/* DragonOS Window Manager */
const WM = (() => {
  const windowsEl = () => document.getElementById('windows');
  const taskbarAppsEl = () => document.getElementById('taskbar-apps');
  let zTop = 10;
  let idCounter = 0;
  const registry = new Map(); // id -> {el, meta}

  function nextId() { return 'win-' + (++idCounter); }

  function focus(id) {
    registry.forEach((w, wid) => {
      w.el.classList.toggle('focused', wid === id);
      if (wid === id) { zTop += 1; w.el.style.zIndex = zTop; }
    });
    document.querySelectorAll('.taskbar-app').forEach(el => {
      el.classList.toggle('active', el.dataset.win === id);
    });
  }

  function renderTaskbar() {
    const el = taskbarAppsEl();
    el.innerHTML = '';
    registry.forEach((w, id) => {
      if (w.meta.minimized === undefined) w.meta.minimized = false;
      const btn = document.createElement('div');
      btn.className = 'taskbar-app';
      btn.dataset.win = id;
      btn.innerHTML = `<span>${w.meta.icon || '🗔'}</span><span>${w.meta.title}</span>`;
      btn.onclick = () => {
        if (w.meta.minimized) {
          w.meta.minimized = false;
          w.el.classList.remove('hidden');
          focus(id);
        } else if (w.el.classList.contains('focused')) {
          w.meta.minimized = true;
          w.el.classList.add('hidden');
        } else {
          focus(id);
        }
      };
      el.appendChild(btn);
    });
  }

  function open({ title, icon, width = 560, height = 400, content, onMount, appId, single = false, resizable = true }) {
    if (single && appId) {
      for (const [id, w] of registry) {
        if (w.meta.appId === appId) {
          w.meta.minimized = false;
          w.el.classList.remove('hidden');
          focus(id);
          return id;
        }
      }
    }
    const id = nextId();
    const el = document.createElement('div');
    el.className = 'window';
    el.id = id;
    const maxW = window.innerWidth - 40;
    const maxH = window.innerHeight - 48 - 40;
    width = Math.min(width, maxW);
    height = Math.min(height, maxH);
    const left = Math.max(10, Math.round((window.innerWidth - width) / 2 + (registry.size % 6) * 24));
    const top = Math.max(10, Math.round((window.innerHeight - 48 - height) / 2 + (registry.size % 6) * 20));
    el.style.left = left + 'px';
    el.style.top = top + 'px';
    el.style.width = width + 'px';
    el.style.height = height + 'px';

    el.innerHTML = `
      <div class="window-header">
        <div class="window-title"><span>${icon || '🗔'}</span><span>${title}</span></div>
        <div class="window-controls">
          <button class="win-btn min" title="Minimize"></button>
          <button class="win-btn max" title="Maximize"></button>
          <button class="win-btn close" title="Close"></button>
        </div>
      </div>
      <div class="window-body"></div>
      ${resizable ? '<div class="resize-handle"></div>' : ''}
    `;
    windowsEl().appendChild(el);

    const body = el.querySelector('.window-body');
    if (typeof content === 'string') body.innerHTML = content;
    else if (content instanceof HTMLElement) body.appendChild(content);

    const meta = { title, icon, appId, minimized: false, maximized: false, prevRect: null };
    registry.set(id, { el, meta });

    // Drag
    const header = el.querySelector('.window-header');
    let dragging = false, sx, sy, sl, st;
    header.addEventListener('mousedown', (e) => {
      if (e.target.closest('.win-btn')) return;
      focus(id);
      if (meta.maximized) return;
      dragging = true; sx = e.clientX; sy = e.clientY;
      sl = el.offsetLeft; st = el.offsetTop;
      document.body.style.userSelect = 'none';
    });
    window.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      el.style.left = Math.max(0, sl + (e.clientX - sx)) + 'px';
      el.style.top = Math.max(0, st + (e.clientY - sy)) + 'px';
    });
    window.addEventListener('mouseup', () => { dragging = false; document.body.style.userSelect = ''; });

    // Resize
    const handle = el.querySelector('.resize-handle');
    if (handle) {
      let resizing = false, rsx, rsy, rw, rh;
      handle.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        resizing = true; rsx = e.clientX; rsy = e.clientY;
        rw = el.offsetWidth; rh = el.offsetHeight;
      });
      window.addEventListener('mousemove', (e) => {
        if (!resizing) return;
        el.style.width = Math.max(280, rw + (e.clientX - rsx)) + 'px';
        el.style.height = Math.max(180, rh + (e.clientY - rsy)) + 'px';
      });
      window.addEventListener('mouseup', () => resizing = false);
    }

    el.addEventListener('mousedown', () => focus(id));

    el.querySelector('.win-btn.close').onclick = () => close(id);
    el.querySelector('.win-btn.min').onclick = () => {
      meta.minimized = true;
      el.classList.add('hidden');
    };
    el.querySelector('.win-btn.max').onclick = () => toggleMaximize(id);
    header.addEventListener('dblclick', (e) => {
      if (e.target.closest('.win-btn')) return;
      toggleMaximize(id);
    });

    renderTaskbar();
    focus(id);
    if (onMount) onMount(body, id);
    return id;
  }

  function toggleMaximize(id) {
    const w = registry.get(id);
    if (!w) return;
    const el = w.el;
    if (!w.meta.maximized) {
      w.meta.prevRect = { left: el.style.left, top: el.style.top, width: el.style.width, height: el.style.height };
      el.style.left = '0px'; el.style.top = '0px';
      el.style.width = '100%'; el.style.height = '100%';
      el.classList.add('maximized');
      w.meta.maximized = true;
    } else {
      const r = w.meta.prevRect;
      if (r) { el.style.left = r.left; el.style.top = r.top; el.style.width = r.width; el.style.height = r.height; }
      el.classList.remove('maximized');
      w.meta.maximized = false;
    }
  }

  function close(id) {
    const w = registry.get(id);
    if (!w) return;
    w.el.remove();
    registry.delete(id);
    renderTaskbar();
  }

  function closeAll() { [...registry.keys()].forEach(close); }

  function setTitle(id, title) {
    const w = registry.get(id);
    if (!w) return;
    w.meta.title = title;
    w.el.querySelector('.window-title span:last-child').textContent = title;
    renderTaskbar();
  }

  return { open, close, closeAll, focus, toggleMaximize, setTitle, registry };
})();
