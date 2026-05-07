// ═══════════════════════════════════════════════════════
// CHARACTERS — Léo, Clara, Tcheezy, Tysha, proies
// ═══════════════════════════════════════════════════════

function makeChar(opts, sceneRef) {
  const g = new THREE.Group();
  const m = color => new THREE.MeshLambertMaterial({ color });

  // Legs
  const legL = new THREE.Group(), legR = new THREE.Group();
  [-0.18, 0.18].forEach((lx, i) => {
    const grp = i === 0 ? legL : legR;
    const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.35, 0.22), m(opts.pants));
    thigh.position.y = -0.17; grp.add(thigh);
    const shin = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.32, 0.2), m(opts.pants));
    shin.position.y = -0.5; grp.add(shin);
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.32), m(0x222233));
    shoe.position.set(0, -0.68, 0.05); grp.add(shoe);
    grp.position.set(lx, 0.62, 0);
    g.add(grp);
  });
  g.userData.legL = legL; g.userData.legR = legR;

  // Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.8, 0.42), m(opts.shirt));
  torso.position.y = 1.3; torso.castShadow = true; g.add(torso);

  // Arms
  const armL = new THREE.Group(), armR = new THREE.Group();
  [-0.46, 0.46].forEach((ax, i) => {
    const grp = i === 0 ? armL : armR;
    const ua = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.32, 0.2), m(opts.shirt));
    ua.position.y = -0.16; grp.add(ua);
    const fa = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.28, 0.18), m(opts.skin));
    fa.position.y = -0.46; grp.add(fa);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.1, 7, 7), m(opts.skin));
    hand.position.y = -0.64; grp.add(hand);
    grp.position.set(ax, 1.62, 0);
    g.add(grp);
  });
  g.userData.armL = armL; g.userData.armR = armR;

  // Neck + Head
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.22, 8), m(opts.skin));
  neck.position.set(0, 1.82, 0); g.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 14, 14), m(opts.skin));
  head.scale.set(1, 1.05, 0.95); head.position.set(0, 2.22, 0); head.castShadow = true;
  g.add(head); g.userData.head = head;

  // Eyes
  [-0.12, 0.12].forEach(ex => {
    const ew = new THREE.Mesh(new THREE.SphereGeometry(0.082, 9, 9), m(0xFFFFFF));
    ew.position.set(ex, 2.24, 0.31); g.add(ew);
    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), m(opts.eyeColor || 0x3a2010));
    iris.position.set(ex, 2.24, 0.35); g.add(iris);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.032, 6, 6), m(0x050505));
    pupil.position.set(ex, 2.24, 0.37); g.add(pupil);
    const shine = new THREE.Mesh(new THREE.SphereGeometry(0.016, 4, 4), m(0xFFFFFF));
    shine.position.set(ex + 0.018, 2.265, 0.39); g.add(shine);
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.028, 0.02), m(opts.hair));
    brow.position.set(ex, 2.37, 0.3); brow.rotation.z = ex < 0 ? 0.22 : -0.22; g.add(brow);
  });

  // Nose + mouth + cheeks
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.052, 6, 6), m(0xBB7040));
  nose.position.set(0, 2.15, 0.34); g.add(nose);
  const mouthGeo = new THREE.TorusGeometry(0.09, 0.025, 4, 10, Math.PI);
  const mouth = new THREE.Mesh(mouthGeo, m(0xCC5040));
  mouth.position.set(0, 2.07, 0.32); mouth.rotation.z = Math.PI; g.add(mouth);
  [-0.22, 0.22].forEach(cx => {
    const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.072, 6, 6),
      new THREE.MeshLambertMaterial({ color: 0xFFAABB, transparent: true, opacity: 0.55 }));
    cheek.position.set(cx, 2.13, 0.3); g.add(cheek);
  });

  // Hair
  if (!opts.isFemale) {
    // Léo — cheveux bouclés
    const topH = new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 10), m(opts.hair));
    topH.position.set(0, 2.54, 0); g.add(topH);
    for (let a = 0; a < 10; a++) {
      const angle = a * Math.PI * 2 / 10;
      const curl = new THREE.Mesh(new THREE.SphereGeometry(0.16 + Math.random() * 0.05, 7, 7), m(opts.hair));
      curl.position.set(Math.cos(angle) * 0.29, 2.52 + Math.abs(Math.sin(a)) * 0.04, Math.sin(angle) * 0.18);
      g.add(curl);
    }
    const beard = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8),
      new THREE.MeshLambertMaterial({ color: 0x3a2010, transparent: true, opacity: 0.45 }));
    beard.position.set(0, 2.0, 0.14); beard.scale.set(1.0, 0.55, 0.85); g.add(beard);
  } else {
    // Clara — longs cheveux
    const topH = new THREE.Mesh(new THREE.SphereGeometry(0.39, 12, 12), m(opts.hair));
    topH.position.set(0, 2.52, -0.04); g.add(topH);
    const longH = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.9, 0.16), m(opts.hair));
    longH.position.set(0, 1.86, -0.15); g.add(longH);
    [-0.3, 0.3].forEach(sx => {
      const sh = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.8, 0.22), m(opts.hair));
      sh.position.set(sx, 1.9, 0.06); g.add(sh);
    });
  }

  g.castShadow = true;
  sceneRef.add(g);
  return g;
}

