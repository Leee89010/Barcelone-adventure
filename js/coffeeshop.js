// ═══════════════════════════════════════════════════════
// COFFEE SHOP — Underground espagnol, chaleureux
// Produits : café + sélection spéciale 🌿
// ═══════════════════════════════════════════════════════

const COFX = -20, COFZ = 18; // position dans le monde

// ── CATALOGUE ─────────────────────────────────────────
const COFFEE_MENU = [
  // Cafés
  { id:'cafe_leche',   name:'☕ Café con leche',     desc:'Le classique catalan',        price: 3,  type:'drink', emoji:'☕',  effect:'normal'  },
  { id:'cortado',      name:'🧋 Cortado glacé',       desc:'Frais et intense',            price: 4,  type:'drink', emoji:'🧋',  effect:'normal'  },
  { id:'croissant',    name:'🥐 Croissant beurre',     desc:'Fait maison chaque matin',   price: 2.5,type:'eat',   emoji:'🥐',  effect:'normal'  },
  { id:'crema',        name:'🍮 Crema catalana',       desc:'Spécialité de la maison',    price: 5,  type:'eat',   emoji:'🍮',  effect:'normal'  },
  // Séparateur
  { id:'sep', name:'── La Sélection Especial ──', desc:'Produits premium de la maison', price:0, type:'sep' },
  // Green menu
  { id:'amnesia',      name:'🌿 Amnesia Haze',         desc:'Sativa — Créative & légère', price:12,  type:'smoke', emoji:'🌿',  effect:'sativa',  thc:'20%' },
  { id:'gorilla',      name:'🦍 Gorilla Glue #4',      desc:'Hybrid — Puissante & relaxante',price:15,type:'smoke',emoji:'🦍', effect:'hybrid',  thc:'24%' },
  { id:'blueberry',    name:'🫐 Blueberry Kush',       desc:'Indica — Détente totale',    price:13,  type:'smoke', emoji:'🫐',  effect:'indica',  thc:'18%' },
  { id:'og_kush',      name:'🔥 OG Kush',              desc:'Classic — Équilibré',        price:14,  type:'smoke', emoji:'🔥',  effect:'hybrid',  thc:'22%' },
  { id:'hash_mk',      name:'🪨 Hash Marocain',         desc:'Traditionnel — Lourd',       price:10,  type:'smoke', emoji:'🪨',  effect:'indica',  thc:'15%' },
  { id:'edible_choc',  name:'🍫 Brownie Especial',     desc:'Edible — Effets en 1h',      price:18,  type:'eat',   emoji:'🍫',  effect:'edible',  thc:'10mg'},
  { id:'edible_gummy', name:'🍬 Gummies Mango',        desc:'Edible — Doux & fruité',     price:16,  type:'eat',   emoji:'🍬',  effect:'edible',  thc:'5mg' },
];

// Effets visuels par type
const EFFECT_MESSAGES = {
  sativa:  ['🌿 Tu te sens créatif... Barcelona est magnifique !', '✨ Les couleurs sont plus vives !', '🎵 Tu as envie de danser !'],
  hybrid:  ['😌 Parfaitement relaxé mais alerte...', '🌊 Sensation de flottement agréable...', '😎 Le monde tourne plus doucement...'],
  indica:  ['😴 Tu te sens très... très... détendu...', '🛋️ Tout va bien. Tout va très bien.', '💤 Tes jambes sont lourdes...'],
  edible:  ['🕐 "Ça fait pas d\'effet..." (attends 1h)', '🚀 Oh. Oh non. C\'est parti maintenant...', '🌀 Le sol est doux comme un nuage...'],
  normal:  ['☕ Délicieux !', '😋 Un régal !', '😊 Parfait !'],
};

let coffeeShopScene = null;
let coffeeShopActive = false;

