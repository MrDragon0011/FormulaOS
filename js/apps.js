/* FormulaOS Applications */
const Apps = {};

/* ---------------- File Explorer ---------------- */
Apps.explorer = function (startPath) {
  WM.open({
    title: 'File Explorer', icon: 'explorer', appId: 'explorer', width: 640, height: 440,
    onMount(body) {
      let path = startPath || '/';
      body.innerHTML = `
        <div class="explorer">
          <div class="explorer-sidebar">
            <div class="item" data-p="/">${Icons.inline('home')}<span>Home</span></div>
            <div class="item" data-p="/Documents">${Icons.inline('explorer')}<span>Documents</span></div>
            <div class="item" data-p="/Pictures">${Icons.inline('photos')}<span>Pictures</span></div>
            <div class="item" data-p="/Desktop">${Icons.inline('monitor')}<span>Desktop</span></div>
            <div class="item" data-p="/Trash">${Icons.inline('trash')}<span>Recycle Bin</span></div>
          </div>
          <div class="explorer-main">
            <div class="app-toolbar">
              <button data-act="up">${Icons.inline('chevronUp')}<span>Up</span></button>
              <button data-act="new-folder">${Icons.inline('folder-open')}<span>Folder</span></button>
              <button data-act="new-file">${Icons.inline('fileGeneric')}<span>File</span></button>
              <button data-act="empty-trash" style="display:none;">${Icons.inline('trash')}<span>Empty Recycle Bin</span></button>
            </div>
            <div class="explorer-path"></div>
            <div class="explorer-grid"></div>
          </div>
        </div>`;
      const grid = body.querySelector('.explorer-grid');
      const pathEl = body.querySelector('.explorer-path');
      const emptyTrashBtn = body.querySelector('[data-act="empty-trash"]');

      function iconFor(name, isDir) {
        if (isDir) return name === 'Trash' ? 'trash' : 'explorer';
        if (/\.(txt|md)$/i.test(name)) return 'notepad';
        if (/\.(png|jpg|jpeg|gif|svg)$/i.test(name)) return 'photos';
        return 'file';
      }

      function render() {
        const inTrash = path === '/Trash';
        pathEl.innerHTML = inTrash ? `${Icons.inline('trash')}<span>Recycle Bin</span>` : path;
        emptyTrashBtn.style.display = inTrash ? '' : 'none';
        body.querySelector('[data-act="new-folder"]').style.display = inTrash ? 'none' : '';
        body.querySelector('[data-act="new-file"]').style.display = inTrash ? 'none' : '';
        body.querySelectorAll('.explorer-sidebar .item').forEach(it => it.classList.toggle('active', it.dataset.p === path));
        grid.innerHTML = '';
        if (inTrash) {
          const items = FormulaFS.listTrash();
          if (!items.length) { grid.innerHTML = '<div style="grid-column:1/-1;color:var(--text-dim);font-size:13px;padding:20px;">Recycle Bin is empty.</div>'; return; }
          items.forEach(({ name, path: full, origin }) => {
            const dir = FormulaFS.isDir(full);
            const el = document.createElement('div');
            el.className = 'explorer-item';
            el.innerHTML = `${Icons.html(iconFor(name, dir))}<div class="label">${name}</div>`;
            el.title = origin ? `Originally: ${origin}` : '';
            el.oncontextmenu = (e) => {
              e.preventDefault();
              OS.showContextMenu(e.clientX, e.clientY, [
                { label: `${Icons.inline('undo')}<span>Restore</span>`, action: () => { FormulaFS.restore(name); render(); OS.notifyFSChange(); OS.renderDock(); } },
                { label: `${Icons.inline('trash')}<span>Delete Permanently</span>`, action: () => { if (confirm(`Permanently delete "${name}"?`)) { FormulaFS.remove(full); render(); OS.renderDock(); } } }
              ]);
            };
            bindOpen(el, () => { if (confirm(`Restore "${name}" to its original location?`)) { FormulaFS.restore(name); render(); OS.notifyFSChange(); OS.renderDock(); } });
            grid.appendChild(el);
          });
          return;
        }
        FormulaFS.list(path).forEach(name => {
          const full = (path === '/' ? '' : path) + '/' + name;
          const dir = FormulaFS.isDir(full);
          const el = document.createElement('div');
          el.className = 'explorer-item';
          el.draggable = true;
          el.innerHTML = `${Icons.html(iconFor(name, dir))}<div class="label">${name}</div>`;
          el.addEventListener('dragstart', (e) => { e.dataTransfer.setData('application/x-formulaos-path', full); e.dataTransfer.effectAllowed = 'move'; });
          bindOpen(el, () => {
            if (dir) { path = full; render(); }
            else if (/\.(png|jpg|jpeg|gif|svg)$/i.test(name)) Apps.imageViewer(full);
            else Apps.textEditor(full);
          });
          el.oncontextmenu = (e) => {
            e.preventDefault();
            const items = [
              { label: `${Icons.inline('trash')}<span>Move to Recycle Bin</span>`, action: () => { FormulaFS.trash(full); render(); OS.notifyFSChange(); OS.renderDock(); } },
              { label: `${Icons.inline('edit')}<span>Rename</span>`, action: () => { const n = prompt('New name', name); if (n) { FormulaFS.rename(full, n); render(); OS.notifyFSChange(); } } }
            ];
            OS.showContextMenu(e.clientX, e.clientY, items);
          };
          grid.appendChild(el);
        });
      }
      body.querySelectorAll('.explorer-sidebar .item').forEach(it => it.onclick = () => { path = it.dataset.p; render(); });
      body.querySelector('[data-act="up"]').onclick = () => { const p = FormulaFS.parentOf(path); if (p) { path = p; render(); } };
      body.querySelector('[data-act="new-folder"]').onclick = () => {
        const n = prompt('Folder name'); if (n) { FormulaFS.mkdir((path === '/' ? '' : path) + '/' + n); render(); }
      };
      body.querySelector('[data-act="new-file"]').onclick = () => {
        const n = prompt('File name', 'untitled.txt'); if (n) { FormulaFS.touch((path === '/' ? '' : path) + '/' + n); render(); }
      };
      emptyTrashBtn.onclick = () => { if (confirm('Permanently delete everything in the Recycle Bin?')) { FormulaFS.emptyTrash(); render(); OS.renderDock(); } };
      document.addEventListener('formulaos:fschange', render);

      // Drag & drop upload from the OS file system
      ['dragover', 'dragenter'].forEach(ev => grid.addEventListener(ev, (e) => { e.preventDefault(); grid.style.background = 'rgba(255,95,69,.08)'; }));
      ['dragleave', 'drop'].forEach(ev => grid.addEventListener(ev, () => { grid.style.background = ''; }));
      grid.addEventListener('drop', (e) => {
        e.preventDefault();
        const files = [...(e.dataTransfer.files || [])];
        files.forEach(f => {
          const reader = new FileReader();
          const isText = /\.(txt|md|json|js|css|html|csv)$/i.test(f.name) || f.type.startsWith('text/');
          reader.onload = () => {
            FormulaFS.write((path === '/' ? '' : path) + '/' + f.name, reader.result);
            render();
          };
          if (isText) reader.readAsText(f); else reader.readAsDataURL(f);
        });
      });
      render();
    }
  });
};

