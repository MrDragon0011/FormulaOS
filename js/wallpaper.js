/* FormulaOS wallpapers — a stylized low-poly race circuit scene, F1-team-inspired palettes */
const Wallpaper = (() => {
  const W = 1600, H = 900;
  const HZ = H * 0.46;          // horizon
  const VX = W * 0.5;           // track vanishing point x
  const TRACK_HALF_TOP = 50;    // track half-width at the horizon
  const TRACK_LX0 = -260, TRACK_RX0 = W + 260; // track edges at the bottom of the frame

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
    const x1 = rand() * W, y1 = rand() * H * 0.4;
    const size = 160 + rand() * 220;
    const rot = rand() * 360;
    const x2 = x1 + size, y2 = y1 + size * (0.4 + rand() * 0.5);
    const x3 = x1 - size * (0.3 + rand() * 0.4), y3 = y1 + size * 0.7;
    return `<polygon points="${x1.toFixed(0)},${y1.toFixed(0)} ${x2.toFixed(0)},${y2.toFixed(0)} ${x3.toFixed(0)},${y3.toFixed(0)}" fill="#ffffff" opacity="${opacity}" transform="rotate(${rot.toFixed(1)} ${x1.toFixed(0)} ${y1.toFixed(0)})"/>`;
  }

  /* x position of the track's left/right edge at a given y (0=horizon..1=bottom) */
  function edgeXAtY(y) {
    const t = (y - HZ) / (H - HZ);
    return {
      l: (VX - TRACK_HALF_TOP) + (TRACK_LX0 - (VX - TRACK_HALF_TOP)) * t,
      r: (VX + TRACK_HALF_TOP) + (TRACK_RX0 - (VX + TRACK_HALF_TOP)) * t
    };
  }

  /* Constant-width kerb: solid colorA line with colorB dashes on top, offset outward from the track edge */
  function kerbLine(x0, y0, x1, y1, offset, colorA, colorB) {
    const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy);
    const nx = dx / len, ny = dy / len;
    const px = -ny, py = nx; // perpendicular, points away from track center on the left edge
    const ox0 = x0 + px * offset, oy0 = y0 + py * offset;
    const ox1 = x1 + px * offset, oy1 = y1 + py * offset;
    return `<line x1="${ox0.toFixed(0)}" y1="${oy0.toFixed(0)}" x2="${ox1.toFixed(0)}" y2="${oy1.toFixed(0)}" stroke="${colorA}" stroke-width="9"/>` +
      `<line x1="${ox0.toFixed(0)}" y1="${oy0.toFixed(0)}" x2="${ox1.toFixed(0)}" y2="${oy1.toFixed(0)}" stroke="${colorB}" stroke-width="9" stroke-dasharray="26 26"/>`;
  }

  /* Center dash-line markings receding into the distance (perspective-scaled) */
  function centerDashes(segs) {
    let out = '';
    for (let i = 0; i < segs; i++) {
      const t0 = i / segs, t1 = (i + 0.55) / segs;
      const e0 = 1 - Math.pow(1 - t0, 1.7), e1 = 1 - Math.pow(1 - t1, 1.7);
      const y0 = HZ + (H - HZ) * e0, y1 = HZ + (H - HZ) * e1;
      const w0 = 2 + 26 * e0, w1 = 2 + 26 * e1;
      out += `<polygon points="${(VX - w0 / 2).toFixed(0)},${y0.toFixed(0)} ${(VX + w0 / 2).toFixed(0)},${y0.toFixed(0)} ${(VX + w1 / 2).toFixed(0)},${y1.toFixed(0)} ${(VX - w1 / 2).toFixed(0)},${y1.toFixed(0)}" fill="#fff" opacity=".8"/>`;
    }
    return out;
  }

  /* Stepped grandstand silhouette */
  function grandstand(x, y, w, h, steps, mirror, color) {
    const dir = mirror ? -1 : 1;
    let pts = [`${x},${y + h}`];
    for (let i = 0; i <= steps; i++) {
      const sx = x + dir * (w * i / steps);
      const sy = y + h - (h * i / steps);
      pts.push(`${sx.toFixed(0)},${sy.toFixed(0)}`);
      pts.push(`${sx.toFixed(0)},${(sy + h / steps * 0.55).toFixed(0)}`);
    }
    pts.push(`${(x + dir * w).toFixed(0)},${y + h}`);
    return `<polygon points="${pts.join(' ')}" fill="${color}"/>`;
  }

  const palettes = [
    { sky: ['#2b0f14', '#5c1418', '#180608'], sun: '#ffc94d', sunGlow: '#e10600', asphalt: ['#4a3234', '#1a0e0f'], grand: '#210a0c', kerbA: '#e10600' },
    { sky: ['#0c2420', '#123a34', '#081916'], sun: '#c9d6d4', sunGlow: '#3aa89a', asphalt: ['#33413f', '#0d1615'], grand: '#082019', kerbA: '#0f6b5c' },
    { sky: ['#0d1830', '#152850', '#080f20'], sun: '#ff8700', sunGlow: '#ff9e2c', asphalt: ['#33384a', '#0e1120'], grand: '#0a1230', kerbA: '#ff8700' },
    { sky: ['#0a1130', '#151f4a', '#060a1c'], sun: '#ffd23f', sunGlow: '#c81e1e', asphalt: ['#2e3350', '#0b0e22'], grand: '#0a0e26', kerbA: '#c81e1e' },
    { sky: ['#0c1f14', '#183822', '#08140c'], sun: '#f0dcae', sunGlow: '#2f8f52', asphalt: ['#374436', '#101a10'], grand: '#0b1c11', kerbA: '#2f8f52' },
    { sky: ['#201c1a', '#3a2e22', '#141110'], sun: '#f2c879', sunGlow: '#c99a4a', asphalt: ['#463f34', '#161210'], grand: '#1a1510', kerbA: '#c99a4a' }
  ];

  function build(index) {
    const p = palettes[index % palettes.length];
    const rand = mulberry32(1000 + index * 97);
    const sunX = W * (0.62 + rand() * 0.16), sunY = H * (0.14 + rand() * 0.07);

    const glass = [glassTriangle(rand, 0.035), glassTriangle(rand, 0.03), glassTriangle(rand, 0.02)].join('');
    const farHills = ridge(rand, HZ + 6, 20, 10);
    const sunPts = facetedDisc(sunX, sunY, 62, 10, rand);

    const track = `${(VX - TRACK_HALF_TOP).toFixed(0)},${HZ.toFixed(0)} ${(VX + TRACK_HALF_TOP).toFixed(0)},${HZ.toFixed(0)} ${TRACK_RX0},${H} ${TRACK_LX0},${H}`;
    const leftKerb = kerbLine(VX - TRACK_HALF_TOP, HZ, TRACK_LX0, H, -7, '#f4f4f4', p.kerbA);
    const rightKerb = kerbLine(VX + TRACK_HALF_TOP, HZ, TRACK_RX0, H, 7, '#f4f4f4', p.kerbA);
    const dashes = centerDashes(9);

    // start/finish gantry + checkered patch, a short way down the track
    const yFL0 = HZ + (H - HZ) * 0.05, yFL1 = HZ + (H - HZ) * 0.105;
    const e0 = edgeXAtY(yFL0), e1 = edgeXAtY(yFL1);
    const flClip = `${e0.l.toFixed(0)},${yFL0.toFixed(0)} ${e0.r.toFixed(0)},${yFL0.toFixed(0)} ${e1.r.toFixed(0)},${yFL1.toFixed(0)} ${e1.l.toFixed(0)},${yFL1.toFixed(0)}`;
    const gantryTop = HZ - 34;
    const gantry = `<line x1="${e0.l.toFixed(0)}" y1="${gantryTop}" x2="${e0.l.toFixed(0)}" y2="${yFL0.toFixed(0)}" stroke="${p.grand}" stroke-width="5"/>` +
      `<line x1="${e0.r.toFixed(0)}" y1="${gantryTop}" x2="${e0.r.toFixed(0)}" y2="${yFL0.toFixed(0)}" stroke="${p.grand}" stroke-width="5"/>` +
      `<rect x="${(e0.l - 6).toFixed(0)}" y="${gantryTop}" width="${(e0.r - e0.l + 12).toFixed(0)}" height="10" fill="${p.grand}"/>`;

    const stands = grandstand(TRACK_LX0 - 40, HZ + (H - HZ) * 0.22, 210, 150, 4, true, p.grand) +
      grandstand(TRACK_RX0 + 40, HZ + (H - HZ) * 0.22, 210, 150, 4, false, p.grand);

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
        <linearGradient id="asphalt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${p.asphalt[0]}"/>
          <stop offset="1" stop-color="${p.asphalt[1]}"/>
        </linearGradient>
        <pattern id="checker" width="16" height="16" patternUnits="userSpaceOnUse">
          <rect width="16" height="16" fill="#0c0c0e"/>
          <rect width="8" height="8" fill="#f4f4f4"/>
          <rect x="8" y="8" width="8" height="8" fill="#f4f4f4"/>
        </pattern>
        <clipPath id="flclip"><polygon points="${flClip}"/></clipPath>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#sky)"/>
      <rect width="${W}" height="${H}" fill="url(#glow)"/>
      ${glass}
      <polygon points="${sunPts}" fill="${p.sun}"/>
      <polygon points="0,${HZ.toFixed(0)} ${farHills}" fill="${p.asphalt[1]}" opacity=".55"/>
      ${stands}
      ${gantry}
      <polygon points="${track}" fill="url(#asphalt)"/>
      <rect x="0" y="${(yFL0 - 2).toFixed(0)}" width="${W}" height="${(yFL1 - yFL0 + 4).toFixed(0)}" fill="url(#checker)" clip-path="url(#flclip)"/>
      ${dashes}
      ${leftKerb}
      ${rightKerb}
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