// ── UI ─────────────────────────────────────────────────
function openCoffeeShop(wallet, inventory, updateWalletFn, updateInvFn, showMsgFn) {
  const ui = document.getElementById('shop-ui');
  document.getElementById('shop-title').textContent = '🌿 La Guarida Verde';
  document.getElementById('shop-wallet').textContent = wallet.amount;

  const itemsEl = document.getElementById('shop-items');
  itemsEl.innerHTML = '';

  COFFEE_MENU.forEach(item => {
    if (item.type === 'sep') {
      const sep = document.createElement('div');
      sep.style.cssText = 'text-align:center;color:#88CC88;font-size:11px;font-weight:700;margin:10px 0 6px;letter-spacing:1px;border-top:1px solid #2a3a2a;padding-top:8px';
      sep.textContent = item.name;
      itemsEl.appendChild(sep);
      return;
    }

    const div = document.createElement('div');
    div.className = 'shop-item';
    const thcBadge = item.thc ? `<span style="background:#1a3a1a;color:#88FF88;padding:1px 6px;border-radius:4px;font-size:10px;margin-left:4px">THC ${item.thc}</span>` : '';
    const effectBadge = item.effect && item.effect !== 'normal' ? `<span style="color:#88CC88;font-size:10px"> · ${item.effect}</span>` : '';
    div.innerHTML = `
      <div style="flex:1">
        <div class="shop-item-name">${item.name}${thcBadge}</div>
        <div class="shop-item-desc">${item.desc}${effectBadge}</div>
      </div>
      <div style="display:flex;align-items:center;gap:6px">
        <span class="shop-item-price">${item.price}€</span>
        <button class="shop-buy-btn" ${wallet.amount < item.price ? 'disabled' : ''}>Acheter</button>
      </div>`;

    div.querySelector('.shop-buy-btn').addEventListener('click', () => {
      if (wallet.amount < item.price) return;
      wallet.amount -= item.price;
      inventory.push(item.emoji);
      updateWalletFn(); updateInvFn();

      // Déclenche effet visuel
      triggerItemEffect(item, showMsgFn);
      openCoffeeShop(wallet, inventory, updateWalletFn, updateInvFn, showMsgFn);
    });
    itemsEl.appendChild(div);
  });

  ui.style.display = 'block';
}

function triggerItemEffect(item, showMsgFn) {
  const msgs = EFFECT_MESSAGES[item.effect] || EFFECT_MESSAGES.normal;
  const msg = msgs[Math.floor(Math.random() * msgs.length)];
  showMsgFn(msg, 4000);

  if (item.type === 'drink')  { if (window.triggerDrink) window.triggerDrink(); }
  else if (item.type === 'eat') { if (window.triggerEat) window.triggerEat(); }
  else if (item.type === 'smoke') {
    if (window.triggerSmoke) window.triggerSmoke();
    // Effet visuel fog/blur
    applyHighEffect(item.effect);
  }
}

// Effet visuel post-processing léger
function applyHighEffect(type) {
  const canvas2d = document.getElementById('post-canvas');
  if (!canvas2d) return;
  const ctx = canvas2d.getContext('2d');
  const w = canvas2d.width, h = canvas2d.height;

  let alpha = 0, growing = true;
  const colors = {
    sativa: 'rgba(100,255,100,',
    hybrid: 'rgba(255,200,50,',
    indica: 'rgba(100,50,200,',
    edible: 'rgba(255,100,200,',
  };
  const col = colors[type] || 'rgba(255,255,255,';

  let frame = 0;
  const maxFrames = 180;
  function tick() {
    if (frame++ > maxFrames) { ctx.clearRect(0,0,w,h); return; }
    ctx.clearRect(0,0,w,h);
    const progress = frame / maxFrames;
    const a = Math.sin(progress * Math.PI) * 0.12;
    // Vignette colorée
    const grad = ctx.createRadialGradient(w/2,h/2,w*0.2, w/2,h/2,w*0.7);
    grad.addColorStop(0, col + '0)');
    grad.addColorStop(1, col + a + ')');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,w,h);
    requestAnimationFrame(tick);
  }
  tick();
}