/* ---------------- Text Editor ---------------- */
Apps.textEditor = function (path) {
  WM.open({
    title: path ? FormulaFS.nameOf(path) : 'Untitled — Notepad', icon: 'notepad', appId: 'notepad', width: 560, height: 440,
    onMount(body, winId) {
      body.innerHTML = `
        <div class="app-toolbar">
          <button data-act="save">${Icons.inline('save')}<span>Save</span></button>
          <button data-act="save-as">${Icons.inline('folder-open')}<span>Save As</span></button>
          <span style="flex:1"></span>
          <span id="status-${winId}" style="font-size:11px;color:var(--text-dim);align-self:center;"></span>
        </div>
        <textarea class="editor-area" spellcheck="false" placeholder="Start typing..."></textarea>`;
      const textarea = body.querySelector('textarea');
      const status = body.querySelector(`#status-${winId}`);
      let currentPath = path || null;
      if (path) textarea.value = FormulaFS.read(path) || '';

      function save(newPath) {
        const target = newPath || currentPath;
        if (!target) return saveAs();
        FormulaFS.write(target, textarea.value);
        currentPath = target;
        WM.setTitle(winId, FormulaFS.nameOf(target));
        status.textContent = 'Saved ' + new Date().toLocaleTimeString();
      }
      function saveAs() {
        const name = prompt('Save as (path from /Documents):', currentPath || '/Documents/untitled.txt');
        if (name) save(name);
      }
      body.querySelector('[data-act="save"]').onclick = () => save();
      body.querySelector('[data-act="save-as"]').onclick = saveAs;
      textarea.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save(); }
      });
    }
  });
};

