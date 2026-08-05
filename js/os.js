/* DragonOS Core */
const OS = (() => {
  const wallpapers = [
    'linear-gradient(160deg,#1b0f2e,#3a1258 55%,#7a1f3d)',
    'linear-gradient(160deg,#0f2027,#203a43 55%,#2c5364)',
    'linear-gradient(160deg,#3a1c71,#d76d77 55%,#ffaf7b)',
    'linear-gradient(160deg,#0b486b,#f56217)',
    'linear-gradient(160deg,#141e30,#243b55)',
    'linear-gradient(160deg,#654ea3,#eaafc8)'
  ];

  const appList = [
    { id: 'explorer', label: 'File Explorer', emoji: '📁', run: () => Apps.explorer() },
    { id: 'trash', label: 'Recycle Bin', emoji: '🗑️', run: () => Apps.explorer('/Trash') },
    { id: 'notepad', label: 'Notepad', emoji: '📝', run: () => Apps.textEditor() },
    { id: 'terminal', label: 'Terminal', emoji: '⌨️', run: () => Apps.terminal() },
    { id: 'browser', label: 'Browser', emoji: '🌐', run: () => Apps.browser() },
    { id: 'calculator', label: 'Calculator', emoji: '🧮', run: () => Apps.calculator() },
    { id: 'notes', label: 'Sticky Notes', emoji: '🗒️', run: () => Apps.notes() },
    { id: 'photos', label: 'Photos', emoji: '🖼️', run: () => Apps.photos() },
    { id: 'paint', label: 'Paint', emoji: '🎨', run: () => Apps.paint() },
    { id: 'media', label: 'Media Player', emoji: '🎬', run: () => Apps.mediaPlayer() },
    { id: 'calendar', label: 'Calendar', emoji: '📅', run: () => Apps.calendar() },
    { id: 'weather', label: 'Weather', emoji: '⛅', run: () => Apps.weather() },
    { id: 'taskmgr', label: 'Task Manager', emoji: '📊', run: () => Apps.taskManager() },
    { id: 'snake', label: 'Dragon Snake', emoji: '🎮', run: () => Apps.snake() },
    { id: 'settings', label: 'Settings', emoji: '⚙️', run: () => Apps.settings() },
    { id: 'about', label: 'About', emoji: '🐉', run: () => Apps.about() },
  ];

  function loadPrefs() {
    try { return JSON.parse(localStorage.getItem('dragonos_prefs_v1')) || {}; } catch (e) { return {}; }
  }
  function savePrefs(p) { localStorage.setItem('dragonos_prefs_v1', JSON.stringify(p)); }
  let prefs = Object.assign({ theme: 'dark', accent: '#ff5f45', accent2: '#ffa53e', wallpaper: 0 }, loadPrefs());

  function setTheme(t) {
    prefs.theme = t;
    document.documentElement.dataset.theme = t;
    savePrefs(prefs);
  }
  function setAccent(hex) {
    prefs.accent = hex;
    document.documentElement.style.setProperty('--accent', hex);
    savePrefs(prefs);
  }
  function setWallpaper(i) {
    prefs.wallpaper = i;
    document.getElementById('desktop').style.background = wallpapers[i];
    savePrefs(prefs);
  }

  function applyPrefs() {
    document.documentElement.dataset.theme = prefs.theme;
    document.documentElement.style.setProperty('--accent', prefs.accent);
    document.getElementById('desktop').style.background = wallpapers[prefs.wallpaper] || wallpapers[0];
  }

  function renderDesktopIcons() {
    const icons = document.getElementById('icons');
    icons.innerHTML = '';
    const shortcuts = [
      appList.find(a => a.id === 'explorer'),
      appList.find(a => a.id === 'notepad'),
      appList.find(a => a.id === 'terminal'),
      appList.find(a => a.id === 'browser'),
      appList.find(a => a.id === 'about'),
      appList.find(a => a.id === 'trash'),
    ];
    shortcuts.forEach(app => {
      const el = document.createElement('div');
      el.className = 'desktop-icon';
      el.innerHTML = `<div class="emoji">${app.emoji}</div><div class="label">${app.label}</div>`;
      el.onclick = (e) => {
        document.querySelectorAll('.desktop-icon').forEach(x => x.classList.remove('selected'));
        el.classList.add('selected');
      };
      bindOpen(el, () => app.run());
      icons.appendChild(el);
    });
  }

  function renderStartMenu() {
    const menu = document.getElementById('start-menu');
    menu.innerHTML = `
      <input class="start-search" placeholder="Search apps..." />
      <div class="start-grid"></div>
      <div class="start-footer">
        <span>🐉 DragonOS</span>
        <button id="lock-btn">🔒 Lock</button>
      </div>`;
    const grid = menu.querySelector('.start-grid');
    function renderGrid(filter) {
      grid.innerHTML = '';
      appList.filter(a => !filter || a.label.toLowerCase().includes(filter.toLowerCase())).forEach(app => {
        const el = document.createElement('div');
        el.className = 'start-app';
        el.innerHTML = `<div class="emoji">${app.emoji}</div><div>${app.label}</div>`;
        el.onclick = () => { app.run(); closeStartMenu(); };
        grid.appendChild(el);
      });
    }
    renderGrid('');
    menu.querySelector('.start-search').addEventListener('input', (e) => renderGrid(e.target.value));
    menu.querySelector('#lock-btn').onclick = () => { closeStartMenu(); lock(); };
  }

  function openStartMenu() { document.getElementById('start-menu').classList.remove('hidden'); }
  function closeStartMenu() { document.getElementById('start-menu').classList.add('hidden'); }

  function showContextMenu(x, y, items) {
    const menu = document.getElementById('context-menu');
    menu.innerHTML = items.map((it, i) => it.sep ? '<div class="ctx-sep"></div>' : `<div class="ctx-item" data-i="${i}">${it.label}</div>`).join('');
    menu.style.left = Math.min(x, window.innerWidth - 220) + 'px';
    menu.style.top = Math.min(y, window.innerHeight - items.length * 34 - 60) + 'px';
    menu.classList.remove('hidden');
    menu.querySelectorAll('.ctx-item').forEach(el => {
      el.onclick = () => { items[el.dataset.i].action(); hideContextMenu(); };
    });
  }
  function hideContextMenu() { document.getElementById('context-menu').classList.add('hidden'); }

  function updateClock() {
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const date = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    const ct = document.getElementById('clock-time'); if (ct) ct.textContent = time;
    const cd = document.getElementById('clock-date'); if (cd) cd.textContent = date;
    const lt = document.getElementById('lock-time'); if (lt) lt.textContent = time;
    const ld = document.getElementById('lock-date'); if (ld) ld.textContent = date;
  }

  function lock() {
    document.getElementById('lock-screen').classList.remove('hidden');
  }
  function unlock() {
    document.getElementById('lock-screen').classList.add('hidden');
  }

  function boot() {
    applyPrefs();
    renderDesktopIcons();
    renderStartMenu();
    updateClock();
    setInterval(updateClock, 1000 * 15);

    document.getElementById('start-btn').onclick = (e) => {
      e.stopPropagation();
      document.getElementById('start-menu').classList.toggle('hidden');
    };
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#start-menu') && !e.target.closest('#start-btn')) closeStartMenu();
      if (!e.target.closest('#context-menu')) hideContextMenu();
    });

    const desktop = document.getElementById('desktop');
    desktop.addEventListener('contextmenu', (e) => {
      if (e.target !== desktop && e.target.id !== 'icons') return;
      e.preventDefault();
      showContextMenu(e.clientX, e.clientY, [
        { label: '🔄 Refresh', action: () => renderDesktopIcons() },
        { label: '📁 New Folder', action: () => { const n = prompt('Folder name', 'New Folder'); if (n) DragonFS.mkdir('/' + n); } },
        { sep: true },
        { label: '⚙️ Settings', action: () => Apps.settings() },
        { label: '🖼️ Change Wallpaper', action: () => Apps.photos() },
      ]);
    });
    desktop.addEventListener('click', (e) => {
      if (e.target === desktop || e.target.id === 'icons') {
        document.querySelectorAll('.desktop-icon').forEach(x => x.classList.remove('selected'));
      }
    });

    // Lock screen interactions
    const lockScreen = document.getElementById('lock-screen');
    const unlockHandler = () => unlock();
    lockScreen.addEventListener('click', unlockHandler);
    document.addEventListener('keydown', (e) => {
      if (!lockScreen.classList.contains('hidden')) unlockHandler();
    });

    // Boot sequence
    setTimeout(() => {
      document.getElementById('boot-screen').style.opacity = '0';
      setTimeout(() => {
        document.getElementById('boot-screen').classList.add('hidden');
      }, 600);
    }, 1600);

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
        const ids = [...WM.registry.keys()];
        if (ids.length < 2) return;
        const focused = ids.find(id => WM.registry.get(id).el.classList.contains('focused'));
        const idx = focused ? ids.indexOf(focused) : -1;
        const next = ids[(idx + 1) % ids.length];
        const w = WM.registry.get(next);
        w.meta.minimized = false;
        w.el.classList.remove('hidden');
        WM.focus(next);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', boot);

  return { wallpapers, setTheme, setAccent, setWallpaper, showContextMenu, hideContextMenu, lock, unlock, appList };
})();
