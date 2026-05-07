window.addEventListener('DOMContentLoaded', () => {

// ═══════════════════════════════════════════════════════
// MAIN — initialisation + boucle principale
// ═══════════════════════════════════════════════════════

// ── RENDERER ──────────────────────────────────────────
const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x5ab8f5);
scene.fog = new THREE.FogExp2(0x88c8f0, 0.007);

const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 400);

// ── BUILD WORLD ───────────────────────────────────────
const lights = buildWorld(scene);

// ── SPAWN CHARACTERS ──────────────────────────────────
const leo = makeChar({
  skin: 0xC8844A, hair: 0x3a2010,
  shirt: 0x2a2a4a, pants: 0x1a1a3a,
  eyeColor: 0x5a3515, isFemale: false
}, scene);
leo.position.set(-1, 0, 3);

const clara = makeChar({
  skin: 0xD4956A, hair: 0x3a1e08,
  shirt: 0x5b8dd9, pants: 0x2a3a6a,
  eyeColor: 0x4a2810, isFemale: true
}, scene);
clara.position.set(2, 0, 3);

const tcheezy = makeCat({
  body: 0xD4823A, belly: 0xFFF5E0,
  eyeColor: 0x88CC44, stripes: false, tipColor: 0xFFD080
}, scene);
tcheezy.position.set(-1, 0, 5);
window.tcheezy = tcheezy; // expose pour ai.js

const tysha = makeCat({
  body: 0x888888, belly: null,
  eyeColor: 0x99CC66, stripes: true, tipColor: 0xCCCCCC
}, scene);
tysha.position.set(2.5, 0, 5);
window.tysha = tysha;

// Preys
const preys = [];
const preyColors = [0x44AA44, 0x884422, 0xCC8822, 0x228844, 0x886644];
for (let i = 0; i < 8; i++) {
  const p = makePrey(preyColors[i % 5], scene);
  p.position.set((Math.random() - 0.5) * 40, 0, (Math.random() - 0.5) * 40);
  p.userData = { active: true, speed: 0.03 + Math.random() * 0.02, dir: Math.random() * Math.PI * 2 };
  preys.push(p);
}

// ── STATE ─────────────────────────────────────────────
let gameStarted = false;
let activeChar = 'leo';
let gameHour = 12;
const GAME_SPEED = 0.04; // heures / seconde réelle

const wallet = { amount: 150 };
const inventory = [];

const visited = new Set();
const POIS = [
  { x: 0,   z: 0,   r: 4.5, msg: '⛲ Plaça de Catalunya !',          id: 'plaza' },
  { x: 0,   z: -65, r: 9,   msg: '🏛 La Sagrada Família de Gaudí !', id: 'sf'    },
  { x: -45, z: -35, r: 7,   msg: '🎨 Parc Güell — magnifique !',     id: 'guell' },
  { x: 45,  z: -35, r: 8,   msg: '⚽ Camp Nou — Visca el Barça !',   id: 'cn'    },
  { x: 0,   z: 60,  r: 7,   msg: '🌊 La Barceloneta !',              id: 'beach' },
  { x: -20, z: 18,  r: 7,   msg: '☕ El Café de Gaudí découvert !',  id: 'cof'   },
  { x: 25,  z: 28,  r: 6,   msg: '🎵 Le Shoko — club mythique !',    id: 'shk'   },
  { x: 10,  z: 48,  r: 7,   msg: '🎰 Casino Barceloneta !',          id: 'cas'   },
];

const INTERACT_ZONES = [
  { x: -20, z: 18, r: 7,  label: '☕ [E] Entrer au Café de Gaudí',
    action: () => {
    openCoffeeShopScene(scene);
    openCoffeeShop(wallet, inventory, () => updateWalletUI(wallet), () => updateInvUI(inventory), showMsg);
  } },
  { x: 10,  z: 48, r: 7,  label: '🎰 [E] Entrer au Casino',
    action: () => { document.getElementById('casino-ui').style.display = 'block'; updateWalletUI(wallet); } },
  { x: 25,  z: 28, r: 6,  label: '🎵 [E] Entrer au Shoko',
    action: () => openShoko(scene) },
];

// ── INPUT ─────────────────────────────────────────────
const keys = {};

  // Reset toutes les touches si la fenêtre perd le focus
  // → évite le bug "personnage qui avance tout seul"
  window.addEventListener('blur', () => {
    Object.keys(keys).forEach(k => { keys[k] = false; });
    resetPlayerVelocity();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      Object.keys(keys).forEach(k => { keys[k] = false; });
      resetPlayerVelocity();
    }
  });
