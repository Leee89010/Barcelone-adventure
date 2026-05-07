// ═══════════════════════════════════════════════════════
// ANIMATIONS — saut, actions contextuelles, Shoko intérieur
// ═══════════════════════════════════════════════════════

// ── ANIMATION STATE ───────────────────────────────────
const animState = {
  action: null,      // null | 'drink' | 'eat' | 'smoke' | 'dance' | 'jump'
  timer:  0,
  loop:   false,
};

function setAction(action, duration = 2.5, loop = false) {
  animState.action = action;
  animState.timer  = duration;
  animState.loop   = loop;
}
function clearAction() {
  animState.action = null;
  animState.timer  = 0;
  animState.loop   = false;
}

// ── POSE HELPERS (appliquées chaque frame) ─────────────
// Toutes les poses manipulent les groupes userData du personnage
// et laissent animateWalk prendre le dessus quand inactif

function poseIdle(char) {
  // bras légèrement baissés, tête qui se balance doucement
  char.userData.armL.rotation.x = Math.sin(Date.now() * 0.001) * 0.06 - 0.1;
  char.userData.armR.rotation.x = -Math.sin(Date.now() * 0.001) * 0.06 - 0.1;
  char.userData.armL.rotation.z =  0.08;
  char.userData.armR.rotation.z = -0.08;
}

function poseDrink(char, t) {
  // Bras droit levé vers la bouche, tête légèrement inclinée
  char.userData.armR.rotation.x = -1.4 + Math.sin(t * 2) * 0.08;
  char.userData.armR.rotation.z = -0.3;
  char.userData.armL.rotation.x = -0.2;
  char.userData.armL.rotation.z =  0.1;
  char.userData.head.rotation.x =  0.15 + Math.sin(t * 2) * 0.05;
}

function poseEat(char, t) {
  // Bras gauche levé, mouvement de mâchoire simulé avec head scale
  char.userData.armL.rotation.x = -1.2 + Math.sin(t * 3) * 0.15;
  char.userData.armL.rotation.z =  0.3;
  char.userData.armR.rotation.x = -0.15;
  char.userData.head.rotation.x = Math.sin(t * 3) * 0.08;
}

function poseSmoke(char, t) {
  // Bras droit à la bouche, tête légèrement relevée, bras gauche croisé
  char.userData.armR.rotation.x = -1.1 + Math.sin(t * 0.8) * 0.1;
  char.userData.armR.rotation.z = -0.25;
  char.userData.armL.rotation.x = -0.4;
  char.userData.armL.rotation.z =  0.35;
  char.userData.head.rotation.x = -0.1 + Math.sin(t * 0.5) * 0.04;
  char.userData.head.rotation.y = Math.sin(t * 0.3) * 0.08;
}

function poseDance(char, t) {
  // Bras en l'air, corps qui se trémousse
  const beat = Math.sin(t * 5);
  char.userData.armL.rotation.x = -1.6 + beat * 0.3;
  char.userData.armR.rotation.x = -1.6 - beat * 0.3;
  char.userData.armL.rotation.z =  0.6 + beat * 0.2;
  char.userData.armR.rotation.z = -0.6 - beat * 0.2;
  char.userData.legL.rotation.x = beat * 0.4;
  char.userData.legR.rotation.x = -beat * 0.4;
  char.userData.head.rotation.y = Math.sin(t * 2.5) * 0.2;
  // Bounce vertical du corps entier
  char.position.y = Math.abs(Math.sin(t * 5)) * 0.12;
}

function poseJump(char, vy, y) {
  // Bras et jambes écartés pendant le saut
  const phase = vy > 0 ? 1 : -1; // montée vs descente
  char.userData.armL.rotation.x = phase * -1.0;
  char.userData.armR.rotation.x = phase * -1.0;
  char.userData.armL.rotation.z =  0.7;
  char.userData.armR.rotation.z = -0.7;
  char.userData.legL.rotation.x = -0.3;
  char.userData.legR.rotation.x =  0.3;
  // Squash & stretch : étire pendant la montée, se ramasse à l'atterrissage
  const stretch = 1 + y * 0.3;
  char.userData.head.position.y = 2.22 + y * 0.1;
}

