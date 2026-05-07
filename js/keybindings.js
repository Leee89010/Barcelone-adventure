// ═══════════════════════════════════════════════════════
// KEYBINDINGS — touches configurables + sauvegarde locale
// ═══════════════════════════════════════════════════════

const DEFAULT_KB = {
  up: 'z', down: 's', left: 'q', right: 'd',
  sprint: 'Shift', interact: 'e',
  swap: 'Tab', cats: 'f', map: 'm'
};

let KB = Object.assign({}, DEFAULT_KB);

function loadKeys() {
  try {
    const s = localStorage.getItem('barca_kb');
    if (s) KB = Object.assign({}, DEFAULT_KB, JSON.parse(s));
  } catch (e) {}
}

function saveKeys() {
  try { localStorage.setItem('barca_kb', JSON.stringify(KB)); } catch (e) {}
}

function keyName(k) {
  const names = { Shift: '⇧Shift', Control: '^Ctrl', Alt: '⌥Alt', Tab: '⇥Tab', ' ': 'Espace' };
  return names[k] || k.toUpperCase();
}

function updateKBUI() {
  Object.keys(KB).forEach(action => {
    const el = document.getElementById('kb-' + action);
    if (el) el.textContent = keyName(KB[action]);
  });
}

function updateControlsHint() {
  const el = document.getElementById('controls-hint');
  if (el) el.textContent =
    `${keyName(KB.up)}${keyName(KB.down)}${keyName(KB.left)}${keyName(KB.right)} déplacer · ${keyName(KB.sprint)} sprint · ${keyName(KB.interact)} interagir · ${keyName(KB.map)} carte`;
}

// Keybinding UI logic
let listeningAction = null;

function initKeybindingUI() {
  loadKeys();
  updateKBUI();
  updateControlsHint();

  document.querySelectorAll('.key-btn[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (listeningAction) {
        document.getElementById('kb-' + listeningAction)?.classList.remove('listening');
      }
      listeningAction = btn.dataset.action;
      btn.classList.add('listening');
      btn.textContent = '...';
    });
  });

  document.getElementById('btn-save-settings').addEventListener('click', () => {
    saveKeys();
    updateControlsHint();
    document.getElementById('settings-overlay').style.display = 'none';
    if(window.showMsg) window.showMsg('✅ Touches sauvegardées !');
  });

  document.getElementById('btn-reset-keys').addEventListener('click', () => {
    KB = Object.assign({}, DEFAULT_KB);
    updateKBUI();
    saveKeys();
    updateControlsHint();
    if(window.showMsg) window.showMsg('↺ Touches réinitialisées');
  });

  document.getElementById('btn-close-settings').addEventListener('click', () => {
    document.getElementById('settings-overlay').style.display = 'none';
  });

  document.getElementById('btn-settings-open').addEventListener('click', () => {
    document.getElementById('settings-overlay').style.display = 'flex';
  });
}

// Called from main keydown handler
function handleKeyRebind(e) {
  if (!listeningAction) return false;
  e.preventDefault();
  KB[listeningAction] = e.key;
  updateKBUI();
  document.getElementById('kb-' + listeningAction)?.classList.remove('listening');
  listeningAction = null;
  return true; // consumed
}

function isKeyDown(keys, action) {
  const k = KB[action];
  return keys[k] || keys[k?.toLowerCase()] || keys[k?.toUpperCase()] || false;
}
