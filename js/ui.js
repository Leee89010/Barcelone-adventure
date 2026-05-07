// ═══════════════════════════════════════════════════════
// UI — HUD, minimap, grande carte, messages
// ═══════════════════════════════════════════════════════

// ── MESSAGES ──────────────────────────────────────────
let _msgTimer, _preyTimer;

function showMsg(txt, dur = 3200) {
  const el = document.getElementById('msg-box');
  el.textContent = txt;
  el.style.opacity = 1;
  clearTimeout(_msgTimer);
  _msgTimer = setTimeout(() => el.style.opacity = 0, dur);
}
window.showMsg = showMsg; // expose globalement

function showInteract(txt) {
  const el = document.getElementById('interact-hint');
  el.textContent = txt;
  el.style.opacity = 1;
}
function hideInteract() {
  document.getElementById('interact-hint').style.opacity = 0;
}

function showPreyAlert(txt) {
  const el = document.getElementById('prey-alert');
  el.textContent = txt;
  el.style.opacity = 1;
  clearTimeout(_preyTimer);
  _preyTimer = setTimeout(() => el.style.opacity = 0, 3000);
}

// ── WALLET & INVENTORY ────────────────────────────────
function updateWalletUI(wallet) {
  document.getElementById('wallet-amt').textContent   = wallet.amount;
  document.getElementById('shop-wallet').textContent  = wallet.amount;
  document.getElementById('casino-wallet').textContent= wallet.amount;
}

function updateInvUI(inventory) {
  const el = document.getElementById('inv-txt');
  if (!inventory.length) { el.textContent = 'Vide'; return; }
  const counts = {};
  inventory.forEach(i => counts[i] = (counts[i] || 0) + 1);
  el.textContent = Object.entries(counts).map(([k, v]) => `${k}×${v}`).join(' · ');
}

// ── CHAR PANEL ────────────────────────────────────────
function updateCharPanel(activeChar) {
  ['leo', 'clara'].forEach(name => {
    const card = document.getElementById('card-' + name);
    const nameEl = document.getElementById('name-' + name);
    const roleEl = document.getElementById('role-' + name);
    const isActive = activeChar === name;
    card.className  = 'ccard' + (isActive ? ' active' : '');
    roleEl.textContent = isActive ? 'Joueur actif' : 'IA compagne';
  });
}

// ── MINIMAP ───────────────────────────────────────────
const miniCtx = document.getElementById('minimap').getContext('2d');
const MM_W = 130, MM_H = 130, MM_SCALE = 1.1;
function wx(x) { return MM_W / 2 + x / MM_SCALE; }
function wz(z) { return MM_H / 2 + z / MM_SCALE; }

function drawMinimap(leo, clara, tcheezy, tysha, pois, visited) {
  miniCtx.fillStyle = '#050215';
  miniCtx.fillRect(0, 0, MM_W, MM_H);

  // Road grid (light lines)
  miniCtx.strokeStyle = '#1a1a2e';
  miniCtx.lineWidth = 2.5;
  [-12, 12, -35, 35].forEach(v => {
    miniCtx.beginPath(); miniCtx.moveTo(wx(-90), wz(v)); miniCtx.lineTo(wx(90), wz(v)); miniCtx.stroke();
    miniCtx.beginPath(); miniCtx.moveTo(wx(v), wz(-90)); miniCtx.lineTo(wx(v), wz(90));  miniCtx.stroke();
  });

  // POIs avec labels
  const poiIcons = { plaza:'⛲', sf:'🏛', guell:'🎨', cn:'⚽', beach:'🌊', cof:'☕', shk:'🎵', cas:'🎰' };
  pois.forEach(p => {
    const vis = visited.has(p.id);
    // Point
    miniCtx.beginPath();
    miniCtx.arc(wx(p.x), wz(p.z), vis ? 5 : 4, 0, Math.PI * 2);
    miniCtx.fillStyle = vis ? '#44FF88' : '#FFD700';
    miniCtx.fill();
    miniCtx.strokeStyle = '#000'; miniCtx.lineWidth = 1; miniCtx.stroke();
    // Icône
    miniCtx.font = '9px sans-serif';
    miniCtx.textAlign = 'center';
    miniCtx.fillStyle = '#fff';
    miniCtx.fillText(poiIcons[p.id] || '•', wx(p.x), wz(p.z) + 3);
  });

  // Cats
  [[tcheezy, '#FF8822'], [tysha, '#AAAAAA']].forEach(([c, col]) => {
    miniCtx.beginPath();
    miniCtx.arc(wx(c.position.x), wz(c.position.z), 3, 0, Math.PI * 2);
    miniCtx.fillStyle = col; miniCtx.fill();
  });

  // Clara
  miniCtx.beginPath();
  miniCtx.arc(wx(clara.position.x), wz(clara.position.z), 4, 0, Math.PI * 2);
  miniCtx.fillStyle = '#FF88CC'; miniCtx.fill();

  // Leo
  miniCtx.beginPath();
  miniCtx.arc(wx(leo.position.x), wz(leo.position.z), 5, 0, Math.PI * 2);
  miniCtx.fillStyle = '#44FF88'; miniCtx.fill();
  miniCtx.strokeStyle = '#000'; miniCtx.lineWidth = 1.5; miniCtx.stroke();

  // N
  miniCtx.fillStyle = '#FFD700';
  miniCtx.font = 'bold 10px sans-serif';
  miniCtx.textAlign = 'left';
  miniCtx.fillText('N', 6, 14);
}