// Appelé chaque frame — applique la bonne pose selon l'état
function updateCharAnimation(char, phys, t) {
  // Réinitialise les rotations parasites chaque frame
  char.userData.armL.rotation.z = 0;
  char.userData.armR.rotation.z = 0;
  char.userData.head.rotation.x = 0;
  char.userData.head.rotation.y = 0;
  if (char.userData.head.position) char.userData.head.position.y = 2.22;

  if (phys.jumping) {
    poseJump(char, playerPhysics.vy, phys.y);
    return;
  }

  if (animState.action && animState.timer > 0) {
    switch (animState.action) {
      case 'drink': poseDrink(char, t); break;
      case 'eat':   poseEat(char, t);   break;
      case 'smoke': poseSmoke(char, t); break;
      case 'dance': poseDance(char, t); break;
    }
    return;
  }

  if (phys.moving) {
    animateWalk(char, true, t, phys.speed > 0.18 ? 13 : 9);
  } else {
    poseIdle(char);
  }
}

// ── SHOKO INTÉRIEUR ───────────────────────────────────
let shokoScene = null;
let shokoActive = false;
const shokoObjects = [];
const shokoDancers = [];
const shokoLights = [];

const SHOKO_X = 25, SHOKO_Z = 28;

function buildShokoInterior(scene) {
  const m = color => new THREE.MeshLambertMaterial({ color });
  const g = new THREE.Group();

  // Sol dancefloor — grille de dalles
  const TILE_COUNT = 8;
  for (let i = 0; i < TILE_COUNT; i++) {
    for (let j = 0; j < TILE_COUNT; j++) {
      const tileColor = (i + j) % 2 === 0 ? 0x111122 : 0x220011;
      const tile = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.05, 1.5), m(tileColor));
      tile.position.set(i * 1.5 - 5.25, 0.025, j * 1.5 - 5.25);
      tile.receiveShadow = true;
      g.add(tile);
      shokoObjects.push(tile);
    }
  }

  // Murs et plafond
  const wallMat = new THREE.MeshLambertMaterial({ color: 0x0a0015 });
  [
    [14, 6, 0.3, 0, 3, -6],
    [14, 6, 0.3, 0, 3,  6],
    [0.3, 6, 12, -7, 3,  0],
    [0.3, 6, 12,  7, 3,  0],
  ].forEach(([w, h, d, x, y, z]) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
    wall.position.set(x, y, z);
    g.add(wall);
  });
  // Plafond
  const ceil = new THREE.Mesh(new THREE.BoxGeometry(14, 0.2, 12), m(0x050010));
  ceil.position.set(0, 6.1, 0);
  g.add(ceil);

  // Bar (fond de salle)
  const bar = new THREE.Mesh(new THREE.BoxGeometry(10, 1.1, 1.5), m(0x1a0830));
  bar.position.set(0, 0.55, -5.2);
  g.add(bar);
  const barTop = new THREE.Mesh(new THREE.BoxGeometry(10.2, 0.12, 1.7), m(0x8844AA));
  barTop.position.set(0, 1.12, -5.2);
  g.add(barTop);

  // Tabourets de bar
  for (let i = -3; i <= 3; i += 1.4) {
    const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.8, 8), m(0x331155));
    stool.position.set(i, 0.4, -3.8);
    g.add(stool);
    const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 8), m(0x661188));
    seat.position.set(i, 0.85, -3.8);
    g.add(seat);
  }

  // Booth VIP à droite
  const booth = new THREE.Mesh(new THREE.BoxGeometry(3, 1, 2), m(0x330055));
  booth.position.set(5.5, 0.5, 3);
  g.add(booth);

  // Miroir boule centrale (icosphère)
  const ball = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.6, 2),
    new THREE.MeshLambertMaterial({ color: 0xDDDDFF, wireframe: false })
  );
  ball.position.set(0, 5.5, 0);
  g.add(ball);
  shokoObjects.push(ball); // pour animation rotation

  // Danseurs silhouettes
  const dancerColors = [0xFF00FF, 0x00FFAA, 0xFF4488, 0x44FFFF, 0xFFAA00];
  const dancerPositions = [
    [-3, 0, -1], [3, 0, -1], [0, 0, 1.5],
    [-2, 0, 2], [2, 0, 2.5], [-1, 0, -2], [1, 0, -2.5]
  ];
  dancerPositions.forEach((pos, i) => {
    const dancer = makeSilhouette(dancerColors[i % dancerColors.length]);
    dancer.position.set(...pos);
    dancer.userData.phase = Math.random() * Math.PI * 2;
    dancer.userData.speed = 3 + Math.random() * 2;
    g.add(dancer);
    shokoDancers.push(dancer);
  });

  // Lumières couleur dynamiques
  const lightColors = [0xFF00FF, 0x00FFAA, 0xFF4400, 0x0044FF, 0xFFCC00];
  lightColors.forEach((color, i) => {
    const pl = new THREE.PointLight(color, 1.5, 10);
    pl.position.set(-4 + i * 2, 4.5, -3);
    pl.userData.phase = i * (Math.PI * 2 / lightColors.length);
    g.add(pl);
    shokoLights.push(pl);
  });

  // Lumières stroboscopiques au plafond
  const strobePositions = [[-3, 5.8, -2], [3, 5.8, -2], [0, 5.8, 1], [-3, 5.8, 3], [3, 5.8, 3]];
  strobePositions.forEach((pos, i) => {
    const strobe = new THREE.PointLight(0xFFFFFF, 0, 6);
    strobe.position.set(...pos);
    strobe.userData.phase = i * 0.4;
    g.add(strobe);
    shokoLights.push(strobe);
  });

  g.position.set(SHOKO_X, 0, SHOKO_Z);
  g.visible = false;
  scene.add(g);
  shokoScene = g;
}

