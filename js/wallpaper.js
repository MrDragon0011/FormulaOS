/* DragonOS wallpapers — procedural low-poly mountain skylines (angular, not blobby gradients) */
const Wallpaper = (() => {
  const W = 1600, H = 900;

  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* Straight-edge jagged ridge line (angular, no curves) closed down to the bottom of the frame */
  function ridge(rand, baseY, amplitude, segments) {
    const step = W / segments;
    const pts = [`0,${H}`];
    for (let i = 0; i <= segments; i++) {
      const x = Math.round(i * step);
      const y = Math.round(baseY - rand() * amplitude);
      pts.push(`${x},${y}`);
    }
    pts.push(`${W},${H}`);
    return pts.join(' ');
  }

  /* Faceted polygon sun/moon disc (straight segments, not a smooth circle) */
  function facetedDisc(cx, cy, r, sides, rand) {
    const pts = [];
    for (let i = 0; i < sides; i++) {
      const a = (i / sides) * Math.PI * 2;
      const rr = r * (0.9 + rand() * 0.14);
      pts.push(`${(cx + Math.cos(a) * rr).toFixed(0)},${(cy + Math.sin(a) * rr).toFixed(0)}`);
    }
    return pts.join(' ');
  }

  function glassTriangle(rand, opacity) {
    const x1 = rand() * W, y1 = rand() * H * 0.55;
    const size = 180 + rand() * 260;
    const rot = rand() * 360;
    const x2 = x1 + size, y2 = y1 + size * (0.4 + rand() * 0.5);
    const x3 = x1 - size * (0.3 + rand() * 0.4), y3 = y1 + size * 0.7;
    return `<polygon points="${x1.toFixed(0)},${y1.toFixed(0)} ${x2.toFixed(0)},${y2.toFixed(0)} ${x3.toFixed(0)},${y3.toFixed(0)}" fill="#ffffff" opacity="${opacity}" transform="rotate(${rot.toFixed(1)} ${x1.toFixed(0)} ${y1.toFixed(0)})"/>`;
  }

  const palettes = [
    { sky: ['#1c1730', '#2c2350', '#141024'], sun: '#ffb15e', sunGlow: '#ff8a5c', mtn: ['#3a2f5c', '#2a2248', '#1c1733'] },
    { sky: ['#0d2430', '#123244', '#081720'], sun: '#7fd8d0', sunGlow: '#3aa8b0', mtn: ['#123846', '#0e2a35', '#0a1e26'] },
    { sky: ['#241a35', '#3a2a52', '#160f24'], sun: '#e58bff', sunGlow: '#b25cff', mtn: ['#3c2c58', '#2a2044', '#1c1730'] },
    { sky: ['#0f2138', '#173355', '#0a1826'], sun: '#7db8ff', sunGlow: '#3f7fe0', mtn: ['#183a5c', '#122c48', '#0c1f32'] },
    { sky: ['#151a2e', '#212a48', '#0d1120'], sun: '#9fb4ff', sunGlow: '#5c74d6', mtn: ['#242f52', '#1a2338', '#111528'] },
    { sky: ['#2e1a2e', '#4a2340', '#1c1020'], sun: '#ff9ec0', sunGlow: '#e0568f', mtn: ['#4a2a48', '#341f38', '#1f1526'] }
  ];

  function build(index) {
    const p = palettes[index % palettes.length];
    const rand = mulberry32(1000 + index * 97);
    const sunX = W * (0.28 + rand() * 0.2), sunY = H * (0.22 + rand() * 0.08);

    const glass = [glassTriangle(rand, 0.03), glassTriangle(rand, 0.025), glassTriangle(rand, 0.02)].join('');
    const ridgeBack = ridge(rand, H * 0.62, 70, 7);
    const ridgeMid = ridge(rand, H * 0.72, 90, 8);
    const ridgeFront = ridge(rand, H * 0.85, 110, 9);
    const sunPts = facetedDisc(sunX, sunY, 78, 10, rand);

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${p.sky[0]}"/>
          <stop offset="0.55" stop-color="${p.sky[1]}"/>
          <stop offset="1" stop-color="${p.sky[2]}"/>
        </linearGradient>
        <radialGradient id="glow" cx="${(sunX / W).toFixed(3)}" cy="${(sunY / H).toFixed(3)}" r="0.35">
          <stop offset="0" stop-color="${p.sunGlow}" stop-opacity="0.55"/>
          <stop offset="1" stop-color="${p.sunGlow}" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#sky)"/>
      <rect width="${W}" height="${H}" fill="url(#glow)"/>
      ${glass}
      <polygon points="${sunPts}" fill="${p.sun}"/>
      <polygon points="${ridgeBack}" fill="${p.mtn[0]}"/>
      <polygon points="${ridgeMid}" fill="${p.mtn[1]}"/>
      <polygon points="${ridgeFront}" fill="${p.mtn[2]}"/>
    </svg>`;
    return svg;
  }

  const cache = new Map();
  function svg(index) {
    if (!cache.has(index)) cache.set(index, build(index));
    return cache.get(index);
  }
  function cssValue(index) {
    const encoded = encodeURIComponent(svg(index)).replace(/'/g, '%27').replace(/"/g, '%22');
    return `center/cover no-repeat url('data:image/svg+xml,${encoded}')`;
  }
  function count() { return palettes.length; }

  return { cssValue, count };
})();
