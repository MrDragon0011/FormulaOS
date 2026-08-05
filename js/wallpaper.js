/* FormulaOS wallpapers — procedural low-poly circuit skylines, F1-team-inspired palettes */
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
    { sky: ['#2b0f14', '#5c1418', '#180608'], sun: '#ffc94d', sunGlow: '#e10600', mtn: ['#5c2024', '#3d1417', '#20090b'] },
    { sky: ['#0c2420', '#123a34', '#081916'], sun: '#c9d6d4', sunGlow: '#3aa89a', mtn: ['#164138', '#0f2d27', '#0a1e19'] },
    { sky: ['#0d1830', '#152850', '#080f20'], sun: '#ff8700', sunGlow: '#ff9e2c', mtn: ['#1c3060', '#152548', '#0c1730'] },
    { sky: ['#0a1130', '#151f4a', '#060a1c'], sun: '#ffd23f', sunGlow: '#c81e1e', mtn: ['#1a2350', '#131a3c', '#0a0e24'] },
    { sky: ['#0c1f14', '#183822', '#08140c'], sun: '#f0dcae', sunGlow: '#2f8f52', mtn: ['#1c3d26', '#132b1b', '#0b1c11'] },
    { sky: ['#201c1a', '#3a2e22', '#141110'], sun: '#f2c879', sunGlow: '#c99a4a', mtn: ['#3a2f22', '#292118', '#1a1510'] }
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

    const stripeY = H * 0.588, stripeH = 16, sq = 16;

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
        <pattern id="checker" width="${sq * 2}" height="${sq * 2}" patternUnits="userSpaceOnUse">
          <rect width="${sq * 2}" height="${sq * 2}" fill="#0c0c0e"/>
          <rect width="${sq}" height="${sq}" fill="#f4f4f4"/>
          <rect x="${sq}" y="${sq}" width="${sq}" height="${sq}" fill="#f4f4f4"/>
        </pattern>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#sky)"/>
      <rect width="${W}" height="${H}" fill="url(#glow)"/>
      ${glass}
      <rect x="0" y="${stripeY.toFixed(0)}" width="${W}" height="${stripeH}" fill="url(#checker)" opacity=".85"/>
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
