/* FormulaOS Applications — Part 3 (advanced apps) */

/* ---------------- Track Atlas ---------------- */
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

/* ---------------- Pit Strategy Simulator ---------------- */
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