/* ---------------- Terminal ---------------- */
Apps.terminal = function () {
  WM.open({
    title: 'Terminal', icon: 'terminal', appId: 'terminal', single: true, width: 560, height: 380,
    onMount(body) {
      body.innerHTML = `<div class="terminal"><div class="output"></div>
        <div class="terminal-input-row"><span class="prompt">driver@pit:~$</span><input autofocus /></div></div>`;
      const out = body.querySelector('.output');
      const input = body.querySelector('input');
      let cwd = '/';

      function print(text) {
        const div = document.createElement('div');
        div.className = 'line';
        div.textContent = text;
        out.appendChild(div);
        body.querySelector('.terminal').scrollTop = 999999;
      }
      print('FormulaOS Terminal — type "help" for commands.');

      const commands = {
        help: () => 'Commands: help, ls, cd, cat, echo, mkdir, touch, rm, pwd, clear, date, whoami, neofetch, open <app>',
        pwd: () => cwd,
        ls: (args) => FormulaFS.list(args[0] ? resolve(args[0]) : cwd).join('  ') || '(empty)',
        cd: (args) => {
          const target = args[0] ? resolve(args[0]) : '/';
          if (FormulaFS.isDir(target)) { cwd = target; return ''; }
          return 'cd: no such directory: ' + (args[0] || '');
        },
        cat: (args) => {
          if (!args[0]) return 'usage: cat <file>';
          const c = FormulaFS.read(resolve(args[0]));
          return c === null ? 'cat: no such file' : c;
        },
        echo: (args) => args.join(' '),
        mkdir: (args) => args[0] ? (FormulaFS.mkdir(resolve(args[0])) ? '' : 'mkdir: failed') : 'usage: mkdir <dir>',
        touch: (args) => args[0] ? (FormulaFS.touch(resolve(args[0])) ? '' : 'touch: failed') : 'usage: touch <file>',
        rm: (args) => args[0] ? (FormulaFS.remove(resolve(args[0])) ? '' : 'rm: failed') : 'usage: rm <path>',
        clear: () => { out.innerHTML = ''; return null; },
        date: () => new Date().toString(),
        whoami: () => 'driver',
        neofetch: () => `
   #=#=#  FormulaOS
   -----------
   OS: FormulaOS Web v1.0
   Host: ${navigator.platform}
   Shell: pit-sh
   Resolution: ${window.innerWidth}x${window.innerHeight}
   Theme: ${document.documentElement.dataset.theme || 'dark'}`,
        open: (args) => {
          const map = { explorer: Apps.explorer, notepad: Apps.textEditor, settings: Apps.settings, calculator: Apps.calculator, browser: Apps.browser, about: Apps.about };
          if (map[args[0]]) { map[args[0]](); return 'Opening ' + args[0] + '...'; }
          return 'open: unknown app "' + (args[0] || '') + '"';
        }
      };

      function resolve(p) {
        if (p.startsWith('/')) return FormulaFS.normalize(p);
        return FormulaFS.normalize((cwd === '/' ? '' : cwd) + '/' + p);
      }

      input.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        const raw = input.value;
        print(`driver@pit:${cwd}$ ${raw}`);
        input.value = '';
        const [cmd, ...args] = raw.trim().split(/\s+/);
        if (!cmd) return;
        if (commands[cmd]) {
          const res = commands[cmd](args);
          if (res !== null && res !== undefined && res !== '') print(res);
        } else {
          print(`command not found: ${cmd}`);
        }
      });
      body.addEventListener('click', () => input.focus());
    }
  });
};

