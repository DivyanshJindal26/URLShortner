let API_KEY = localStorage.getItem('sk_api_key') || '';
const BASE = window.location.origin;

function api(method, path, body, isForm) {
  const opts = {
    method,
    headers: { Authorization: `Bearer ${API_KEY}` },
  };
  if (body && !isForm) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  } else if (isForm) {
    opts.body = body; // FormData
  }
  return fetch(`${BASE}/api${path}`, opts).then(r => r.json());
}

// --- Auth ---

async function login() {
  const key = document.getElementById('key-input').value.trim();
  if (!key) return;
  API_KEY = key;
  const res = await fetch(`${BASE}/api/stats`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (res.ok) {
    localStorage.setItem('sk_api_key', key);
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    init();
  } else {
    document.getElementById('login-error').classList.remove('hidden');
  }
}

function logout() {
  localStorage.removeItem('sk_api_key');
  location.reload();
}

document.getElementById('key-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') login();
});

// Auto-login if key stored
if (API_KEY) {
  fetch(`${BASE}/api/stats`, { headers: { Authorization: `Bearer ${API_KEY}` } })
    .then(r => r.ok ? r.json() : null)
    .then(data => {
      if (data) {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        init(data);
      }
    });
}

// --- Init ---

function init(stats) {
  loadStats(stats);
  loadLinks();
  setupDragDrop();
}

async function loadStats(cached) {
  const data = cached || await api('GET', '/stats');
  document.getElementById('stats-bar').innerHTML = `
    <div class="stat"><span>${data.linkCount}</span> links · <span>${data.totalVisits}</span> visits</div>
    <div class="stat"><span>${data.imageCount}</span> images · <span>${data.totalImageVisits}</span> views</div>
  `;
}

// --- Tabs ---

function switchTab(name, el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
  document.getElementById(`panel-${name}`).classList.remove('hidden');
  if (name === 'links') loadLinks();
  if (name === 'images') loadImages();
}

// --- Links ---

async function loadLinks() {
  const links = await api('GET', '/links');
  const el = document.getElementById('links-list');
  if (!links.length) { el.innerHTML = '<p style="color:var(--muted);padding:12px 0">No links yet</p>'; return; }
  el.innerHTML = links.map(l => `
    <div class="item" id="link-${l.code}">
      <div class="item-info">
        <div class="item-title">${escHtml(l.title || l.original_url)}</div>
        <div class="item-sub"><a href="${BASE}/${l.code}" target="_blank" style="color:var(--accent)">${BASE}/${l.code}</a> → ${escHtml(l.original_url)}</div>
      </div>
      <span class="badge">${l.visits} visits</span>
      <div class="item-actions">
        <button class="btn-copy" onclick="copy('${BASE}/${l.code}', this)">Copy</button>
        <button class="btn-danger" onclick="deleteLink('${l.code}')">Delete</button>
      </div>
    </div>
  `).join('');
}

async function shortenUrl() {
  const url = document.getElementById('url-input').value.trim();
  const customCode = document.getElementById('code-input').value.trim();
  if (!url) return;
  const res = await api('POST', '/shorten', { url, customCode: customCode || undefined });
  if (res.error) { alert(res.error); return; }
  document.getElementById('url-input').value = '';
  document.getElementById('code-input').value = '';
  copy(res.shortUrl);
  loadLinks();
  loadStats();
}

async function deleteLink(code) {
  if (!confirm(`Delete /${code}?`)) return;
  await api('DELETE', `/links/${code}`);
  document.getElementById(`link-${code}`)?.remove();
  loadStats();
}

// --- Images ---

async function loadImages() {
  const images = await api('GET', '/images');
  const el = document.getElementById('images-list');
  if (!images.length) { el.innerHTML = '<p style="color:var(--muted);padding:12px 0">No images yet</p>'; return; }
  el.innerHTML = images.map(img => `
    <div class="item" id="img-${img.filename}">
      <img class="image-thumb" src="${BASE}/i/${img.filename}/raw" alt="${escHtml(img.original_name)}" />
      <div class="item-info">
        <div class="item-title">${escHtml(img.original_name || img.filename)}</div>
        <div class="item-sub">${formatBytes(img.size)} · ${img.mime_type}</div>
      </div>
      <span class="badge">${img.visits} views</span>
      <div class="item-actions">
        <button class="btn-copy" onclick="copy('${BASE}/i/${img.filename}', this)">Embed</button>
        <button class="btn-copy" onclick="copy('${BASE}/i/${img.filename}/raw', this)">Raw</button>
        <button class="btn-danger" onclick="deleteImage('${img.filename}')">Delete</button>
      </div>
    </div>
  `).join('');
}

async function uploadFiles(files) {
  const progress = document.getElementById('upload-progress');
  progress.classList.remove('hidden');
  for (const file of files) {
    progress.textContent = `Uploading ${file.name}…`;
    const form = new FormData();
    form.append('image', file);
    const res = await api('POST', '/upload', form, true);
    if (res.error) { alert(res.error); continue; }
    copy(res.embedUrl);
  }
  progress.textContent = 'Done!';
  setTimeout(() => progress.classList.add('hidden'), 2000);
  loadImages();
  loadStats();
}

async function deleteImage(filename) {
  if (!confirm(`Delete ${filename}?`)) return;
  await api('DELETE', `/images/${filename}`);
  document.getElementById(`img-${filename}`)?.remove();
  loadStats();
}

function setupDragDrop() {
  const zone = document.getElementById('upload-zone');
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    uploadFiles(e.dataTransfer.files);
  });
  zone.addEventListener('click', () => document.getElementById('file-input').click());
}

// --- Helpers ---

function copy(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    if (btn) { const old = btn.textContent; btn.textContent = 'Copied!'; setTimeout(() => btn.textContent = old, 1500); }
  });
}

function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatBytes(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}
