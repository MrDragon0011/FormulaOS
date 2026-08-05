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
  let zTop = 10;
  let idCounter = 0;
  const registry = new Map(); // id -> {el, meta}
  const listeners = { change: [], focus: [] };

  function emit(kind, arg) { listeners[kind].forEach(fn => fn(arg)); }
  function onChange(fn) { listeners.change.push(fn); }
  function onFocus(fn) { listeners.focus.push(fn); }

  function nextId() { return 'win-' + (++idCounter); }

  function focus(id) {
    registry.forEach((w, wid) => {
      w.el.classList.toggle('focused', wid === id);
      if (wid === id) { zTop += 1; w.el.style.zIndex = zTop; }
    });
    emit('focus', id);
    emit('change');
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
    const barTop = 28, dockH = 88;
    const maxW = window.innerWidth - 40;
    const maxH = window.innerHeight - barTop - dockH;
    width = Math.min(width, maxW);
    height = Math.min(height, maxH);
    const left = Math.max(10, Math.round((window.innerWidth - width) / 2 + (registry.size % 6) * 24));
    const top = Math.max(10, Math.round((window.innerHeight - barTop - dockH - height) / 2 + (registry.size % 6) * 20));
    el.style.left = left + 'px';
    el.style.top = top + 'px';
    el.style.width = width + 'px';
    el.style.height = height + 'px';

    el.innerHTML = `
      <div class="window-header">
        <div class="window-controls">
          <button class="win-btn close" title="Close"></button>
          <button class="win-btn min" title="Minimize"></button>
          <button class="win-btn max" title="Maximize"></button>
        </div>
        <div class="window-title"><span>${icon || '🗔'}</span><span>${title}</span></div>
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

    // Drag (mouse + touch) with edge-snap
    const header = el.querySelector('.window-header');
    const snapPreview = document.getElementById('snap-preview');
    const desktopEl = document.getElementById('desktop');
    let dragging = false, sx, sy, sl, st, snapZone = null;
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
    function zoneFor(clientX, clientY) {
      if (clientY < 32) return 'top';
      if (clientX < 18) return 'left';
      if (clientX > window.innerWidth - 18) return 'right';
      return null;
    }
    function showPreview(zone) {
      const r = desktopEl.getBoundingClientRect();
      snapPreview.classList.remove('hidden');
      if (zone === 'left') { snapPreview.style.left = '0px'; snapPreview.style.top = '0px'; snapPreview.style.width = (r.width / 2) + 'px'; snapPreview.style.height = r.height + 'px'; }
      else if (zone === 'right') { snapPreview.style.left = (r.width / 2) + 'px'; snapPreview.style.top = '0px'; snapPreview.style.width = (r.width / 2) + 'px'; snapPreview.style.height = r.height + 'px'; }
      else if (zone === 'top') { snapPreview.style.left = '0px'; snapPreview.style.top = '0px'; snapPreview.style.width = r.width + 'px'; snapPreview.style.height = r.height + 'px'; }
    }
    function hidePreview() { snapPreview.classList.add('hidden'); }
    function dragMove(e) {
      if (!dragging) return;
      if (e.cancelable) e.preventDefault();
      const p = pt(e);
      el.style.left = Math.max(0, sl + (p.clientX - sx)) + 'px';
      el.style.top = Math.max(0, st + (p.clientY - sy)) + 'px';
      const zone = zoneFor(p.clientX, p.clientY);
      if (zone !== snapZone) { snapZone = zone; if (zone) showPreview(zone); else hidePreview(); }
    }
    function dragEnd() {
      if (dragging && snapZone) {
        const r = desktopEl.getBoundingClientRect();
        if (snapZone === 'left') { el.style.left = '0px'; el.style.top = '0px'; el.style.width = (r.width / 2) + 'px'; el.style.height = r.height + 'px'; }
        else if (snapZone === 'right') { el.style.left = (r.width / 2) + 'px'; el.style.top = '0px'; el.style.width = (r.width / 2) + 'px'; el.style.height = r.height + 'px'; }
        else if (snapZone === 'top') { toggleMaximize(id); }
      }
      dragging = false; snapZone = null; hidePreview();
      document.body.style.userSelect = '';
    }
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
      emit('change');
    };
    el.querySelector('.win-btn.max').onclick = () => toggleMaximize(id);
    header.addEventListener('dblclick', (e) => {
      if (e.target.closest('.win-btn')) return;
      toggleMaximize(id);
    });

    emit('change');
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
    emit('change');
  }

  function restore(id) {
    const w = registry.get(id);
    if (!w) return;
    w.meta.minimized = false;
    w.el.classList.remove('hidden');
    focus(id);
  }

  function close(id) {
    const w = registry.get(id);
    if (!w) return;
    w.el.remove();
    registry.delete(id);
    emit('change');
  }

  function closeAll() { [...registry.keys()].forEach(close); }

  function setTitle(id, title) {
    const w = registry.get(id);
    if (!w) return;
    w.meta.title = title;
    w.el.querySelector('.window-title span:last-child').textContent = title;
    emit('change');
  }

  return { open, close, closeAll, focus, restore, toggleMaximize, setTitle, registry, onChange, onFocus };
})();
