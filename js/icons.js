/* DragonOS custom icon set — flat SVG glyphs, no emoji */
const Icons = (() => {
  const glyphs = {
    explorer: '<path d="M3 7a1 1 0 0 1 1-1h4.5l1.5 1.8H20a1 1 0 0 1 1 1V17a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7z"/>',
    trash: '<path d="M5 7h14M9.5 7V5.2a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V7M7 7l.9 11.2a1 1 0 0 0 1 .8h6.2a1 1 0 0 0 1-.8L17 7"/><path d="M10.3 10.5v5M13.7 10.5v5"/>',
    'trash-full': '<path d="M5 7h14M9.5 7V5.2a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V7M7 7l.9 11.2a1 1 0 0 0 1 .8h6.2a1 1 0 0 0 1-.8L17 7"/><path d="M8.3 9.2 9.5 15.5M12 9.2v6.3M15.7 9.2l-1.2 6.3" stroke-width="1.9"/>',
    notepad: '<path d="M6 3.5h9l4 4V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z"/><path d="M15 3.5V8h4M8.2 12h7.6M8.2 15h7.6M8.2 9h3.5"/>',
    terminal: '<rect x="3" y="4.5" width="18" height="15" rx="2"/><path d="M7 9.5 10.5 12 7 14.5M12.5 15h5"/>',
    browser: '<circle cx="12" cy="12" r="8.3"/><path d="M3.7 12h16.6M12 3.7c2.3 2.3 3.5 5.3 3.5 8.3s-1.2 6-3.5 8.3c-2.3-2.3-3.5-5.3-3.5-8.3s1.2-6 3.5-8.3z"/>',
    calculator: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M7.5 6.8h9M7.5 11h1.6M7.5 14.3h1.6M7.5 17.6h1.6M11.2 11h1.6M11.2 14.3h1.6M11.2 17.6h1.6M14.9 11v6.6"/>',
    notes: '<path d="M5.5 4h13a1 1 0 0 1 1 1v9.8L14.3 20H5.5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/><path d="M19.5 14.8H15a1 1 0 0 0-1 1v4.5"/><path d="M8 8.5h8M8 12h5.3"/>',
    photos: '<rect x="3.3" y="4.5" width="17.4" height="15" rx="2"/><circle cx="8.3" cy="9.3" r="1.7"/><path d="m4.5 17.5 5-5.3 3.4 3.5 3-3.3 4.6 5.1"/>',
    paint: '<path d="M12 4a8 8 0 1 0 0 16h.7a1.7 1.7 0 0 0 1.2-2.9 1.7 1.7 0 0 1 1.2-2.9H17a4 4 0 0 0 4-4c0-3.9-4-6.2-9-6.2z"/><circle cx="7.8" cy="12.3" r="1.1"/><circle cx="9.6" cy="8.6" r="1.1"/><circle cx="14" cy="8" r="1.1"/><circle cx="17" cy="10.8" r="1.1"/>',
    media: '<rect x="3" y="4.5" width="18" height="13" rx="2"/><path d="M10.3 8.3v5.4l4.6-2.7z" fill="#fff" stroke="none"/><path d="M8 20.5h8"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 9.8h17M8 3v4M16 3v4"/><path d="M8 13.5h2M12 13.5h2M16 13.5h1M8 17h2M12 17h2"/>',
    weather: '<path d="M6.8 18.3a4 4 0 0 1-.4-8 5.4 5.4 0 0 1 10.4-1.7 3.9 3.9 0 0 1-.8 9.7H6.8z"/><path d="M9 4V2.4M4.6 6.6 3.4 5.4M13.8 4.5l.9-1.3" stroke-width="1.4"/>',
    taskmgr: '<rect x="3.5" y="3.5" width="17" height="17" rx="2"/><path d="M8 16.5v-4M12 16.5v-7M16 16.5v-2.5"/>',
    snake: '<rect x="3.5" y="3.5" width="17" height="17" rx="2"/><path d="M7 8h6a2.5 2.5 0 0 1 0 5H9a2.5 2.5 0 0 0 0 5h6.5"/><circle cx="16.8" cy="8" r="1.1" fill="#fff" stroke="none"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l1.9-1.4-2-3.4-2.2.8a7.6 7.6 0 0 0-2.6-1.5L14 2.5h-4l-.5 2.5a7.6 7.6 0 0 0-2.6 1.5l-2.2-.8-2 3.4L4.6 10.5a7.6 7.6 0 0 0 0 3L2.7 15l2 3.4 2.2-.8c.76.66 1.64 1.17 2.6 1.5l.5 2.4h4l.5-2.4a7.6 7.6 0 0 0 2.6-1.5l2.2.8 2-3.4-1.9-1.5z"/>',
    about: '<path d="M4 15.5c1.3-6 4.7-11 8-11 3.7 0 6.6 3 6.6 7 0 3-1.7 5-4 5-1.4 0-2.3-.9-2.3-2.2 0-1.7 1.4-3.3 1.4-4.8 0-.8-.5-1.3-1.2-1.3-1.7 0-3 2.6-3 5.4 0 1 .2 1.7.2 1.7-2 1.4-4.3 2.3-5.7 2.3z"/><circle cx="16.2" cy="8.6" r=".9" fill="#fff" stroke="none"/>',
    dragon: '<path d="M4 15.5c1.3-6 4.7-11 8-11 3.7 0 6.6 3 6.6 7 0 3-1.7 5-4 5-1.4 0-2.3-.9-2.3-2.2 0-1.7 1.4-3.3 1.4-4.8 0-.8-.5-1.3-1.2-1.3-1.7 0-3 2.6-3 5.4 0 1 .2 1.7.2 1.7-2 1.4-4.3 2.3-5.7 2.3z"/><circle cx="16.2" cy="8.6" r=".9" fill="#fff" stroke="none"/>',
    launchpad: '<rect x="4" y="4" width="6.2" height="6.2" rx="1.6"/><rect x="13.8" y="4" width="6.2" height="6.2" rx="1.6"/><rect x="4" y="13.8" width="6.2" height="6.2" rx="1.6"/><rect x="13.8" y="13.8" width="6.2" height="6.2" rx="1.6"/>',
    file: '<path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z"/><path d="M14 3.5V8h4M9 12h6M9 15.3h6M9 18.6h3.5"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M19.5 19.5 15 15"/>',
    refresh: '<path d="M20 11A8 8 0 1 0 18.6 16.8"/><path d="M20 4.5v6.5h-6.5"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    undo: '<path d="M9 7 4 12l5 5"/><path d="M4 12h10.5a5.5 5.5 0 0 1 0 11H13"/>',
    edit: '<path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3z"/><path d="M14 6.5l3.5 3.5"/>',
    save: '<path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4M7 14h10v6H7z"/>',
    upload: '<path d="M12 16V6M8 10l4-4 4 4"/><path d="M5 18.5h14"/>',
    'folder-open': '<path d="M3 7.5a1 1 0 0 1 1-1h4.3l1.4 1.7H20a1 1 0 0 1 1 1l-1.7 8.8a1 1 0 0 1-1 .8H5.7a1 1 0 0 1-1-.8L3 7.5z"/>',
    home: '<path d="M4 11 12 4l8 7"/><path d="M6 10v9a1 1 0 0 0 1 1h4v-5h2v5h4a1 1 0 0 0 1-1v-9"/>',
    monitor: '<rect x="3" y="4.5" width="18" height="12" rx="1.5"/><path d="M9 20h6M12 16.5V20"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3.2 2"/>',
    person: '<circle cx="12" cy="8.3" r="3.3"/><path d="M5 20c1-4 4-6 7-6s6 2 7 6"/>',
    accessibility: '<circle cx="12" cy="5" r="1.8"/><path d="M4.5 8.5h15M12 8.5v5m0 0-3.5 7M12 13.5l3.5 7M8.5 12.5l-2 2M15.5 12.5l2 2"/>',
    sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 3v2.3M12 18.7V21M4.2 12H1.9M22.1 12h-2.3M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6"/>',
    moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/>',
    'moon-stars': '<path d="M18.3 14.6A7.6 7.6 0 1 1 9.8 6a6.3 6.3 0 0 0 8.5 8.6z"/><path d="M19.5 3.2v3.1M18 4.7h3" stroke-width="1.4"/>',
    'cloud-rain': '<path d="M6.5 17.5a3.8 3.8 0 0 1-.4-7.6 5.2 5.2 0 0 1 9.9-1.6 3.7 3.7 0 0 1-.6 9.2H6.5z"/><path d="M8.5 19.3l-1 2M12 19.3l-1 2M15.5 19.3l-1 2"/>',
    snowflake: '<path d="M12 3v18M4.7 7.5l14.6 9M19.3 7.5l-14.6 9"/>',
    music: '<circle cx="7" cy="18" r="2.4"/><circle cx="17" cy="16" r="2.4"/><path d="M9.4 18V6.5L19.4 4v11.5"/>',
    chevronUp: '<path d="M6 15l6-6 6 6"/>',
    chevronLeft: '<path d="M15 6l-6 6 6 6"/>',
    chevronRight: '<path d="M9 6l6 6-6 6"/>',
    chevronDown: '<path d="M6 9l6 6 6-6"/>',
    fileGeneric: '<path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z"/>'
  };
  /* Restrained DragonOS palette — six families, each a soft-to-deep pair.
     Every icon is assigned one family; glyph shape (not hue) carries identity. */
  const family = {
    blue: ['#8fc7ff', '#3f7fd9'],
    violet: ['#b9a3f5', '#6c4fd4'],
    slate: ['#c3cad6', '#6b7686'],
    slateDeep: ['#7c8698', '#3d4552'],
    orange: ['#ffbe86', '#e8813a'],
    emerald: ['#8fe0b8', '#2a9d63'],
    cyan: ['#8fe3ea', '#2a9bab']
  };
  const colors = {
    explorer: family.blue, trash: family.slate, 'trash-full': family.orange, notepad: family.orange,
    terminal: family.slateDeep, browser: family.cyan, calculator: family.slate,
    notes: family.orange, photos: family.violet, paint: family.violet,
    media: family.violet, calendar: family.orange, weather: family.cyan,
    taskmgr: family.emerald, snake: family.emerald, settings: family.slate,
    about: family.orange, dragon: family.orange, launchpad: family.violet,
    search: family.slate, file: family.slate, music: family.violet,
    sun: family.orange, 'cloud-rain': family.cyan, snowflake: family.cyan
  };
  function svg(id) {
    const g = glyphs[id] || glyphs.about;
    const [c1, c2] = colors[id] || family.slate;
    const gid = 'ic-g-' + id, hid = 'ic-h-' + id, sid = 'ic-s-' + id, cid = 'ic-c-' + id;
    return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="rgba(255,255,255,.96)" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round">` +
      `<defs>` +
        `<linearGradient id="${gid}" x1="0" y1="0" x2="0.85" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>` +
        `<linearGradient id="${hid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
        `<linearGradient id="${sid}" x1="0" y1="0" x2="0" y2="1"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".16"/></linearGradient>` +
        `<clipPath id="${cid}"><rect x="1" y="1" width="22" height="22" rx="5.3"/></clipPath>` +
      `</defs>` +
      `<g clip-path="url(#${cid})">` +
        `<rect x="1" y="1" width="22" height="22" fill="url(#${gid})"/>` +
        `<rect x="1" y="1" width="22" height="22" fill="url(#${sid})"/>` +
        `<rect x="1" y="1" width="22" height="11" fill="url(#${hid})"/>` +
      `</g>` +
      `<rect x="1.4" y="1.4" width="21.2" height="21.2" rx="5" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width=".7"/>` +
      g + `</svg>`;
  }
  function html(id, cls) {
    return `<span class="app-icon${cls ? ' ' + cls : ''}">${svg(id)}</span>`;
  }

  /* Monochrome line glyphs for menu bar / chrome UI (no colored tile) */
  const monoGlyphs = {
    search: '<circle cx="10.2" cy="10.2" r="6.2"/><path d="M19 19l-4.3-4.3"/>',
    wifi: '<path d="M3 8.5a13 13 0 0 1 18 0"/><path d="M6 12a8.5 8.5 0 0 1 12 0"/><path d="M9 15.5a4 4 0 0 1 6 0"/><circle cx="12" cy="19" r="1" fill="currentColor" stroke="none"/>',
    battery: '<rect x="2.5" y="8" width="16" height="8" rx="1.6"/><path d="M20.5 10.5v3" stroke-linecap="round"/><rect x="4.3" y="9.8" width="10.5" height="4.4" rx=".6" fill="currentColor" stroke="none"/>',
    control: '<path d="M4 7h9M17 7h3M4 12h3M9 12h11M4 17h13M19 17h1"/><circle cx="12" cy="7" r="1.6" fill="currentColor" stroke="currentColor"/><circle cx="6.5" cy="12" r="1.6" fill="currentColor" stroke="currentColor"/><circle cx="16.5" cy="17" r="1.6" fill="currentColor" stroke="currentColor"/>',
    rocket: '<path d="M12 2.5c2.8 1.4 4.6 4.4 4.6 8.3 0 2-.5 3.7-1.2 5l-3.4 3.7-3.4-3.7c-.7-1.3-1.2-3-1.2-5 0-3.9 1.8-6.9 4.6-8.3z"/><circle cx="12" cy="10" r="1.7"/><path d="M8.4 15.6 6 17.3l.6-3.3M15.6 15.6 18 17.3l-.6-3.3M10 19.8l2 2 2-2"/>',
    grid: '<rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1.5"/><rect x="14" y="3.5" width="6.5" height="6.5" rx="1.5"/><rect x="3.5" y="14" width="6.5" height="6.5" rx="1.5"/><rect x="14" y="14" width="6.5" height="6.5" rx="1.5"/>'
  };
  function monoSvg(id) {
    const g = monoGlyphs[id];
    if (!g) return '';
    return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${g}</svg>`;
  }

  /* Inline glyph (no tile/background), for use next to text in menus, lists, buttons */
  function inlineSvg(id) {
    const g = glyphs[id] || monoGlyphs[id];
    if (!g) return '';
    return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${g}</svg>`;
  }
  function inline(id, cls) {
    return `<span class="icon-inline${cls ? ' ' + cls : ''}">${inlineSvg(id)}</span>`;
  }
  return { svg, html, monoSvg, inlineSvg, inline };
})();
