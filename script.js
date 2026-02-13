const loginView = document.getElementById('loginView');
const teamView = document.getElementById('teamView');
const adminView = document.getElementById('adminView');
const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logoutBtn');
const adminLogoutBtn = document.getElementById('adminLogoutBtn');
const postsGrid = document.getElementById('postsGrid');
const teamName = document.getElementById('teamName');
const teamScore = document.getElementById('teamScore');
const rankingList = document.getElementById('rankingList');
const historyBody = document.getElementById('historyBody');
const recordsCount = document.getElementById('recordsCount');
const exportBtn = document.getElementById('exportBtn');
const postModal = document.getElementById('postModal');
const postForm = document.getElementById('postForm');
const modalTitle = document.getElementById('modalTitle');
const cancelModal = document.getElementById('cancelModal');
const postPin = document.getElementById('postPin');
const gamePoints = document.getElementById('gamePoints');
const toast = document.getElementById('toast');

let currentUser = null;
let activePost = null;

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  const isJson = (response.headers.get('content-type') || '').includes('application/json');
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const error = new Error(payload?.error || 'Erro na comunicação com o servidor.');
    error.status = response.status;
    throw error;
  }

  return payload;
}

function toastMessage(message) {
  toast.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 2200);
}

function openPostModal(postId) {
  activePost = postId;
  modalTitle.textContent = `Registo do posto ${postId}`;
  postForm.reset();
  postModal.classList.remove('hidden');
  postPin.focus();
}

function closePostModal() {
  activePost = null;
  postModal.classList.add('hidden');
}

function renderTeamDashboard(data) {
  teamName.textContent = data.team.name;
  teamScore.textContent = data.score;

  postsGrid.innerHTML = '';
  data.posts.forEach((post) => {
    const btn = document.createElement('button');
    btn.className = `post-btn ${post.visited ? 'red' : 'green'}`;
    btn.disabled = post.visited;
    btn.innerHTML = `Posto ${post.id}<small>${post.visited ? 'Já visitado' : 'Por visitar'}</small>`;
    btn.addEventListener('click', () => openPostModal(post.id));
    postsGrid.appendChild(btn);
  });
}

function renderAdminDashboard(data) {
  recordsCount.textContent = data.totalRecords;

  rankingList.innerHTML = '';
  data.ranking.forEach((team) => {
    const li = document.createElement('li');
    li.textContent = `${team.name}: ${team.score} pontos`;
    rankingList.appendChild(li);
  });

  historyBody.innerHTML = '';
  data.history.forEach((entry) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${new Date(entry.timestamp).toLocaleString('pt-PT')}</td>
      <td>${entry.teamName}</td>
      <td>${entry.postId}</td>
      <td>${entry.presence}</td>
      <td>${entry.game}</td>
      <td>${entry.total}</td>
    `;
    historyBody.appendChild(tr);
  });
}

async function loadTeamData() {
  const data = await api('/api/team/dashboard');
  renderTeamDashboard(data);
}

async function loadAdminData() {
  const data = await api('/api/admin/dashboard');
  renderAdminDashboard(data);
}

async function switchView() {
  loginView.classList.add('hidden');
  teamView.classList.add('hidden');
  adminView.classList.add('hidden');

  if (!currentUser) {
    loginView.classList.remove('hidden');
    return;
  }

  if (currentUser.role === 'admin') {
    adminView.classList.remove('hidden');
    await loadAdminData();
  } else {
    teamView.classList.remove('hidden');
    await loadTeamData();
  }
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const result = await api('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    currentUser = result.user;
    loginForm.reset();
    await switchView();
    toastMessage(`Sessão iniciada: ${currentUser.name}`);
  } catch (error) {
    toastMessage(error.message);
  }
});

async function logout() {
  await api('/api/logout', { method: 'POST' });
  currentUser = null;
  await switchView();
}

logoutBtn.addEventListener('click', logout);
adminLogoutBtn.addEventListener('click', logout);

cancelModal.addEventListener('click', closePostModal);
postModal.addEventListener('click', (e) => {
  if (e.target === postModal) closePostModal();
});

postForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const extra = Number(gamePoints.value);
    if (![0, 100].includes(extra)) {
      toastMessage('Os pontos de jogo devem ser 0 ou 100.');
      return;
    }

    const payload = await api('/api/checkins', {
      method: 'POST',
      body: JSON.stringify({
        postId: activePost,
        pin: postPin.value.trim(),
        gamePoints: extra,
      }),
    });

    closePostModal();
    await loadTeamData();
    toastMessage(`Posto ${activePost} registado (+${payload.totalAdded} pontos).`);
  } catch (error) {
    toastMessage(error.message);
  }
});

exportBtn.addEventListener('click', () => {
  window.location.href = '/api/admin/export.csv';
});

async function boot() {
  try {
    const session = await api('/api/session');
    currentUser = session.user;
  } catch (_error) {
    currentUser = null;
  }
  await switchView();
}

boot();
