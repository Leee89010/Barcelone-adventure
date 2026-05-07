// ═══════════════════════════════════════════════════════
// PHYSICS — mouvement TPS, saut arcade, collisions
// ═══════════════════════════════════════════════════════

const colliders = [];

function addCollider(cx, cz, hw, hd) {
  colliders.push({ cx, cz, hw, hd });
}

function resolveCollision(px, pz, radius = 0.45) {
  let rx = px, rz = pz;
  for (const c of colliders) {
    const dx = rx - c.cx, dz = rz - c.cz;
    const ox = c.hw + radius - Math.abs(dx);
    const oz = c.hd + radius - Math.abs(dz);
    if (ox > 0 && oz > 0) {
      if (ox < oz) rx += dx > 0 ? ox : -ox;
      else         rz += dz > 0 ? oz : -oz;
    }
  }
  return { x: rx, z: rz };
}

const playerPhysics = {
  vx: 0, vz: 0,
  vy: 0, y: 0,
  onGround: true,
  MAX_SPEED:    0.12,
  SPRINT_MULT:  1.8,
  ACCEL:        0.18,   // lerp factor — plus faible = plus smooth, pas d overshoot
  FRICTION:     0.75,   // freinage rapide
  STOP_THRESH:  0.002,
  JUMP_FORCE:   0.18,
  GRAVITY:      0.012,
};

function resetPlayerVelocity() {
  playerPhysics.vx = 0;
  playerPhysics.vz = 0;
}

function jump() {
  if (!playerPhysics.onGround) return false;
  playerPhysics.vy = playerPhysics.JUMP_FORCE;
  playerPhysics.onGround = false;
  return true;
}

function updatePlayerPhysics(inputX, inputZ, sprinting) {
  const maxSpd = playerPhysics.MAX_SPEED * (sprinting ? playerPhysics.SPRINT_MULT : 1);
  const hasInput = inputX !== 0 || inputZ !== 0;

  if (hasInput) {
    const len = Math.sqrt(inputX * inputX + inputZ * inputZ);
    const nx = inputX / len, nz = inputZ / len;
    // Lerp doux vers vitesse cible — ACCEL fixe, pas multiplié par sprint
    playerPhysics.vx += (nx * maxSpd - playerPhysics.vx) * playerPhysics.ACCEL;
    playerPhysics.vz += (nz * maxSpd - playerPhysics.vz) * playerPhysics.ACCEL;
  } else {
    playerPhysics.vx *= playerPhysics.FRICTION;
    playerPhysics.vz *= playerPhysics.FRICTION;
    if (Math.abs(playerPhysics.vx) < playerPhysics.STOP_THRESH) playerPhysics.vx = 0;
    if (Math.abs(playerPhysics.vz) < playerPhysics.STOP_THRESH) playerPhysics.vz = 0;
  }

  // Clamp vitesse absolue
  const spd = Math.sqrt(playerPhysics.vx ** 2 + playerPhysics.vz ** 2);
  if (spd > maxSpd) {
    playerPhysics.vx = (playerPhysics.vx / spd) * maxSpd;
    playerPhysics.vz = (playerPhysics.vz / spd) * maxSpd;
  }

  // Vertical
  if (!playerPhysics.onGround) {
    playerPhysics.vy -= playerPhysics.GRAVITY;
    playerPhysics.y  += playerPhysics.vy;
    if (playerPhysics.y <= 0) {
      playerPhysics.y = 0; playerPhysics.vy = 0;
      playerPhysics.onGround = true;
    }
  }

  return {
    vx: playerPhysics.vx, vz: playerPhysics.vz,
    y: playerPhysics.y, speed: spd,
    moving:  spd > playerPhysics.STOP_THRESH,
    jumping: !playerPhysics.onGround,
  };
}

const WORLD_BOUNDS = { minX: -100, maxX: 100, minZ: -90, maxZ: 65 };

function clampToBounds(x, z) {
  return {
    x: Math.max(WORLD_BOUNDS.minX, Math.min(WORLD_BOUNDS.maxX, x)),
    z: Math.max(WORLD_BOUNDS.minZ, Math.min(WORLD_BOUNDS.maxZ, z)),
  };
}
