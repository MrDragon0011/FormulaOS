/* FormulaOS custom icon set — no emoji */
const Icons = (() => {
  let gradSeq = 0;

  /* Thin line glyphs — used ONLY inline next to text (menus, sidebars, buttons).
     currentColor stroke so they stay theme-adaptive; never placed on a tile. */
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
    media: '<rect x="3" y="4.5" width="18" height="13" rx="2"/><path d="M10.3 8.3v5.4l4.6-2.7z" fill="currentColor" stroke="none"/><path d="M8 20.5h8"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 9.8h17M8 3v4M16 3v4"/><path d="M8 13.5h2M12 13.5h2M16 13.5h1M8 17h2M12 17h2"/>',
    weather: '<path d="M6.8 18.3a4 4 0 0 1-.4-8 5.4 5.4 0 0 1 10.4-1.7 3.9 3.9 0 0 1-.8 9.7H6.8z"/><path d="M9 4V2.4M4.6 6.6 3.4 5.4M13.8 4.5l.9-1.3" stroke-width="1.4"/>',
    taskmgr: '<rect x="3.5" y="3.5" width="17" height="17" rx="2"/><path d="M8 16.5v-4M12 16.5v-7M16 16.5v-2.5"/>',
    snake: '<rect x="3.5" y="3.5" width="17" height="17" rx="2"/><path d="M7 8h6a2.5 2.5 0 0 1 0 5H9a2.5 2.5 0 0 0 0 5h6.5"/><circle cx="16.8" cy="8" r="1.1" fill="currentColor" stroke="none"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l1.9-1.4-2-3.4-2.2.8a7.6 7.6 0 0 0-2.6-1.5L14 2.5h-4l-.5 2.5a7.6 7.6 0 0 0-2.6 1.5l-2.2-.8-2 3.4L4.6 10.5a7.6 7.6 0 0 0 0 3L2.7 15l2 3.4 2.2-.8c.76.66 1.64 1.17 2.6 1.5l.5 2.4h4l.5-2.4a7.6 7.6 0 0 0 2.6-1.5l2.2.8 2-3.4-1.9-1.5z"/>',
    about: '<g transform="rotate(-12 12 12)"><path d="M6 5v15" stroke-width="1.6"/><rect x="7.5" y="6" width="11" height="8"/><path d="M7.5 10h11M10.25 6v8M13 6v8M15.75 6v8"/></g>',
    flag: '<g transform="rotate(-12 12 12)"><path d="M6 5v15" stroke-width="1.6"/><rect x="7.5" y="6" width="11" height="8"/><path d="M7.5 10h11M10.25 6v8M13 6v8M15.75 6v8"/></g>',
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
    fileGeneric: '<path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z"/>',
    trackatlas: '<path d="M4 6.3 10 4.3l4 2 6-2v13.4l-6 2-4-2-6 2z"/><path d="M10 4.3v13.4M14 6.3v13.4"/><circle cx="12" cy="10.5" r="1.6"/>',
    pitstrategy: '<circle cx="12" cy="13.5" r="7.8"/><path d="M10 2h4M16.3 3.6l1.4 1.4M12 13.5V8.7M12 13.5l3.4 2"/>',
    livetiming: '<circle cx="12" cy="17.3" r="1.5" fill="currentColor" stroke="none"/><path d="M8.6 14.6a4.9 4.9 0 0 1 6.8 0M5.9 11.9a8.8 8.8 0 0 1 12.2 0M3.3 9.2a12.6 12.6 0 0 1 17.4 0"/>'
  };

  /* Bold filled glyphs — used ONLY on glass tiles (dock, desktop, Launchpad).
     No glyph draws its own frame; the tile's squircle IS the silhouette. */
  const tileGlyphs = {
    explorer: '<path d="M4 7.3a1 1 0 0 1 1-1h4.3l1.6 1.9h8.1a1 1 0 0 1 1 1v8.4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" fill="#fff" fill-opacity=".95"/>',
    trash: '<rect x="6.3" y="6.1" width="11.4" height="1.8" rx=".9" fill="#fff"/><path d="M10 4.5a1 1 0 0 1 1-.9h2a1 1 0 0 1 1 .9v1.6h-4z" fill="#fff"/><path d="M7.3 9 8.2 18.7a1 1 0 0 0 1 .9h5.6a1 1 0 0 0 1-.9L16.7 9z" fill="#fff" fill-opacity=".95"/><path d="M10.3 11.2v6.2M13.7 11.2v6.2" stroke="rgba(0,0,0,.22)" stroke-width="1.1" fill="none"/>',
    'trash-full': '<rect x="6.3" y="6.1" width="11.4" height="1.8" rx=".9" fill="#fff"/><path d="M10 4.5a1 1 0 0 1 1-.9h2a1 1 0 0 1 1 .9v1.6h-4z" fill="#fff"/><path d="M7.3 9 8.2 18.7a1 1 0 0 0 1 .9h5.6a1 1 0 0 0 1-.9L16.7 9z" fill="#fff" fill-opacity=".95"/><path d="M10.3 11.2v6.2M13.7 11.2v6.2" stroke="rgba(0,0,0,.22)" stroke-width="1.1" fill="none"/>',
    notepad: '<path d="M6.3 4h8l4 4v11.7a1 1 0 0 1-1 1H6.3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" fill="#fff" fill-opacity=".95"/><path d="M14.3 4v3.6a1 1 0 0 0 1 1h3.7z" fill="rgba(0,0,0,.15)"/><path d="M8.3 12.2h7.4M8.3 15.4h7.4M8.3 9.2h4" stroke="rgba(0,0,0,.24)" stroke-width="1.1" fill="none"/>',
    terminal: '<path d="M7.3 8.7 11.6 12l-4.3 3.3" stroke="#fff" stroke-width="2.1" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect x="12.6" y="14.2" width="4.6" height="1.8" rx=".9" fill="#fff"/>',
    browser: '<circle cx="12" cy="12" r="8" fill="#fff" fill-opacity=".14"/><circle cx="12" cy="12" r="8" stroke="#fff" stroke-width="1.5" fill="none"/><path d="M4.3 12h15.4M12 4c2.2 2.2 3.4 5.1 3.4 8s-1.2 5.8-3.4 8c-2.2-2.2-3.4-5.1-3.4-8s1.2-5.8 3.4-8z" stroke="#fff" stroke-width="1.2" fill="none"/>',
    calculator: '<rect x="6.5" y="5" width="11" height="4.4" rx="1.2" fill="#fff" fill-opacity=".95"/><circle cx="8.3" cy="13" r="1.15" fill="#fff"/><circle cx="12" cy="13" r="1.15" fill="#fff"/><circle cx="15.7" cy="13" r="1.15" fill="#fff"/><circle cx="8.3" cy="17" r="1.15" fill="#fff"/><circle cx="12" cy="17" r="1.15" fill="#fff"/><circle cx="15.7" cy="17" r="1.15" fill="#fff"/>',
    notes: '<path d="M5.8 4.3h12.4a1 1 0 0 1 1 1v9.6L14.4 20H5.8a1 1 0 0 1-1-1V5.3a1 1 0 0 1 1-1z" fill="#fff" fill-opacity=".95"/><path d="M19.2 14.9h-4.3a1 1 0 0 0-1 1V20z" fill="rgba(0,0,0,.15)"/>',
    photos: '<circle cx="8.6" cy="8.6" r="2.1" fill="#fff"/><path d="M4.3 18.4 9.6 12l3.6 3.8 3.2-3.5 4.6 6.1a1 1 0 0 1-.8 1.6H5.1a1 1 0 0 1-.8-1.6z" fill="#fff" fill-opacity=".92"/>',
    paint: '<path d="M12 4a8 8 0 1 0 0 16h.7a1.7 1.7 0 0 0 1.2-2.9 1.7 1.7 0 0 1 1.2-2.9H17a4 4 0 0 0 4-4c0-3.9-4-6.2-9-6.2z" fill="#fff" fill-opacity=".92"/><circle cx="7.9" cy="12.3" r="1.15" fill="#e8813a"/><circle cx="9.6" cy="8.7" r="1.15" fill="#3f7fd9"/><circle cx="14" cy="8.1" r="1.15" fill="#2a9d63"/><circle cx="17" cy="10.8" r="1.15" fill="#c74f7a"/>',
    media: '<circle cx="12" cy="12" r="8" fill="#fff" fill-opacity=".14"/><circle cx="12" cy="12" r="8" stroke="#fff" stroke-width="1.4" fill="none"/><path d="M10.1 8.7v6.6l5.6-3.3z" fill="#fff"/>',
    calendar: '<path d="M5.8 5.6h12.4a1 1 0 0 1 1 1v11.8a1 1 0 0 1-1 1H5.8a1 1 0 0 1-1-1V6.6a1 1 0 0 1 1-1z" fill="#fff" fill-opacity=".95"/><path d="M4.8 9.8h14.4" stroke="rgba(0,0,0,.22)" stroke-width="1.2"/><rect x="8.2" y="12.4" width="3" height="3" rx=".7" fill="rgba(0,0,0,.3)"/><path d="M8.3 4.2v3M15.7 4.2v3" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>',
    weather: '<circle cx="16.3" cy="7.6" r="2.6" fill="#fff"/><path d="M6.8 18.3a4 4 0 0 1-.4-8 5.4 5.4 0 0 1 9-2.6 3.9 3.9 0 0 1 .2 10.6H6.8z" fill="#fff" fill-opacity=".95"/>',
    taskmgr: '<rect x="6.3" y="13" width="3" height="6.3" rx="1" fill="#fff"/><rect x="10.5" y="8.7" width="3" height="10.6" rx="1" fill="#fff"/><rect x="14.7" y="11" width="3" height="8.3" rx="1" fill="#fff"/>',
    snake: '<path d="M6.5 9.5h6a3 3 0 0 1 0 6H10a3 3 0 0 0 0 6h6.5" stroke="#fff" stroke-width="3.1" fill="none" stroke-linecap="round"/><circle cx="17.6" cy="9" r="1.3" fill="#fff"/>',
    settings: '<path fill-rule="evenodd" fill="#fff" fill-opacity=".95" d="M14 2.5h-4l-.5 2.5a7.6 7.6 0 0 0-2.6 1.5l-2.2-.8-2 3.4L4.6 10.5a7.6 7.6 0 0 0 0 3L2.7 15l2 3.4 2.2-.8c.76.66 1.64 1.17 2.6 1.5l.5 2.4h4l.5-2.4a7.6 7.6 0 0 0 2.6-1.5l2.2.8 2-3.4-1.9-1.5a7.6 7.6 0 0 0 0-3l1.9-1.4-2-3.4-2.2.8a7.6 7.6 0 0 0-2.6-1.5zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>',
    about: '<g transform="rotate(-12 12 12)"><rect x="5.7" y="4.5" width="1.7" height="16" rx=".85" fill="#fff"/><rect x="7.5" y="6" width="11" height="8" fill="none" stroke="#fff" stroke-width=".9" stroke-opacity=".55"/><rect x="7.5" y="6" width="2.75" height="4" fill="#fff"/><rect x="13" y="6" width="2.75" height="4" fill="#fff"/><rect x="10.25" y="10" width="2.75" height="4" fill="#fff"/><rect x="15.75" y="10" width="2.75" height="4" fill="#fff"/></g>',
    flag: '<g transform="rotate(-12 12 12)"><rect x="5.7" y="4.5" width="1.7" height="16" rx=".85" fill="#fff"/><rect x="7.5" y="6" width="11" height="8" fill="none" stroke="#fff" stroke-width=".9" stroke-opacity=".55"/><rect x="7.5" y="6" width="2.75" height="4" fill="#fff"/><rect x="13" y="6" width="2.75" height="4" fill="#fff"/><rect x="10.25" y="10" width="2.75" height="4" fill="#fff"/><rect x="15.75" y="10" width="2.75" height="4" fill="#fff"/></g>',
    launchpad: '<rect x="4.6" y="4.6" width="6" height="6" rx="1.7" fill="#fff"/><rect x="13.4" y="4.6" width="6" height="6" rx="1.7" fill="#fff"/><rect x="4.6" y="13.4" width="6" height="6" rx="1.7" fill="#fff"/><rect x="13.4" y="13.4" width="6" height="6" rx="1.7" fill="#fff"/>',
    file: '<path d="M7.3 3.6h6.6l4 4V20a1 1 0 0 1-1 1H7.3a1 1 0 0 1-1-1V4.6a1 1 0 0 1 1-1z" fill="#fff" fill-opacity=".95"/><path d="M13.9 3.6v3.6a1 1 0 0 0 1 1H18.5z" fill="rgba(0,0,0,.15)"/>',
    music: '<circle cx="7" cy="18" r="2.3" fill="#fff"/><circle cx="17" cy="16" r="2.3" fill="#fff"/><path d="M9.3 18V6.7L19.3 4.2v11.4" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round"/>',
    sun: '<circle cx="12" cy="12" r="4.3" fill="#fff"/><path d="M12 3v2.3M12 18.7V21M4.2 12H1.9M22.1 12h-2.3M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>',
    'cloud-rain': '<path d="M6.5 15.8a3.8 3.8 0 0 1-.4-7.6 5.2 5.2 0 0 1 9.9-1.6 3.7 3.7 0 0 1-.6 9.2H6.5z" fill="#fff" fill-opacity=".95"/><path d="M8.5 18.6l-.9 1.8M12 18.6l-.9 1.8M15.5 18.6l-.9 1.8" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>',
    snowflake: '<path d="M12 4v16M5.4 7.8l13.2 8.4M18.6 7.8 5.4 16.2" stroke="#fff" stroke-width="2" stroke-linecap="round"/>',
    trackatlas: '<path d="M4.3 6.6 10 4.6l4 2 5.7-2v12.8l-5.7 2-4-2-5.7 2z" fill="#fff" fill-opacity=".95"/><path d="M10 4.6v12.8M14 6.6v12.8" stroke="rgba(0,0,0,.22)" stroke-width="1.1"/><circle cx="12" cy="10.8" r="2" fill="rgba(0,0,0,.32)"/>',
    pitstrategy: '<circle cx="12" cy="13.3" r="7.6" fill="#fff" fill-opacity=".95"/><rect x="10" y="1.8" width="4" height="2.6" rx="1" fill="#fff"/><rect x="16" y="3.2" width="2.6" height="1.6" rx=".8" fill="#fff" transform="rotate(45 17.3 4)"/><path d="M12 13.3V8.6M12 13.3l3.3 1.9" stroke="rgba(0,0,0,.4)" stroke-width="1.3" stroke-linecap="round"/>',
    livetiming: '<circle cx="12" cy="13.3" r="7.6" fill="#fff" fill-opacity=".95"/><rect x="10" y="2.2" width="4" height="2.2" rx="1" fill="#fff"/><rect x="16.3" y="4.4" width="2.2" height="1.4" rx=".7" fill="#fff" transform="rotate(45 17.4 5.1)"/><path d="M12 13.3V9M12 13.3l2.8 1.6" stroke="rgba(0,0,0,.4)" stroke-width="1.3" stroke-linecap="round"/>'
  };

  /* Restrained FormulaOS palette — six families, each a soft-to-deep pair.
     Every icon is assigned one family; glyph shape (not hue) carries identity. */
  const family = {
    blue: ['#8fc7ff', '#3f7fd9'],
    violet: ['#b9a3f5', '#6c4fd4'],
    slate: ['#c3cad6', '#6b7686'],
    slateDeep: ['#7c8698', '#3d4552'],
    orange: ['#ffbe86', '#e8813a'],
    emerald: ['#8fe0b8', '#2a9d63'],
    cyan: ['#8fe3ea', '#2a9bab'],
    red: ['#ff6b5e', '#c81e1e']
  };
  const colors = {
    explorer: family.blue, trash: family.slate, 'trash-full': family.orange, notepad: family.orange,
    terminal: family.slateDeep, browser: family.cyan, calculator: family.slate,
    notes: family.orange, photos: family.violet, paint: family.violet,
    media: family.violet, calendar: family.orange, weather: family.cyan,
    taskmgr: family.emerald, snake: family.red, settings: family.slate,
    about: family.red, flag: family.red, launchpad: family.violet,
    search: family.slate, file: family.slate, music: family.violet,
    sun: family.orange, 'cloud-rain': family.cyan, snowflake: family.cyan,
    trackatlas: family.blue, pitstrategy: family.orange, livetiming: family.red
  };
  function svg(id) {
    const g = glyphs[id] || tileGlyphs[id] || glyphs.file;
    const [c1, c2] = colors[id] || family.slate;
    const gid = 'ic-g-' + id + '-' + (++gradSeq);
    return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="url(#${gid})" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" color="${c2}">` +
      `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>` +
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
    grid: '<rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1.5"/><rect x="14" y="3.5" width="6.5" height="6.5" rx="1.5"/><rect x="3.5" y="14" width="6.5" height="6.5" rx="1.5"/><rect x="14" y="14" width="6.5" height="6.5" rx="1.5"/>',
    trophy: '<path d="M7 4h10v4a5 5 0 0 1-10 0V4z"/><path d="M7 5H4a1 1 0 0 0-1 1v1a3 3 0 0 0 3 3"/><path d="M17 5h3a1 1 0 0 1 1 1v1a3 3 0 0 1-3 3"/><path d="M12 13v3"/><path d="M9 20h6"/><path d="M9.5 16.5h5l.5 3.5h-6z"/>'
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

  /* Stylized side-view F1 car — standalone graphic (not a 24x24 tile icon), used by the race widget */
  /* Neutral livery by default (no team colors) — matte carbon body, silver/white accents */
  function carSvg(body1, body2) {
    body1 = body1 || '#3a3d44'; body2 = body2 || '#121316';
    const dark = '#0a0b0d', rim = '#8a8f99', rimDark = '#3a3d44', tire = '#161719', accent = '#e6e8ec';
    return `<svg viewBox="0 0 260 92" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="rw-car-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${body1}"/><stop offset=".55" stop-color="${body1}"/><stop offset="1" stop-color="${body2}"/>
        </linearGradient>
        <linearGradient id="rw-car-rim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${rim}"/><stop offset="1" stop-color="${rimDark}"/>
        </linearGradient>
        <linearGradient id="rw-car-sheen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#fff" stop-opacity="0"/>
          <stop offset=".45" stop-color="#fff" stop-opacity=".22"/>
          <stop offset=".55" stop-color="#fff" stop-opacity="0"/>
        </linearGradient>
        <pattern id="rw-car-weave" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="4" height="4" fill="none"/>
          <path d="M0 0v4M2 0v4" stroke="#000" stroke-opacity=".12" stroke-width=".6"/>
        </pattern>
        <radialGradient id="rw-car-tire" cx=".35" cy=".3" r=".8">
          <stop offset="0" stop-color="#2a2c30"/><stop offset="1" stop-color="${tire}"/>
        </radialGradient>
      </defs>
      <ellipse cx="132" cy="83" rx="118" ry="5" fill="#000" opacity=".32"/>

      <!-- rear wing -->
      <rect x="221" y="15" width="3.4" height="22" fill="${dark}"/>
      <rect x="250" y="15" width="3.4" height="22" fill="${dark}"/>
      <path d="M219 18 254 18 254 22.6 219 22.6Z" fill="${dark}"/>
      <path d="M219 18 254 18 254 22.6 219 22.6Z" fill="url(#rw-car-sheen)"/>
      <rect x="219" y="27.5" width="35" height="3" rx="1" fill="${dark}" opacity=".75"/>
      <rect x="233" y="38" width="3" height="13" fill="${dark}"/>
      <rect x="230" y="49" width="9" height="3" rx="1" fill="${dark}"/>

      <!-- rear wheel -->
      <circle cx="212" cy="65" r="20" fill="url(#rw-car-tire)"/>
      <circle cx="212" cy="65" r="20" fill="none" stroke="#000" stroke-opacity=".4" stroke-width="1.2"/>
      <path d="M197.5 51.5a20 20 0 0 0 0 27" fill="none" stroke="#000" stroke-opacity=".25" stroke-width="1.6"/>
      <circle cx="212" cy="65" r="11.5" fill="url(#rw-car-rim)"/>
      <circle cx="212" cy="65" r="3.6" fill="${dark}"/>
      <path d="M212 55v20M200.5 65h23M203 55.5l18 19M221 55.5l-18 19" stroke="#4a4e57" stroke-width="1.1"/>

      <!-- floor / diffuser -->
      <path d="M160 71 228 71 235 79 152 79Z" fill="${dark}"/>
      <path d="M168 73.5h54M168 76h54" stroke="#000" stroke-opacity=".4" stroke-width=".8"/>

      <!-- sidepod undercut shadow -->
      <path d="M140 40 172 43 178 60 148 60Z" fill="${dark}" opacity=".6"/>

      <!-- body -->
      <path d="M4 57 24 48 60 39 95 36 117 35 144 36 180 42 212 53 212 61 186 61 186 66 60 66 60 61 24 61 4 61Z" fill="url(#rw-car-g)"/>
      <path d="M4 57 24 48 60 39 95 36 117 35 144 36 180 42 212 53 212 61 186 61 186 66 60 66 60 61 24 61 4 61Z" fill="url(#rw-car-weave)"/>
      <path d="M4 57 24 48 60 39 95 36 117 35 144 36 180 42 212 53 212 61 186 61 186 66 60 66 60 61 24 61 4 61Z" fill="url(#rw-car-sheen)"/>
      <path d="M64 61 216 61 216 64 64 64Z" fill="${dark}" opacity=".4"/>

      <!-- livery accent stripe (neutral silver, no team color) -->
      <path d="M62 40 106 36 101 51 58 55Z" fill="${accent}" opacity=".92"/>
      <path d="M108 35.6 143.5 36.5 139 52 103 51.5Z" fill="${accent}" opacity=".22"/>
      <circle cx="90" cy="45.5" r="6.4" fill="#151619"/>
      <circle cx="90" cy="45.5" r="6.4" fill="none" stroke="${accent}" stroke-width=".8" opacity=".7"/>

      <!-- halo + cockpit -->
      <path d="M100 36 Q113 12 136 35" fill="none" stroke="${dark}" stroke-width="4.6" stroke-linecap="round"/>
      <path d="M100 36 Q113 12 136 35" fill="none" stroke="#3a3d44" stroke-width="1.2" stroke-linecap="round" opacity=".6"/>
      <path d="M104 36 Q114 25 132 35Z" fill="#1c1e24"/>
      <circle cx="117" cy="29.5" r="5" fill="#c7cbd2"/>
      <circle cx="117" cy="29.5" r="5" fill="url(#rw-car-sheen)"/>
      <path d="M78 40 60 39" stroke="${dark}" stroke-width="2.4" stroke-linecap="round"/>
      <rect x="76" y="34" width="7" height="4.5" rx="1.5" fill="${dark}"/>

      <!-- front suspension arms -->
      <path d="M60 55 40 50M60 60 40 63" stroke="#4a4e57" stroke-width="1.4" stroke-linecap="round"/>

      <!-- front wing -->
      <rect x="0" y="53" width="28" height="3.4" rx="1" fill="${dark}"/>
      <rect x="0" y="58" width="28" height="2.6" rx="1" fill="${dark}" opacity=".75"/>
      <rect x="0" y="62" width="24" height="2" rx="1" fill="${dark}" opacity=".55"/>
      <rect x="0" y="49" width="3.2" height="16" fill="${dark}"/>
      <rect x="25" y="49" width="3.2" height="16" fill="${dark}"/>
      <path d="M2 49 26 49 26 51 2 51Z" fill="url(#rw-car-sheen)"/>

      <!-- front wheel -->
      <circle cx="40" cy="63" r="15.4" fill="url(#rw-car-tire)"/>
      <circle cx="40" cy="63" r="15.4" fill="none" stroke="#000" stroke-opacity=".4" stroke-width="1"/>
      <circle cx="40" cy="63" r="8.6" fill="url(#rw-car-rim)"/>
      <circle cx="40" cy="63" r="2.6" fill="${dark}"/>
      <path d="M40 55v16M32 63h16M34.3 57.3l11.4 11.4M45.7 57.3 34.3 68.7" stroke="#4a4e57" stroke-width=".95"/>
    </svg>`;
  }
  /* Standard multi-color Google "G" mark, required as-is on OAuth buttons */
  function googleSvg() {
    return `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.98v2.33A9 9 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.98A9 9 0 0 0 0 9c0 1.45.35 2.83.98 4.03z"/>
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .98 4.97L3.95 7.3C4.66 5.17 6.65 3.58 9 3.58z"/>
    </svg>`;
  }
  function googleButton(cls) {
    return `<span class="icon-google${cls ? ' ' + cls : ''}">${googleSvg()}</span>`;
  }

  return { svg, html, monoSvg, inlineSvg, inline, carSvg, googleSvg, googleButton };
})();
