/* DragonOS Core */
const OS = (() => {
  const wallpapers = [
    'radial-gradient(120% 100% at 50% 0%, #241a35, #1a1327 100%)',
    'radial-gradient(120% 100% at 50% 0%, #16232b, #0f171c 100%)',
    'radial-gradient(120% 100% at 50% 0%, #2a1f3d, #241834 100%)',
    'radial-gradient(120% 100% at 50% 0%, #123044, #0d2130 100%)',
    'radial-gradient(120% 100% at 50% 0%, #1c2333, #151a26 100%)',
    'radial-gradient(120% 100% at 50% 0%, #2e2140, #221933 100%)'
  ];

  const appList = [
    { id: 'explorer', label: 'Finder', run: () => Apps.explorer() },
    { id: 'trash', label: 'Recycle Bin', run: () => Apps.explorer('/Trash') },
    { id: 'notepad', label: 'Notepad', run: () => Apps.textEditor() },
    { id: 'terminal', label: 'Terminal', run: () => Apps.terminal() },
    { id: 'browser', label: 'Browser', run: () => Apps.browser() },
    { id: 'calculator', label: 'Calculator', run: () => Apps.calculator() },
    { id: 'notes', label: 'Sticky Notes', run: () => Apps.notes() },
    { id: 'photos', label: 'Photos', run: () => Apps.photos() },
    { id: 'paint', label: 'Paint', run: () => Apps.paint() },
    { id: 'media', label: 'Media Player', run: () => Apps.mediaPlayer() },
    { id: 'calendar', label: 'Calendar', run: () => Apps.calendar() },
    { id: 'weather', label: 'Weather', run: () => Apps.weather() },
    { id: 'taskmgr', label: 'Task Manager', run: () => Apps.taskManager() },
    { id: 'snake', label: 'Dragon Snake', run: () => Apps.snake() },
    { id: 'settings', label: 'Settings', run: () => Apps.settings() },
    { id: 'about', label: 'About', run: () => Apps.about() },
  ];
  const DEFAULT_DOCK_PINNED = ['explorer', 'notepad', 'terminal', 'browser', 'photos', 'settings'];

  function loadPrefs() {
    try { return JSON.parse(localStorage.getItem('dragonos_prefs_v1')) || {}; } catch (e) { return {}; }
  }
  function savePrefs(p) { localStorage.setItem('dragonos_prefs_v1', JSON.stringify(p)); }
  let prefs = Object.assign({
    theme: 'dark', accent: '#ff5f45', accent2: '#ffa53e', wallpaper: 0, customWallpaper: null,
    fontSize: 'md', reduceMotion: false, highContrast: false, clock24h: false,
    username: 'Dragon', iconSize: 'md', brightness: 100, dockPinned: DEFAULT_DOCK_PINNED.slice()
  }, loadPrefs());

  function pinToDock(id) {
    if (id === 'trash' || prefs.dockPinned.includes(id)) return;
    prefs.dockPinned.push(id);
    savePrefs(prefs);
    renderDock();
  }
  function unpinFromDock(id) {
    prefs.dockPinned = prefs.dockPinned.filter(x => x !== id);
    savePrefs(prefs);
    renderDock();
  }
  function notifyFSChange() { document.dispatchEvent(new CustomEvent('dragonos:fschange')); }

  function setTheme(t) {
    prefs.theme = t;
    document.documentElement.dataset.theme = t;
    savePrefs(prefs);
  }
  function toggleTheme() { setTheme(prefs.theme === 'dark' ? 'light' : 'dark'); }
  function setAccent(hex) {
    prefs.accent = hex;
    document.documentElement.style.setProperty('--accent', hex);
    savePrefs(prefs);
  }
  function setWallpaper(i) {
    prefs.wallpaper = i;
    prefs.customWallpaper = null;
    document.getElementById('desktop').style.background = wallpapers[i];
    savePrefs(prefs);
  }
  function setCustomWallpaper(dataUrl) {
    prefs.customWallpaper = dataUrl;
    document.getElementById('desktop').style.background = `center/cover no-repeat url(${dataUrl})`;
    savePrefs(prefs);
  }
  function setFontSize(size) {
    prefs.fontSize = size;
    document.documentElement.dataset.fontsize = size;
    savePrefs(prefs);
  }
  function setReduceMotion(on) {
    prefs.reduceMotion = on;
    document.documentElement.classList.toggle('reduce-motion', on);
    savePrefs(prefs);
  }
  function setHighContrast(on) {
    prefs.highContrast = on;
    document.documentElement.classList.toggle('high-contrast', on);
    savePrefs(prefs);
  }
  function setClock24h(on) {
    prefs.clock24h = on;
    savePrefs(prefs);
    updateClock();
  }
  function setUsername(name) {
    prefs.username = name || 'Dragon';
    savePrefs(prefs);
    const lu = document.getElementById('lock-username'); if (lu) lu.textContent = prefs.username;
  }
  function setIconSize(size) {
    prefs.iconSize = size;
    document.getElementById('icons').dataset.size = size;
    savePrefs(prefs);
  }
  function setBrightness(v) {
    prefs.brightness = v;
    document.getElementById('desktop').style.filter = `brightness(${v}%)`;
    savePrefs(prefs);
  }

  function applyPrefs() {
    document.documentElement.dataset.theme = prefs.theme;
    document.documentElement.dataset.fontsize = prefs.fontSize;
    document.documentElement.classList.toggle('reduce-motion', prefs.reduceMotion);
    document.documentElement.classList.toggle('high-contrast', prefs.highContrast);
    document.documentElement.style.setProperty('--accent', prefs.accent);
    if (prefs.customWallpaper) document.getElementById('desktop').style.background = `center/cover no-repeat url(${prefs.customWallpaper})`;
    else document.getElementById('desktop').style.background = wallpapers[prefs.wallpaper] || wallpapers[0];
    document.getElementById('desktop').style.filter = `brightness(${prefs.brightness}%)`;
    const lu = document.getElementById('lock-username'); if (lu) lu.textContent = prefs.username;
  }

  function storageUsage() {
    let total = 0;
    const items = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      const size = (localStorage.getItem(k) || '').length;
      total += size;
      if (k.startsWith('dragonos_')) items.push({ key: k, size });
    }
    return { total, items };
  }

  /* ---------------- Desktop icons (mirrors the real /Desktop folder) ---------------- */
  function fileIconId(name, isDir) {
    if (isDir) return 'explorer';
    if (/\.(txt|md)$/i.test(name)) return 'notepad';
    if (/\.(png|jpg|jpeg|gif|svg)$/i.test(name)) return 'photos';
    return 'file';
  }
  function renderDesktopIcons() {
    const icons = document.getElementById('icons');
    icons.dataset.size = prefs.iconSize;
    icons.innerHTML = '';
    DragonFS.list('/Desktop').forEach(name => {
      const full = '/Desktop/' + name;
      const dir = DragonFS.isDir(full);
      const el = document.createElement('div');
      el.className = 'desktop-icon';
      el.draggable = true;
      el.innerHTML = `${Icons.html(fileIconId(name, dir))}<div class="label">${name}</div>`;
      el.onclick = () => {
        document.querySelectorAll('.desktop-icon').forEach(x => x.classList.remove('selected'));
        el.classList.add('selected');
      };
      el.addEventListener('dragstart', (e) => { e.dataTransfer.setData('application/x-dragonos-path', full); e.dataTransfer.effectAllowed = 'move'; });
      el.oncontextmenu = (e) => {
        e.preventDefault();
        OS.showContextMenu(e.clientX, e.clientY, [
          { label: 'Open', action: () => bindOpenAction() },
          { label: 'Move to Recycle Bin', action: () => { DragonFS.trash(full); renderDesktopIcons(); notifyFSChange(); renderDock(); } },
          { label: 'Rename', action: () => { const n = prompt('New name', name); if (n) { DragonFS.rename(full, n); renderDesktopIcons(); notifyFSChange(); } } },
        ]);
      };
      function bindOpenAction() {
        if (dir) Apps.explorer(full);
        else if (/\.(png|jpg|jpeg|gif|svg)$/i.test(name)) Apps.imageViewer(full);
        else Apps.textEditor(full);
      }
      bindOpen(el, bindOpenAction);
      icons.appendChild(el);
    });
  }
  document.addEventListener('dragonos:fschange', renderDesktopIcons);

  /* ---------------- Dock ---------------- */
  function findWindowByAppId(appId) {
    let found = null;
    WM.registry.forEach((w, id) => { if (w.meta.appId === appId) found = id; });
    return found;
  }
  function bounceDock(appId) {
    const el = document.querySelector(`.dock-item[data-app="${appId}"]`);
    if (!el) return;
    el.classList.remove('bounce');
    void el.offsetWidth;
    el.classList.add('bounce');
  }
  function activateApp(app) {
    const winId = findWindowByAppId(app.id);
    if (winId) {
      const w = WM.registry.get(winId);
      if (w.meta.minimized) WM.restore(winId); else WM.focus(winId);
    } else {
      app.run();
    }
    bounceDock(app.id);
  }
  function makeDockItem(app, running, opts) {
    opts = opts || {};
    const el = document.createElement('div');
    el.className = 'dock-item';
    el.dataset.app = app.id;
    el.innerHTML = `${Icons.html(opts.iconId || app.id)}<span class="dock-label">${app.label}</span>${running ? '<span class="dot"></span>' : ''}`;
    el.onclick = () => activateApp(app);
    el.oncontextmenu = (e) => {
      e.preventDefault();
      const winId = findWindowByAppId(app.id);
      const items = [{ label: `Open ${app.label}`, action: () => activateApp(app) }];
      if (winId) items.push({ label: `${Icons.inline('close')}<span>Quit</span>`, action: () => { WM.registry.forEach((w, id) => { if (w.meta.appId === app.id) WM.close(id); }); } });
      if (opts.trash) {
        const trashCount = DragonFS.listTrash().length;
        items.push({ label: trashCount ? `Empty Recycle Bin (${trashCount})` : 'Empty Recycle Bin', disabled: !trashCount, action: () => { if (confirm('Permanently delete everything in the Recycle Bin?')) { DragonFS.emptyTrash(); renderDock(); notifyFSChange(); } } });
      } else if (opts.pinned) {
        items.push({ label: 'Remove from Dock', action: () => unpinFromDock(app.id) });
      } else {
        items.push({ label: 'Add to Dock', action: () => pinToDock(app.id) });
      }
      showContextMenu(e.clientX, e.clientY, items);
    };
    if (opts.trash) {
      el.addEventListener('dragover', (e) => { e.preventDefault(); el.classList.add('drag-over'); });
      el.addEventListener('dragleave', () => el.classList.remove('drag-over'));
      el.addEventListener('drop', (e) => {
        e.preventDefault();
        el.classList.remove('drag-over');
        const path = e.dataTransfer.getData('application/x-dragonos-path');
        if (path) { DragonFS.trash(path); renderDock(); notifyFSChange(); bounceDock('trash'); }
      });
    }
    return el;
  }
  function sepEl() { const d = document.createElement('div'); d.className = 'dock-sep'; return d; }
  function renderDock() {
    const dock = document.getElementById('dock');
    if (!dock) return;
    dock.innerHTML = '';
    const launchpadBtn = document.createElement('div');
    launchpadBtn.className = 'dock-item';
    launchpadBtn.innerHTML = `<span class="app-icon mono-tile">${Icons.monoSvg('grid')}</span><span class="dock-label">App Grid</span>`;
    launchpadBtn.onclick = openLaunchpad;
    dock.appendChild(launchpadBtn);
    dock.appendChild(sepEl());

    const runningIds = new Set([...WM.registry.values()].map(w => w.meta.appId).filter(Boolean));
    const pinned = prefs.dockPinned.filter(id => id !== 'trash' && appList.some(a => a.id === id));
    pinned.forEach(id => {
      const app = appList.find(a => a.id === id);
      if (app) dock.appendChild(makeDockItem(app, runningIds.has(id), { pinned: true }));
    });
    const extra = [...runningIds].filter(id => !pinned.includes(id) && id !== 'trash');
    if (extra.length) {
      dock.appendChild(sepEl());
      extra.forEach(id => { const app = appList.find(a => a.id === id); if (app) dock.appendChild(makeDockItem(app, true, { pinned: false })); });
    }
    dock.appendChild(sepEl());
    const trashEmpty = DragonFS.listTrash().length === 0;
    dock.appendChild(makeDockItem(appList.find(a => a.id === 'trash'), false, { trash: true, iconId: trashEmpty ? 'trash' : 'trash-full' }));

    updateActiveAppName();
  }

  function updateActiveAppName() {
    const nameEl = document.getElementById('mb-appname');
    if (!nameEl) return;
    let focused = null;
    WM.registry.forEach((w) => { if (w.el.classList.contains('focused') && !w.el.classList.contains('hidden')) focused = w; });
    nameEl.textContent = focused ? focused.meta.title : 'Finder';
  }

  /* ---------------- Launchpad ---------------- */
  function openLaunchpad() {
    const lp = document.getElementById('launchpad');
    const grid = document.getElementById('launchpad-grid');
    const search = document.getElementById('launchpad-search');
    function renderGrid(filter) {
      grid.innerHTML = '';
      appList.filter(a => a.id !== 'trash').filter(a => !filter || a.label.toLowerCase().includes(filter.toLowerCase())).forEach(app => {
        const el = document.createElement('div');
        el.className = 'lp-app';
        el.innerHTML = `${Icons.html(app.id)}<div>${app.label}</div>`;
        el.onclick = () => { app.run(); closeLaunchpad(); };
        el.oncontextmenu = (e) => {
          e.preventDefault();
          const pinned = prefs.dockPinned.includes(app.id);
          showContextMenu(e.clientX, e.clientY, [
            { label: `Open ${app.label}`, action: () => { app.run(); closeLaunchpad(); } },
            pinned ? { label: 'Remove from Dock', action: () => unpinFromDock(app.id) } : { label: 'Add to Dock', action: () => pinToDock(app.id) },
          ]);
        };
        grid.appendChild(el);
      });
    }
    renderGrid('');
    search.value = '';
    lp.classList.remove('hidden');
    setTimeout(() => search.focus(), 50);
    search.oninput = () => renderGrid(search.value);
  }
  function closeLaunchpad() { document.getElementById('launchpad').classList.add('hidden'); }

  /* ---------------- Spotlight ---------------- */
  function openSpotlight() {
    const sp = document.getElementById('spotlight');
    const input = document.getElementById('spotlight-input');
    const results = document.getElementById('spotlight-results');
    let sel = 0, matches = [];
    function renderResults(q) {
      matches = !q ? [] : appList.filter(a => a.label.toLowerCase().includes(q.toLowerCase()));
      sel = 0;
      results.innerHTML = matches.map((a, i) => `<div class="sr-item${i === 0 ? ' sel' : ''}" data-i="${i}">${Icons.html(a.id)}<span>${a.label}</span></div>`).join('');
      results.querySelectorAll('.sr-item').forEach(el => {
        el.onclick = () => { activateApp(matches[el.dataset.i]); closeSpotlight(); };
      });
    }
    input.value = '';
    results.innerHTML = '';
    sp.classList.remove('hidden');
    setTimeout(() => input.focus(), 50);
    input.oninput = () => renderResults(input.value);
    input.onkeydown = (e) => {
      if (e.key === 'Escape') { closeSpotlight(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); if (matches.length) { sel = (sel + 1) % matches.length; updateSel(); } }
      else if (e.key === 'ArrowUp') { e.preventDefault(); if (matches.length) { sel = (sel - 1 + matches.length) % matches.length; updateSel(); } }
      else if (e.key === 'Enter') { if (matches[sel]) { activateApp(matches[sel]); closeSpotlight(); } }
    };
    function updateSel() {
      results.querySelectorAll('.sr-item').forEach((el, i) => el.classList.toggle('sel', i === sel));
    }
  }
  function closeSpotlight() { document.getElementById('spotlight').classList.add('hidden'); }

  /* ---------------- Menu bar dropdowns ---------------- */
  function buildMenu(kind) {
    const focusedId = [...WM.registry.entries()].find(([id, w]) => w.el.classList.contains('focused') && !w.el.classList.contains('hidden'));
    switch (kind) {
      case 'logo':
        return [
          { label: `About This DragonOS`, action: () => Apps.about() },
          { sep: true },
          { label: 'System Settings…', action: () => Apps.settings() },
          { sep: true },
          { label: 'Lock Screen', action: () => lock() },
          { label: 'Restart', action: () => { if (confirm('Restart DragonOS?')) location.reload(); } },
        ];
      case 'app':
        return [
          { label: `About ${document.getElementById('mb-appname').textContent}`, action: () => Apps.about() },
          { sep: true },
          { label: 'Quit', disabled: !focusedId, action: () => focusedId && WM.close(focusedId[0]) },
        ];
      case 'file':
        return [
          { label: 'New Finder Window', action: () => Apps.explorer() },
          { label: 'New Folder', action: () => { const n = prompt('Folder name', 'New Folder'); if (n) DragonFS.mkdir('/' + n); } },
          { sep: true },
          { label: 'Close Window', disabled: !focusedId, action: () => focusedId && WM.close(focusedId[0]) },
        ];
      case 'edit':
        return [
          { label: 'Undo', disabled: true, action: () => {} },
          { label: 'Redo', disabled: true, action: () => {} },
          { sep: true },
          { label: 'Cut', disabled: true, action: () => {} },
          { label: 'Copy', disabled: true, action: () => {} },
          { label: 'Paste', disabled: true, action: () => {} },
        ];
      case 'view':
        return [
          { label: prefs.theme === 'dark' ? `${Icons.inline('sun')}<span>Switch to Light Mode</span>` : `${Icons.inline('moon')}<span>Switch to Dark Mode</span>`, action: () => toggleTheme() },
          { label: 'Show Launchpad', action: () => openLaunchpad() },
        ];
      case 'window':
        return [
          { label: 'Minimize', disabled: !focusedId, action: () => { if (focusedId) { WM.registry.get(focusedId[0]).el.querySelector('.win-btn.min').click(); } } },
          { label: 'Zoom', disabled: !focusedId, action: () => focusedId && WM.toggleMaximize(focusedId[0]) },
          { sep: true },
          ...[...WM.registry.entries()].map(([id, w]) => ({ label: (w.el.classList.contains('focused') ? '● ' : '') + w.meta.title, action: () => WM.restore(id) })),
        ];
      case 'help':
        return [
          { label: 'DragonOS Help', action: () => Apps.about() },
          { label: 'Keyboard Shortcuts', action: () => alert('⌘/Ctrl+Space — Spotlight\nAlt+Tab — Switch windows\nDrag a window to a screen edge — Snap\nF4 or Launchpad icon — App grid') },
        ];
      default: return [];
    }
  }

  function showMenuDropdown(triggerEl, items) {
    const dd = document.getElementById('mb-dropdown');
    dd.innerHTML = items.map((it, i) => it.sep ? '<div class="dd-sep"></div>' : `<div class="dd-item${it.disabled ? ' disabled' : ''}" data-i="${i}">${it.label}</div>`).join('');
    const rect = triggerEl.getBoundingClientRect();
    dd.style.left = Math.min(rect.left, window.innerWidth - 240) + 'px';
    dd.classList.remove('hidden');
    dd.querySelectorAll('.dd-item:not(.disabled)').forEach(el => {
      el.onclick = () => { items[el.dataset.i].action(); hideMenuDropdown(); };
    });
    document.querySelectorAll('.mb-item').forEach(x => x.classList.remove('open'));
    triggerEl.classList.add('open');
  }
  function hideMenuDropdown() {
    document.getElementById('mb-dropdown').classList.add('hidden');
    document.querySelectorAll('.mb-item').forEach(x => x.classList.remove('open'));
  }

  /* ---------------- Control Center ---------------- */
  function toggleControlCenter() {
    const cc = document.getElementById('control-center');
    if (!cc.classList.contains('hidden')) { cc.classList.add('hidden'); return; }
    cc.innerHTML = `
      <div class="cc-row">
        <div class="cc-tile" data-t="theme">${Icons.inline('moon')}<div>Dark Mode</div></div>
        <div class="cc-tile" data-t="dnd">${Icons.inline('moon-stars')}<div>Do Not Disturb</div></div>
      </div>
      <div class="cc-row">
        <div class="cc-tile" data-t="wifi">${Icons.inline('wifi')}<div>Wi-Fi</div></div>
        <div class="cc-tile" data-t="reduce">${Icons.inline('accessibility')}<div>Reduce Motion</div></div>
      </div>
      <div class="cc-slider">
        <label>Display Brightness</label>
        <input type="range" min="40" max="120" value="${prefs.brightness}" data-role="brightness" />
      </div>`;
    cc.querySelector('[data-t="theme"]').classList.toggle('on', prefs.theme === 'dark');
    cc.querySelector('[data-t="reduce"]').classList.toggle('on', prefs.reduceMotion);
    cc.querySelector('[data-t="wifi"]').classList.add('on');
    cc.querySelector('[data-t="theme"]').onclick = () => { toggleTheme(); toggleControlCenter(); toggleControlCenter(); };
    cc.querySelector('[data-t="reduce"]').onclick = () => { setReduceMotion(!prefs.reduceMotion); toggleControlCenter(); toggleControlCenter(); };
    cc.querySelector('[data-t="wifi"]').onclick = (e) => e.currentTarget.classList.toggle('on');
    cc.querySelector('[data-t="dnd"]').onclick = (e) => e.currentTarget.classList.toggle('on');
    cc.querySelector('[data-role="brightness"]').oninput = (e) => setBrightness(parseInt(e.target.value));
    cc.classList.remove('hidden');
  }

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
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: !prefs.clock24h });
    const date = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    const ct = document.getElementById('clock-time'); if (ct) ct.textContent = time;
    const cd = document.getElementById('clock-date'); if (cd) cd.textContent = date;
    const lt = document.getElementById('lock-time'); if (lt) lt.textContent = time;
    const ld = document.getElementById('lock-date'); if (ld) ld.textContent = date;
  }

  function lock() {
    hideMenuDropdown();
    document.getElementById('control-center').classList.add('hidden');
    document.getElementById('lock-screen').classList.remove('hidden');
  }
  function unlock() {
    document.getElementById('lock-screen').classList.add('hidden');
  }

  function boot() {
    document.getElementById('boot-logo-icon').innerHTML = Icons.svg('dragon');
    document.getElementById('lock-avatar-icon').innerHTML = Icons.svg('dragon');
    document.getElementById('mb-logo-btn').innerHTML = Icons.svg('dragon');
    document.getElementById('mb-search').innerHTML = Icons.monoSvg('search');
    document.getElementById('mb-wifi').innerHTML = Icons.monoSvg('wifi');
    document.getElementById('mb-battery').innerHTML = Icons.monoSvg('battery');
    document.getElementById('mb-control').innerHTML = Icons.monoSvg('control');
    document.getElementById('spotlight-icon').innerHTML = Icons.monoSvg('search');
    applyPrefs();
    renderDesktopIcons();
    renderDock();
    updateClock();
    setInterval(updateClock, 1000 * 15);

    WM.onChange(renderDock);
    WM.onFocus(updateActiveAppName);

    // Menu bar interactions
    document.querySelectorAll('.mb-menu, .mb-logo, .mb-appname').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const kind = el.dataset.menu || (el.id === 'mb-logo-btn' ? 'logo' : el.id === 'mb-appname' ? 'app' : null);
        if (!kind) return;
        const dd = document.getElementById('mb-dropdown');
        if (!dd.classList.contains('hidden') && el.classList.contains('open')) { hideMenuDropdown(); return; }
        showMenuDropdown(el, buildMenu(kind));
      });
    });
    document.getElementById('mb-search').onclick = (e) => { e.stopPropagation(); openSpotlight(); };
    document.getElementById('mb-control').onclick = (e) => { e.stopPropagation(); toggleControlCenter(); };
    document.getElementById('mb-clock').onclick = (e) => { e.stopPropagation(); Apps.calendar(); };
    document.getElementById('mb-wifi').onclick = (e) => e.stopPropagation();
    document.getElementById('mb-battery').onclick = (e) => e.stopPropagation();

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#mb-dropdown') && !e.target.closest('.mb-menu') && !e.target.closest('.mb-logo') && !e.target.closest('.mb-appname')) hideMenuDropdown();
      if (!e.target.closest('#context-menu')) hideContextMenu();
      if (!e.target.closest('#control-center') && !e.target.closest('#mb-control')) document.getElementById('control-center').classList.add('hidden');
    });

    // Spotlight / Launchpad close on backdrop click
    document.getElementById('spotlight').addEventListener('click', (e) => { if (e.target.id === 'spotlight') closeSpotlight(); });
    document.getElementById('launchpad').addEventListener('click', (e) => { if (e.target.id === 'launchpad') closeLaunchpad(); });

    const desktop = document.getElementById('desktop');
    desktop.addEventListener('contextmenu', (e) => {
      if (e.target !== desktop && e.target.id !== 'icons') return;
      e.preventDefault();
      showContextMenu(e.clientX, e.clientY, [
        { label: `${Icons.inline('refresh')}<span>Refresh</span>`, action: () => renderDesktopIcons() },
        { label: `${Icons.inline('folder-open')}<span>New Folder</span>`, action: () => { const n = prompt('Folder name', 'New Folder'); if (n) { DragonFS.mkdir('/Desktop/' + n); renderDesktopIcons(); } } },
        { sep: true },
        { label: `${Icons.inline('photos')}<span>Change Wallpaper</span>`, action: () => Apps.settings('appearance') },
        { label: `${Icons.inline('settings')}<span>Settings</span>`, action: () => Apps.settings() },
      ]);
    });
    desktop.addEventListener('dragover', (e) => { if ([...e.dataTransfer.types].includes('files')) e.preventDefault(); });
    desktop.addEventListener('drop', (e) => {
      if (!(e.target === desktop || e.target.id === 'icons')) return;
      const files = [...(e.dataTransfer.files || [])];
      if (!files.length) return;
      e.preventDefault();
      files.forEach(f => {
        const reader = new FileReader();
        const isText = /\.(txt|md|json|js|css|html|csv)$/i.test(f.name) || f.type.startsWith('text/');
        reader.onload = () => { DragonFS.write('/Desktop/' + f.name, reader.result); renderDesktopIcons(); };
        if (isText) reader.readAsText(f); else reader.readAsDataURL(f);
      });
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
      if ((e.metaKey || e.ctrlKey) && e.code === 'Space') { e.preventDefault(); openSpotlight(); return; }
      if (e.key === 'Escape') { closeSpotlight(); closeLaunchpad(); hideMenuDropdown(); }
      if (e.key === 'F4') { e.preventDefault(); openLaunchpad(); }
      if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
        const ids = [...WM.registry.keys()];
        if (ids.length < 2) return;
        const focused = ids.find(id => WM.registry.get(id).el.classList.contains('focused'));
        const idx = focused ? ids.indexOf(focused) : -1;
        const next = ids[(idx + 1) % ids.length];
        WM.restore(next);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', boot);

  return {
    wallpapers, appList, prefs,
    setTheme, toggleTheme, setAccent, setWallpaper, setCustomWallpaper, setFontSize, setReduceMotion,
    setHighContrast, setClock24h, setUsername, setIconSize, setBrightness,
    showContextMenu, hideContextMenu, lock, unlock, storageUsage, openLaunchpad, openSpotlight,
    pinToDock, unpinFromDock, notifyFSChange, renderDesktopIcons, renderDock
  };
})();