document.addEventListener('keydown', e => {
  if (handleKeyRebind(e)) return;
  keys[e.key] = true;

  if (isKeyDown(keys, 'swap'))     swapChar();
  if (isKeyDown(keys, 'cats'))     triggerCatMsg();
  if (isKeyDown(keys, 'interact')) handleInteract();
  if (isKeyDown(keys, 'map'))      toggleMap();
  if (e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); if (!shokoActive) jump(); else setAction('dance', Infinity, true); }
  if (e.key === 'Escape')          { toggleMenu(); if (shokoActive) closeShoko(); }
});
document.addEventListener('keyup', e => { keys[e.key] = false; });

// Mobile buttons
const mobileMap = {
  btnL: 'left', btnR: 'right', btnU: 'up', btnD: 'down'
};
Object.entries(mobileMap).forEach(([id, action]) => {
  const el = document.getElementById(id);
  el.addEventListener('pointerdown', () => { keys[KB[action]] = true; });
  el.addEventListener('pointerup',   () => { keys[KB[action]] = false; });
  el.addEventListener('pointerleave',() => { keys[KB[action]] = false; });
});
document.getElementById('btnSprint').addEventListener('pointerdown', () => keys['__sprint__'] = true);
document.getElementById('btnSprint').addEventListener('pointerup',   () => keys['__sprint__'] = false);
document.getElementById('btnInteract').addEventListener('click', handleInteract);
document.getElementById('btnMap').addEventListener('click', toggleMap);
document.getElementById('btnMenu').addEventListener('click', () => toggleMenu(true));

// ── ACTIONS ───────────────────────────────────────────
function swapChar() {
  activeChar = activeChar === 'leo' ? 'clara' : 'leo';
  updateCharPanel(activeChar);
  showMsg(activeChar === 'leo' ? '🧑 Tu joues Léo' : '👧 Tu joues Clara');
}

const catMsgs = [
  '🐾 Tcheezy chasse un gecko !', '😺 Tysha ronronne au soleil !',
  '🐱 Tcheezy veut des tapas !',  '😸 Tysha grimpe sur un palmier !',
  '🐾 Tcheezy regarde la mer !',  '😺 Les deux chats font la sieste ensemble !',
];
let catMsgI = 0;
function triggerCatMsg() { showMsg(catMsgs[catMsgI++ % catMsgs.length]); }

function handleInteract() {
  const active = activeChar === 'leo' ? leo : clara;
  for (const z of INTERACT_ZONES) {
    if (Math.hypot(active.position.x - z.x, active.position.z - z.z) < z.r) {
      z.action(); return;
    }
  }
  showMsg('💬 Approche-toi d\'un lieu pour interagir (E)');
}

function toggleMap() {
  if (mapOpen) closeBigMap();
  else openBigMap(leo, clara, tcheezy, tysha, visited);
}

function toggleMenu(force) {
  const m = document.getElementById('menu-overlay');
  m.style.display = (force || m.style.display === 'none') ? 'flex' : 'none';
}

// ── MENU BUTTONS ──────────────────────────────────────
document.getElementById('btn-play').addEventListener('click', () => {
  document.getElementById('menu-overlay').style.display = 'none';
  gameStarted = true;
  lastTime = performance.now();
  showMsg('🎮 ' + keyName(KB.up) + keyName(KB.down) + keyName(KB.left) + keyName(KB.right) +
    ' déplacer · ' + keyName(KB.sprint) + ' sprint · ' + keyName(KB.interact) + ' interagir · ' + keyName(KB.map) + ' carte');
});
document.getElementById('menu-sel-leo').addEventListener('click', () => { activeChar = 'leo'; updateCharPanel('leo'); });
document.getElementById('menu-sel-clara').addEventListener('click', () => { activeChar = 'clara'; updateCharPanel('clara'); });

// ── INIT ──────────────────────────────────────────────
initCamera(camera);
initKeybindingUI();
initShops(wallet, inventory, () => updateWalletUI(wallet), () => updateInvUI(inventory), showMsg);
initMapUI(leo, clara, tcheezy, tysha, visited);
updateCharPanel(activeChar);
updateWalletUI(wallet);

