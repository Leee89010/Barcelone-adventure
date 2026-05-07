// ═══════════════════════════════════════════════════════
// SHOPS — café, casino, Shoko
// ═══════════════════════════════════════════════════════

const COFFEE_ITEMS = [
  { name: '☕ Café con leche',  desc: 'Le classique catalan',      price: 3,   emoji: '☕' },
  { name: '🧋 Cortado glacé',   desc: 'Frais et intense',          price: 4,   emoji: '🧋' },
  { name: '🥐 Croissant beurre',desc: 'Fait maison',               price: 2.5, emoji: '🥐' },
  { name: '🍰 Crema catalana',  desc: 'Spécialité du chef',        price: 5,   emoji: '🍰' },
  { name: '🧃 Zumo de naranja', desc: 'Pressé à la commande',      price: 3.5, emoji: '🧃' },
  { name: '🫙 Café premium',    desc: 'Grain spécial Barcelone',   price: 8,   emoji: '🫙' },
];

function openCoffeeShop(wallet, inventory, updateWalletFn, updateInvFn, showMsgFn) {
  const ui = document.getElementById('shop-ui');
  document.getElementById('shop-title').textContent = '☕ El Café de Gaudí';
  document.getElementById('shop-wallet').textContent = wallet.amount;

  const itemsEl = document.getElementById('shop-items');
  itemsEl.innerHTML = '';

  COFFEE_ITEMS.forEach(item => {
    const div = document.createElement('div');
    div.className = 'shop-item';
    div.innerHTML = `
      <div>
        <div class="shop-item-name">${item.name}</div>
        <div class="shop-item-desc">${item.desc}</div>
      </div>
      <div style="display:flex;align-items:center">
        <span class="shop-item-price">${item.price}€</span>
        <button class="shop-buy-btn" ${wallet.amount < item.price ? 'disabled' : ''}>Acheter</button>
      </div>`;
    div.querySelector('.shop-buy-btn').addEventListener('click', () => {
      if (wallet.amount >= item.price) {
        wallet.amount -= item.price;
        inventory.push(item.emoji);
        updateWalletFn();
        updateInvFn();
        showMsgFn(`${item.emoji} Acheté ! -${item.price}€`);
        // Déclenche l'animation selon le type d'article
        if (item.emoji === '🥐' || item.emoji === '🍰') { if(window.triggerEat) window.triggerEat(); }
        else if (item.emoji === '🫙') { if(window.triggerSmoke) window.triggerSmoke(); }
        else { if(window.triggerDrink) window.triggerDrink(); }
        openCoffeeShop(wallet, inventory, updateWalletFn, updateInvFn, showMsgFn);
      }
    });
    itemsEl.appendChild(div);
  });

  ui.style.display = 'block';
}

// Casino — machine à sous
const SLOTS = ['🍒', '🍋', '🍊', '🎰', '💎', '7️⃣', '🌟'];

function spinSlots(bet, wallet, updateWalletFn, showMsgFn) {
  if (wallet.amount < bet) { showMsgFn('💸 Pas assez d\'argent !'); return; }
  wallet.amount -= bet;
  updateWalletFn();

  const reels = [
    document.getElementById('reel0'),
    document.getElementById('reel1'),
    document.getElementById('reel2'),
  ];
  const result = SLOTS.map(() => SLOTS[Math.floor(Math.random() * SLOTS.length)]);

  reels.forEach((r, i) => {
    let spins = 0;
    const interval = setInterval(() => {
      r.textContent = SLOTS[Math.floor(Math.random() * SLOTS.length)];
      if (++spins > 10 + i * 5) { clearInterval(interval); r.textContent = result[i]; }
    }, 75);
  });

  setTimeout(() => {
    const resultEl = document.getElementById('slot-result');
    if (result[0] === result[1] && result[1] === result[2]) {
      const jackpot = result[0] === '💎' ? bet * 20 : result[0] === '7️⃣' ? bet * 10 : bet * 4;
      wallet.amount += jackpot;
      resultEl.textContent = `🎉 JACKPOT ! +${jackpot}€ !`;
      resultEl.style.color = '#FFD700';
      showMsgFn(`🎰 JACKPOT ! Tu as gagné ${jackpot}€ !`);
    } else if (result[0] === result[1] || result[1] === result[2] || result[0] === result[2]) {
      const win = Math.floor(bet * 1.5);
      wallet.amount += win;
      resultEl.textContent = `✨ Paire ! +${win}€`;
      resultEl.style.color = '#88FF88';
    } else {
      resultEl.textContent = `😢 Perdu ! -${bet}€`;
      resultEl.style.color = '#FF6666';
    }
    document.getElementById('casino-wallet').textContent = wallet.amount;
    updateWalletFn();
  }, 1300);
}

function initShops(wallet, inventory, updateWalletFn, updateInvFn, showMsgFn) {
  if (typeof initCoffeeShop !== 'undefined') initCoffeeShop(wallet, inventory, updateWalletFn, updateInvFn, showMsgFn);
  // shop-close handled by coffeeshop.js
  document.getElementById('casino-close').addEventListener('click', () => {
    document.getElementById('casino-ui').style.display = 'none';
  });
  document.getElementById('btn-spin').addEventListener('click', () => {
    spinSlots(10, wallet, updateWalletFn, showMsgFn);
  });
  document.getElementById('btn-spin50').addEventListener('click', () => {
    spinSlots(50, wallet, updateWalletFn, showMsgFn);
  });
}