function makeSilhouette(color) {
  const g = new THREE.Group();
  const m = new THREE.MeshLambertMaterial({ color, transparent: true, opacity: 0.85 });
  // Corps
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.3), m);
  body.position.y = 1.1;
  g.add(body);
  // Tête
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), m);
  head.position.y = 1.72;
  g.add(head);
  // Jambes
  [-0.14, 0.14].forEach((lx, i) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.55, 0.18), m);
    leg.position.set(lx, 0.52, 0);
    g.add(leg);
    g.userData[`leg${i}`] = leg;
  });
  // Bras
  [-0.38, 0.38].forEach((ax, i) => {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.5, 0.16), m);
    arm.position.set(ax, 1.1, 0);
    g.add(arm);
    g.userData[`arm${i}`] = arm;
  });
  return g;
}

function openShoko(scene) {
  if (!shokoScene) buildShokoInterior(scene);
  shokoScene.visible = true;
  shokoActive = true;
  showMsg('🎵 Bienvenue au Shoko ! Danse avec Espace !');
  setAction('dance', Infinity, true);
}

function closeShoko() {
  if (shokoScene) shokoScene.visible = false;
  shokoActive = false;
  clearAction();
}

function updateShokoAnimation(t) {
  if (!shokoActive || !shokoScene) return;

  // Rotation miroir boule
  const ball = shokoObjects.find(o => o.geometry?.type === 'IcosahedronGeometry');
  if (ball) {
    ball.rotation.y = t * 0.4;
    ball.rotation.x = t * 0.15;
  }

  // Danseurs silhouettes
  shokoDancers.forEach(d => {
    const beat = Math.sin(t * d.userData.speed + d.userData.phase);
    const beat2 = Math.sin(t * d.userData.speed * 0.5 + d.userData.phase);
    if (d.userData.leg0) d.userData.leg0.rotation.x =  beat * 0.5;
    if (d.userData.leg1) d.userData.leg1.rotation.x = -beat * 0.5;
    if (d.userData.arm0) d.userData.arm0.rotation.x = -1.2 + beat2 * 0.4;
    if (d.userData.arm1) d.userData.arm1.rotation.x = -1.2 - beat2 * 0.4;
    if (d.userData.arm0) d.userData.arm0.rotation.z =  0.5 + beat2 * 0.2;
    if (d.userData.arm1) d.userData.arm1.rotation.z = -0.5 - beat2 * 0.2;
    d.position.y = Math.abs(Math.sin(t * d.userData.speed * 0.9 + d.userData.phase)) * 0.12;
    d.rotation.y = Math.sin(t * 0.3 + d.userData.phase) * 0.5;
  });

  // Lumières colorées — rotation des couleurs
  shokoLights.forEach((light, i) => {
    if (i < 5) {
      // Lumières couleur : intensity pulse
      light.intensity = 1.2 + Math.sin(t * 3 + light.userData.phase) * 0.8;
      // Déplacement circulaire
      const r = 4.5;
      light.position.x = Math.cos(t * 0.8 + light.userData.phase) * r;
      light.position.z = Math.sin(t * 0.8 + light.userData.phase) * r - 2;
    } else {
      // Stroboscopes
      const strobe = Math.sin(t * 8 + light.userData.phase);
      light.intensity = strobe > 0.85 ? 2.5 : 0;
    }
  });

  // Dalles dancefloor — changement de couleur au rythme
  const beat = Math.sin(t * 5) > 0.6;
  shokoObjects.forEach((obj, i) => {
    if (obj.geometry?.type === 'BoxGeometry' && obj.geometry.parameters?.height === 0.05) {
      const baseColor = (Math.floor(i / 8) + i % 8) % 2 === 0 ? 0x111122 : 0x220011;
      const litColor  = [0xFF00FF, 0x00FFFF, 0xFF4400, 0x00FF88][i % 4];
      obj.material.color.setHex(beat && Math.random() > 0.7 ? litColor : baseColor);
    }
  });
}

