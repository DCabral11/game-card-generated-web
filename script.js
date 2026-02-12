const POSTS = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  pin: String(1430 + i * 7),
}));

const TEAMS = Array.from({ length: 40 }, (_, i) => {
  const n = String(i + 1).padStart(2, "0");
  return {
    username: `team${n}`,
    password: `city-${n}`,
    name: `Equipa ${n}`,
  };
});

const ADMIN = { username: "admin", password: "admin123", role: "admin", name: "Administrador" };
const SESSION_KEY = "citygame.session";
const DB_KEY = "citygame.records.v1";

const loginView = document.getElementById("loginView");
const teamView = document.getElementById("teamView");
const adminView = document.getElementById("adminView");
const loginForm = document.getElementById("loginForm");
const logoutBtn = document.getElementById("logoutBtn");
const adminLogoutBtn = document.getElementById("adminLogoutBtn");
const postsGrid = document.getElementById("postsGrid");
const teamName = document.getElementById("teamName");
const teamScore = document.getElementById("teamScore");
const rankingList = document.getElementById("rankingList");
const historyBody = document.getElementById("historyBody");
const recordsCount = document.getElementById("recordsCount");
const exportBtn = document.getElementById("exportBtn");
const postModal = document.getElementById("postModal");
const postForm = document.getElementById("postForm");
const modalTitle = document.getElementById("modalTitle");
const cancelModal = document.getElementById("cancelModal");
const postPin = document.getElementById("postPin");
const gamePoints = document.getElementById("gamePoints");
const toast = document.getElementById("toast");

let activePost = null;

const now = () => new Date().toISOString();

function loadRecords() {
  const raw = localStorage.getItem(DB_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveRecords(records) {
  localStorage.setItem(DB_KEY, JSON.stringify(records));
}

function getSession() {
  const raw = sessionStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

function setSession(payload) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

function toastMessage(message) {
  toast.textContent = message;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 2200);
}

function scoreForTeam(username, records = loadRecords()) {
  return records.filter((r) => r.team === username).reduce((acc, r) => acc + r.total, 0);
}

function wasVisited(username, postId, records = loadRecords()) {
  return records.some((r) => r.team === username && r.postId === postId);
}

function renderTeamDashboard(team) {
  const records = loadRecords();
  teamName.textContent = team.name;
  teamScore.textContent = scoreForTeam(team.username, records);

  postsGrid.innerHTML = "";
  POSTS.forEach((post) => {
    const visited = wasVisited(team.username, post.id, records);
    const btn = document.createElement("button");
    btn.className = `post-btn ${visited ? "red" : "green"}`;
    btn.disabled = visited;
    btn.innerHTML = `Posto ${post.id}<small>${visited ? "Já visitado" : "Por visitar"}</small>`;
    btn.addEventListener("click", () => openPostModal(post.id));
    postsGrid.appendChild(btn);
  });
}

function teamRanking(records = loadRecords()) {
  const totals = TEAMS.map((team) => ({
    ...team,
    score: scoreForTeam(team.username, records),
  }));
  return totals.sort((a, b) => b.score - a.score || a.username.localeCompare(b.username));
}

function renderAdminDashboard() {
  const records = loadRecords();
  recordsCount.textContent = records.length;

  rankingList.innerHTML = "";
  teamRanking(records).forEach((team) => {
    const li = document.createElement("li");
    li.textContent = `${team.name}: ${team.score} pontos`;
    rankingList.appendChild(li);
  });

  historyBody.innerHTML = "";
  [...records]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .forEach((r) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${new Date(r.timestamp).toLocaleString("pt-PT")}</td>
        <td>${r.teamName}</td>
        <td>${r.postId}</td>
        <td>${r.presence}</td>
        <td>${r.game}</td>
        <td>${r.total}</td>
      `;
      historyBody.appendChild(tr);
    });
}

function openPostModal(postId) {
  const session = getSession();
  if (!session || session.role !== "team") return;
  activePost = postId;
  modalTitle.textContent = `Registo do posto ${postId}`;
  postForm.reset();
  postModal.classList.remove("hidden");
  postPin.focus();
}

function closePostModal() {
  activePost = null;
  postModal.classList.add("hidden");
}

function authenticate(username, password) {
  if (username === ADMIN.username && password === ADMIN.password) return ADMIN;
  return TEAMS.find((t) => t.username === username && t.password === password) || null;
}

function switchView() {
  const session = getSession();
  loginView.classList.add("hidden");
  teamView.classList.add("hidden");
  adminView.classList.add("hidden");

  if (!session) {
    loginView.classList.remove("hidden");
    return;
  }

  if (session.role === "admin") {
    adminView.classList.remove("hidden");
    renderAdminDashboard();
  } else {
    teamView.classList.remove("hidden");
    renderTeamDashboard(session);
  }
}

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const user = authenticate(username, password);

  if (!user) {
    toastMessage("Credenciais inválidas.");
    return;
  }

  const role = user.role || "team";
  setSession({ username: user.username, name: user.name, role });
  loginForm.reset();
  switchView();
  toastMessage(`Sessão iniciada: ${user.name}`);
});

logoutBtn.addEventListener("click", () => {
  clearSession();
  switchView();
});

adminLogoutBtn.addEventListener("click", () => {
  clearSession();
  switchView();
});

cancelModal.addEventListener("click", closePostModal);
postModal.addEventListener("click", (e) => {
  if (e.target === postModal) closePostModal();
});

postForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const session = getSession();
  if (!session || session.role !== "team" || !activePost) return;

  const post = POSTS.find((p) => p.id === activePost);
  const typedPin = postPin.value.trim();
  const extra = Number(gamePoints.value);

  if (![0, 100].includes(extra)) {
    toastMessage("Os pontos de jogo devem ser 0 ou 100.");
    return;
  }

  if (typedPin !== post.pin) {
    toastMessage("PIN inválido para este posto.");
    return;
  }

  const records = loadRecords();
  if (wasVisited(session.username, activePost, records)) {
    toastMessage("Este posto já foi registado pela equipa.");
    closePostModal();
    return;
  }

  const entry = {
    id: crypto.randomUUID(),
    team: session.username,
    teamName: session.name,
    postId: activePost,
    presence: 50,
    game: extra,
    total: 50 + extra,
    timestamp: now(),
  };

  records.push(entry);
  saveRecords(records);
  closePostModal();
  renderTeamDashboard(session);
  toastMessage(`Posto ${activePost} registado (+${entry.total} pontos).`);
});

exportBtn.addEventListener("click", () => {
  const records = loadRecords();
  const header = ["timestamp", "team", "team_name", "post", "presence", "game", "total"];
  const lines = records.map((r) =>
    [r.timestamp, r.team, r.teamName, r.postId, r.presence, r.game, r.total]
      .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
      .join(",")
  );
  const csv = [header.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `city-game-export-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toastMessage("Exportação CSV concluída.");
});

window.addEventListener("storage", () => {
  const session = getSession();
  if (!session) return;
  if (session.role === "admin") renderAdminDashboard();
  else renderTeamDashboard(session);
});

switchView();