// ── INTÉRIEUR 3D ──────────────────────────────────────
function buildCoffeeShopInterior(scene) {
  const g = new THREE.Group();
  const mat = (color, opts={}) => new THREE.MeshLambertMaterial({color, ...opts});

  // Sol — carrelage bois foncé
  for (let i = 0; i < 8; i++) for (let j = 0; j < 6; j++) {
    const c = (i + j) % 2 === 0 ? 0x5C3317 : 0x4A2810;
    const tile = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 1.4), mat(c));
    tile.position.set(i*1.4 - 4.9, 0.03, j*1.4 - 3.5);
    tile.receiveShadow = true; g.add(tile);
  }

  // Murs — pierre + bois
  const wallMat = mat(0x3D2B1F);
  [[12,5,0.25,0,2.5,-4.2],[12,5,0.25,0,2.5,4.2],
   [0.25,5,8,-5.5,2.5,0],[0.25,5,8,5.5,2.5,0]].forEach(([w,h,d,x,y,z])=>{
    const wl = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), wallMat);
    wl.position.set(x,y,z); wl.castShadow=true; g.add(wl);
  });
  // Plafond poutres
  const ceil = new THREE.Mesh(new THREE.BoxGeometry(12,0.2,8), mat(0x2A1A0E));
  ceil.position.set(0,5.1,0); g.add(ceil);
  for (let bx=-4;bx<=4;bx+=2) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.25,0.3,8.5), mat(0x4A2E12));
    beam.position.set(bx,4.95,0); g.add(beam);
  }

  // Bar en bois massif
  const bar = new THREE.Mesh(new THREE.BoxGeometry(9,1.1,1.4), mat(0x6B3A1F));
  bar.position.set(0,0.55,-3.2); g.add(bar);
  const barTop = new THREE.Mesh(new THREE.BoxGeometry(9.1,0.15,1.5), mat(0x8B4513));
  barTop.position.set(0,1.13,-3.2); g.add(barTop);
  // Détails bar — bords dorés
  const barEdge = new THREE.Mesh(new THREE.BoxGeometry(9.2,0.08,0.08), mat(0xC8A04A));
  barEdge.position.set(0,1.17,-2.48); g.add(barEdge);

  // Tabourets de bar
  for (let i=-3.5;i<=3.5;i+=1.4) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,0.85,6), mat(0x5C3317));
    leg.position.set(i,0.42,-2.1); g.add(leg);
    const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.28,0.28,0.1,10), mat(0x8B2020));
    seat.position.set(i,0.88,-2.1); g.add(seat);
  }

  // Tables rondes
  [[-3,0,1],[0,0,1.5],[3,0,0.5],[-2,0,3.2],[2,0,3.0]].forEach(([tx,ty,tz])=>{
    const tleg = new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,0.78,7), mat(0x5C3317));
    tleg.position.set(tx,0.39,tz); g.add(tleg);
    const ttop = new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,0.06,12), mat(0x8B4513));
    ttop.position.set(tx,0.8,tz); g.add(ttop);
    // Chaises autour
    for (let a=0;a<3;a++) {
      const angle = a*(Math.PI*2/3);
      const ch = new THREE.Mesh(new THREE.BoxGeometry(0.4,0.08,0.4), mat(0x6B2020));
      ch.position.set(tx+Math.cos(angle)*0.75, 0.45, tz+Math.sin(angle)*0.75); g.add(ch);
    }
  });

  // Étagères avec jars
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(8,0.12,0.35), mat(0x6B3A1F));
  shelf.position.set(0,3.2,-3.85); g.add(shelf);
  const shelf2 = shelf.clone(); shelf2.position.y = 2.4; g.add(shelf2);

  // Jars verts sur les étagères
  const jarColors = [0x2D5A1B,0x3D7A2B,0x1D4A1B,0x4D6A2B,0x2D6A3B];
  for (let i=0;i<8;i++) {
    const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.11,0.28,8), mat(jarColors[i%5],{transparent:true,opacity:0.85}));
    jar.position.set(-3.2+i*0.92, 3.38, -3.85); g.add(jar);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.13,0.13,0.05,8), mat(0x888888));
    lid.position.set(-3.2+i*0.92, 3.54, -3.85); g.add(lid);
    // Plante verte dedans
    const plant = new THREE.Mesh(new THREE.SphereGeometry(0.08,5,5), mat(0x44AA22));
    plant.position.set(-3.2+i*0.92, 3.42, -3.85); g.add(plant);
  }

  // Lampes suspendues — Edison bulbs
  [-3.5, 0, 3.5].forEach(lx => {
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,1.5,4), mat(0x222222));
    cord.position.set(lx, 4.3, 0); g.add(cord);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.18,8,8), mat(0xFFEE99,{transparent:true,opacity:0.9}));
    bulb.position.set(lx, 3.45, 0); g.add(bulb);
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.35,0.3,8,1,true), mat(0x2A2A2A));
    shade.position.set(lx, 3.6, 0); g.add(shade);
    // PointLight chaude
    const pl = new THREE.PointLight(0xFFD077, 1.2, 7);
    pl.position.set(lx, 3.4, 0); g.add(pl);
  });

  // Miroir derrière le bar
  const mirror = new THREE.Mesh(new THREE.BoxGeometry(7,2.5,0.08), mat(0xCCDDEE,{transparent:true,opacity:0.6}));
  mirror.position.set(0,2.5,-4.1); g.add(mirror);
  const mirrorFrame = new THREE.Mesh(new THREE.BoxGeometry(7.2,2.7,0.05), mat(0x8B6020));
  mirrorFrame.position.set(0,2.5,-4.12); g.add(mirrorFrame);

  // Plante décorative (figuier)
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.18,0.4,8), mat(0x8B4513));
  pot.position.set(4.8,0.2,3.5); g.add(pot);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.08,1.1,6), mat(0x5C3317));
  trunk.position.set(4.8,0.95,3.5); g.add(trunk);
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.6,8,8), mat(0x2D6B1A));
  canopy.position.set(4.8,1.8,3.5); g.add(canopy);
  const canopy2 = new THREE.Mesh(new THREE.SphereGeometry(0.4,7,7), mat(0x3D7B2A));
  canopy2.position.set(5.1,2.2,3.2); g.add(canopy2);

  // Tableau/affiche sur le mur
  const poster = new THREE.Mesh(new THREE.BoxGeometry(2,1.4,0.05), mat(0x1A3A1A));
  poster.position.set(4.8,2.8,-4.1); g.add(poster);
  const posterFrame = new THREE.Mesh(new THREE.BoxGeometry(2.1,1.5,0.04), mat(0x6B3A1F));
  posterFrame.position.set(4.8,2.8,-4.12); g.add(posterFrame);

  // Ambiance lumineuse chaude générale
  const ambWarm = new THREE.PointLight(0xFF8C44, 0.4, 15);
  ambWarm.position.set(0, 4, 0); g.add(ambWarm);

  g.position.set(COFX, 0, COFZ);
  g.visible = false;
  scene.add(g);
  return g;
}

let coffeeInterior = null;

function openCoffeeShopScene(scene) {
  if (!coffeeInterior) coffeeInterior = buildCoffeeShopInterior(scene);
  coffeeInterior.visible = true;
  coffeeShopActive = true;
}

function closeCoffeeShopScene() {
  if (coffeeInterior) coffeeInterior.visible = false;
  coffeeShopActive = false;
}

function initCoffeeShop(wallet, inventory, updateWalletFn, updateInvFn, showMsgFn) {
  document.getElementById('shop-close').addEventListener('click', () => {
    document.getElementById('shop-ui').style.display = 'none';
    closeCoffeeShopScene();
  });
}

window.openCoffeeShop = openCoffeeShop;
window.openCoffeeShopScene = openCoffeeShopScene;
window.coffeeShopActive = false;
