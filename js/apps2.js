/* FormulaOS Applications — Part 2 */

/* ---------------- Image Viewer ---------------- */
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

/* ---------------- Paint ---------------- */
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

/* ---------------- Media Player ---------------- */
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

/* ---------------- Calendar ---------------- */
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

/* ---------------- Weather ---------------- */
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

/* ---------------- Task Manager ---------------- */
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

/* ---------------- Snake Game ---------------- */
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
