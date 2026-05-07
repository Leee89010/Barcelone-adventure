// ═══════════════════════════════════════════════════════
// WORLD — ville, bâtiments, décors, éclairage
// ═══════════════════════════════════════════════════════

let scene, sun, ambLight, clubLight, casLight;

// Cache matériaux pour les perfs
const _mats = {};
function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!_mats[key]) _mats[key] = new THREE.MeshLambertMaterial({ color, ...opts });
  return _mats[key];
}

// Helpers
function box(w, h, d, color, x, y, z, ry = 0, opts = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, opts));
  m.position.set(x, y, z);
  m.rotation.y = ry;
  m.castShadow = true;
  m.receiveShadow = true;
  scene.add(m);
  return m;
}
function cyl(rt, rb, h, seg, color, x, y, z) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(color));
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  scene.add(m);
  return m;
}
function sph(r, color, x, y, z, seg = 10) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg, seg), mat(color));
  m.position.set(x, y, z);
  m.castShadow = true;
  scene.add(m);
  return m;
}
function cone(r, h, seg, color, x, y, z) {
  const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), mat(color));
  m.position.set(x, y, z);
  m.castShadow = true;
  scene.add(m);
  return m;
}

function building(x, z, w, d, h, wall, roof, ry = 0) {
  box(w, h, d, wall, x, h / 2, z, ry);
  box(w + 0.4, 0.5, d + 0.4, roof, x, h + 0.25, z, ry);
  addCollider(x, z, w / 2 + 0.2, d / 2 + 0.2);
  // Windows
  for (let fy = 1.5; fy < h - 0.4; fy += 2) {
    for (let fx = -w / 2 + 1; fx < w / 2; fx += 1.5) {
      const wm = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.7, 0.08),
        mat(0x88CCFF, { transparent: true, opacity: 0.82 })
      );
      wm.position.set(x + Math.cos(ry) * fx, fy, z + (d / 2 + 0.05) * Math.cos(ry));
      wm.rotation.y = ry;
      scene.add(wm);
    }
  }
  // Balconies
  for (let fy = 2; fy < h - 1; fy += 2.5) {
    box(w + 0.5, 0.12, 0.4, 0xC8B070, x, fy, z + (d / 2 + 0.22) * Math.cos(ry), ry);
  }
}

function cityBlock(bx, bz, count = 4) {
  const wallColors = [0xE8B87A, 0xF4CCA0, 0xD4924A, 0xF0D098, 0xEDBC84, 0xCD853F, 0xDEB887, 0xF8D8A0];
  const roofColors = [0xC07040, 0xCC8844, 0xA06030, 0xC08040, 0xB87840, 0xA05020, 0xB06028, 0xD0A050];
  const positions = [[-2, -1], [2, -1], [-2, 1], [2, 1], [0, -2], [0, 2], [-3, 0], [3, 0]];
  for (let i = 0; i < count; i++) {
    const [ox, oz] = positions[i % positions.length];
    const ci = Math.floor(Math.random() * wallColors.length);
    const w = 3 + Math.random() * 3;
    const d = 3 + Math.random() * 3;
    const h = 5 + Math.random() * 10;
    building(bx + ox * 4, bz + oz * 4, w, d, h, wallColors[ci], roofColors[ci]);
  }
}

function palm(x, z, h = 6) {
  cyl(0.12, 0.2, h, 7, 0x8B6020, x, h / 2, z);
  [0, 51.4, 102.8, 154.3, 205.7, 257.1, 308.6].forEach(a => {
    const r = a * Math.PI / 180;
    const lm = new THREE.Mesh(new THREE.ConeGeometry(0.12, 2.5, 5), mat(0x228B22));
    lm.position.set(x + Math.cos(r) * 1.4, h + 0.3, z + Math.sin(r) * 1.4);
    lm.rotation.z = Math.cos(r) * 0.7;
    lm.rotation.x = Math.sin(r) * 0.7;
    lm.castShadow = true;
    scene.add(lm);
  });
  sph(0.55, 0x1a7a10, x, h, z, 6);
}

function tree(x, z) {
  cyl(0.18, 0.28, 3, 7, 0x7B4A10, x, 1.5, z);
  sph(1.1, 0x2d8a2d, x, 3.4, z, 8);
  sph(0.7, 0x3a9a30, x + 0.4, 4.2, z - 0.2, 7);
}