// ── Ticker central des animations ─────────────────────
function updateAnimations(t, dt) {
  // Décrémenter le timer de l'action en cours
  if (animState.action && !animState.loop && animState.timer > 0) {
    animState.timer -= dt;
    if (animState.timer <= 0) clearAction();
  }
  updateShokoAnimation(t);
}

// ── Actions contextuelles (appelées depuis shops.js / main.js) ──
function triggerDrink()  { setAction('drink', 3.0); showMsg('☕ Hmmm, délicieux !'); }
function triggerEat()    { setAction('eat',   3.5); showMsg('😋 Un délice !'); }
function triggerSmoke()  { setAction('smoke', 5.0); showMsg('🚬 Une pause bien méritée...'); }


// ── CEL-SHADING OUTLINE + BLOOM (post-canvas) ─────────
function initPostProcessing() {
  const pc = document.getElementById('post-canvas');
  if (!pc) return;
  pc.width  = window.innerWidth;
  pc.height = window.innerHeight;
  window.addEventListener('resize', () => {
    pc.width  = window.innerWidth;
    pc.height = window.innerHeight;
  });
}

// Vignette permanente + légère teinte dorée (cinématique)
function renderPostFX(dayFactor) {
  const pc = document.getElementById('post-canvas');
  if (!pc || pc._highActive) return; // skip si effet high en cours
  const ctx = pc.getContext('2d');
  const w = pc.width, h = pc.height;
  ctx.clearRect(0, 0, w, h);

  // Vignette sombre sur les bords
  const vig = ctx.createRadialGradient(w/2, h/2, w*0.3, w/2, h/2, w*0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = vig; ctx.fillRect(0,0,w,h);

  // Teinte chaude au coucher du soleil
  if (dayFactor < 0.4) {
    const sunsetAlpha = (0.4 - dayFactor) / 0.4 * 0.15;
    ctx.fillStyle = `rgba(255,100,20,${sunsetAlpha})`;
    ctx.fillRect(0,0,w,h);
  }

  // Nuit — teinte bleutée
  if (dayFactor < 0.1) {
    const nightAlpha = (0.1 - dayFactor) / 0.1 * 0.25;
    ctx.fillStyle = `rgba(10,20,80,${nightAlpha})`;
    ctx.fillRect(0,0,w,h);
  }
}

window.renderPostFX = renderPostFX;
window.initPostProcessing = initPostProcessing;

// Expose globalement pour shops.js
window.triggerDrink = triggerDrink;
window.triggerEat   = triggerEat;
window.triggerSmoke = triggerSmoke;
window.openShoko    = openShoko;
window.closeShoko   = closeShoko;
window.shokoActive  = false;