function makeCat(opts, sceneRef) {
  const g = new THREE.Group();
  const m = color => new THREE.MeshLambertMaterial({ color });

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 12), m(opts.body));
  body.scale.set(1.05, 0.78, 1.35); body.position.set(0, 0.3, 0); body.castShadow = true; g.add(body);

  if (opts.belly) {
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.23, 9, 9), m(opts.belly));
    belly.scale.set(0.85, 0.75, 1.05); belly.position.set(0, 0.29, 0.22); g.add(belly);
  }

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.27, 12, 12), m(opts.body));
  head.scale.set(1.05, 1, 1); head.position.set(0, 0.66, 0.3); head.castShadow = true;
  g.add(head); g.userData.head = head;

  [-0.15, 0.15].forEach(ex => {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.22, 4), m(opts.body));
    ear.position.set(ex, 0.92, 0.3); ear.rotation.z = ex < 0 ? -0.3 : 0.3; g.add(ear);
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.14, 4), m(0xffbbcc));
    inner.position.set(ex, 0.93, 0.31); inner.rotation.z = ex < 0 ? -0.3 : 0.3; g.add(inner);
  });

  [-0.1, 0.1].forEach(ex => {
    const eyeW = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), m(0xEEFFEE));
    eyeW.position.set(ex, 0.68, 0.54); g.add(eyeW);
    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.038, 7, 7), m(opts.eyeColor || 0x88DD44));
    iris.position.set(ex, 0.68, 0.57); g.add(iris);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.022, 5, 5), m(0x111111));
    pupil.position.set(ex, 0.68, 0.59); g.add(pupil);
  });

  const cnose = new THREE.Mesh(new THREE.SphereGeometry(0.028, 5, 5), m(0xffaaaa));
  cnose.position.set(0, 0.63, 0.56); g.add(cnose);

  [-1, 1].forEach(side => {
    [0, 0.04, -0.04].forEach(wy => {
      const wh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.01, 0.01), m(0xFFFFFF));
      wh.position.set(side * 0.25, 0.64 + wy, 0.53); g.add(wh);
    });
  });

  [[-0.2, 0.12, 0.22], [0.2, 0.12, 0.22], [-0.16, 0.1, -0.18], [0.16, 0.1, -0.18]].forEach(([lx, ly, lz]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.24, 6), m(opts.body));
    leg.position.set(lx, ly, lz); g.add(leg);
    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), m(opts.belly || opts.body));
    paw.position.set(lx, ly - 0.14, lz); g.add(paw);
  });

  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.03, 0.7, 6), m(opts.body));
  tail.position.set(0, 0.38, -0.5); tail.rotation.x = 1.0; tail.rotation.z = 0.2; g.add(tail);
  const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), m(opts.tipColor || opts.body));
  tailTip.position.set(0.12, 0.55, -0.75); g.add(tailTip);

  if (opts.stripes) {
    for (let i = 0; i < 5; i++) {
      const s = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.042, 0.042),
        new THREE.MeshLambertMaterial({ color: 0x666666, transparent: true, opacity: 0.55 }));
      s.position.set(0, 0.28 + i * 0.09, 0.38); g.add(s);
    }
  }

  sceneRef.add(g);
  return g;
}

function makePrey(color, sceneRef) {
  const g = new THREE.Group();
  const m = c => new THREE.MeshLambertMaterial({ color: c });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.35), m(color));
  body.position.y = 0.04; g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 6), m(color));
  head.position.set(0, 0.06, 0.22); g.add(head);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.25, 4), m(color));
  tail.position.set(0, 0.04, -0.22); tail.rotation.x = Math.PI / 2; g.add(tail);
  sceneRef.add(g);
  return g;
}

// Animation helpers
function animateWalk(char, moving, t, freq = 9) {
  const amp = moving ? 0.52 : 0;
  char.userData.legL.rotation.x  += (Math.sin(t * freq) * amp  - char.userData.legL.rotation.x)  * 0.28;
  char.userData.legR.rotation.x  += (-Math.sin(t * freq) * amp - char.userData.legR.rotation.x)  * 0.28;
  char.userData.armL.rotation.x  += (-Math.sin(t * freq) * 0.3 * (moving ? 1 : 0) - char.userData.armL.rotation.x) * 0.28;
  char.userData.armR.rotation.x  += (Math.sin(t * freq)  * 0.3 * (moving ? 1 : 0) - char.userData.armR.rotation.x) * 0.28;
  char.position.y = moving ? Math.abs(Math.sin(t * freq)) * 0.055 : Math.sin(t * 1.5) * 0.01;
}
