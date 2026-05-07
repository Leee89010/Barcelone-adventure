// ═══════════════════════════════════════════════════════
// AI — Clara, chats (machine à états), proies
// ═══════════════════════════════════════════════════════

// ── CLARA AI ──────────────────────────────────────────
const claraAI = {
  state: 'follow', // follow | wander | idle
  timer: 0,
  target: { x: 0, z: 0 },
  vel: { x: 0, z: 0 }
};

function updateClaraAI(clara, leo, activeChar, dt, t) {
  const player = activeChar === 'leo' ? leo : { position: { x: leo.position.x - 2, z: leo.position.z } };
  const px = (activeChar === 'leo' ? leo : { position: clara }).position.x;
  const pz = (activeChar === 'leo' ? leo : { position: clara }).position.z;

  claraAI.timer -= dt;
  const dist = Math.hypot(clara.position.x - px, clara.position.z - pz);

  if (dist > 12) {
    claraAI.state = 'follow';
  } else if (claraAI.timer <= 0) {
    claraAI.timer = 2.5 + Math.random() * 5;
    const r = Math.random();
    if (r < 0.5)       claraAI.state = 'follow';
    else if (r < 0.75) {
      claraAI.state = 'wander';
      claraAI.target.x = px + (Math.random() - 0.5) * 12;
      claraAI.target.z = pz + (Math.random() - 0.5) * 12;
    } else {
      claraAI.state = 'idle';
    }
  }

  let tx = clara.position.x, tz = clara.position.z;
  if (claraAI.state === 'follow')      { tx = px + 2.2; tz = pz + 0.6 + Math.sin(t * 0.3) * 0.3; }
  else if (claraAI.state === 'wander') { tx = claraAI.target.x; tz = claraAI.target.z; }

  const ddx = tx - clara.position.x, ddz = tz - clara.position.z;
  const d = Math.sqrt(ddx * ddx + ddz * ddz);
  const moving = d > 0.1;

  if (moving) {
    claraAI.vel.x += (ddx / d * 0.02 - claraAI.vel.x) * 0.4;
    claraAI.vel.z += (ddz / d * 0.02 - claraAI.vel.z) * 0.4;
    const col = resolveCollision(clara.position.x + claraAI.vel.x, clara.position.z + claraAI.vel.z, 0.4);
    const b = clampToBounds(col.x, col.z);
    clara.position.x = b.x; clara.position.z = b.z;
    clara.rotation.y = Math.atan2(ddx, ddz);
  } else {
    claraAI.vel.x *= 0.8; claraAI.vel.z *= 0.8;
  }

  if (!moving) clara.userData.head.rotation.y = Math.sin(t * 0.8) * 0.12;
  animateWalk(clara, moving, t);

  // Leo suit Clara si c'est elle qui est jouée
  if (activeChar === 'clara') {
    const ltx = clara.position.x - 2.2, ltz = clara.position.z + 0.6;
    const lddx = ltx - leo.position.x, lddz = ltz - leo.position.z;
    const ld = Math.sqrt(lddx * lddx + lddz * lddz);
    if (ld > 0.1) {
      leo.position.x += lddx / ld * 0.055;
      leo.position.z += lddz / ld * 0.055;
      leo.rotation.y = Math.atan2(lddx, lddz);
    }
    animateWalk(leo, ld > 0.1, t);
  }
}

// ── CAT AI ────────────────────────────────────────────
// États : idle | follow | wander | hunt | chase | return
const catStates = {
  tcheezy: { state: 'follow', timer: 0, target: { x: 0, z: 0 }, prey: null, carrying: null, speed: 0.055 },
  tysha:   { state: 'wander', timer: 0, target: { x: 0, z: 0 }, prey: null, carrying: null, speed: 0.048 },
};

const CAT_STATE_LABELS = {
  idle:   'Fait la sieste 😴',
  follow: 'Suit le groupe',
  wander: 'Se balade 🐾',
  hunt:   'À l\'affût 👀',
  chase:  'En chasse ! 🏃',
  return: 'Rapporte une proie 🐭'
};