function lamp(x, z) {
  cyl(0.07, 0.1, 4, 7, 0x445566, x, 2, z);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.8), mat(0x445566));
  arm.position.set(x, 4.1, z + 0.4);
  scene.add(arm);
  sph(0.2, 0xFFEE88, x, 4.1, z + 0.8, 6);
  const pl = new THREE.PointLight(0xFFDD77, 0.7, 9);
  pl.position.set(x, 4, z + 0.8);
  scene.add(pl);
}

// Waves array for animation
const waves = [];

function buildWorld(sceneRef) {
  scene = sceneRef;

  // ── Lights
  ambLight = new THREE.AmbientLight(0xfff0e0, 0.55);
  scene.add(ambLight);

  sun = new THREE.DirectionalLight(0xfff5cc, 1.8);
  sun.position.set(25, 40, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  sun.shadow.radius = 3; // PCF soft shadows
  sun.shadow.camera.left = -70; sun.shadow.camera.right = 70;
  sun.shadow.camera.top = 70;  sun.shadow.camera.bottom = -70;
  sun.shadow.camera.near = 0.5; sun.shadow.camera.far = 220;
  sun.shadow.bias = -0.0003;
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0xaaccff, 0.45);
  fill.position.set(-20, 10, -15);
  scene.add(fill);

  // Hemisphere light douce
  const hemi = new THREE.HemisphereLight(0xD4EEFF, 0xB8A878, 0.3);
  scene.add(hemi);

  // ── Ground
  // Ground avec légère variation de couleur
  const gndMat = new THREE.MeshLambertMaterial({ color: 0xC8B878 });
  const gnd = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), gndMat);
  gnd.rotation.x = -Math.PI / 2;
  gnd.receiveShadow = true;
  scene.add(gnd);

  // Plaza tiles
  for (let i = -6; i <= 6; i++) for (let j = -6; j <= 6; j++) {
    const c = (i + j) % 2 === 0 ? 0xD6C488 : 0xC8B870;
    const t = new THREE.Mesh(new THREE.PlaneGeometry(1.95, 1.95), mat(c));
    t.rotation.x = -Math.PI / 2;
    t.position.set(i * 2, 0.01, j * 2);
    t.receiveShadow = true;
    scene.add(t);
  }

  // Roads
  function road(ax, az, bx, bz, w = 4.5) {
    const dx = bx - ax, dz = bz - az;
    const len = Math.sqrt(dx * dx + dz * dz);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, len), mat(0x3a3a4a));
    m.rotation.x = -Math.PI / 2;
    m.rotation.z = Math.atan2(dx, dz);
    m.position.set((ax + bx) / 2, 0.012, (az + bz) / 2);
    m.receiveShadow = true;
    scene.add(m);
  }
  road(-80, -12, 80, -12); road(-80, 12, 80, 12);
  road(-12, -80, -12, 80); road(12, -80, 12, 80);
  road(-80, -35, 80, -35); road(-80, 35, 80, 35);
  road(-35, -80, -35, 80); road(35, -80, 35, 80);
  road(-80, -55, 80, -55); road(-55, -80, -55, 80);
  road(55, -80, 55, 80);

  // City blocks
  const blockPos = [
    [-25,-25],[-25,-50],[-50,-25],[-50,-50],
    [25,-25],[25,-50],[50,-25],[50,-50],
    [-25,25],[-50,25],[25,25],[50,25],
    [-25,-75],[-50,-75],[0,-75],[25,-75],[50,-75],
    [-75,-25],[-75,-50],[-75,0],[75,-25],[75,-50],[75,0],
    [-75,25],[75,25],
  ];
  blockPos.forEach(([bx, bz]) => cityBlock(bx, bz, 4 + Math.floor(Math.random() * 4)));

  // ── SAGRADA FAMÍLIA
  const SFX = 0, SFZ = -65;
  box(20, 3, 12, 0xD4B878, SFX, 1.5, SFZ);
  box(16, 5, 10, 0xCCA860, SFX, 5.5, SFZ);
  box(13, 4, 8, 0xC4A050, SFX, 9, SFZ);
  addCollider(SFX, SFZ, 10, 6);
  [[-6, 28], [-2.2, 33], [2.2, 33], [6, 28]].forEach(([tx, th]) => {
    box(2.4, th, 2.4, 0xD4A840, SFX + tx, th / 2 + 3, SFZ);
    for (let y = 4; y < th + 3; y += 1.8) box(2.5, 0.18, 2.5, 0xC89820, SFX + tx, y, SFZ);
    cone(1.3, 5.5, 8, 0xFFD700, SFX + tx, th + 5.5, SFZ);
    sph(0.55, 0xFFD700, SFX + tx, th + 8.5, SFZ, 8);
  });
  [[-9.5, 20], [9.5, 20]].forEach(([tx, th]) => {
    box(2, th, 2, 0xD0A030, SFX + tx, th / 2 + 2, SFZ);
    cone(1, 4.5, 8, 0xFFCC00, SFX + tx, th + 4.5, SFZ);
  });
  const rw = new THREE.Mesh(new THREE.CircleGeometry(3, 24), mat(0xFFAA30, { side: THREE.DoubleSide }));
  rw.position.set(SFX, 9, SFZ + 6.1); rw.rotation.y = Math.PI; scene.add(rw);

  // ── PARK GÜELL
  const GX = -45, GZ = -35;
  box(20, 0.5, 10, 0xF0E0A0, GX, 0.25, GZ);
  addCollider(GX, GZ, 10, 5);
  const mC = [0xFF6644, 0xFFCC00, 0x44AAFF, 0x88DD44, 0xFF88AA, 0xFFFFFF, 0xCC4422];
  for (let i = 0; i < 12; i++) box(1.3, 1.3, 0.4, mC[i % 7], GX - 7.5 + i * 1.3, 1.0, GZ - 4.5);
  for (const cx of [GX - 6, GX - 2, GX + 2, GX + 6]) { cyl(0.55, 0.7, 4.5, 8, 0xEEDDAA, cx, 2.25, GZ - 2); sph(0.75, 0xFFCC44, cx, 4.8, GZ - 2, 8); }
  box(5, 5, 3.5, 0xEEDD99, GX - 7, 2.5, GZ + 3); cone(3, 3.5, 4, 0xCC6622, GX - 7, 6.5, GZ + 3);

  // ── CAMP NOU
  const CNX = 45, CNZ = -35;
  const stad = new THREE.Mesh(new THREE.TorusGeometry(10, 4.5, 8, 28), mat(0xDDCCBB));
  stad.position.set(CNX, 2.5, CNZ); stad.rotation.x = Math.PI / 2; stad.castShadow = true; scene.add(stad);
  addCollider(CNX, CNZ, 14, 14);
  box(20, 0.2, 20, 0x3a8a3a, CNX, 0.1, CNZ);
  box(20, 0.04, 0.2, 0xFFFFFF, CNX, 0.14, CNZ);
  box(0.2, 0.04, 20, 0xFFFFFF, CNX, 0.14, CNZ);
  const circle = new THREE.Mesh(new THREE.RingGeometry(3, 3.2, 28), mat(0xFFFFFF, { side: THREE.DoubleSide }));
  circle.rotation.x = -Math.PI / 2; circle.position.set(CNX, 0.15, CNZ); scene.add(circle);

  // ── BEACH
  const beachMesh = new THREE.Mesh(new THREE.PlaneGeometry(150, 30), mat(0xF5D888));
  beachMesh.rotation.x = -Math.PI / 2; beachMesh.position.set(0, 0.01, 58); scene.add(beachMesh);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(200, 60), mat(0x1E7FFF));
  sea.rotation.x = -Math.PI / 2; sea.position.set(0, 0.008, 88); scene.add(sea);
  for (let i = 0; i < 6; i++) {
    const w = new THREE.Mesh(
      new THREE.PlaneGeometry(150, 2 + Math.random() * 2),
      mat(0x55AAFF, { transparent: true, opacity: 0.35 })
    );
    w.rotation.x = -Math.PI / 2; w.position.set(Math.random() * 10 - 5, 0.03 + i * 0.005, 68 + i * 3);
    scene.add(w); waves.push(w);
  }
  box(150, 0.25, 6, 0xDDD0A0, 0, 0.12, 43); // Promenade
  const umbC = [0xFF4444, 0xFFCC00, 0x4444FF, 0xFF88AA, 0x44CC44, 0xFFAA00];
  for (let i = 0; i < 10; i++) {
    cyl(0.05, 0.05, 3.5, 4, 0xA08040, -35 + i * 7, 1.75, 53);
    cone(2.5, 1.8, 8, umbC[i % 6], -35 + i * 7, 4, 53);
  }

  // ── COFFEE SHOP
  const COFX = -20, COFZ = 18;
  box(10, 5, 8, 0x8B4513, COFX, 2.5, COFZ);
  addCollider(COFX, COFZ, 5, 4);
  box(10.4, 0.5, 8.4, 0xA0522D, COFX, 5.25, COFZ);
  box(11, 0.2, 3, 0xCC4422, COFX, 4.5, COFZ + 5.5); // Awning
  box(5, 1.2, 0.2, 0xFFD700, COFX, 5.8, COFZ + 4.1); // Sign
  [[-2.5, 4.1], [2.5, 4.1]].forEach(([wx]) => {
    const wm = new THREE.Mesh(new THREE.BoxGeometry(2.5, 3, 0.1), mat(0x88CCFF, { transparent: true, opacity: 0.75 }));
    wm.position.set(COFX + wx, 2.5, COFZ + 4.1); scene.add(wm);
  });
  box(1.2, 2.8, 0.1, 0x6B3A10, COFX, 1.4, COFZ + 4.1); // Door
  for (let si = 0; si < 4; si++) { // Outdoor tables
    const sx = COFX - 3 + si * 2, sz = COFZ + 7;
    cyl(0.2, 0.2, 0.7, 6, 0x8B6020, sx, 0.35, sz);
    box(1.0, 0.1, 1.0, 0xCC4422, sx, 0.7, sz);
    box(0.4, 0.6, 0.4, 0x8B4513, sx - 0.25, 0.3, sz);
    box(0.4, 0.6, 0.4, 0x8B4513, sx + 0.25, 0.3, sz);
  }

  // ── SHOKO CLUB
  const SHKX = 25, SHKZ = 28;
  box(14, 6, 10, 0x1a1a2e, SHKX, 3, SHKZ);
  // Colliders avec gap à l'entrée (centre avant = pas de collider = porte)
  addCollider(SHKX - 5, SHKZ + 5, 2, 0.4);   // mur gauche avant
  addCollider(SHKX + 5, SHKZ + 5, 2, 0.4);   // mur droit avant
  addCollider(SHKX, SHKZ - 0.5, 7, 4.5);     // murs latéraux + fond
  box(14.5, 0.4, 10.5, 0x0a0a1a, SHKX, 6.2, SHKZ);
  box(8, 1.5, 0.15, 0xFF00AA, SHKX, 6.5, SHKZ + 5.1); // Neon sign
  for (let i = 0; i < 6; i++) sph(0.25, i % 2 === 0 ? 0xFF00FF : 0x00FFAA, SHKX - 3.5 + i * 1.3, 7.5, SHKZ + 5.1, 6);
  [[-4, 5.1], [0, 5.1], [4, 5.1]].forEach(([wx, wz]) => {
    const wm = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2, 0.08), mat(0xFF44AA, { transparent: true, opacity: 0.6 }));
    wm.position.set(SHKX + wx, 3.5, SHKZ + wz); scene.add(wm);
  });
  clubLight = new THREE.PointLight(0xFF00FF, 2, 15); clubLight.position.set(SHKX, 4, SHKZ); scene.add(clubLight);
  const clubLight2 = new THREE.PointLight(0x00FFAA, 1.5, 12); clubLight2.position.set(SHKX, 4, SHKZ + 5); scene.add(clubLight2);
  // Rope décorative (ne bloque pas l'entrée — juste cosmétique sur les côtés)
  box(2.5, 0.05, 0.05, 0xCC0044, SHKX - 5.5, 0.8, SHKZ + 5.2);
  box(2.5, 0.05, 0.05, 0xCC0044, SHKX + 5.5, 0.8, SHKZ + 5.2);
  box(0.08, 1.2, 0.08, 0xCC9900, SHKX - 6.8, 0.6, SHKZ + 5.2);
  box(0.08, 1.2, 0.08, 0xCC9900, SHKX - 4.2, 0.6, SHKZ + 5.2);
  box(0.08, 1.2, 0.08, 0xCC9900, SHKX + 4.2, 0.6, SHKZ + 5.2);
  box(0.08, 1.2, 0.08, 0xCC9900, SHKX + 6.8, 0.6, SHKZ + 5.2);

  // ── CASINO
  const CASX = 10, CASZ = 48;
  box(18, 7, 12, 0x2a1a0a, CASX, 3.5, CASZ);
  addCollider(CASX, CASZ, 9, 6);
  box(18.5, 0.3, 12.5, 0xFFD700, CASX, 0.15, CASZ);
  box(18.5, 0.3, 12.5, 0xFFD700, CASX, 7.0, CASZ);
  box(10, 2, 0.2, 0xFFD700, CASX, 8.2, CASZ + 6.1); // Sign
  [[-5, 6.1], [0, 6.1], [5, 6.1]].forEach(([wx, wz]) => {
    const wm = new THREE.Mesh(new THREE.BoxGeometry(3, 4, 0.1), mat(0xFFDD66, { transparent: true, opacity: 0.55 }));
    wm.position.set(CASX + wx, 3.5, CASZ + wz); scene.add(wm);
  });
  casLight = new THREE.PointLight(0xFFDD44, 2, 20); casLight.position.set(CASX, 5, CASZ); scene.add(casLight);
  box(4, 0.05, 2, 0xAA0000, CASX, 0.03, CASZ + 6.2); // Carpet

  // ── TREES & PALMS
  [-12, -6, 6, 12].forEach(x => { palm(x, -2, 6.5); palm(x, 4, 5.5); });
  [-8, 8].forEach(x => { tree(x, -4); tree(x, 6); });
  [-16, -12, 12, 16].forEach(x => { tree(x, 2); palm(x, 42, 5); });
  [-30, -20, -10, 0, 10, 20, 30].forEach(x => palm(x, 36, 7));
  for (let i = 0; i < 18; i++) palm(-80 + i * 9, -38, 5 + Math.random() * 3);
  for (let i = 0; i < 18; i++) tree(-80 + i * 9, -22);

  // Fountain
  cyl(3.4, 4, 0.5, 20, 0xB0A8C8, 0, 0.25, 0);
  cyl(2.8, 2.8, 0.65, 20, 0x5599CC, 0, 0.55, 0);
  cyl(0.22, 0.22, 1.8, 8, 0xCCBBAA, 0, 1.3, 0);
  cyl(1.1, 1.1, 0.22, 14, 0xCCBBAA, 0, 1.5, 0);
  cyl(0.18, 0.18, 0.8, 6, 0xCCBBAA, 0, 1.8, 0);
  cyl(0.7, 0.7, 0.12, 10, 0xCCBBAA, 0, 2.2, 0);

  // Lamps
  [-8, 0, 8].forEach(x => { lamp(x, -8); lamp(x, 8); });
  [-8, 8].forEach(z => { lamp(-13, z); lamp(13, z); });
  for (let i = -4; i <= 4; i++) { lamp(i * 10, -22); lamp(i * 10, 22); }
  for (let i = -4; i <= 4; i++) { lamp(-22, i * 10); lamp(22, i * 10); }

  return { sun, ambLight, clubLight, casLight, waves };
}