// ── GRANDE CARTE ──────────────────────────────────────
let mapOpen = false;
const bigCtx = document.getElementById('bigmap').getContext('2d');
const BM_W = 560, BM_H = 560, BM_SCALE = 3.0;
function bmx(x) { return BM_W / 2 + x * BM_SCALE; }
function bmz(z) { return BM_H / 2 + z * BM_SCALE; }

const BM_BUILDINGS = [
  { x:0,   z:0,   w:24, d:24, c:'#C8B870' },
  { x:-18, z:-12, w:5,  d:4,  c:'#E8A060' }, { x:-13, z:-10, w:4, d:3, c:'#E8A060' },
  { x:-21, z:-20, w:7,  d:5,  c:'#D4924A' }, { x:-14, z:-20, w:4, d:4, c:'#E8A060' },
  { x:18,  z:-12, w:5,  d:4,  c:'#E8A060' }, { x:13,  z:-10, w:4, d:3, c:'#E8A060' },
  { x:21,  z:-20, w:7,  d:5,  c:'#D4924A' }, { x:14,  z:-20, w:4, d:4, c:'#E8A060' },
  { x:0,   z:-65, w:22, d:14, c:'#D4A840' },
  { x:-45, z:-35, w:20, d:10, c:'#F0E0A0' },
  { x:45,  z:-35, w:24, d:24, c:'#3a8a3a' },
  { x:-20, z:18,  w:10, d:8,  c:'#8B4513' },
  { x:25,  z:28,  w:14, d:10, c:'#1a1a2e' },
  { x:10,  z:48,  w:18, d:12, c:'#2a1a0a' },
  { x:0,   z:58,  w:150,d:22, c:'#F5D888' },
  { x:0,   z:80,  w:200,d:40, c:'#1E5FBB' },
];

const BM_ROADS = [
  [-80,-12,80,-12], [-80,12,80,12], [-12,-80,-12,80], [12,-80,12,80],
  [-80,-35,80,-35], [-80,35,80,35], [-35,-80,-35,80], [35,-80,35,80],
];

const BM_POI_LABELS = [
  { x:0,   z:0,   label:'⛲ Plaza Catalunya', id:'plaza' },
  { x:0,   z:-65, label:'🏛 Sagrada Família',  id:'sf'    },
  { x:-45, z:-35, label:'🎨 Parc Güell',        id:'guell' },
  { x:45,  z:-35, label:'⚽ Camp Nou',           id:'cn'    },
  { x:0,   z:60,  label:'🌊 Barceloneta',        id:'beach' },
  { x:-20, z:18,  label:'☕ Café',               id:'cof'   },
  { x:25,  z:28,  label:'🎵 Shoko',              id:'shk'   },
  { x:10,  z:48,  label:'🎰 Casino',             id:'cas'   },
];

