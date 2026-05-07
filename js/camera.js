// ═══════════════════════════════════════════════════════
// CAMERA — third-person smooth, spring damping
// ═══════════════════════════════════════════════════════

const cam = {
  theta: 0, phi: 0.5, radius: 14,
  targetX: 0, targetY: 1.5, targetZ: 0,
  currentX: 0, currentY: 8,  currentZ: 14,
  velX: 0, velY: 0, velZ: 0,   // vitesses spring
  isDragging: false,
  lastMX: 0, lastMY: 0,
  autoResetTimer: null,
};

function initCamera(camera) {
  camera.position.set(0, 8, 14);
  camera.lookAt(0, 0, 0);

  document.addEventListener('mousedown', e => {
    if (e.target.closest('button,input,.panel,#menu-overlay,#settings-overlay,#map-overlay')) return;
    if (e.button === 0) {
      cam.isDragging = true;
      cam.lastMX = e.clientX; cam.lastMY = e.clientY;
      clearTimeout(cam.autoResetTimer);
    }
  });

  document.addEventListener('mousemove', e => {
    if (!cam.isDragging) return;
    cam.theta -= (e.clientX - cam.lastMX) * 0.004;
    cam.phi    = Math.max(0.15, Math.min(1.4, cam.phi + (e.clientY - cam.lastMY) * 0.004));
    cam.lastMX = e.clientX; cam.lastMY = e.clientY;
  });

  document.addEventListener('mouseup', e => {
    if (e.button !== 0 || !cam.isDragging) return;
    cam.isDragging = false;
    clearTimeout(cam.autoResetTimer);
    cam.autoResetTimer = setTimeout(() => { cam.theta = 0; cam.phi = 0.5; }, 2500);
  });

  document.addEventListener('wheel', e => {
    if (e.target.closest('.panel,#menu-overlay,#settings-overlay,#map-overlay')) return;
    cam.radius = Math.max(4, Math.min(55, cam.radius + e.deltaY * 0.016));
  }, { passive: true });

  let touchStart = null;
  document.addEventListener('touchstart', e => {
    if (e.touches.length === 2) touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });
  document.addEventListener('touchmove', e => {
    if (e.touches.length !== 2 || !touchStart) return;
    cam.theta -= (e.touches[0].clientX - touchStart.x) * 0.005;
    cam.phi    = Math.max(0.15, Math.min(1.4, cam.phi + (e.touches[0].clientY - touchStart.y) * 0.005));
    touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });
}

function resetCamera() {
  clearTimeout(cam.autoResetTimer);
  cam.theta = 0; cam.phi = 0.5; cam.radius = 14;
}

// Spring constant et damping pour caméra organique
const CAM_STIFFNESS = 200; // force du ressort
const CAM_DAMPING   = 22;  // amortissement

function updateCamera(camera, tx, tz, dt, isMoving) {
  // Suivi du joueur — très réactif
  const snapK = 1 - Math.exp(-12 * dt);
  cam.targetX += (tx - cam.targetX) * snapK;
  cam.targetZ += (tz - cam.targetZ) * snapK;

  // Réalignement doux derrière le joueur en mouvement
  if (isMoving && !cam.isDragging) {
    const alignK = 1 - Math.exp(-1.5 * dt);
    cam.theta += (0 - cam.theta) * alignK;
  }

  // Position orbitale désirée
  const desiredX = cam.targetX + cam.radius * Math.sin(cam.theta) * Math.cos(cam.phi);
  const desiredY = Math.max(2, cam.radius * Math.sin(cam.phi) + cam.targetY);
  const desiredZ = cam.targetZ + cam.radius * Math.cos(cam.theta) * Math.cos(cam.phi);

  // Spring damper — donne un mouvement organique naturel
  const ax = (desiredX - cam.currentX) * CAM_STIFFNESS - cam.velX * CAM_DAMPING;
  const ay = (desiredY - cam.currentY) * CAM_STIFFNESS - cam.velY * CAM_DAMPING;
  const az = (desiredZ - cam.currentZ) * CAM_STIFFNESS - cam.velZ * CAM_DAMPING;

  cam.velX += ax * dt; cam.velY += ay * dt; cam.velZ += az * dt;
  cam.currentX += cam.velX * dt;
  cam.currentY += cam.velY * dt;
  cam.currentZ += cam.velZ * dt;

  camera.position.set(cam.currentX, cam.currentY, cam.currentZ);
  camera.lookAt(cam.targetX, cam.targetY + 0.6, cam.targetZ);
}

window.cam = cam;
