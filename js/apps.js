const Apps = {};

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

Apps.browser = function () {
  const HOME = 'https://en.wikipedia.org/wiki/Special:Random';
  WM.open({
    title: 'Web Browser', icon: 'browser', appId: 'browser', width: 760, height: 520,
    onMount(body) {
      body.innerHTML = `
        <div class="app-toolbar">
          <button data-act="back" title="Back">${Icons.inline('chevronLeft')}</button>
          <button data-act="fwd" title="Forward">${Icons.inline('chevronRight')}</button>
          <button data-act="reload" title="Reload">${Icons.inline('refresh')}</button>
          <button data-act="home" title="Home">${Icons.inline('home')}</button>
          <input type="text" value="${HOME}" placeholder="Search or enter a URL" />
          <button data-act="open-new" title="Open in a new browser tab">${Icons.inline('folder-open')}</button>
        </div>
        <div class="browser-status" data-role="status" style="display:none;"></div>
        <div class="browser-blocked" data-role="blocked" style="display:none;">
          <div class="browser-blocked-card">
            <div class="browser-blocked-title">This site can't be shown here</div>
            <div class="browser-blocked-sub">It blocks embedding in other pages (a security setting most major sites use). Open it in a real browser tab instead.</div>
            <button data-act="blocked-open-new">Open in a new browser tab</button>
          </div>
        </div>
        <iframe style="width:100%;height:calc(100% - 46px);border:none;background:#fff;"></iframe>`;

      const iframe = body.querySelector('iframe');
      const urlInput = body.querySelector('input');
      const statusEl = body.querySelector('[data-role="status"]');
      const blockedEl = body.querySelector('[data-role="blocked"]');
      let history = [], historyIndex = -1, slowTimer = null;

      const KNOWN_BLOCKED = [
        'google.com', 'youtube.com', 'facebook.com', 'instagram.com', 'twitter.com', 'x.com',
        'amazon.com', 'netflix.com', 'linkedin.com', 'reddit.com', 'github.com', 'twitch.tv',
        'apple.com', 'microsoft.com', 'spotify.com', 'discord.com', 'tiktok.com', 'pinterest.com',
        'duckduckgo.com', 'bing.com', 'startpage.com', 'ecosia.org', 'qwant.com'
      ];

      function normalize(raw) {
        const v = raw.trim();
        if (!v) return HOME;
        if (/^https?:\/\//i.test(v)) return v;
        if (/^[\w-]+(\.[\w-]+)+([/?#].*)?$/.test(v)) return 'https://' + v;
        return 'https://marginalia-search.com/search?query=' + encodeURIComponent(v) + '&profile=default';
      }

      function isKnownBlocked(url) {
        try {
          const host = new URL(url).hostname.replace(/^www\./, '');
          return KNOWN_BLOCKED.some(d => host === d || host.endsWith('.' + d));
        } catch { return false; }
      }

      function setStatus(text) {
        statusEl.textContent = text;
        statusEl.style.display = text ? '' : 'none';
      }

      function showBlocked(show) {
        blockedEl.style.display = show ? '' : 'none';
        iframe.style.display = show ? 'none' : '';
      }

      function goTo(url, pushHistory) {
        clearTimeout(slowTimer);
        urlInput.value = url;

        if (isKnownBlocked(url)) {
          setStatus('');
          showBlocked(true);
          iframe.src = 'about:blank';
        } else {
          showBlocked(false);
          setStatus('Loading…');
          iframe.src = url;
          slowTimer = setTimeout(() => setStatus('Taking a while — this site may block being embedded. Try "Open in a new browser tab" →'), 4000);
        }

        if (pushHistory !== false) {
          history = history.slice(0, historyIndex + 1);
          history.push(url);
          historyIndex = history.length - 1;
        }
      }

      iframe.addEventListener('load', () => { clearTimeout(slowTimer); setStatus(''); });

      body.querySelector('[data-act="reload"]').onclick = () => goTo(history[historyIndex] || urlInput.value, false);
      body.querySelector('[data-act="home"]').onclick = () => goTo(HOME);
      body.querySelector('[data-act="back"]').onclick = () => { if (historyIndex > 0) { historyIndex--; goTo(history[historyIndex], false); } };
      body.querySelector('[data-act="fwd"]').onclick = () => { if (historyIndex < history.length - 1) { historyIndex++; goTo(history[historyIndex], false); } };
      body.querySelector('[data-act="open-new"]').onclick = () => window.open(urlInput.value, '_blank', 'noopener');
      body.querySelector('[data-act="blocked-open-new"]').onclick = () => window.open(urlInput.value, '_blank', 'noopener');
      urlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') goTo(normalize(urlInput.value)); });

      goTo(HOME);
    }
  });
};

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
                ${OS.wallpapers.map((_, i) => `<div class="wallpaper-thumb" style="background:${OS.wallpaperCss(i)}" data-wp="${i}" title="${OS.wallpaperName(i)}"></div>`).join('')}
                ${OS.prefs.customWallpaper ? `
                  <div class="wallpaper-thumb wallpaper-thumb-custom active" style="background-image:url(${OS.prefs.customWallpaper})" data-wp-custom="1" title="Your uploaded image">
                    <button class="wallpaper-thumb-remove" data-act="clear-wp" title="Remove custom image">${Icons.inline('close')}</button>
                  </div>` : `
                  <div class="wallpaper-thumb wallpaper-thumb-add" data-act="upload-wp" title="Upload a custom image">${Icons.inline('upload')}</div>`}
              </div>
              <input type="file" accept="image/*" data-role="wp-file" style="display:none" />
              <div class="label-sub" data-role="wp-hint" style="margin-top:8px;">${OS.prefs.customWallpaper ? 'Custom image in use. Pick a track above, or remove it, to go back to a track wallpaper.' : 'Click the tile above or drag & drop an image onto it. Large images are resized automatically.'}</div>
              <div class="settings-error" data-role="wp-error" style="display:none;"></div>
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

          const wpErrorEl = content.querySelector('[data-role="wp-error"]');
          function wpError(msg) { wpErrorEl.textContent = msg; wpErrorEl.style.display = msg ? '' : 'none'; }

          function resizeImage(file, maxDim, quality) {
            return new Promise((resolve, reject) => {
              const img = new Image();
              const url = URL.createObjectURL(file);
              img.onload = () => {
                URL.revokeObjectURL(url);
                const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
                const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
                const canvas = document.createElement('canvas');
                canvas.width = w; canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL('image/jpeg', quality));
              };
              img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that image')); };
              img.src = url;
            });
          }

          function handleWpFile(f) {
            wpError('');
            if (!f) return;
            if (!f.type.startsWith('image/')) { wpError('That file isn\'t an image.'); return; }
            resizeImage(f, 2400, 0.85).then(dataUrl => {
              if (!OS.setCustomWallpaper(dataUrl)) { wpError('Image is too large to save — try a smaller one.'); return; }
              render('appearance');
            }).catch(() => wpError('Could not read that image.'));
          }

          const wpFile = content.querySelector('[data-role="wp-file"]');
          wpFile.addEventListener('change', () => handleWpFile(wpFile.files[0]));

          const addTile = content.querySelector('[data-act="upload-wp"]');
          if (addTile) {
            addTile.onclick = () => wpFile.click();
            addTile.addEventListener('dragover', (e) => { e.preventDefault(); addTile.classList.add('drag-over'); });
            addTile.addEventListener('dragleave', () => addTile.classList.remove('drag-over'));
            addTile.addEventListener('drop', (e) => {
              e.preventDefault(); addTile.classList.remove('drag-over');
              handleWpFile(e.dataTransfer.files[0]);
            });
          }
          const clearWp = content.querySelector('[data-act="clear-wp"]');
          if (clearWp) clearWp.onclick = (e) => { e.stopPropagation(); OS.setWallpaper(OS.prefs.wallpaper || 0); render('appearance'); };
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
          const user = Auth.currentUser();
          const profile = Auth.currentProfile();
          let authBlock;
          if (!Auth.configured()) {
            authBlock = `
              <div class="settings-card">
                <div class="label-title">Accounts not set up yet</div>
                <div class="label-sub" style="margin-top:4px;">Add your Supabase project URL and anon key to js/supabase-config.js to enable sign-in and favorite teams.</div>
              </div>`;
          } else if (!user) {
            authBlock = `
              <div class="settings-card">
                <div class="label-title" style="margin-bottom:10px;">Sign in</div>
                <div style="display:flex;flex-direction:column;gap:8px;max-width:280px;">
                  <input type="email" data-role="email" placeholder="Email" />
                  <input type="password" data-role="password" placeholder="Password" />
                  <div style="display:flex;gap:8px;">
                    <button data-act="signin">${Icons.inline('person')}<span>Sign In</span></button>
                    <button data-act="signup">${Icons.inline('edit')}<span>Create Account</span></button>
                  </div>
                  <div class="auth-divider">or</div>
                  <button class="btn-google" data-act="google" type="button">${Icons.googleButton()}<span>Continue with Google</span></button>
                  <div class="label-sub" data-role="auth-msg"></div>
                </div>
              </div>`;
          } else {
            const currentTeamId = profile && profile.favorite_team;
            authBlock = `
              <div class="settings-card">
                <div class="settings-row">
                  <div class="label-group"><div class="label-title">Signed in</div><div class="label-sub">${user.email}</div></div>
                  <button data-act="signout">${Icons.inline('close')}<span>Sign Out</span></button>
                </div>
              </div>
              <div class="settings-card">
                <div class="label-title" style="margin-bottom:10px;">Favorite Team</div>
                <div class="label-sub" style="margin-bottom:10px;">Sets your accent color, wallpaper livery, and the Next Race car. Drag to reorder.</div>
                <div class="swatch-row" data-role="team-row" style="flex-wrap:wrap;gap:10px;">
                  ${OS.orderedTeams().map(t => `
                    <div class="team-pick${t.id === currentTeamId ? ' active' : ''}" data-team="${t.id}" draggable="true" style="display:flex;flex-direction:column;align-items:center;gap:5px;cursor:grab;width:78px;">
                      <div class="swatch" style="background:${t.accent};width:34px;height:34px;${t.id === currentTeamId ? 'border-color:#fff;' : ''}"></div>
                      <span style="font-size:11px;color:var(--text-dim);text-align:center;">${t.name}</span>
                    </div>`).join('')}
                </div>
              </div>
              <div class="settings-card">
                <div class="settings-row">
                  <div class="label-group"><div class="label-title">Delete Account</div><div class="label-sub">Permanently deletes your account and profile. This can't be undone.</div></div>
                  <button data-act="delete-account">${Icons.inline('trash')}<span>Delete Account</span></button>
                </div>
                <div class="label-sub" data-role="delete-msg"></div>
              </div>`;
          }
          content.innerHTML = `
            <div class="settings-section-title">Account</div>
            <div class="settings-section-desc">Personalize your FormulaOS profile.</div>
            <div class="settings-card">
              <div class="settings-row">
                <div class="label-group"><div class="label-title">Display Name</div><div class="label-sub">Shown in the Start Menu</div></div>
                <input type="text" data-role="username" value="${OS.prefs.username}" style="width:160px;" />
              </div>
            </div>
            ${authBlock}`;
          const input = content.querySelector('[data-role="username"]');
          input.addEventListener('change', () => OS.setUsername(input.value.trim()));

          if (Auth.configured() && !user) {
            const msg = content.querySelector('[data-role="auth-msg"]');
            const runAuth = (fn) => async () => {
              const email = content.querySelector('[data-role="email"]').value.trim();
              const password = content.querySelector('[data-role="password"]').value;
              msg.textContent = '';
              try { await fn(email, password); msg.textContent = 'Check your inbox to confirm, then sign in.'; render('account'); }
              catch (e) { msg.textContent = e.message || 'Something went wrong.'; }
            };
            content.querySelector('[data-act="signin"]').onclick = async () => {
              const email = content.querySelector('[data-role="email"]').value.trim();
              const password = content.querySelector('[data-role="password"]').value;
              try { await Auth.signIn(email, password); render('account'); }
              catch (e) { msg.textContent = e.message || 'Sign in failed.'; }
            };
            content.querySelector('[data-act="signup"]').onclick = runAuth(Auth.signUp);
            content.querySelector('[data-act="google"]').onclick = async () => {
              msg.textContent = '';
              try { await Auth.signInWithGoogle(); }
              catch (e) { msg.textContent = e.message || 'Google sign-in failed.'; }
            };
          } else if (user) {
            content.querySelector('[data-act="signout"]').onclick = async () => { await Auth.signOut(); render('account'); };
            content.querySelector('[data-act="delete-account"]').onclick = async () => {
              if (!confirm('Permanently delete your FormulaOS account? This cannot be undone.')) return;
              const msg = content.querySelector('[data-role="delete-msg"]');
              try { await Auth.deleteAccount(); render('account'); }
              catch (e) { msg.textContent = e.message || 'Could not delete account.'; }
            };
            let dragId = null;
            content.querySelectorAll('.team-pick').forEach(el => {
              el.onclick = async () => {
                const team = teamById(el.dataset.team);
                if (team) OS.morphToTeam(team);
                await Auth.setFavoriteTeam(el.dataset.team);
                render('account');
              };
              el.addEventListener('dragstart', () => { dragId = el.dataset.team; el.style.opacity = '.4'; });
              el.addEventListener('dragend', () => { el.style.opacity = ''; });
              el.addEventListener('dragover', (e) => e.preventDefault());
              el.addEventListener('drop', (e) => {
                e.preventDefault();
                if (!dragId || dragId === el.dataset.team) return;
                const order = OS.orderedTeams().map(t => t.id);
                const from = order.indexOf(dragId), to = order.indexOf(el.dataset.team);
                order.splice(to, 0, order.splice(from, 1)[0]);
                OS.setTeamOrder(order);
                render('account');
              });
            });
          }
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

Apps.photos = function () {
  WM.open({
    title: 'Photos', icon: 'photos', appId: 'photos', single: true, width: 520, height: 400,
    onMount(body) {
      const wallpapers = OS.wallpapers;
      body.innerHTML = `<div class="gallery">${wallpapers.map((_, i) => `<div class="card" style="background:${OS.wallpaperCss(i)}"><span>${OS.wallpaperName(i)}</span></div>`).join('')}</div>`;
      body.querySelectorAll('.card').forEach((c, i) => c.onclick = () => OS.setWallpaper(i));
    }
  });
};

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

Apps.imageViewer = function (path) {
  WM.open({
    title: path ? FormulaFS.nameOf(path) : 'Image Viewer', icon: 'photos', width: 520, height: 420,
    onMount(body) {
      const data = path ? FormulaFS.read(path) : null;
      body.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:repeating-conic-gradient(#00000022 0% 25%, transparent 0% 50%) 50%/24px 24px;overflow:auto;">
        ${data ? `<img src="${data}" style="max-width:100%;max-height:100%;object-fit:contain;box-shadow:0 10px 30px rgba(0,0,0,.4);" />` : '<div style="color:var(--text-dim)">No image</div>'}
      </div>`;
    }
  });
};

Apps.paint = function () {
  WM.open({
    title: 'Paint', icon: 'paint', appId: 'paint', width: 620, height: 480,
    onMount(body) {
      body.innerHTML = `
        <div class="app-toolbar">
          <input type="color" value="#ff5f45" data-role="color" style="width:34px;height:30px;padding:0;border:none;background:none;cursor:pointer;" />
          <select data-role="size"><option value="2">Thin</option><option value="5" selected>Medium</option><option value="12">Thick</option></select>
          <button data-act="clear">${Icons.inline('trash')}<span>Clear</span></button>
          <button data-act="save">${Icons.inline('save')}<span>Save to Pictures</span></button>
        </div>
        <canvas style="width:100%;height:calc(100% - 46px);touch-action:none;cursor:crosshair;background:#fff;"></canvas>`;
      const canvas = body.querySelector('canvas');
      const ctx = canvas.getContext('2d');
      function fit() {
        const rect = canvas.getBoundingClientRect();
        const prev = canvas.width ? canvas.toDataURL() : null;
        canvas.width = rect.width; canvas.height = rect.height;
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        if (prev) { const img = new Image(); img.onload = () => ctx.drawImage(img, 0, 0); img.src = prev; }
      }
      requestAnimationFrame(fit);
      window.addEventListener('resize', fit);

      const colorInput = body.querySelector('[data-role="color"]');
      const sizeSelect = body.querySelector('[data-role="size"]');
      let drawing = false, lastX = 0, lastY = 0;

      function pos(e) {
        const rect = canvas.getBoundingClientRect();
        const t = e.touches ? e.touches[0] : e;
        return { x: t.clientX - rect.left, y: t.clientY - rect.top };
      }
      function start(e) { e.preventDefault(); drawing = true; const p = pos(e); lastX = p.x; lastY = p.y; }
      function move(e) {
        if (!drawing) return;
        e.preventDefault();
        const p = pos(e);
        ctx.strokeStyle = colorInput.value;
        ctx.lineWidth = parseInt(sizeSelect.value);
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(lastX, lastY); ctx.lineTo(p.x, p.y); ctx.stroke();
        lastX = p.x; lastY = p.y;
      }
      function end() { drawing = false; }
      canvas.addEventListener('mousedown', start);
      canvas.addEventListener('mousemove', move);
      window.addEventListener('mouseup', end);
      canvas.addEventListener('touchstart', start, { passive: false });
      canvas.addEventListener('touchmove', move, { passive: false });
      canvas.addEventListener('touchend', end);

      body.querySelector('[data-act="clear"]').onclick = () => { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height); };
      body.querySelector('[data-act="save"]').onclick = () => {
        const name = prompt('Save as (in /Pictures):', 'painting.png');
        if (name) { FormulaFS.write('/Pictures/' + name.replace(/[^\w.\-]/g, '_'), canvas.toDataURL()); alert('Saved to /Pictures'); }
      };
    }
  });
};

Apps.mediaPlayer = function (path) {
  WM.open({
    title: 'Media Player', icon: 'media', width: 480, height: 380,
    onMount(body) {
      body.innerHTML = `
        <div class="app-toolbar"><button data-act="open">${Icons.inline('folder-open')}<span>Open file…</span></button><input type="file" accept="audio/*,video/*" style="display:none" /></div>
        <div style="height:calc(100% - 46px);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px;padding:14px;">
          <video style="max-width:100%;max-height:100%;display:none;border-radius:8px;" controls></video>
          <div class="audio-art" style="width:60px;height:60px;display:none;">${Icons.svg('music')}</div>
          <audio style="width:100%;display:none;" controls></audio>
          <div class="mp-empty" style="color:var(--text-dim);font-size:13px;">No media loaded — open a local audio or video file.</div>
        </div>`;
      const fileInput = body.querySelector('input[type=file]');
      const video = body.querySelector('video');
      const audio = body.querySelector('audio');
      const art = body.querySelector('.audio-art');
      const empty = body.querySelector('.mp-empty');
      body.querySelector('[data-act="open"]').onclick = () => fileInput.click();
      fileInput.addEventListener('change', () => {
        const f = fileInput.files[0];
        if (!f) return;
        const url = URL.createObjectURL(f);
        empty.style.display = 'none';
        if (f.type.startsWith('video')) {
          video.src = url; video.style.display = 'block'; audio.style.display = 'none'; art.style.display = 'none';
          video.play();
        } else {
          audio.src = url; audio.style.display = 'block'; art.style.display = 'block'; video.style.display = 'none';
          audio.play();
        }
      });
    }
  });
};

Apps.calendar = function () {
  WM.open({
    title: 'Calendar', icon: 'calendar', appId: 'calendar', single: true, width: 400, height: 420,
    onMount(body) {
      let view = new Date();
      body.innerHTML = `
        <div class="app-toolbar">
          <button data-act="prev">◀</button>
          <span style="flex:1;text-align:center;font-weight:600;" class="cal-title"></span>
          <button data-act="next">▶</button>
        </div>
        <div class="app-pad cal-grid-wrap"></div>`;
      const wrap = body.querySelector('.cal-grid-wrap');
      const title = body.querySelector('.cal-title');
      function render() {
        const y = view.getFullYear(), m = view.getMonth();
        title.textContent = view.toLocaleDateString([], { month: 'long', year: 'numeric' });
        const first = new Date(y, m, 1);
        const startDay = first.getDay();
        const daysInMonth = new Date(y, m + 1, 0).getDate();
        const today = new Date();
        let html = '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;font-size:11px;">';
        ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach(d => html += `<div style="text-align:center;color:var(--text-dim);font-weight:700;">${d}</div>`);
        for (let i = 0; i < startDay; i++) html += '<div></div>';
        for (let d = 1; d <= daysInMonth; d++) {
          const isToday = d === today.getDate() && m === today.getMonth() && y === today.getFullYear();
          html += `<div style="text-align:center;padding:8px 0;border-radius:8px;${isToday ? 'background:var(--accent);color:#fff;font-weight:700;' : ''}">${d}</div>`;
        }
        html += '</div>';
        wrap.innerHTML = html;
      }
      body.querySelector('[data-act="prev"]').onclick = () => { view.setMonth(view.getMonth() - 1); render(); };
      body.querySelector('[data-act="next"]').onclick = () => { view.setMonth(view.getMonth() + 1); render(); };
      render();
    }
  });
};

Apps.weather = function () {
  WM.open({
    title: 'Weather', icon: 'weather', appId: 'weather', single: true, width: 320, height: 380, resizable: false,
    onMount(body) {
      const conditions = [
        { icon: 'sun', label: 'Sunny', temp: 78 },
        { icon: 'weather', label: 'Partly Cloudy', temp: 68 },
        { icon: 'cloud-rain', label: 'Rainy', temp: 58 },
        { icon: 'snowflake', label: 'Snowy', temp: 29 },
      ];
      const c = conditions[Math.floor((new Date().getDate()) % conditions.length)];
      body.innerHTML = `
        <div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;background:linear-gradient(160deg,#2a6ba8,#7ec8e3);color:#fff;text-align:center;">
          <div style="width:72px;height:72px;">${Icons.svg(c.icon)}</div>
          <div style="font-size:44px;font-weight:200;">${c.temp}°F</div>
          <div style="font-size:14px;opacity:.85;">${c.label} · Monaco</div>
          <div style="font-size:11px;opacity:.6;margin-top:12px;">Demo data — no live network calls</div>
        </div>`;
    }
  });
};

Apps.taskManager = function () {
  WM.open({
    title: 'Task Manager', icon: 'taskmgr', appId: 'taskmgr', single: true, width: 380, height: 400,
    onMount(body) {
      body.innerHTML = `<div class="app-toolbar"><button data-act="refresh">${Icons.inline('refresh')}<span>Refresh</span></button></div><div class="tm-list app-pad"></div>`;
      const list = body.querySelector('.tm-list');
      function render() {
        list.innerHTML = '';
        if (WM.registry.size === 0) { list.innerHTML = '<div style="color:var(--text-dim);font-size:13px;">No running apps.</div>'; return; }
        WM.registry.forEach((w, id) => {
          const row = document.createElement('div');
          row.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px;border-bottom:1px solid var(--border);font-size:13px;';
          row.innerHTML = `${Icons.inline(w.meta.icon || 'file', 'tm-icon')}<span style="flex:1">${w.meta.title}</span><button data-id="${id}" style="background:#ff5f57;border:none;color:#fff;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:11px;">End Task</button>`;
          row.querySelector('button').onclick = () => { WM.close(id); render(); };
          list.appendChild(row);
        });
      }
      body.querySelector('[data-act="refresh"]').onclick = render;
      render();
    }
  });
};

Apps.snake = function () {
  WM.open({
    title: 'Track Racer', icon: 'snake', width: 360, height: 420, resizable: false,
    onMount(body) {
      body.innerHTML = `
        <div class="app-toolbar"><span style="align-self:center;font-size:12px;">Score: <b class="score">0</b></span><span style="flex:1"></span><button data-act="restart">${Icons.inline('refresh')}<span>Restart</span></button></div>
        <div style="display:flex;align-items:center;justify-content:center;height:calc(100% - 46px);background:#0c0714;">
          <canvas width="300" height="300" style="touch-action:none;"></canvas>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,44px);grid-template-rows:repeat(2,40px);gap:4px;justify-content:center;padding:8px 0;">
          <div></div><button data-dir="up" style="grid-column:2;">${Icons.inline('chevronUp')}</button><div></div>
          <button data-dir="left">${Icons.inline('chevronLeft')}</button><button data-dir="down">${Icons.inline('chevronDown')}</button><button data-dir="right">${Icons.inline('chevronRight')}</button>
        </div>`;
      const canvas = body.querySelector('canvas');
      const ctx = canvas.getContext('2d');
      const scoreEl = body.querySelector('.score');
      const cell = 15, cols = 20;
      let snake, dir, food, score, timer, alive;

      function reset() {
        snake = [{ x: 10, y: 10 }];
        dir = { x: 1, y: 0 };
        placeFood();
        score = 0; alive = true;
        scoreEl.textContent = 0;
        clearInterval(timer);
        timer = setInterval(tick, 130);
      }
      function placeFood() { food = { x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * cols) }; }
      function tick() {
        if (!alive) return;
        const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
        if (head.x < 0 || head.y < 0 || head.x >= cols || head.y >= cols || snake.some(s => s.x === head.x && s.y === head.y)) {
          alive = false; clearInterval(timer); draw(); return;
        }
        snake.unshift(head);
        if (head.x === food.x && head.y === food.y) { score++; scoreEl.textContent = score; placeFood(); }
        else snake.pop();
        draw();
      }
      function draw() {
        ctx.fillStyle = '#0c0714'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ff5f45';
        ctx.fillRect(food.x * cell, food.y * cell, cell - 1, cell - 1);
        snake.forEach((s, i) => {
          ctx.fillStyle = i === 0 ? '#ffd36e' : '#7ee08a';
          ctx.fillRect(s.x * cell, s.y * cell, cell - 1, cell - 1);
        });
        if (!alive) {
          ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#fff'; ctx.font = '20px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
        }
      }
      function setDir(x, y) { if (dir.x !== -x || dir.y !== -y) dir = { x, y }; }
      body.querySelectorAll('[data-dir]').forEach(btn => btn.onclick = () => {
        const d = btn.dataset.dir;
        if (d === 'up') setDir(0, -1); if (d === 'down') setDir(0, 1); if (d === 'left') setDir(-1, 0); if (d === 'right') setDir(1, 0);
      });
      const keyHandler = (e) => {
        if (e.key === 'ArrowUp') setDir(0, -1);
        if (e.key === 'ArrowDown') setDir(0, 1);
        if (e.key === 'ArrowLeft') setDir(-1, 0);
        if (e.key === 'ArrowRight') setDir(1, 0);
      };
      document.addEventListener('keydown', keyHandler);
      body.querySelector('[data-act="restart"]').onclick = reset;
      reset();

      const obs = new MutationObserver(() => { if (!document.body.contains(canvas)) { clearInterval(timer); document.removeEventListener('keydown', keyHandler); obs.disconnect(); } });
      obs.observe(document.body, { childList: true, subtree: true });
    }
  });
};

Apps.trackAtlas = function () {
  WM.open({
    title: 'Track Atlas', icon: 'trackatlas', appId: 'trackatlas', width: 720, height: 520,
    onMount(body) {
      const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const races = OS.raceCalendar();
      const next = OS.nextRace();

      body.innerHTML = `
        <div class="explorer">
          <div class="explorer-sidebar" style="width:200px;display:flex;flex-direction:column;">
            <input type="text" data-role="ta-search" placeholder="Search circuits…"
              style="width:100%;margin-bottom:8px;padding:7px 9px;border-radius:7px;background:rgba(255,255,255,.08);border:1px solid var(--border);color:var(--text);font-size:12px;box-sizing:border-box;" />
            <div data-role="ta-list" style="overflow-y:auto;flex:1;"></div>
          </div>
          <div class="explorer-main app-pad" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;">
            <div data-role="ta-track" style="width:260px;height:260px;"></div>
            <div style="text-align:center;">
              <div style="font-size:17px;font-weight:800;" data-role="ta-name"></div>
              <div style="font-size:12.5px;color:var(--text-dim);margin-top:2px;" data-role="ta-circuit"></div>
              <div style="font-size:11.5px;color:var(--text-dim);margin-top:8px;display:flex;align-items:center;justify-content:center;gap:5px;" data-role="ta-date"></div>
            </div>
          </div>
        </div>`;

      const listEl = body.querySelector('[data-role="ta-list"]');
      const trackEl = body.querySelector('[data-role="ta-track"]');
      const nameEl = body.querySelector('[data-role="ta-name"]');
      const circuitEl = body.querySelector('[data-role="ta-circuit"]');
      const dateEl = body.querySelector('[data-role="ta-date"]');

      function select(race) {
        trackEl.innerHTML = Wallpaper.circuitSvg(race.track, 'var(--accent)');
        nameEl.textContent = race.name;
        circuitEl.textContent = race.circuit;
        dateEl.innerHTML = race.track === next.track
          ? `${Icons.inline('flag')}<span>Next race on the calendar</span>`
          : `<span>${MONTHS[race.month]} ${race.day}</span>`;
        listEl.querySelectorAll('.item').forEach(it => it.classList.toggle('active', it.dataset.track === race.track));
      }

      function renderList(filter) {
        const filtered = races.filter(r => !filter || r.name.toLowerCase().includes(filter.toLowerCase()) || r.circuit.toLowerCase().includes(filter.toLowerCase()));
        listEl.innerHTML = filtered.map(r => `<div class="item" data-track="${r.track}">${r.name.replace(' Grand Prix', '')}</div>`).join('')
          || '<div style="padding:10px;font-size:12px;color:var(--text-dim);">No circuits match.</div>';
        listEl.querySelectorAll('.item').forEach(it => it.onclick = () => select(races.find(r => r.track === it.dataset.track)));
      }

      renderList('');
      select(next);
      body.querySelector('[data-role="ta-search"]').addEventListener('input', (e) => renderList(e.target.value));
    }
  });
};

Apps.pitStrategy = function () {
  WM.open({
    title: 'Pit Strategy', icon: 'pitstrategy', appId: 'pitstrategy', width: 660, height: 580,
    onMount(body) {
      const COMPOUNDS = {
        soft: { label: 'Soft', color: '#e10600', base: 90.0, deg: 0.090 },
        medium: { label: 'Medium', color: '#ffd23f', base: 91.0, deg: 0.055 },
        hard: { label: 'Hard', color: '#e7e2da', base: 92.2, deg: 0.030 }
      };
      const PIT_LOSS = 22;
      let totalLaps = 56;
      let stints = [{ compound: 'medium', laps: 28 }, { compound: 'hard', laps: 28 }];

      body.innerHTML = `
        <div class="app-pad" style="display:flex;flex-direction:column;gap:12px;height:100%;box-sizing:border-box;overflow-y:auto;">
          <div style="display:flex;align-items:center;gap:10px;">
            <label style="font-size:12.5px;color:var(--text-dim);">Race Distance</label>
            <input type="number" data-role="ps-laps" min="10" max="80" value="${totalLaps}"
              style="width:64px;padding:6px 8px;border-radius:6px;background:rgba(255,255,255,.08);border:1px solid var(--border);color:var(--text);" />
            <span style="font-size:12.5px;color:var(--text-dim);">laps</span>
            <span style="flex:1"></span>
            <span data-role="ps-remaining" style="font-size:12px;color:var(--text-dim);font-variant-numeric:tabular-nums;"></span>
          </div>

          <div data-role="ps-stints" style="display:flex;flex-direction:column;gap:7px;"></div>

          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
            <select data-role="ps-add-compound" style="padding:7px 8px;border-radius:6px;background:rgba(255,255,255,.08);border:1px solid var(--border);color:var(--text);">
              ${Object.entries(COMPOUNDS).map(([k, c]) => `<option value="${k}">${c.label}</option>`).join('')}
            </select>
            <input type="number" data-role="ps-add-laps" min="1" value="10"
              style="width:64px;padding:7px 8px;border-radius:6px;background:rgba(255,255,255,.08);border:1px solid var(--border);color:var(--text);" />
            <button data-act="ps-add">${Icons.inline('edit')}<span>Add Stint</span></button>
            <span style="flex:1"></span>
            <button data-act="ps-run" style="background:var(--accent);color:#fff;border:none;">${Icons.inline('refresh')}<span>Simulate</span></button>
          </div>

          <canvas data-role="ps-canvas" width="600" height="140" style="width:100%;height:140px;background:rgba(255,255,255,.04);border-radius:8px;"></canvas>

          <div style="font-size:11px;color:var(--text-dim);display:flex;gap:14px;">
            ${Object.entries(COMPOUNDS).map(([k, c]) => `<span style="display:flex;align-items:center;gap:5px;"><span style="width:9px;height:9px;border-radius:50%;background:${c.color};display:inline-block;"></span>${c.label}</span>`).join('')}
          </div>

          <div data-role="ps-results" style="display:flex;flex-direction:column;gap:6px;"></div>
        </div>`;

      const stintsEl = body.querySelector('[data-role="ps-stints"]');
      const remainingEl = body.querySelector('[data-role="ps-remaining"]');
      const lapsInput = body.querySelector('[data-role="ps-laps"]');
      const canvas = body.querySelector('[data-role="ps-canvas"]');
      const ctx = canvas.getContext('2d');
      const resultsEl = body.querySelector('[data-role="ps-results"]');

      function simulate(strategy) {
        let time = 0;
        const lapTimes = [];
        strategy.forEach((stint, si) => {
          for (let i = 0; i < stint.laps; i++) {
            const lt = COMPOUNDS[stint.compound].base + COMPOUNDS[stint.compound].deg * i;
            time += lt;
            lapTimes.push({ t: lt, compound: stint.compound });
          }
          if (si < strategy.length - 1) time += PIT_LOSS;
        });
        return { time, lapTimes, stops: strategy.length - 1 };
      }

      function fmt(sec) {
        const m = Math.floor(sec / 60);
        return `${m}:${(sec - m * 60).toFixed(1).padStart(4, '0')}`;
      }

      function renderStints() {
        const used = stints.reduce((s, x) => s + x.laps, 0);
        remainingEl.textContent = `${used} / ${totalLaps} laps assigned` + (used === totalLaps ? ' ✓' : '');
        remainingEl.style.color = used === totalLaps ? 'var(--text-dim)' : 'var(--accent)';
        stintsEl.innerHTML = stints.map((s, i) => `
          <div style="display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.05);border:1px solid var(--border);border-radius:8px;padding:7px 10px;">
            <span style="width:10px;height:10px;border-radius:50%;background:${COMPOUNDS[s.compound].color};flex:none;"></span>
            <span style="width:64px;font-size:12.5px;">${COMPOUNDS[s.compound].label}</span>
            <input type="number" min="1" data-i="${i}" data-role="ps-stint-laps" value="${s.laps}"
              style="width:56px;padding:4px 6px;border-radius:6px;background:rgba(255,255,255,.08);border:1px solid var(--border);color:var(--text);" />
            <span style="font-size:11.5px;color:var(--text-dim);">laps</span>
            <span style="flex:1"></span>
            <button data-act="ps-remove" data-i="${i}" style="background:none;border:none;color:var(--text-dim);cursor:pointer;padding:4px;">${Icons.inline('close')}</button>
          </div>`).join('') || '<div style="font-size:12px;color:var(--text-dim);">No stints yet — add one below.</div>';
        stintsEl.querySelectorAll('[data-role="ps-stint-laps"]').forEach(inp => {
          inp.onchange = () => { stints[+inp.dataset.i].laps = Math.max(1, parseInt(inp.value) || 1); renderStints(); };
        });
        stintsEl.querySelectorAll('[data-act="ps-remove"]').forEach(btn => {
          btn.onclick = () => { stints.splice(+btn.dataset.i, 1); renderStints(); };
        });
      }

      function draw(result) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const w = canvas.width, h = canvas.height, pad = 12;
        const times = result.lapTimes.map(l => l.t);
        const maxT = Math.max(...times), minT = Math.min(...times);
        const n = times.length;
        if (n < 2) return;
        result.lapTimes.forEach((l, i) => {
          const x = pad + (w - pad * 2) * (i / (n - 1));
          const y = h - pad - (h - pad * 2) * ((l.t - minT) / ((maxT - minT) || 1));
          ctx.fillStyle = COMPOUNDS[l.compound].color;
          ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
        });
      }

      function run() {
        const used = stints.reduce((s, x) => s + x.laps, 0);
        if (used !== totalLaps || stints.length === 0) {
          resultsEl.innerHTML = `<div style="font-size:12.5px;color:var(--accent);">Stints must add up to exactly ${totalLaps} laps (currently ${used}).</div>`;
          return;
        }
        const half = Math.ceil(totalLaps / 2);
        const third = Math.floor(totalLaps / 3);
        const candidates = [
          { name: 'Your Strategy', strategy: stints },
          { name: '1-Stop (Medium → Hard)', strategy: [{ compound: 'medium', laps: half }, { compound: 'hard', laps: totalLaps - half }] },
          { name: '2-Stop (Soft → Medium → Soft)', strategy: [{ compound: 'soft', laps: third }, { compound: 'medium', laps: third }, { compound: 'soft', laps: totalLaps - third * 2 }] }
        ].map(c => ({ ...c, result: simulate(c.strategy) }));
        candidates.sort((a, b) => a.result.time - b.result.time);
        const fastest = candidates[0];

        resultsEl.innerHTML = candidates.map(c => `
          <div style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:8px;background:${c.name === 'Your Strategy' ? 'rgba(255,255,255,.07)' : 'transparent'};border:1px solid var(--border);">
            ${c === fastest ? Icons.inline('flag') : '<span style="width:14px;display:inline-block;"></span>'}
            <span style="flex:1;font-size:12.5px;">${c.name} <span style="color:var(--text-dim);">(${c.result.stops} stop${c.result.stops === 1 ? '' : 's'})</span></span>
            <span style="font-size:13px;font-weight:700;font-variant-numeric:tabular-nums;">${fmt(c.result.time)}</span>
          </div>`).join('');
        draw(simulate(stints));
      }

      lapsInput.addEventListener('change', () => { totalLaps = Math.max(10, Math.min(80, parseInt(lapsInput.value) || 56)); renderStints(); });
      body.querySelector('[data-act="ps-add"]').onclick = () => {
        const compound = body.querySelector('[data-role="ps-add-compound"]').value;
        const laps = Math.max(1, parseInt(body.querySelector('[data-role="ps-add-laps"]').value) || 1);
        stints.push({ compound, laps });
        renderStints();
      };
      body.querySelector('[data-act="ps-run"]').onclick = run;

      renderStints();
      run();
    }
  });
};

Apps.liveTiming = function () {
  WM.open({
    title: 'Live Timing', icon: 'livetiming', appId: 'livetiming', width: 460, height: 560,
    onMount(body) {
      body.innerHTML = `
        <div style="display:flex;flex-direction:column;height:100%;">
          <div style="padding:12px 14px;border-bottom:1px solid var(--border);flex:none;">
            <div style="display:flex;align-items:center;gap:7px;">
              <span data-role="lt-badge"></span>
              <div style="font-size:14px;font-weight:700;" data-role="lt-title">Loading session…</div>
            </div>
            <div style="font-size:11.5px;color:var(--text-dim);margin-top:2px;" data-role="lt-sub"></div>
          </div>
          <div style="flex:1;overflow-y:auto;" data-role="lt-list"></div>
        </div>`;
      const badgeEl = body.querySelector('[data-role="lt-badge"]');
      const titleEl = body.querySelector('[data-role="lt-title"]');
      const subEl = body.querySelector('[data-role="lt-sub"]');
      const listEl = body.querySelector('[data-role="lt-list"]');

      let timer = null;
      async function load() {
        try {
          const sessions = await fetch('https://api.openf1.org/v1/sessions?session_key=latest').then(r => r.json());
          const session = sessions && sessions[0];
          if (!session) { titleEl.textContent = 'No session data available'; return; }
          const now = new Date();
          const isLive = now >= new Date(session.date_start) && now <= new Date(session.date_end);
          badgeEl.innerHTML = isLive
            ? '<span class="lt-live-dot"></span><span style="color:#ff5c5c;font-weight:700;font-size:11px;letter-spacing:.5px;">LIVE</span>'
            : '<span style="color:var(--text-dim);font-weight:700;font-size:11px;letter-spacing:.5px;">FINAL</span>';
          titleEl.textContent = `${session.session_name} — ${session.circuit_short_name}`;
          subEl.textContent = isLive
            ? `${session.country_name} · session in progress`
            : `${session.country_name} · ${new Date(session.date_start).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;

          const [drivers, positions, intervals] = await Promise.all([
            fetch(`https://api.openf1.org/v1/drivers?session_key=${session.session_key}`).then(r => r.json()).catch(() => []),
            fetch(`https://api.openf1.org/v1/position?session_key=${session.session_key}`).then(r => r.json()).catch(() => []),
            fetch(`https://api.openf1.org/v1/intervals?session_key=${session.session_key}`).then(r => r.json()).catch(() => [])
          ]);
          const driverMap = {};
          drivers.forEach(d => { driverMap[d.driver_number] = d; });
          const latestPos = {};
          positions.forEach(p => { if (!latestPos[p.driver_number] || p.date > latestPos[p.driver_number].date) latestPos[p.driver_number] = p; });
          const latestGap = {};
          intervals.forEach(iv => { if (!latestGap[iv.driver_number] || iv.date > latestGap[iv.driver_number].date) latestGap[iv.driver_number] = iv; });

          const rows = Object.values(latestPos).sort((a, b) => a.position - b.position);
          if (!rows.length) {
            listEl.innerHTML = '<div style="padding:24px;text-align:center;color:var(--text-dim);font-size:12.5px;">No timing data for this session.</div>';
          } else {
            listEl.innerHTML = rows.map(p => {
              const d = driverMap[p.driver_number];
              const gap = latestGap[p.driver_number];
              const gapText = p.position === 1 ? 'Leader' : (gap && gap.gap_to_leader != null ? gap.gap_to_leader : '—');
              return `<div class="lt-row">
                <div class="lt-pos">${p.position}</div>
                <div class="lt-swatch" style="background:#${d && d.team_colour ? d.team_colour : '888888'};"></div>
                <div class="lt-info">
                  <div class="lt-name">${d ? d.full_name : 'Car #' + p.driver_number}</div>
                  <div class="lt-team">${d ? d.team_name : ''}</div>
                </div>
                <div class="lt-gap">${gapText}</div>
              </div>`;
            }).join('');
          }

          if (isLive && !timer) timer = setInterval(load, 8000);
          if (!isLive && timer) { clearInterval(timer); timer = null; }
        } catch (e) {
          titleEl.textContent = 'Live timing unavailable';
          subEl.textContent = 'Could not reach the timing service.';
          badgeEl.innerHTML = '';
        }
      }
      load();

      const obs = new MutationObserver(() => {
        if (!document.body.contains(body)) { if (timer) clearInterval(timer); obs.disconnect(); }
      });
      obs.observe(document.getElementById('windows'), { childList: true, subtree: true });
    }
  });
};