// Day/night cycle
const DAY   = { sky: new THREE.Color(0x5ab8f5), sunInt: 1.8, ambInt: 0.9 };
const SUNSET= { sky: new THREE.Color(0xFF7340), sunInt: 0.9, ambInt: 0.55 };
const NIGHT = { sky: new THREE.Color(0x08081e), sunInt: 0.12, ambInt: 0.2 };

function getDayFactor(h) {
  if (h >= 6  && h < 12) return (h - 6) / 6;
  if (h >= 12 && h < 18) return 1;
  if (h >= 18 && h < 21) return 1 - (h - 18) / 3;
  return 0;
}

function updateDayNight(h, sceneRef, lights) {
  const dayF = getDayFactor(h);
  const skyC = dayF > 0.5
    ? DAY.sky.clone().lerp(SUNSET.sky, Math.max(0, (1 - dayF) * 2))
    : NIGHT.sky.clone().lerp(SUNSET.sky, dayF * 2);
  sceneRef.background.copy(skyC);
  sceneRef.fog.color.copy(skyC);
  lights.sun.intensity = DAY.sunInt * dayF + (1 - dayF) * 0.12;
  lights.ambLight.intensity = NIGHT.ambInt + dayF * (DAY.ambInt - NIGHT.ambInt);
  if (lights.clubLight) lights.clubLight.intensity = 2 - dayF * 1.4;
  if (lights.casLight)  lights.casLight.intensity  = 1.5 - dayF * 0.8;
}

function updateWaves(t) {
  waves.forEach((w, i) => {
    w.position.x += Math.sin(t * 0.8 + i) * 0.015;
    w.material.opacity = 0.25 + Math.sin(t * 1.2 + i) * 0.1;
  });
}

function getTimeLabel(h) {
  const hh = Math.floor(h).toString().padStart(2, '0');
  const mm = Math.floor((h % 1) * 60).toString().padStart(2, '0');
  return (h > 6 && h < 20 ? '☀️ ' : '🌙 ') + hh + ':' + mm;
}