// ── LOD ───────────────────────────────────────────────
function updateLOD(px, pz) {
  scene.children.forEach(obj => {
    if (!obj.isMesh) return;
    if (obj.geometry && (obj.geometry.type === 'PlaneGeometry')) return;
    const d = Math.hypot(obj.position.x - px, obj.position.z - pz);
    obj.visible = d < 110;
  });
}

// ── GAME LOOP ─────────────────────────────────────────
let t = 0, lastTime = performance.now();

function animate() {
  requestAnimationFrame(animate);

  if (!gameStarted) {
    // Affiche la scène derrière le menu
    camera.position.set(0, 11, 17);
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
    return;
  }

  const now = performance.now();
  const dt  = Math.min((now - lastTime) / 1000, 0.05);
  lastTime  = now;
  t        += dt;

  // ── Day/night
  gameHour = (gameHour + dt * GAME_SPEED) % 24;
  document.getElementById('time-txt').textContent = getTimeLabel(gameHour);
  updateDayNight(gameHour, scene, lights);

  // ── Player movement — relatif à la caméra
  const active = activeChar === 'leo' ? leo : clara;
  const sprint = keys[KB.sprint] || keys['__sprint__'];

  // Input brut ZQSD
  const rawX = (isKeyDown(keys, 'left') ? -1 : 0) + (isKeyDown(keys, 'right') ? 1 : 0);
  const rawZ = (isKeyDown(keys, 'up')   ? -1 : 0) + (isKeyDown(keys, 'down')  ? 1 : 0);

  // Projection sur l'axe de la caméra (cam.theta = angle horizontal)
  const cosT = Math.cos(cam.theta);
  const sinT = Math.sin(cam.theta);
  const inputX = rawX * cosT + rawZ * sinT;
  const inputZ = rawZ * cosT - rawX * sinT;

  const phys = updatePlayerPhysics(inputX, inputZ, sprint);

  // Appliquer déplacement horizontal
  if (phys.moving || phys.jumping) {
    const col = resolveCollision(active.position.x + phys.vx, active.position.z + phys.vz);
    const b   = clampToBounds(col.x, col.z);
    active.position.x = b.x;
    active.position.z = b.z;
  }

  // Hauteur verticale (saut)
  active.position.y = phys.y;

  // Rotation smooth vers la direction du mouvement
  if (phys.moving && (inputX !== 0 || inputZ !== 0)) {
    const targetAngle = Math.atan2(inputX, inputZ);
    let diff = targetAngle - active.rotation.y;
    while (diff >  Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    active.rotation.y += diff * 0.22;
  }

  // Animation unifiée (marche / saut / action contextuelle)
  updateCharAnimation(active, phys, t);
  updateAnimations(t, dt);

  // ── Clara / Leo AI
  updateClaraAI(clara, leo, activeChar, dt, t);

  // ── Cat AI
  const px = active.position.x, pz = active.position.z;
  const labelTch = updateCatAI(tcheezy, catStates.tcheezy, 'Tcheezy', px, pz, preys, wallet, () => updateWalletUI(wallet), showPreyAlert, showMsg, t, dt);
  const labelTys = updateCatAI(tysha,   catStates.tysha,   'Tysha',   px, pz, preys, wallet, () => updateWalletUI(wallet), showPreyAlert, showMsg, t, dt);
  document.getElementById('role-tch').textContent = labelTch;
  document.getElementById('role-tys').textContent = labelTys;

  // ── Prey movement
  updatePreys(preys, t, dt);

  // ── Waves
  updateWaves(t);

  // ── Camera
  updateCamera(camera, active.position.x, active.position.z, dt, phys.moving);

  // ── POIs
  POIS.forEach(p => {
    if (!visited.has(p.id) && Math.hypot(px - p.x, pz - p.z) < p.r) {
      visited.add(p.id);
      document.getElementById('score-num').textContent = visited.size;
      showMsg(p.msg);
    }
  });

  // ── Interact zones
  checkInteractZones(px, pz, INTERACT_ZONES);

  // ── Minimap
  drawMinimap(leo, clara, tcheezy, tysha, POIS, visited);

  // ── LOD
  updateLOD(px, pz);

  if (window.renderPostFX) renderPostFX(getDayFactor(gameHour));
  renderer.render(scene, camera);
}

animate();
if (window.initPostProcessing) initPostProcessing();

// ── RESIZE ────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});


}); // end DOMContentLoaded
