/* FormulaOS wallpapers — a top-down circuit map of the next Grand Prix, F1-team-inspired palettes.
   Track shapes are stylized/procedural (seeded per circuit), not GPS-accurate traces. */
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
  function hashSeed(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

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
    const x1 = rand() * W, y1 = rand() * H * 0.4;
    const size = 160 + rand() * 220;
    const rot = rand() * 360;
    const x2 = x1 + size, y2 = y1 + size * (0.4 + rand() * 0.5);
    const x3 = x1 - size * (0.3 + rand() * 0.4), y3 = y1 + size * 0.7;
    return `<polygon points="${x1.toFixed(0)},${y1.toFixed(0)} ${x2.toFixed(0)},${y2.toFixed(0)} ${x3.toFixed(0)},${y3.toFixed(0)}" fill="#ffffff" opacity="${opacity}" transform="rotate(${rot.toFixed(1)} ${x1.toFixed(0)} ${y1.toFixed(0)})"/>`;
  }

  /* Each real circuit gets a small character descriptor rather than exact geometry —
     corner count / tightness / elongation shape a distinct, plausible track silhouette. */
  const TRACKS = {
    monaco: { label: 'MONACO', corners: 14, jitter: .62, elong: .72, tight: .8 },
    singapore: { label: 'MARINA BAY', corners: 15, jitter: .55, elong: .8, tight: .7 },
    jeddah: { label: 'JEDDAH', corners: 16, jitter: .4, elong: 1.35, tight: .55 },
    baku: { label: 'BAKU', corners: 12, jitter: .58, elong: 1.5, tight: .65 },
    vegas: { label: 'LAS VEGAS', corners: 9, jitter: .3, elong: 1.4, tight: .35 },
    miami: { label: 'MIAMI', corners: 13, jitter: .45, elong: 1.1, tight: .5 },
    suzuka: { label: 'SUZUKA', corners: 13, jitter: .5, elong: 1.0, tight: .55, figure8: true },
    spa: { label: 'SPA-FRANCORCHAMPS', corners: 11, jitter: .5, elong: 1.25, tight: .4 },
    silverstone: { label: 'SILVERSTONE', corners: 12, jitter: .42, elong: 1.15, tight: .35 },
    monza: { label: 'MONZA', corners: 8, jitter: .28, elong: 1.2, tight: .3 },
    barcelona: { label: 'BARCELONA', corners: 10, jitter: .4, elong: 1.05, tight: .45 },
    redbullring: { label: 'RED BULL RING', corners: 7, jitter: .35, elong: .95, tight: .4 },
    hungaroring: { label: 'HUNGARORING', corners: 13, jitter: .48, elong: .85, tight: .68 },
    zandvoort: { label: 'ZANDVOORT', corners: 10, jitter: .4, elong: .95, tight: .6 },
    montreal: { label: 'MONTREAL', corners: 10, jitter: .38, elong: 1.1, tight: .45 },
    cota: { label: 'COTA', corners: 12, jitter: .46, elong: 1.0, tight: .48 },
    mexico: { label: 'MEXICO CITY', corners: 11, jitter: .4, elong: 1.0, tight: .5 },
    interlagos: { label: 'INTERLAGOS', corners: 10, jitter: .44, elong: .9, tight: .55 },
    lusail: { label: 'LUSAIL', corners: 12, jitter: .35, elong: 1.05, tight: .4 },
    yasmarina: { label: 'YAS MARINA', corners: 13, jitter: .4, elong: 1.1, tight: .5 },
    bahrain: { label: 'BAHRAIN', corners: 11, jitter: .42, elong: 1.1, tight: .48 },
    albertpark: { label: 'ALBERT PARK', corners: 12, jitter: .38, elong: 1.05, tight: .4 },
    shanghai: { label: 'SHANGHAI', corners: 11, jitter: .44, elong: .95, tight: .55 },
    imola: { label: 'IMOLA', corners: 10, jitter: .42, elong: 1.15, tight: .45 }
  };
  const DEFAULT_TRACK = { label: 'GRAND PRIX', corners: 11, jitter: .42, elong: 1.05, tight: .5 };

  /* Smooth closed loop through seeded vertices, using quadratic mid-point smoothing (real
     circuits are flowing curves, not angular facets — a deliberate exception to the OS's
     faceted icon language, appropriate to the subject). */
  function trackPath(t, seed, cx, cy, scale) {
    const rand = mulberry32(seed);
    const n = t.corners;
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = scale * (1 - t.jitter / 2 + rand() * t.jitter) * (t.figure8 && i % 2 === 0 ? 0.55 : 1);
      pts.push([cx + Math.cos(a) * r * t.elong, cy + Math.sin(a) * r]);
    }
    // pull points toward center at "tight" corners for hairpin-style variation
    for (let i = 0; i < n; i++) {
      if (rand() < t.tight * 0.4) {
        pts[i][0] = cx + (pts[i][0] - cx) * 0.62;
        pts[i][1] = cy + (pts[i][1] - cy) * 0.62;
      }
    }
    const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    let d = `M ${mid(pts[n - 1], pts[0])[0].toFixed(1)} ${mid(pts[n - 1], pts[0])[1].toFixed(1)} `;
    for (let i = 0; i < n; i++) {
      const p = pts[i], nextP = pts[(i + 1) % n];
      const m = mid(p, nextP);
      d += `Q ${p[0].toFixed(1)} ${p[1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)} `;
    }
    d += 'Z';
    return { d, start: mid(pts[n - 1], pts[0]), second: pts[0] };
  }

  const palettes = [
    { sky: ['#2b0f14', '#5c1418', '#180608'], sun: '#ffc94d', sunGlow: '#e10600', track: '#e7e2da', kerb: '#e10600', grass: '#2a0d10' },
    { sky: ['#0c2420', '#123a34', '#081916'], sun: '#c9d6d4', sunGlow: '#3aa89a', track: '#e7e2da', kerb: '#0f6b5c', grass: '#0a2420' },
    { sky: ['#0d1830', '#152850', '#080f20'], sun: '#ff8700', sunGlow: '#ff9e2c', track: '#e7e2da', kerb: '#ff8700', grass: '#0d1a30' },
    { sky: ['#0a1130', '#151f4a', '#060a1c'], sun: '#ffd23f', sunGlow: '#c81e1e', track: '#e7e2da', kerb: '#c81e1e', grass: '#0b1030' },
    { sky: ['#0c1f14', '#183822', '#08140c'], sun: '#f0dcae', sunGlow: '#2f8f52', track: '#e7e2da', kerb: '#2f8f52', grass: '#0c2016' },
    { sky: ['#201c1a', '#3a2e22', '#141110'], sun: '#f2c879', sunGlow: '#c99a4a', track: '#e7e2da', kerb: '#c99a4a', grass: '#1e1a15' }
  ];

  function build(index, trackSlug) {
    const p = palettes[index % palettes.length];
    const t = TRACKS[trackSlug] || DEFAULT_TRACK;
    const rand = mulberry32(1000 + index * 97);
    const sunX = W * (0.16 + rand() * 0.14), sunY = H * (0.13 + rand() * 0.06);
    const glass = [glassTriangle(rand, 0.03), glassTriangle(rand, 0.025), glassTriangle(rand, 0.02)].join('');
    const sunPts = facetedDisc(sunX, sunY, 56, 10, rand);

    const cx = W * 0.56, cy = H * 0.5, scale = Math.min(W, H) * 0.27;
    const trk = trackPath(t, hashSeed(trackSlug || 'default'), cx, cy, scale);

    // start/finish marker: short perpendicular tick + checker swatch at the loop seam
    const [sx, sy] = trk.start, [sx2, sy2] = trk.second;
    const ang = Math.atan2(sy2 - sy, sx2 - sx);
    const px = Math.cos(ang + Math.PI / 2), py = Math.sin(ang + Math.PI / 2);
    const fl = `<line x1="${(sx - px * 26).toFixed(1)}" y1="${(sy - py * 26).toFixed(1)}" x2="${(sx + px * 26).toFixed(1)}" y2="${(sy + py * 26).toFixed(1)}" stroke="url(#checker)" stroke-width="10"/>`;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${p.sky[0]}"/>
          <stop offset="0.55" stop-color="${p.sky[1]}"/>
          <stop offset="1" stop-color="${p.sky[2]}"/>
        </linearGradient>
        <radialGradient id="glow" cx="${(sunX / W).toFixed(3)}" cy="${(sunY / H).toFixed(3)}" r="0.4">
          <stop offset="0" stop-color="${p.sunGlow}" stop-opacity="0.5"/>
          <stop offset="1" stop-color="${p.sunGlow}" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="spot" cx="${(cx / W).toFixed(3)}" cy="${(cy / H).toFixed(3)}" r="0.42">
          <stop offset="0" stop-color="${p.kerb}" stop-opacity=".16"/>
          <stop offset="1" stop-color="${p.kerb}" stop-opacity="0"/>
        </radialGradient>
        <pattern id="checker" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(${(ang * 180 / Math.PI).toFixed(1)})">
          <rect width="10" height="10" fill="#0c0c0e"/>
          <rect width="5" height="5" fill="#f4f4f4"/>
          <rect x="5" y="5" width="5" height="5" fill="#f4f4f4"/>
        </pattern>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#sky)"/>
      <rect width="${W}" height="${H}" fill="url(#glow)"/>
      ${glass}
      <polygon points="${sunPts}" fill="${p.sun}"/>
      <rect width="${W}" height="${H}" fill="url(#spot)"/>
      <path d="${trk.d}" fill="none" stroke="${p.kerb}" stroke-width="26" stroke-linejoin="round" opacity=".9"/>
      <path d="${trk.d}" fill="none" stroke="${p.track}" stroke-width="18" stroke-linejoin="round"/>
      ${fl}
      <text x="${cx}" y="${(cy + scale * 1.28).toFixed(0)}" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="700" letter-spacing="10" fill="#ffffff" opacity=".5">${t.label}</text>
    </svg>`;
    return svg;
  }

  const cache = new Map();
  function svg(index, trackSlug) {
    const key = index + ':' + (trackSlug || '');
    if (!cache.has(key)) cache.set(key, build(index, trackSlug));
    return cache.get(key);
  }
  function cssValue(index, trackSlug) {
    const encoded = encodeURIComponent(svg(index, trackSlug)).replace(/'/g, '%27').replace(/"/g, '%22');
    return `center/cover no-repeat url('data:image/svg+xml,${encoded}')`;
  }
  function count() { return palettes.length; }

  return { cssValue, count };
})();
