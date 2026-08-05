/* DragonOS Applications */
const Apps = {};

/* ---------------- File Explorer ---------------- */
Apps.explorer = function (startPath) {
  WM.open({
    title: 'File Explorer', icon: '📁', appId: 'explorer', width: 640, height: 440,
    onMount(body) {
      let path = startPath || '/';
      body.innerHTML = `
        <div class="explorer">
          <div class="explorer-sidebar">
            <div class="item" data-p="/">🏠 Home</div>
            <div class="item" data-p="/Documents">📄 Documents</div>
            <div class="item" data-p="/Pictures">🖼️ Pictures</div>
            <div class="item" data-p="/Desktop">🖥️ Desktop</div>
            <div class="item" data-p="/Trash">🗑️ Recycle Bin</div>
          </div>
          <div class="explorer-main">
            <div class="app-toolbar">
              <button data-act="up">⬆ Up</button>
              <button data-act="new-folder">📁+ Folder</button>
              <button data-act="new-file">📄+ File</button>
              <button data-act="empty-trash" style="display:none;">🗑️ Empty Recycle Bin</button>
            </div>
            <div class="explorer-path"></div>
            <div class="explorer-grid"></div>
          </div>
        </div>`;
      const grid = body.querySelector('.explorer-grid');
      const pathEl = body.querySelector('.explorer-path');
      const emptyTrashBtn = body.querySelector('[data-act="empty-trash"]');

      function iconFor(name, isDir) {
        if (isDir) return name === 'Trash' ? '🗑️' : '📁';
        if (/\.(txt|md)$/i.test(name)) return '📄';
        if (/\.(png|jpg|jpeg|gif|svg)$/i.test(name)) return '🖼️';
        return '📦';
      }

      function render() {
        const inTrash = path === '/Trash';
        pathEl.textContent = inTrash ? '🗑️ Recycle Bin' : path;
        emptyTrashBtn.style.display = inTrash ? '' : 'none';
        body.querySelector('[data-act="new-folder"]').style.display = inTrash ? 'none' : '';
        body.querySelector('[data-act="new-file"]').style.display = inTrash ? 'none' : '';
        body.querySelectorAll('.explorer-sidebar .item').forEach(it => it.classList.toggle('active', it.dataset.p === path));
        grid.innerHTML = '';
        if (inTrash) {
          const items = DragonFS.listTrash();
          if (!items.length) { grid.innerHTML = '<div style="grid-column:1/-1;color:var(--text-dim);font-size:13px;padding:20px;">Recycle Bin is empty.</div>'; return; }
          items.forEach(({ name, path: full, origin }) => {
            const dir = DragonFS.isDir(full);
            const el = document.createElement('div');
            el.className = 'explorer-item';
            el.innerHTML = `<div class="emoji">${iconFor(name, dir)}</div><div class="label">${name}</div>`;
            el.title = origin ? `Originally: ${origin}` : '';
            el.oncontextmenu = (e) => {
              e.preventDefault();
              OS.showContextMenu(e.clientX, e.clientY, [
                { label: '↩️ Restore', action: () => { DragonFS.restore(name); render(); } },
                { label: '🗑 Delete Permanently', action: () => { if (confirm(`Permanently delete "${name}"?`)) { DragonFS.remove(full); render(); } } }
              ]);
            };
            bindOpen(el, () => { if (confirm(`Restore "${name}" to its original location?`)) { DragonFS.restore(name); render(); } });
            grid.appendChild(el);
          });
          return;
        }
        DragonFS.list(path).forEach(name => {
          const full = (path === '/' ? '' : path) + '/' + name;
          const dir = DragonFS.isDir(full);
          const el = document.createElement('div');
          el.className = 'explorer-item';
          el.innerHTML = `<div class="emoji">${iconFor(name, dir)}</div><div class="label">${name}</div>`;
          bindOpen(el, () => {
            if (dir) { path = full; render(); }
            else if (/\.(png|jpg|jpeg|gif|svg)$/i.test(name)) Apps.imageViewer(full);
            else Apps.textEditor(full);
          });
          el.oncontextmenu = (e) => {
            e.preventDefault();
            const items = [
              { label: '🗑 Move to Recycle Bin', action: () => { DragonFS.trash(full); render(); } },
              { label: '✏️ Rename', action: () => { const n = prompt('New name', name); if (n) { DragonFS.rename(full, n); render(); } } }
            ];
            OS.showContextMenu(e.clientX, e.clientY, items);
          };
          grid.appendChild(el);
        });
      }
      body.querySelectorAll('.explorer-sidebar .item').forEach(it => it.onclick = () => { path = it.dataset.p; render(); });
      body.querySelector('[data-act="up"]').onclick = () => { const p = DragonFS.parentOf(path); if (p) { path = p; render(); } };
      body.querySelector('[data-act="new-folder"]').onclick = () => {
        const n = prompt('Folder name'); if (n) { DragonFS.mkdir((path === '/' ? '' : path) + '/' + n); render(); }
      };
      body.querySelector('[data-act="new-file"]').onclick = () => {
        const n = prompt('File name', 'untitled.txt'); if (n) { DragonFS.touch((path === '/' ? '' : path) + '/' + n); render(); }
      };
      emptyTrashBtn.onclick = () => { if (confirm('Permanently delete everything in the Recycle Bin?')) { DragonFS.emptyTrash(); render(); } };

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
            DragonFS.write((path === '/' ? '' : path) + '/' + f.name, reader.result);
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
    title: path ? DragonFS.nameOf(path) : 'Untitled — Notepad', icon: '📝', width: 560, height: 440,
    onMount(body, winId) {
      body.innerHTML = `
        <div class="app-toolbar">
          <button data-act="save">💾 Save</button>
          <button data-act="save-as">📁 Save As</button>
          <span style="flex:1"></span>
          <span id="status-${winId}" style="font-size:11px;color:var(--text-dim);align-self:center;"></span>
        </div>
        <textarea class="editor-area" spellcheck="false" placeholder="Start typing..."></textarea>`;
      const textarea = body.querySelector('textarea');
      const status = body.querySelector(`#status-${winId}`);
      let currentPath = path || null;
      if (path) textarea.value = DragonFS.read(path) || '';

      function save(newPath) {
        const target = newPath || currentPath;
        if (!target) return saveAs();
        DragonFS.write(target, textarea.value);
        currentPath = target;
        WM.setTitle(winId, DragonFS.nameOf(target));
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
    title: 'Terminal', icon: '⌨️', appId: 'terminal', single: true, width: 560, height: 380,
    onMount(body) {
      body.innerHTML = `<div class="terminal"><div class="output"></div>
        <div class="terminal-input-row"><span class="prompt">dragon@web:~$</span><input autofocus /></div></div>`;
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
      print('DragonOS Terminal — type "help" for commands.');

      const commands = {
        help: () => 'Commands: help, ls, cd, cat, echo, mkdir, touch, rm, pwd, clear, date, whoami, neofetch, open <app>',
        pwd: () => cwd,
        ls: (args) => DragonFS.list(args[0] ? resolve(args[0]) : cwd).join('  ') || '(empty)',
        cd: (args) => {
          const target = args[0] ? resolve(args[0]) : '/';
          if (DragonFS.isDir(target)) { cwd = target; return ''; }
          return 'cd: no such directory: ' + (args[0] || '');
        },
        cat: (args) => {
          if (!args[0]) return 'usage: cat <file>';
          const c = DragonFS.read(resolve(args[0]));
          return c === null ? 'cat: no such file' : c;
        },
        echo: (args) => args.join(' '),
        mkdir: (args) => args[0] ? (DragonFS.mkdir(resolve(args[0])) ? '' : 'mkdir: failed') : 'usage: mkdir <dir>',
        touch: (args) => args[0] ? (DragonFS.touch(resolve(args[0])) ? '' : 'touch: failed') : 'usage: touch <file>',
        rm: (args) => args[0] ? (DragonFS.remove(resolve(args[0])) ? '' : 'rm: failed') : 'usage: rm <path>',
        clear: () => { out.innerHTML = ''; return null; },
        date: () => new Date().toString(),
        whoami: () => 'dragon',
        neofetch: () => `
   🐉  DragonOS
   -----------
   OS: DragonOS Web v1.0
   Host: ${navigator.platform}
   Shell: dragon-sh
   Resolution: ${window.innerWidth}x${window.innerHeight}
   Theme: ${document.documentElement.dataset.theme || 'dark'}`,
        open: (args) => {
          const map = { explorer: Apps.explorer, notepad: Apps.textEditor, settings: Apps.settings, calculator: Apps.calculator, browser: Apps.browser, about: Apps.about };
          if (map[args[0]]) { map[args[0]](); return 'Opening ' + args[0] + '...'; }
          return 'open: unknown app "' + (args[0] || '') + '"';
        }
      };

      function resolve(p) {
        if (p.startsWith('/')) return DragonFS.normalize(p);
        return DragonFS.normalize((cwd === '/' ? '' : cwd) + '/' + p);
      }

      input.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        const raw = input.value;
        print(`dragon@web:${cwd}$ ${raw}`);
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
    title: 'Web Browser', icon: '🌐', width: 720, height: 500,
    onMount(body) {
      body.innerHTML = `
        <div class="app-toolbar">
          <button data-act="back">◀</button>
          <button data-act="fwd">▶</button>
          <button data-act="go">↻</button>
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
Apps.settings = function () {
  WM.open({
    title: 'Settings', icon: '⚙️', appId: 'settings', single: true, width: 480, height: 420,
    onMount(body) {
      body.innerHTML = `
        <div class="settings-nav">
          <button class="active" data-tab="appearance">🎨 Appearance</button>
          <button data-tab="system">🖥️ System</button>
        </div>
        <div class="app-pad" id="settings-content"></div>`;
      const content = body.querySelector('#settings-content');
      const tabs = body.querySelectorAll('.settings-nav button');
      tabs.forEach(t => t.onclick = () => { tabs.forEach(x => x.classList.remove('active')); t.classList.add('active'); render(t.dataset.tab); });

      function render(tab) {
        if (tab === 'appearance') {
          content.innerHTML = `
            <h3 style="margin-top:0">Theme</h3>
            <div class="app-toolbar" style="border:none;padding:0;margin-bottom:14px;">
              <button data-theme="dark">🌙 Dark</button>
              <button data-theme="light">☀️ Light</button>
            </div>
            <h3>Accent Color</h3>
            <div class="swatch-row">
              ${['#ff5f45', '#3e8bff', '#33c17a', '#c14fff', '#ff2e7e', '#ffb000'].map(c => `<div class="swatch" style="background:${c}" data-accent="${c}"></div>`).join('')}
            </div>
            <h3>Wallpaper</h3>
            <div class="wallpaper-row">
              ${OS.wallpapers.map((w, i) => `<div class="wallpaper-thumb" style="background:${w}" data-wp="${i}"></div>`).join('')}
            </div>`;
          content.querySelectorAll('[data-theme]').forEach(b => b.onclick = () => OS.setTheme(b.dataset.theme));
          content.querySelectorAll('[data-accent]').forEach(b => b.onclick = () => OS.setAccent(b.dataset.accent));
          content.querySelectorAll('[data-wp]').forEach(b => b.onclick = () => OS.setWallpaper(parseInt(b.dataset.wp)));
        } else {
          content.innerHTML = `
            <h3 style="margin-top:0">System</h3>
            <p style="font-size:13px;color:var(--text-dim)">DragonOS Web v1.0 — all data stored locally in your browser via localStorage.</p>
            <div class="app-toolbar" style="border:none;padding:0;gap:10px;">
              <button data-act="reset-fs">🗑️ Reset File System</button>
              <button data-act="reset-all">♻️ Reset All Settings</button>
            </div>`;
          content.querySelector('[data-act="reset-fs"]').onclick = () => { if (confirm('Reset all files?')) DragonFS.reset(); };
          content.querySelector('[data-act="reset-all"]').onclick = () => { if (confirm('Reset all DragonOS settings and files?')) { localStorage.clear(); location.reload(); } };
        }
      }
      render('appearance');
    }
  });
};

/* ---------------- Calculator ---------------- */
Apps.calculator = function () {
  WM.open({
    title: 'Calculator', icon: '🧮', appId: 'calculator', single: true, width: 300, height: 420, resizable: false,
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
    title: 'About DragonOS', icon: '🐉', appId: 'about', single: true, width: 380, height: 420, resizable: false,
    onMount(body) {
      body.innerHTML = `
        <div class="about-hero">
          <div class="emoji">🐉</div>
          <h2 style="margin:0">DragonOS</h2>
          <div style="color:var(--text-dim);font-size:13px">Version 1.0 — a web-based operating system</div>
        </div>
        <div class="about-list">
          • Runs entirely in your browser<br/>
          • Files persist via localStorage<br/>
          • Draggable, resizable windows<br/>
          • Built-in Terminal, Notepad, File Explorer, Browser, Calculator<br/>
          • Fully themeable — try Settings ⚙️<br/><br/>
          Built with vanilla HTML, CSS &amp; JavaScript. No frameworks, no build step.
        </div>`;
    }
  });
};

/* ---------------- Photos / Gallery ---------------- */
Apps.photos = function () {
  WM.open({
    title: 'Photos', icon: '🖼️', appId: 'photos', single: true, width: 520, height: 400,
    onMount(body) {
      const wallpapers = OS.wallpapers;
      body.innerHTML = `<div class="gallery">${wallpapers.map((w, i) => `<div class="card" style="background:${w}"><span>Wallpaper ${i + 1}</span></div>`).join('')}</div>`;
      body.querySelectorAll('.card').forEach((c, i) => c.onclick = () => OS.setWallpaper(i));
    }
  });
};

/* ---------------- Sticky Notes ---------------- */
Apps.notes = function () {
  WM.open({
    title: 'Sticky Notes', icon: '🗒️', appId: 'notes', single: true, width: 340, height: 440,
    onMount(body) {
      body.innerHTML = `<div class="app-toolbar"><button data-act="add">+ New note</button></div><div class="notes-list"></div>`;
      const list = body.querySelector('.notes-list');
      const KEY = 'dragonos_notes_v1';
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
