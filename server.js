require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const { pool } = require('./db');

const app = express();
const PORT = Number(process.env.PORT || 4173);

app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'city-game-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 8 },
  })
);

app.use(express.static(path.join(__dirname)));

function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Não autenticado.' });
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso restrito ao administrador.' });
  }
  next();
}

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Credenciais em falta.' });

  const [rows] = await pool.query('SELECT id, username, password_hash, role, display_name FROM users WHERE username = ?', [username]);
  const user = rows[0];
  if (!user) return res.status(401).json({ error: 'Credenciais inválidas.' });

  const valid = user.password_hash.startsWith('$2')
    ? await bcrypt.compare(password, user.password_hash)
    : password === user.password_hash;

  if (!valid) return res.status(401).json({ error: 'Credenciais inválidas.' });

  req.session.user = {
    id: user.id,
    username: user.username,
    role: user.role,
    name: user.display_name,
  };

  return res.json({ user: req.session.user });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/session', (req, res) => {
  res.json({ user: req.session.user || null });
});

app.get('/api/team/dashboard', requireAuth, async (req, res) => {
  if (req.session.user.role !== 'team') return res.status(403).json({ error: 'Apenas equipas.' });

  const teamId = req.session.user.id;
  const [posts] = await pool.query('SELECT id FROM posts ORDER BY id');
  const [checkins] = await pool.query('SELECT post_id, total_points FROM checkins WHERE team_id = ?', [teamId]);

  const visited = new Set(checkins.map((c) => c.post_id));
  const score = checkins.reduce((sum, c) => sum + c.total_points, 0);

  const mappedPosts = posts.map((p) => ({
    id: p.id,
    visited: visited.has(p.id),
  }));

  res.json({ team: req.session.user, score, posts: mappedPosts });
});

app.post('/api/checkins', requireAuth, async (req, res) => {
  if (req.session.user.role !== 'team') return res.status(403).json({ error: 'Apenas equipas.' });

  const { postId, pin, gamePoints } = req.body;
  const parsedPostId = Number(postId);
  const parsedGamePoints = Number(gamePoints);

  if (!Number.isInteger(parsedPostId)) return res.status(400).json({ error: 'Posto inválido.' });
  if (![0, 100].includes(parsedGamePoints)) {
    return res.status(400).json({ error: 'Os pontos de jogo devem ser 0 ou 100.' });
  }

  const [posts] = await pool.query('SELECT id, pin_code FROM posts WHERE id = ?', [parsedPostId]);
  const post = posts[0];
  if (!post) return res.status(404).json({ error: 'Posto não encontrado.' });
  if (String(pin) !== String(post.pin_code)) {
    return res.status(400).json({ error: 'PIN inválido para este posto.' });
  }

  const teamId = req.session.user.id;
  const presence = 50;
  const total = presence + parsedGamePoints;

  try {
    await pool.query(
      `INSERT INTO checkins (team_id, post_id, presence_points, game_points, total_points)
       VALUES (?, ?, ?, ?, ?)`,
      [teamId, parsedPostId, presence, parsedGamePoints, total]
    );
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Este posto já foi registado pela equipa.' });
    }
    throw error;
  }

  res.json({ ok: true, totalAdded: total });
});

app.get('/api/admin/dashboard', requireAdmin, async (_req, res) => {
  const [ranking] = await pool.query(
    `SELECT u.username, u.display_name AS name, COALESCE(SUM(c.total_points), 0) AS score
     FROM users u
     LEFT JOIN checkins c ON c.team_id = u.id
     WHERE u.role = 'team'
     GROUP BY u.id
     ORDER BY score DESC, u.username ASC`
  );

  const [history] = await pool.query(
    `SELECT c.created_at AS timestamp, u.display_name AS teamName, c.post_id AS postId,
            c.presence_points AS presence, c.game_points AS game, c.total_points AS total
     FROM checkins c
     JOIN users u ON u.id = c.team_id
     ORDER BY c.created_at DESC`
  );

  res.json({ ranking, history, totalRecords: history.length });
});

app.get('/api/admin/export.csv', requireAdmin, async (_req, res) => {
  const [rows] = await pool.query(
    `SELECT c.created_at AS timestamp, u.username AS team, u.display_name AS team_name,
            c.post_id AS post, c.presence_points AS presence, c.game_points AS game, c.total_points AS total
     FROM checkins c
     JOIN users u ON u.id = c.team_id
     ORDER BY c.created_at DESC`
  );

  const header = ['timestamp', 'team', 'team_name', 'post', 'presence', 'game', 'total'];
  const csvRows = rows.map((row) =>
    header.map((key) => `"${String(row[key] ?? '').replaceAll('"', '""')}"`).join(',')
  );
  const csv = [header.join(','), ...csvRows].join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="city-game-export-${Date.now()}.csv"`);
  res.send(csv);
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
