/* FormulaOS Core */
const OS = (() => {
  function wallpaperCss(i) { return Wallpaper.cssValue(i, nextRace().track); }
  function wallpaperName(i) { return Wallpaper.paletteName(i); }
  const wallpapers = Array.from({ length: Wallpaper.count() }, (_, i) => i);
  function applyBackground(cssValue) {
    document.getElementById('desktop').style.background = cssValue;
    document.getElementById('lock-screen').style.background = cssValue;
    document.getElementById('boot-screen').style.background = cssValue;
  }

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
    { id: 'snake', label: 'Track Racer', run: () => Apps.snake() },
    { id: 'trackatlas', label: 'Track Atlas', run: () => Apps.trackAtlas() },
    { id: 'pitstrategy', label: 'Pit Strategy', run: () => Apps.pitStrategy() },
    { id: 'settings', label: 'Settings', run: () => Apps.settings() },
    { id: 'about', label: 'About', run: () => Apps.about() },
  ];
  const DEFAULT_DOCK_PINNED = ['explorer', 'notepad', 'terminal', 'browser', 'photos', 'settings'];

  function loadPrefs() {
    try { return JSON.parse(localStorage.getItem('formulaos_prefs_v1')) || {}; } catch (e) { return {}; }
  }
  function savePrefs(p) {
    try { localStorage.setItem('formulaos_prefs_v1', JSON.stringify(p)); return true; }
    catch (e) { return false; }
  }
  let prefs = Object.assign({
    theme: 'dark', accent: '#e10600', accent2: '#ffc300', wallpaper: 0, customWallpaper: null,
    fontSize: 'md', reduceMotion: false, highContrast: false, clock24h: false,
    username: 'Driver', iconSize: 'md', brightness: 100, dockPinned: DEFAULT_DOCK_PINNED.slice(),
    teamOrder: null
  }, loadPrefs());
  let activeTeam = null; // set when a signed-in user's favorite team overrides the theme

  /* Team tiles in Settings can be drag-reordered; teamOrder is a list of team ids,
     any ids missing from it (new teams, or before it's ever been customized) sort to the end. */
  function orderedTeams() {
    if (!prefs.teamOrder) return TEAMS.slice();
    const order = prefs.teamOrder;
    return TEAMS.slice().sort((a, b) => {
      const ia = order.indexOf(a.id), ib = order.indexOf(b.id);
      if (ia === -1 && ib === -1) return 0;
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  }
  function setTeamOrder(order) {
    prefs.teamOrder = order;
    savePrefs(prefs);
  }

  /* Smoothly crossfades the desktop background and morphs --accent instead of an instant
     snap, when a user actively picks a new favorite team livery. */
  function morphToTeam(team) {
    const html = document.documentElement;
    const desktop = document.getElementById('desktop');
    const targetAccent = team && team.id !== 'neutral' ? team.accent : prefs.accent;
    const targetBg = wallpaperCss(team && team.id !== 'neutral' ? team.palette : (prefs.wallpaper || 0));

    let overlay = document.getElementById('bg-morph-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'bg-morph-overlay';
      desktop.appendChild(overlay);
    }
    overlay.style.background = targetBg;
    overlay.classList.remove('in');
    void overlay.offsetWidth; // force reflow so the opacity transition re-triggers on the very next style change
    html.classList.add('theme-morph');
    html.style.setProperty('--accent', targetAccent);
    overlay.classList.add('in');
    setTimeout(() => {
      desktop.style.background = targetBg;
      document.getElementById('lock-screen').style.background = targetBg;
      overlay.classList.remove('in');
      html.classList.remove('theme-morph');
    }, 520);
  }

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
  function notifyFSChange() { document.dispatchEvent(new CustomEvent('formulaos:fschange')); }

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
    applyBackground(wallpaperCss(i));
    savePrefs(prefs);
  }
  function setCustomWallpaper(dataUrl) {
    const prevCustom = prefs.customWallpaper;
    prefs.customWallpaper = dataUrl;
    if (!savePrefs(prefs)) {
      prefs.customWallpaper = prevCustom;
      return false;
    }
    applyBackground(`center/cover no-repeat url(${dataUrl})`);
    return true;
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
    prefs.username = name || 'Driver';
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
    document.documentElement.style.setProperty('--accent', activeTeam ? activeTeam.accent : prefs.accent);
    if (prefs.customWallpaper && !activeTeam) applyBackground(`center/cover no-repeat url(${prefs.customWallpaper})`);
    else applyBackground(wallpaperCss(activeTeam ? activeTeam.palette : (prefs.wallpaper || 0)));
    document.getElementById('desktop').style.filter = `brightness(${prefs.brightness}%)`;
    const lu = document.getElementById('lock-username'); if (lu) lu.textContent = prefs.username;
  }

  /* Applies (or clears) the signed-in user's favorite-team livery across accent, wallpaper, and the race widget's car */
  function setActiveTeam(team) {
    activeTeam = team && team.id !== 'neutral' ? team : null;
    applyPrefs();
    renderRaceWidget();
  }
  let gateResolved = false;
  function onAuthUpdate({ user, profile, ready }) {
    const team = user && profile && profile.favorite_team ? teamById(profile.favorite_team) : null;
    setActiveTeam(team);
    if (!ready) return;
    if (!gateResolved) {
      gateResolved = true;
      if (Auth.configured() && !user) showLoginGate();
      else resolveGateThenWelcome();
    } else if (user && !document.getElementById('login-gate').classList.contains('hidden')) {
      resolveGateThenWelcome();
    }
  }

  function storageUsage() {
    let total = 0;
    const items = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      const size = (localStorage.getItem(k) || '').length;
      total += size;
      if (k.startsWith('formulaos_')) items.push({ key: k, size });
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
    FormulaFS.list('/Desktop').forEach(name => {
      const full = '/Desktop/' + name;
      const dir = FormulaFS.isDir(full);
      const el = document.createElement('div');
      el.className = 'desktop-icon';
      el.draggable = true;
      el.innerHTML = `${Icons.html(fileIconId(name, dir))}<div class="label">${name}</div>`;
      el.onclick = () => {
        document.querySelectorAll('.desktop-icon').forEach(x => x.classList.remove('selected'));
        el.classList.add('selected');
      };
      el.addEventListener('dragstart', (e) => { e.dataTransfer.setData('application/x-formulaos-path', full); e.dataTransfer.effectAllowed = 'move'; });
      el.oncontextmenu = (e) => {
        e.preventDefault();
        OS.showContextMenu(e.clientX, e.clientY, [
          { label: 'Open', action: () => bindOpenAction() },
          { label: 'Move to Recycle Bin', action: () => { FormulaFS.trash(full); renderDesktopIcons(); notifyFSChange(); renderDock(); } },
          { label: 'Rename', action: () => { const n = prompt('New name', name); if (n) { FormulaFS.rename(full, n); renderDesktopIcons(); notifyFSChange(); } } },
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
  document.addEventListener('formulaos:fschange', renderDesktopIcons);

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
        const trashCount = FormulaFS.listTrash().length;
        items.push({ label: trashCount ? `Empty Recycle Bin (${trashCount})` : 'Empty Recycle Bin', disabled: !trashCount, action: () => { if (confirm('Permanently delete everything in the Recycle Bin?')) { FormulaFS.emptyTrash(); renderDock(); notifyFSChange(); } } });
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
        const path = e.dataTransfer.getData('application/x-formulaos-path');
        if (path) { FormulaFS.trash(path); renderDock(); notifyFSChange(); bounceDock('trash'); }
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
    const trashEmpty = FormulaFS.listTrash().length === 0;
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
    function activateResult(m) {
      if (m.kind === 'driver') {
        const team = teamById(m.driver.team);
        toast(m.driver.name, `#${m.driver.number} · ${team ? team.name : m.driver.team}`, { icon: 'person' });
      } else {
        activateApp(m);
      }
    }
    function renderResults(q) {
      if (!q) { matches = []; }
      else {
        const ql = q.toLowerCase();
        const appMatches = appList.filter(a => a.label.toLowerCase().includes(ql));
        const driverMatches = DRIVERS.filter(d => d.name.toLowerCase().includes(ql)).map(d => ({ kind: 'driver', label: `${d.name} — #${d.number}`, driver: d }));
        matches = appMatches.concat(driverMatches);
      }
      sel = 0;
      results.innerHTML = matches.map((a, i) => `<div class="sr-item${i === 0 ? ' sel' : ''}" data-i="${i}">${Icons.html(a.kind === 'driver' ? 'person' : a.id)}<span>${a.label}</span></div>`).join('');
      results.querySelectorAll('.sr-item').forEach(el => {
        el.onclick = () => { activateResult(matches[el.dataset.i]); closeSpotlight(); };
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
      else if (e.key === 'Enter') { if (matches[sel]) { activateResult(matches[sel]); closeSpotlight(); } }
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
          { label: `About This FormulaOS`, action: () => Apps.about() },
          { sep: true },
          { label: 'System Settings…', action: () => Apps.settings() },
          { sep: true },
          { label: 'Lock Screen', action: () => lock() },
          { label: 'Restart', action: () => { if (confirm('Restart FormulaOS?')) location.reload(); } },
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
          { label: 'New Folder', action: () => { const n = prompt('Folder name', 'New Folder'); if (n) FormulaFS.mkdir('/' + n); } },
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
          { label: 'FormulaOS Help', action: () => Apps.about() },
          { label: 'Welcome Screen', action: () => showWelcome() },
          { label: 'Keyboard Shortcuts', action: () => alert('⌘/Ctrl+Space — Spotlight\nAlt+Tab — Switch windows\nDrag a window to a screen edge — Snap\nF4 or Launchpad icon — App grid') },
        ];
      default: return [];
    }
  }

  /* ---------------- Championship standings (live, via the Jolpica Ergast-compatible API) ---------------- */
  const STANDINGS_CACHE_KEY = 'formulaos_standings_v1';
  const STANDINGS_TTL = 6 * 3600 * 1000;
  function loadCachedStandings() {
    try { return JSON.parse(localStorage.getItem(STANDINGS_CACHE_KEY)); } catch (e) { return null; }
  }
  async function fetchStandings() {
    const cached = loadCachedStandings();
    if (cached && Date.now() - cached.fetchedAt < STANDINGS_TTL) return cached.drivers;
    try {
      const res = await fetch('https://api.jolpi.ca/ergast/f1/current/driverStandings.json');
      const data = await res.json();
      const list = data.MRData.StandingsTable.StandingsLists[0] || { DriverStandings: [] };
      const drivers = list.DriverStandings.map(d => ({
        position: d.position,
        points: d.points,
        name: `${d.Driver.givenName} ${d.Driver.familyName}`,
        shortName: `${d.Driver.givenName.charAt(0)}. ${d.Driver.familyName}`,
        team: d.Constructors[0] ? d.Constructors[0].name : ''
      }));
      localStorage.setItem(STANDINGS_CACHE_KEY, JSON.stringify({ fetchedAt: Date.now(), drivers }));
      return drivers;
    } catch (e) {
      return cached ? cached.drivers : null;
    }
  }
  async function renderStandingsMenuItem() {
    const iconEl = document.getElementById('mb-standings-icon');
    const textEl = document.getElementById('mb-standings-text');
    if (iconEl) iconEl.innerHTML = Icons.monoSvg('trophy');
    const drivers = await fetchStandings();
    if (!textEl) return;
    if (!drivers || !drivers.length) { textEl.textContent = 'Standings unavailable'; return; }
    const leader = drivers[0];
    textEl.textContent = `${leader.name.split(' ').pop()} · ${leader.points} pts`;
    const el = document.getElementById('mb-standings');
    if (el) el.onclick = (e) => {
      e.stopPropagation();
      showMenuDropdown(el, drivers.slice(0, 5).map(d =>
        ({ label: `${d.position}. ${d.shortName} — ${d.points} pts <span style="color:var(--text-dim);font-weight:400;margin-left:10px;">${d.team}</span>`, action: () => {} })
      ));
    };
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

  /* ---------------- Next Race widget ---------------- */
  const RACE_CALENDAR = [
    { name: 'Bahrain Grand Prix', circuit: 'Bahrain International Circuit', track: 'bahrain', month: 3, day: 2 },
    { name: 'Saudi Arabian Grand Prix', circuit: 'Jeddah Corniche Circuit', track: 'jeddah', month: 3, day: 16 },
    { name: 'Australian Grand Prix', circuit: 'Albert Park Circuit', track: 'albertpark', month: 3, day: 30 },
    { name: 'Japanese Grand Prix', circuit: 'Suzuka Circuit', track: 'suzuka', month: 4, day: 13 },
    { name: 'Chinese Grand Prix', circuit: 'Shanghai International Circuit', track: 'shanghai', month: 4, day: 27 },
    { name: 'Miami Grand Prix', circuit: 'Miami International Autodrome', track: 'miami', month: 5, day: 4 },
    { name: 'Emilia Romagna Grand Prix', circuit: 'Imola', track: 'imola', month: 5, day: 18 },
    { name: 'Monaco Grand Prix', circuit: 'Circuit de Monaco', track: 'monaco', month: 5, day: 25 },
    { name: 'Canadian Grand Prix', circuit: 'Circuit Gilles Villeneuve', track: 'montreal', month: 6, day: 8 },
    { name: 'Spanish Grand Prix', circuit: 'Circuit de Barcelona-Catalunya', track: 'barcelona', month: 6, day: 22 },
    { name: 'Austrian Grand Prix', circuit: 'Red Bull Ring', track: 'redbullring', month: 6, day: 29 },
    { name: 'British Grand Prix', circuit: 'Silverstone Circuit', track: 'silverstone', month: 7, day: 6 },
    { name: 'Belgian Grand Prix', circuit: 'Circuit de Spa-Francorchamps', track: 'spa', month: 7, day: 27 },
    { name: 'Hungarian Grand Prix', circuit: 'Hungaroring', track: 'hungaroring', month: 8, day: 3 },
    { name: 'Dutch Grand Prix', circuit: 'Circuit Zandvoort', track: 'zandvoort', month: 8, day: 31 },
    { name: 'Italian Grand Prix', circuit: 'Autodromo Nazionale Monza', track: 'monza', month: 9, day: 7 },
    { name: 'Azerbaijan Grand Prix', circuit: 'Baku City Circuit', track: 'baku', month: 9, day: 21 },
    { name: 'Singapore Grand Prix', circuit: 'Marina Bay Street Circuit', track: 'singapore', month: 10, day: 5 },
    { name: 'United States Grand Prix', circuit: 'Circuit of the Americas', track: 'cota', month: 10, day: 19 },
    { name: 'Mexico City Grand Prix', circuit: 'Autódromo Hermanos Rodríguez', track: 'mexico', month: 10, day: 26 },
    { name: 'São Paulo Grand Prix', circuit: 'Interlagos', track: 'interlagos', month: 11, day: 9 },
    { name: 'Las Vegas Grand Prix', circuit: 'Las Vegas Strip Circuit', track: 'vegas', month: 11, day: 22 },
    { name: 'Qatar Grand Prix', circuit: 'Lusail International Circuit', track: 'lusail', month: 11, day: 30 },
    { name: 'Abu Dhabi Grand Prix', circuit: 'Yas Marina Circuit', track: 'yasmarina', month: 12, day: 7 }
  ];
  function nextRace() {
    const now = new Date();
    const withDates = RACE_CALENDAR.map((r, i) => {
      let d = new Date(now.getFullYear(), r.month - 1, r.day, 14, 0, 0);
      if (d < now) d = new Date(now.getFullYear() + 1, r.month - 1, r.day, 14, 0, 0);
      return { ...r, date: d, round: i + 1 };
    });
    withDates.sort((a, b) => a.date - b.date);
    return withDates[0];
  }
  function renderRaceWidget() {
    const el = document.getElementById('race-widget');
    if (!el) return;
    const race = nextRace();
    el.dataset.race = race.name;
    el.innerHTML = `
      <div class="rw-head">
        <div class="rw-label">Next Race</div>
        <div class="rw-flag">${Icons.inline('flag')}<span>Round ${race.round}</span></div>
      </div>
      <div>
        <div class="rw-race">${race.name}</div>
        <div class="rw-circuit">${race.circuit}</div>
      </div>
      <div class="rw-countdown" data-role="rw-countdown"></div>
      <div class="rw-car">${activeTeam && activeTeam.car ? Icons.carSvg(activeTeam.car[0], activeTeam.car[1]) : Icons.carSvg()}</div>
    `;
    updateRaceCountdown();
  }
  function updateRaceCountdown() {
    const el = document.getElementById('race-widget');
    const box = el && el.querySelector('[data-role="rw-countdown"]');
    if (!box) return;
    const race = nextRace();
    if (el.dataset.race !== race.name) { renderRaceWidget(); return; }
    let diff = Math.max(0, race.date - new Date());
    const d = Math.floor(diff / 86400000); diff -= d * 86400000;
    const h = Math.floor(diff / 3600000); diff -= h * 3600000;
    const m = Math.floor(diff / 60000); diff -= m * 60000;
    const s = Math.floor(diff / 1000);
    box.innerHTML = [[d, 'Days'], [h, 'Hrs'], [m, 'Min'], [s, 'Sec']]
      .map(([v, label]) => `<div class="rw-unit"><b>${String(v).padStart(2, '0')}</b><span>${label}</span></div>`).join('');
  }

  /* ---------------- Toast notifications ---------------- */
  function toast(title, sub, opts) {
    opts = opts || {};
    const stack = document.getElementById('toast-stack');
    if (!stack) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `
      <div class="toast-icon">${Icons.inlineSvg(opts.icon || 'flag')}</div>
      <div class="toast-body">
        <div class="toast-title">${title}</div>
        ${sub ? `<div class="toast-sub">${sub}</div>` : ''}
      </div>
      <button class="toast-close">&#10005;</button>`;
    stack.appendChild(el);
    const dismiss = () => { el.classList.add('leaving'); setTimeout(() => el.remove(), 200); };
    el.querySelector('.toast-close').onclick = dismiss;
    setTimeout(dismiss, opts.duration || 7000);
  }

  /* Race-weekend countdown milestones — fires once per threshold per race, tracked in localStorage */
  const RACE_TOAST_THRESHOLDS = [
    { ms: 24 * 3600 * 1000, label: '24 hours' },
    { ms: 3600 * 1000, label: '1 hour' },
    { ms: 10 * 60 * 1000, label: '10 minutes' }
  ];
  const TOAST_SEEN_KEY = 'formulaos_race_toasts_v1';
  function loadToastSeen() {
    try { return JSON.parse(localStorage.getItem(TOAST_SEEN_KEY)) || {}; } catch (e) { return {}; }
  }
  function checkRaceToasts() {
    const race = nextRace();
    let seen = loadToastSeen();
    if (seen.race !== race.name) seen = { race: race.name, thresholds: [] };
    const msLeft = race.date - new Date();
    RACE_TOAST_THRESHOLDS.forEach(t => {
      if (msLeft <= t.ms && msLeft > 0 && !seen.thresholds.includes(t.label)) {
        toast(race.name, `Lights out in about ${t.label} — ${race.circuit}`, { icon: 'flag' });
        seen.thresholds.push(t.label);
      }
    });
    localStorage.setItem(TOAST_SEEN_KEY, JSON.stringify(seen));
  }

  function lock() {
    hideMenuDropdown();
    document.getElementById('control-center').classList.add('hidden');
    document.getElementById('lock-screen').classList.remove('hidden');
  }
  function unlock() {
    document.getElementById('lock-screen').classList.add('hidden');
  }

  const WELCOME_SEEN_KEY = 'formulaos_welcome_seen_v1';
  function showWelcome() { document.getElementById('welcome-screen').classList.remove('hidden'); }
  function dismissWelcome() {
    document.getElementById('welcome-screen').classList.add('hidden');
    localStorage.setItem(WELCOME_SEEN_KEY, '1');
  }

  function showLoginGate() { document.getElementById('login-gate').classList.remove('hidden'); }
  function hideLoginGate() { document.getElementById('login-gate').classList.add('hidden'); }
  function resolveGateThenWelcome() {
    hideLoginGate();
    if (!localStorage.getItem(WELCOME_SEEN_KEY)) showWelcome();
  }

  /* Flag colors for the next Grand Prix's host country — recolors the boot screen so
     the very first thing you see ties into the live race calendar, not a static logo. */
  const COUNTRY_FLAG_COLORS = {
    bahrain: ['#ce1126', '#ffffff'], jeddah: ['#006c35', '#ffffff'],
    albertpark: ['#00008b', '#ffffff'], suzuka: ['#bc002d', '#ffffff'],
    shanghai: ['#de2910', '#ffde00'], miami: ['#b31942', '#3c3b6e'],
    imola: ['#009246', '#ce2b37'], monaco: ['#ce1126', '#ffffff'],
    montreal: ['#ff0000', '#ffffff'], barcelona: ['#aa151b', '#f1bf00'],
    redbullring: ['#ed2939', '#ffffff'], silverstone: ['#c8102e', '#012169'],
    spa: ['#000000', '#ffcd00'], hungaroring: ['#ce2939', '#477050'],
    zandvoort: ['#ae1c28', '#21468b'], monza: ['#009246', '#ce2b37'],
    baku: ['#00b9e4', '#ed2939'], singapore: ['#ed2939', '#ffffff'],
    cota: ['#b31942', '#3c3b6e'], mexico: ['#006847', '#ce1126'],
    interlagos: ['#009c3b', '#ffdf00'], vegas: ['#b31942', '#3c3b6e'],
    lusail: ['#8a1538', '#ffffff'], yasmarina: ['#00732f', '#ffffff']
  };
  function nextRaceFlagColors() { return COUNTRY_FLAG_COLORS[nextRace().track] || [prefs.accent, prefs.accent2]; }

  function boot() {
    const [fc1, fc2] = nextRaceFlagColors();
    const bootLogo = document.getElementById('boot-logo-icon');
    if (bootLogo) bootLogo.style.filter = `drop-shadow(0 0 30px ${fc1})`;
    const bootTitle = document.querySelector('.boot-title');
    if (bootTitle) bootTitle.style.background = `linear-gradient(90deg, ${fc1}, ${fc2})`;
    const bootBarFill = document.querySelector('.boot-bar-fill');
    if (bootBarFill) bootBarFill.style.background = `linear-gradient(90deg, ${fc1}, ${fc2})`;
    const bootStatus = document.querySelector('.boot-status');
    if (bootStatus) bootStatus.textContent = `Loading ${nextRace().circuit}…`;
    document.getElementById('boot-logo-icon').innerHTML = Icons.svg('flag');
    document.getElementById('lock-avatar-icon').innerHTML = Icons.svg('flag');
    document.getElementById('mb-logo-btn').innerHTML = Icons.svg('flag');
    document.getElementById('mb-search').innerHTML = Icons.monoSvg('search');
    document.getElementById('mb-wifi').innerHTML = Icons.monoSvg('wifi');
    document.getElementById('mb-battery').innerHTML = Icons.monoSvg('battery');
    document.getElementById('mb-control').innerHTML = Icons.monoSvg('control');
    document.getElementById('spotlight-icon').innerHTML = Icons.monoSvg('search');
    document.getElementById('welcome-logo-icon').innerHTML = Icons.svg('flag');
    document.getElementById('login-logo-icon').innerHTML = Icons.svg('flag');
    document.querySelectorAll('.wf-icon').forEach(el => { el.innerHTML = Icons.inlineSvg(el.dataset.icon); });
    document.getElementById('welcome-dismiss').onclick = dismissWelcome;
    document.getElementById('login-google').innerHTML = `${Icons.googleButton()}<span>Continue with Google</span>`;

    document.getElementById('login-guest').onclick = () => resolveGateThenWelcome();
    document.getElementById('login-google').onclick = async () => {
      const msg = document.getElementById('login-msg');
      msg.textContent = '';
      try { await Auth.signInWithGoogle(); }
      catch (e) { msg.textContent = e.message || 'Google sign-in failed.'; }
    };
    document.getElementById('login-signin').onclick = async () => {
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const msg = document.getElementById('login-msg');
      msg.textContent = '';
      try { await Auth.signIn(email, password); }
      catch (e) { msg.textContent = e.message || 'Sign in failed.'; }
    };
    document.getElementById('login-signup').onclick = async () => {
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const msg = document.getElementById('login-msg');
      msg.textContent = '';
      try { await Auth.signUp(email, password); msg.textContent = 'Check your inbox to confirm, then sign in.'; }
      catch (e) { msg.textContent = e.message || 'Something went wrong.'; }
    };

    applyPrefs();
    renderDesktopIcons();
    renderDock();
    updateClock();
    setInterval(updateClock, 1000 * 15);
    Auth.onChange(onAuthUpdate);
    Auth.init();
    renderRaceWidget();
    setInterval(updateRaceCountdown, 1000);
    checkRaceToasts();
    setInterval(checkRaceToasts, 30000);
    renderStandingsMenuItem();
    setInterval(renderStandingsMenuItem, 10 * 60 * 1000);

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
        { label: `${Icons.inline('folder-open')}<span>New Folder</span>`, action: () => { const n = prompt('Folder name', 'New Folder'); if (n) { FormulaFS.mkdir('/Desktop/' + n); renderDesktopIcons(); } } },
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
        reader.onload = () => { FormulaFS.write('/Desktop/' + f.name, reader.result); renderDesktopIcons(); };
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
    wallpapers, wallpaperCss, wallpaperName, appList, prefs, nextRace,
    raceCalendar: () => RACE_CALENDAR.slice(),
    setTheme, toggleTheme, setAccent, setWallpaper, setCustomWallpaper, setFontSize, setReduceMotion,
    setHighContrast, setClock24h, setUsername, setIconSize, setBrightness,
    showContextMenu, hideContextMenu, lock, unlock, storageUsage, openLaunchpad, openSpotlight,
    pinToDock, unpinFromDock, notifyFSChange, renderDesktopIcons, renderDock,
    toast, orderedTeams, setTeamOrder, morphToTeam, getActiveTeam: () => activeTeam
  };
})();