function updateCatAI(cat, cs, catName, px, pz, preys, wallet, updateWalletFn, showPreyAlertFn, showMsgFn, t, dt) {
  cs.timer -= dt;
  const distPlayer = Math.hypot(cat.position.x - px, cat.position.z - pz);

  // Trouver la proie la plus proche
  let nearestPrey = null, nearestDist = 999;
  preys.forEach(p => {
    if (!p.userData.active) return;
    const d = Math.hypot(p.position.x - cat.position.x, p.position.z - cat.position.z);
    if (d < nearestDist) { nearestDist = d; nearestPrey = p; }
  });

  // Transitions d'état
  if (cs.state === 'return' && cs.carrying) {
    if (distPlayer < 2.5) {
      showPreyAlertFn(`🐾 ${catName} a rapporté une proie !`);
      cs.carrying.userData.active = false;
      cs.carrying.visible = false;
      cs.carrying = null;
      wallet.amount += 5;
      updateWalletFn();
      showMsgFn(`+5€ vendu par ${catName} 🐾`);
      cs.state = 'idle'; cs.timer = 3;
    }
  } else if (cs.state === 'chase' && cs.prey) {
    const dp = Math.hypot(cs.prey.position.x - cat.position.x, cs.prey.position.z - cat.position.z);
    if (dp < 0.55) {
      cs.carrying = cs.prey; cs.prey = null; cs.state = 'return';
      cs.carrying.position.set(cat.position.x, 0.6, cat.position.z);
      showPreyAlertFn(`😸 ${catName} a attrapé sa proie !`);
    } else if (dp > 22) { cs.state = 'wander'; cs.prey = null; }
  } else if (cs.state === 'hunt' && cs.prey) {
    const dp = Math.hypot(cs.prey.position.x - cat.position.x, cs.prey.position.z - cat.position.z);
    if (dp < 4) cs.state = 'chase';
    else if (dp > 28) { cs.state = 'wander'; cs.prey = null; }
  } else if (cs.timer <= 0) {
    const r = Math.random();
    if (distPlayer > 15)               cs.state = 'follow';
    else if (nearestDist < 12 && r < 0.4) { cs.state = 'hunt'; cs.prey = nearestPrey; cs.timer = 8 + Math.random() * 6; }
    else if (r < 0.35)                 { cs.state = 'idle';   cs.timer = 2 + Math.random() * 3; }
    else if (r < 0.65)                 { cs.state = 'wander'; cs.target.x = px + (Math.random()-0.5)*16; cs.target.z = pz + (Math.random()-0.5)*16; cs.timer = 3 + Math.random() * 5; }
    else                               { cs.state = 'follow'; cs.timer = 4 + Math.random() * 4; }
  }

  // Mouvement
  let tx = cat.position.x, tz = cat.position.z, spd = 0;
  const isT = (cat === window.tcheezy || (typeof tcheezy !== "undefined" && cat === tcheezy));
  if      (cs.state === 'follow')                     { tx = px + (isT ? -1 : 1); tz = pz + 1.5; spd = cs.speed; }
  else if (cs.state === 'wander')                     { tx = cs.target.x; tz = cs.target.z; spd = cs.speed * 0.7; }
  else if ((cs.state === 'hunt' || cs.state === 'chase') && cs.prey) { tx = cs.prey.position.x; tz = cs.prey.position.z; spd = cs.speed * (cs.state === 'chase' ? 1.9 : 1.2); }
  else if (cs.state === 'return')                     { tx = px; tz = pz; spd = cs.speed * 1.1; }

  const ddx = tx - cat.position.x, ddz = tz - cat.position.z;
  const d = Math.sqrt(ddx * ddx + ddz * ddz);
  if (d > 0.1 && spd > 0) {
    const col = resolveCollision(cat.position.x + ddx / d * spd, cat.position.z + ddz / d * spd, 0.25);
    const b = clampToBounds(col.x, col.z);
    cat.position.x = b.x; cat.position.z = b.z;
    cat.rotation.y = Math.atan2(ddx, ddz);
  }

  if (cs.carrying) cs.carrying.position.set(cat.position.x, 0.6, cat.position.z);
  cat.position.y = Math.abs(Math.sin(t * 2.5 + (isT ? 0 : 1.3))) * 0.04;
  if (cat.userData.head) cat.userData.head.rotation.x = Math.sin(t * 1.2) * 0.06;

  return CAT_STATE_LABELS[cs.state] || cs.state;
}

// ── PREY AI ───────────────────────────────────────────
function updatePreys(preys, t, dt) {
  preys.forEach(p => {
    if (!p.userData.active) return;
    p.userData.dir += (Math.random() - 0.5) * 0.28;
    p.position.x += Math.cos(p.userData.dir) * p.userData.speed;
    p.position.z += Math.sin(p.userData.dir) * p.userData.speed;
    p.position.x = Math.max(-45, Math.min(45, p.position.x));
    p.position.z = Math.max(-45, Math.min(45, p.position.z));
    p.rotation.y = p.userData.dir;
    p.position.y = Math.abs(Math.sin(t * 4 + p.userData.dir)) * 0.05;
  });
}
