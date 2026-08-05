/* DragonOS Window Manager */

/* Binds both dblclick (mouse) and double-tap (touch) to open an item */
function bindOpen(el, handler) {
  el.addEventListener('dblclick', (e) => { e.preventDefault(); handler(e); });
  let lastTap = 0;
  el.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTap < 350) { e.preventDefault(); handler(e); }
    lastTap = now;
  });
}
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

    // Drag (mouse + touch)
    const header = el.querySelector('.window-header');
    let dragging = false, sx, sy, sl, st;
    function pt(e) { return e.touches ? e.touches[0] : e; }
    function dragStart(e) {
      if (e.target.closest('.win-btn')) return;
      focus(id);
      if (meta.maximized) return;
      dragging = true;
      const p = pt(e);
      sx = p.clientX; sy = p.clientY;
      sl = el.offsetLeft; st = el.offsetTop;
      document.body.style.userSelect = 'none';
    }
    function dragMove(e) {
      if (!dragging) return;
      if (e.cancelable) e.preventDefault();
      const p = pt(e);
      el.style.left = Math.max(0, sl + (p.clientX - sx)) + 'px';
      el.style.top = Math.max(0, st + (p.clientY - sy)) + 'px';
    }
    function dragEnd() { dragging = false; document.body.style.userSelect = ''; }
    header.addEventListener('mousedown', dragStart);
    window.addEventListener('mousemove', dragMove);
    window.addEventListener('mouseup', dragEnd);
    header.addEventListener('touchstart', dragStart, { passive: true });
    window.addEventListener('touchmove', dragMove, { passive: false });
    window.addEventListener('touchend', dragEnd);

    // Resize (mouse + touch)
    const handle = el.querySelector('.resize-handle');
    if (handle) {
      let resizing = false, rsx, rsy, rw, rh;
      function rStart(e) {
        e.stopPropagation();
        resizing = true;
        const p = pt(e);
        rsx = p.clientX; rsy = p.clientY;
        rw = el.offsetWidth; rh = el.offsetHeight;
      }
      function rMove(e) {
        if (!resizing) return;
        if (e.cancelable) e.preventDefault();
        const p = pt(e);
        el.style.width = Math.max(280, rw + (p.clientX - rsx)) + 'px';
        el.style.height = Math.max(180, rh + (p.clientY - rsy)) + 'px';
      }
      function rEnd() { resizing = false; }
      handle.addEventListener('mousedown', rStart);
      window.addEventListener('mousemove', rMove);
      window.addEventListener('mouseup', rEnd);
      handle.addEventListener('touchstart', rStart, { passive: true });
      window.addEventListener('touchmove', rMove, { passive: false });
      window.addEventListener('touchend', rEnd);
    }

    el.addEventListener('mousedown', () => focus(id));
    el.addEventListener('touchstart', () => focus(id), { passive: true });

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