function drawBigMap(leo, clara, tcheezy, tysha, visited) {
  bigCtx.clearRect(0, 0, BM_W, BM_H);
  bigCtx.fillStyle = '#0a0520';
  bigCtx.fillRect(0, 0, BM_W, BM_H);

  // Roads
  bigCtx.strokeStyle = '#1e1e35';
  bigCtx.lineWidth = 5;
  BM_ROADS.forEach(([ax, az, bx, bz]) => {
    bigCtx.beginPath();
    bigCtx.moveTo(bmx(ax), bmz(az));
    bigCtx.lineTo(bmx(bx), bmz(bz));
    bigCtx.stroke();
  });

  // Buildings
  BM_BUILDINGS.forEach(b => {
    bigCtx.fillStyle = b.c;
    bigCtx.fillRect(bmx(b.x - b.w / 2), bmz(b.z - b.d / 2), b.w * BM_SCALE, b.d * BM_SCALE);
    bigCtx.strokeStyle = 'rgba(0,0,0,0.4)';
    bigCtx.lineWidth = 0.5;
    bigCtx.strokeRect(bmx(b.x - b.w / 2), bmz(b.z - b.d / 2), b.w * BM_SCALE, b.d * BM_SCALE);
  });

  // POI markers
  BM_POI_LABELS.forEach(p => {
    const vis = visited.has(p.id);
    // Glow ring
    bigCtx.shadowColor = vis ? '#44FF88' : '#FFD700';
    bigCtx.shadowBlur = 10;
    bigCtx.beginPath();
    bigCtx.arc(bmx(p.x), bmz(p.z), vis ? 9 : 8, 0, Math.PI * 2);
    bigCtx.fillStyle = vis ? '#44FF88' : '#FFD700';
    bigCtx.fill();
    bigCtx.strokeStyle = '#000'; bigCtx.lineWidth = 2; bigCtx.stroke();
    bigCtx.shadowBlur = 0;
    // Label au-dessus
    bigCtx.fillStyle = vis ? '#44FF88' : '#FFE87C';
    bigCtx.font = 'bold 11px sans-serif';
    bigCtx.textAlign = 'center';
    bigCtx.fillText(p.label, bmx(p.x), bmz(p.z) - 13);
    // Statut visité
    if (vis) {
      bigCtx.fillStyle = '#44FF88';
      bigCtx.font = '9px sans-serif';
      bigCtx.fillText('✓ visité', bmx(p.x), bmz(p.z) + 20);
    }
  });

  // Cats
  [[tcheezy, '#FF8822'], [tysha, '#AAAAAA']].forEach(([c, col]) => {
    bigCtx.beginPath();
    bigCtx.arc(bmx(c.position.x), bmz(c.position.z), 5, 0, Math.PI * 2);
    bigCtx.fillStyle = col; bigCtx.fill();
    bigCtx.strokeStyle = '#000'; bigCtx.lineWidth = 1; bigCtx.stroke();
  });

  // Clara
  bigCtx.beginPath();
  bigCtx.arc(bmx(clara.position.x), bmz(clara.position.z), 6, 0, Math.PI * 2);
  bigCtx.fillStyle = '#FF88CC'; bigCtx.fill();
  bigCtx.strokeStyle = '#000'; bigCtx.lineWidth = 1.5; bigCtx.stroke();

  // Leo + direction
  const lx = bmx(leo.position.x), lz = bmz(leo.position.z);
  bigCtx.shadowColor = '#44FF88'; bigCtx.shadowBlur = 14;
  bigCtx.beginPath(); bigCtx.arc(lx, lz, 8, 0, Math.PI * 2);
  bigCtx.fillStyle = '#44FF88'; bigCtx.fill();
  bigCtx.strokeStyle = '#000'; bigCtx.lineWidth = 2; bigCtx.stroke();
  bigCtx.shadowBlur = 0;

  // Arrow
  const ang = leo.rotation.y;
  bigCtx.save(); bigCtx.translate(lx, lz); bigCtx.rotate(-ang);
  bigCtx.beginPath(); bigCtx.moveTo(0, -13); bigCtx.lineTo(-4, -6); bigCtx.lineTo(4, -6);
  bigCtx.closePath(); bigCtx.fillStyle = '#44FF88'; bigCtx.fill(); bigCtx.restore();

  // Compass
  bigCtx.fillStyle = '#FFD700';
  bigCtx.font = 'bold 14px sans-serif';
  bigCtx.textAlign = 'left';
  bigCtx.fillText('N', 12, 22);

  // Visited count
  document.getElementById('map-visited').textContent = visited.size;
}

function openBigMap(leo, clara, tcheezy, tysha, visited) {
  mapOpen = true;
  document.getElementById('map-overlay').style.display = 'flex';
  drawBigMap(leo, clara, tcheezy, tysha, visited);
}

function closeBigMap() {
  mapOpen = false;
  document.getElementById('map-overlay').style.display = 'none';
}

function initMapUI(leo, clara, tcheezy, tysha, visited) {
  document.getElementById('map-close').addEventListener('click', closeBigMap);
}

// ── INTERACTION ZONES ─────────────────────────────────
function checkInteractZones(px, pz, zones) {
  for (const z of zones) {
    if (Math.hypot(px - z.x, pz - z.z) < z.r) {
      showInteract(z.label);
      return z;
    }
  }
  hideInteract();
  return null;
}