/* ---------------- Browser ---------------- */
Apps.browser = function () {
  WM.open({
    title: 'Web Browser', icon: 'browser', appId: 'browser', width: 720, height: 500,
    onMount(body) {
      body.innerHTML = `
        <div class="app-toolbar">
          <button data-act="back">${Icons.inline('chevronLeft')}</button>
          <button data-act="fwd">${Icons.inline('chevronRight')}</button>
          <button data-act="go">${Icons.inline('refresh')}</button>
          <input type="text" value="https://en.wikipedia.org/wiki/Special:Random" />
        </div>
        <iframe style="width:100%;height:calc(100% - 46px);border:none;background:#fff;"></iframe>`;
      const iframe = body.querySelector('iframe');
      const urlInput = body.querySelector('input');
      function load() {
        let v = urlInput.value.trim();
        if (!/^https?:\/\//.test(v)) v = 'https://' + v;
        iframe.src = v;
      }
      body.querySelector('[data-act="go"]').onclick = load;
      urlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') load(); });
      load();
    }
  });
};

/* ---------------- Settings ---------------- */
Apps.settings = function (openSection) {
  WM.open({
    title: 'Settings', icon: 'settings', appId: 'settings', single: true, width: 620, height: 500,
    onMount(body) {
      const SECTIONS = [
        { id: 'appearance', label: 'Appearance', icon: 'paint' },
        { id: 'desktop', label: 'Desktop & Icons', icon: 'monitor' },
        { id: 'accessibility', label: 'Accessibility', icon: 'accessibility' },
        { id: 'datetime', label: 'Date & Time', icon: 'clock' },
        { id: 'account', label: 'Account', icon: 'person' },
        { id: 'apps', label: 'Apps', icon: 'launchpad' },
        { id: 'storage', label: 'Storage', icon: 'save' },
        { id: 'about', label: 'About', icon: 'flag' },
      ];
      body.innerHTML = `
        <div class="settings-shell">
          <div class="settings-sidebar">
            ${SECTIONS.map(s => `<div class="item" data-s="${s.id}">${Icons.inline(s.icon)}<span>${s.label}</span></div>`).join('')}
          </div>
          <div class="settings-main app-pad" id="settings-content"></div>
        </div>`;
      const content = body.querySelector('#settings-content');
      const navItems = body.querySelectorAll('.settings-sidebar .item');

      function activate(section) {
        navItems.forEach(it => it.classList.toggle('active', it.dataset.s === section));
        render(section);
      }
      navItems.forEach(it => it.onclick = () => activate(it.dataset.s));

      function toggleEl(on, onChange) {
        const t = document.createElement('div');
        t.className = 'toggle' + (on ? ' on' : '');
        t.onclick = () => { const next = !t.classList.contains('on'); t.classList.toggle('on', next); onChange(next); };
        return t;
      }

      function render(section) {
        content.innerHTML = '';
        if (section === 'appearance') {
          content.innerHTML = `
            <div class="settings-section-title">Appearance</div>
            <div class="settings-section-desc">Customize how FormulaOS looks.</div>
            <div class="settings-card">
              <div class="settings-row">
                <div class="label-group"><div class="label-title">Theme</div><div class="label-sub">Light or dark interface</div></div>
                <div class="seg" data-role="theme-seg">
                  <button data-v="dark">${Icons.inline('moon')}<span>Dark</span></button><button data-v="light">${Icons.inline('sun')}<span>Light</span></button>
                </div>
              </div>
            </div>
            <div class="settings-card">
              <div class="label-title" style="margin-bottom:10px;">Accent Color</div>
              <div class="swatch-row" data-role="accent-row">
                ${['#e10600', '#3e8bff', '#33c17a', '#ff8700', '#c14fff', '#ffc300'].map(c => `<div class="swatch" style="background:${c}" data-accent="${c}"></div>`).join('')}
              </div>
            </div>
            <div class="settings-card">
              <div class="label-title" style="margin-bottom:10px;">Wallpaper</div>
              <div class="wallpaper-row" data-role="wp-row">
                ${OS.wallpapers.map((_, i) => `<div class="wallpaper-thumb" style="background:${OS.wallpaperCss(i)}" data-wp="${i}"></div>`).join('')}
              </div>
              <div style="margin-top:10px;display:flex;gap:8px;align-items:center;">
                <button data-act="upload-wp">${Icons.inline('upload')}<span>Upload custom image…</span></button>
                <input type="file" accept="image/*" data-role="wp-file" style="display:none" />
              </div>
            </div>`;
          const themeSeg = content.querySelector('[data-role="theme-seg"]');
          [...themeSeg.children].forEach(b => { b.classList.toggle('active', b.dataset.v === OS.prefs.theme); b.onclick = () => { OS.setTheme(b.dataset.v); render('appearance'); }; });
          content.querySelectorAll('[data-accent]').forEach(b => {
            b.classList.toggle('active', b.dataset.accent === OS.prefs.accent);
            b.onclick = () => { OS.setAccent(b.dataset.accent); render('appearance'); };
          });
          content.querySelectorAll('[data-wp]').forEach(b => {
            b.classList.toggle('active', !OS.prefs.customWallpaper && parseInt(b.dataset.wp) === OS.prefs.wallpaper);
            b.onclick = () => { OS.setWallpaper(parseInt(b.dataset.wp)); render('appearance'); };
          });
          const wpFile = content.querySelector('[data-role="wp-file"]');
          content.querySelector('[data-act="upload-wp"]').onclick = () => wpFile.click();
          wpFile.addEventListener('change', () => {
            const f = wpFile.files[0]; if (!f) return;
            const reader = new FileReader();
            reader.onload = () => OS.setCustomWallpaper(reader.result);
            reader.readAsDataURL(f);
          });
        } else if (section === 'desktop') {
          content.innerHTML = `
            <div class="settings-section-title">Desktop & Icons</div>
            <div class="settings-section-desc">Control icon size and desktop behavior.</div>
            <div class="settings-card">
              <div class="settings-row">
                <div class="label-group"><div class="label-title">Icon Size</div><div class="label-sub">Size of desktop shortcuts</div></div>
                <div class="seg" data-role="icon-seg">
                  <button data-v="sm">Small</button><button data-v="md">Medium</button><button data-v="lg">Large</button>
                </div>
              </div>
            </div>
            <div class="settings-card">
              <div class="settings-row">
                <div class="label-group"><div class="label-title">Refresh Desktop</div><div class="label-sub">Re-render desktop icons</div></div>
                <button data-act="refresh">${Icons.inline('refresh')}<span>Refresh</span></button>
              </div>
            </div>`;
          const iconSeg = content.querySelector('[data-role="icon-seg"]');
          [...iconSeg.children].forEach(b => { b.classList.toggle('active', b.dataset.v === OS.prefs.iconSize); b.onclick = () => { OS.setIconSize(b.dataset.v); render('desktop'); }; });
          content.querySelector('[data-act="refresh"]').onclick = () => location.reload();
        } else if (section === 'accessibility') {
          content.innerHTML = `
            <div class="settings-section-title">Accessibility</div>
            <div class="settings-section-desc">Make FormulaOS easier to see and use.</div>
            <div class="settings-card">
              <div class="settings-row">
                <div class="label-group"><div class="label-title">Text Size</div><div class="label-sub">UI font scale</div></div>
                <div class="seg" data-role="font-seg">
                  <button data-v="sm">A</button><button data-v="md" style="font-size:14px;">A</button><button data-v="lg" style="font-size:16px;">A</button>
                </div>
              </div>
              <div class="settings-row">
                <div class="label-group"><div class="label-title">Reduce Motion</div><div class="label-sub">Disable window/boot animations</div></div>
                <div data-role="motion-toggle"></div>
              </div>
              <div class="settings-row">
                <div class="label-group"><div class="label-title">High Contrast</div><div class="label-sub">Stronger borders and text contrast</div></div>
                <div data-role="contrast-toggle"></div>
              </div>
            </div>`;
          const fontSeg = content.querySelector('[data-role="font-seg"]');
          [...fontSeg.children].forEach(b => { b.classList.toggle('active', b.dataset.v === OS.prefs.fontSize); b.onclick = () => { OS.setFontSize(b.dataset.v); render('accessibility'); }; });
          content.querySelector('[data-role="motion-toggle"]').appendChild(toggleEl(OS.prefs.reduceMotion, (v) => OS.setReduceMotion(v)));
          content.querySelector('[data-role="contrast-toggle"]').appendChild(toggleEl(OS.prefs.highContrast, (v) => OS.setHighContrast(v)));
        } else if (section === 'datetime') {
          content.innerHTML = `
            <div class="settings-section-title">Date & Time</div>
            <div class="settings-section-desc">Time is read from your device clock.</div>
            <div class="settings-card">
              <div class="settings-row">
                <div class="label-group"><div class="label-title">24-Hour Time</div><div class="label-sub">Show taskbar clock in 24h format</div></div>
                <div data-role="clock-toggle"></div>
              </div>
              <div class="settings-row">
                <div class="label-group"><div class="label-title">Current Time</div></div>
                <div class="label-sub" style="font-size:13px;">${new Date().toLocaleString()}</div>
              </div>
            </div>`;
          content.querySelector('[data-role="clock-toggle"]').appendChild(toggleEl(OS.prefs.clock24h, (v) => OS.setClock24h(v)));
        } else if (section === 'account') {
          content.innerHTML = `
            <div class="settings-section-title">Account</div>
            <div class="settings-section-desc">Personalize your FormulaOS profile.</div>
            <div class="settings-card">
              <div class="settings-row">
                <div class="label-group"><div class="label-title">Display Name</div><div class="label-sub">Shown in the Start Menu</div></div>
                <input type="text" data-role="username" value="${OS.prefs.username}" style="width:160px;" />
              </div>
            </div>`;
          const input = content.querySelector('[data-role="username"]');
          input.addEventListener('change', () => OS.setUsername(input.value.trim()));
        } else if (section === 'apps') {
          content.innerHTML = `
            <div class="settings-section-title">Apps</div>
            <div class="settings-section-desc">${OS.appList.length} apps installed on FormulaOS.</div>
            <div class="app-directory">
              ${OS.appList.map(a => `<div class="adi" data-app="${a.id}">${Icons.html(a.id, 'adi-icon')} ${a.label}</div>`).join('')}
            </div>`;
          content.querySelectorAll('[data-app]').forEach(el => {
            el.onclick = () => { const app = OS.appList.find(a => a.id === el.dataset.app); if (app) app.run(); };
          });
        } else if (section === 'storage') {
          const usage = OS.storageUsage();
          const limitBytes = 5 * 1024 * 1024;
          const pct = Math.min(100, Math.round((usage.total / limitBytes) * 100));
          content.innerHTML = `
            <div class="settings-section-title">Storage</div>
            <div class="settings-section-desc">FormulaOS stores all data locally in this browser via localStorage.</div>
            <div class="settings-card">
              <div class="label-title">${(usage.total / 1024).toFixed(1)} KB used <span style="color:var(--text-dim);font-weight:400;">(~5 MB browser limit)</span></div>
              <div class="storage-bar"><div class="storage-bar-fill" style="width:${pct}%"></div></div>
              ${usage.items.map(it => `<div class="settings-row"><div class="label-group"><div class="label-title" style="font-size:12px;">${it.key.replace('formulaos_', '')}</div></div><div class="label-sub">${(it.size / 1024).toFixed(1)} KB</div></div>`).join('')}
            </div>
            <div class="settings-card">
              <div class="settings-row"><div class="label-group"><div class="label-title">Reset File System</div><div class="label-sub">Deletes all files and folders</div></div><button data-act="reset-fs">${Icons.inline('trash')}<span>Reset</span></button></div>
              <div class="settings-row"><div class="label-group"><div class="label-title">Empty Recycle Bin</div></div><button data-act="empty-trash">${Icons.inline('trash')}<span>Empty</span></button></div>
              <div class="settings-row"><div class="label-group"><div class="label-title">Reset All Settings & Data</div><div class="label-sub">Restores FormulaOS to factory defaults</div></div><button data-act="reset-all">${Icons.inline('refresh')}<span>Reset All</span></button></div>
            </div>`;
          content.querySelector('[data-act="reset-fs"]').onclick = () => { if (confirm('Reset all files?')) { FormulaFS.reset(); render('storage'); } };
          content.querySelector('[data-act="empty-trash"]').onclick = () => { if (confirm('Empty the Recycle Bin?')) { FormulaFS.emptyTrash(); render('storage'); } };
          content.querySelector('[data-act="reset-all"]').onclick = () => { if (confirm('Reset all FormulaOS settings and files?')) { localStorage.clear(); location.reload(); } };
        } else if (section === 'about') {
          content.innerHTML = `
            <div class="settings-section-title">About FormulaOS</div>
            <div class="settings-card" style="text-align:center;padding:26px;">
              <div style="display:flex;justify-content:center;">${Icons.html('flag', 'about-icon')}</div>
              <div style="font-weight:700;font-size:16px;margin-top:6px;">FormulaOS Web</div>
              <div class="label-sub">Version 1.0</div>
            </div>
            <div class="settings-card">
              <div class="settings-row"><div class="label-title">Platform</div><div class="label-sub">${navigator.platform || 'Web'}</div></div>
              <div class="settings-row"><div class="label-title">Screen</div><div class="label-sub">${window.innerWidth}×${window.innerHeight}</div></div>
              <div class="settings-row"><div class="label-title">Apps Installed</div><div class="label-sub">${OS.appList.length}</div></div>
            </div>`;
        }
      }
      activate(openSection || 'appearance');
    }
  });
};

/* ---------------- Calculator ---------------- */
Apps.calculator = function () {
  WM.open({
    title: 'Calculator', icon: 'calculator', appId: 'calculator', single: true, width: 300, height: 420, resizable: false,
    onMount(body) {
      body.innerHTML = `
        <div class="calc">
          <div class="calc-display">0</div>
          <div class="calc-grid">
            <button data-k="C">C</button><button data-k="±">±</button><button data-k="%">%</button><button class="op" data-k="/">÷</button>
            <button data-k="7">7</button><button data-k="8">8</button><button data-k="9">9</button><button class="op" data-k="*">×</button>
            <button data-k="4">4</button><button data-k="5">5</button><button data-k="6">6</button><button class="op" data-k="-">−</button>
            <button data-k="1">1</button><button data-k="2">2</button><button data-k="3">3</button><button class="op" data-k="+">+</button>
            <button data-k="0" style="grid-column:span 2">0</button><button data-k=".">.</button><button class="eq" data-k="=">=</button>
          </div>
        </div>`;
      const display = body.querySelector('.calc-display');
      let expr = '';
      function update() { display.textContent = expr || '0'; }
      body.querySelectorAll('[data-k]').forEach(btn => btn.onclick = () => {
        const k = btn.dataset.k;
        if (k === 'C') { expr = ''; }
        else if (k === '=') {
          try { expr = String(Function('"use strict";return (' + expr.replace(/×/g, '*').replace(/÷/g, '/') + ')')()); }
          catch (e) { expr = 'Error'; }
        } else if (k === '±') {
          expr = expr.startsWith('-') ? expr.slice(1) : '-' + expr;
        } else if (k === '%') {
          try { expr = String(Function('"use strict";return (' + expr + ')')() / 100); } catch (e) {}
        } else {
          expr += (k === '*' ? '×' : k === '/' ? '÷' : k);
        }
        update();
      });
      update();
    }
  });
};

/* ---------------- About ---------------- */
Apps.about = function () {
  WM.open({
    title: 'About FormulaOS', icon: 'flag', appId: 'about', single: true, width: 380, height: 420, resizable: false,
    onMount(body) {
      body.innerHTML = `
        <div class="about-hero">
          ${Icons.html('flag', 'about-icon')}
          <h2 style="margin:0">FormulaOS</h2>
          <div style="color:var(--text-dim);font-size:13px">Version 1.0 — a web-based operating system</div>
        </div>
        <div class="about-list">
          • Runs entirely in your browser<br/>
          • Files persist via localStorage<br/>
          • Draggable, resizable windows<br/>
          • Built-in Terminal, Notepad, File Explorer, Browser, Calculator<br/>
          • Fully themeable — try Settings<br/><br/>
          Built with vanilla HTML, CSS &amp; JavaScript. No frameworks, no build step.
        </div>`;
    }
  });
};

/* ---------------- Photos / Gallery ---------------- */
Apps.photos = function () {
  WM.open({
    title: 'Photos', icon: 'photos', appId: 'photos', single: true, width: 520, height: 400,
    onMount(body) {
      const wallpapers = OS.wallpapers;
      body.innerHTML = `<div class="gallery">${wallpapers.map((_, i) => `<div class="card" style="background:${OS.wallpaperCss(i)}"><span>Wallpaper ${i + 1}</span></div>`).join('')}</div>`;
      body.querySelectorAll('.card').forEach((c, i) => c.onclick = () => OS.setWallpaper(i));
    }
  });
};

/* ---------------- Sticky Notes ---------------- */
Apps.notes = function () {
  WM.open({
    title: 'Sticky Notes', icon: 'notes', appId: 'notes', single: true, width: 340, height: 440,
    onMount(body) {
      body.innerHTML = `<div class="app-toolbar"><button data-act="add">+ New note</button></div><div class="notes-list"></div>`;
      const list = body.querySelector('.notes-list');
      const KEY = 'formulaos_notes_v1';
      let notes = JSON.parse(localStorage.getItem(KEY) || '[]');
      function save() { localStorage.setItem(KEY, JSON.stringify(notes)); }
      function render() {
        list.innerHTML = '';
        notes.forEach((n, i) => {
          const div = document.createElement('div');
          div.className = 'note-item';
          div.innerHTML = `<textarea style="width:100%;border:none;background:transparent;resize:none;color:var(--text);font-family:inherit;font-size:12px;min-height:60px;outline:none;">${n}</textarea><button style="float:right;margin-top:4px;" data-i="${i}">Delete</button>`;
          div.querySelector('textarea').addEventListener('input', (e) => { notes[i] = e.target.value; save(); });
          div.querySelector('button').onclick = () => { notes.splice(i, 1); save(); render(); };
          list.appendChild(div);
        });
      }
      body.querySelector('[data-act="add"]').onclick = () => { notes.push('New note...'); save(); render(); };
      render();
    }
  });
};
