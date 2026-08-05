/* DragonOS Virtual File System — persisted to localStorage */
const DragonFS = (() => {
  const KEY = 'dragonos_fs_v1';

  const TRASH_META_KEY = 'dragonos_trash_meta_v1';

  function defaultFS() {
    return {
      '/': { type: 'dir', children: ['Documents', 'Pictures', 'Desktop', 'Trash'] },
      '/Documents': { type: 'dir', children: ['welcome.txt', 'todo.txt'] },
      '/Pictures': { type: 'dir', children: [] },
      '/Desktop': { type: 'dir', children: [] },
      '/Trash': { type: 'dir', children: [] },
      '/Documents/welcome.txt': {
        type: 'file',
        content: 'Welcome to DragonOS 🐉\n\nThis is a fully in-browser operating system.\n\n- Double-click icons to open apps\n- Right-click the desktop for options\n- Open Settings to change your wallpaper and theme\n- Everything you save here persists in this browser via localStorage\n\nEnjoy!'
      },
      '/Documents/todo.txt': { type: 'file', content: '- Take over the world\n- Or just enjoy this OS\n- Either way' }
    };
  }

  let fs = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // migration: ensure /Trash exists for filesystems created before Recycle Bin was added
        if (!parsed['/Trash']) {
          parsed['/Trash'] = { type: 'dir', children: [] };
          if (parsed['/'] && !parsed['/'].children.includes('Trash')) parsed['/'].children.push('Trash');
        }
        return parsed;
      }
    } catch (e) {}
    const d = defaultFS();
    localStorage.setItem(KEY, JSON.stringify(d));
    return d;
  }

  function loadTrashMeta() {
    try { return JSON.parse(localStorage.getItem(TRASH_META_KEY)) || {}; } catch (e) { return {}; }
  }
  function saveTrashMeta(m) { localStorage.setItem(TRASH_META_KEY, JSON.stringify(m)); }
  let trashMeta = loadTrashMeta();

  function save() {
    localStorage.setItem(KEY, JSON.stringify(fs));
  }

  function normalize(path) {
    if (path === '' ) return '/';
    if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
    return path;
  }

  function parentOf(path) {
    if (path === '/') return null;
    const idx = path.lastIndexOf('/');
    return idx === 0 ? '/' : path.slice(0, idx);
  }

  function nameOf(path) {
    if (path === '/') return '/';
    return path.slice(path.lastIndexOf('/') + 1);
  }

  function exists(path) { return !!fs[normalize(path)]; }
  function isDir(path) { const n = fs[normalize(path)]; return n && n.type === 'dir'; }

  function list(path) {
    path = normalize(path);
    const node = fs[path];
    if (!node || node.type !== 'dir') return [];
    return node.children.slice().sort((a, b) => a.localeCompare(b));
  }

  function read(path) {
    const node = fs[normalize(path)];
    return node && node.type === 'file' ? node.content : null;
  }

  function write(path, content) {
    path = normalize(path);
    const parent = parentOf(path);
    if (!fs[path]) {
      if (!fs[parent] || fs[parent].type !== 'dir') return false;
      fs[parent].children.push(nameOf(path));
      fs[path] = { type: 'file', content: '' };
    }
    fs[path].content = content;
    save();
    return true;
  }

  function mkdir(path) {
    path = normalize(path);
    if (fs[path]) return false;
    const parent = parentOf(path);
    if (!fs[parent] || fs[parent].type !== 'dir') return false;
    fs[parent].children.push(nameOf(path));
    fs[path] = { type: 'dir', children: [] };
    save();
    return true;
  }

  function touch(path) {
    path = normalize(path);
    if (fs[path]) return false;
    return write(path, '');
  }

  function remove(path) {
    path = normalize(path);
    if (path === '/' || !fs[path]) return false;
    const node = fs[path];
    if (node.type === 'dir') {
      node.children.slice().forEach(c => remove(path === '/' ? '/' + c : path + '/' + c));
    }
    const parent = parentOf(path);
    if (fs[parent]) fs[parent].children = fs[parent].children.filter(c => c !== nameOf(path));
    delete fs[path];
    save();
    return true;
  }

  function rename(path, newName) {
    path = normalize(path);
    const parent = parentOf(path);
    const newPath = parent === '/' ? '/' + newName : parent + '/' + newName;
    if (fs[newPath] || !fs[path]) return false;
    fs[newPath] = fs[path];
    delete fs[path];
    fs[parent].children = fs[parent].children.filter(c => c !== nameOf(path));
    fs[parent].children.push(newName);
    if (fs[newPath].type === 'dir') {
      // recursively fix children paths
      const fixChildren = (oldBase, newBase) => {
        Object.keys(fs).forEach(k => {
          if (k.startsWith(oldBase + '/')) {
            const suffix = k.slice(oldBase.length);
            const nk = newBase + suffix;
            fs[nk] = fs[k];
            delete fs[k];
          }
        });
      };
      fixChildren(path, newPath);
    }
    save();
    return true;
  }

  function reset() {
    fs = defaultFS();
    trashMeta = {};
    saveTrashMeta(trashMeta);
    save();
  }

  // Move a node (and its subtree) to a new parent directory, keeping/renaming its own name.
  function move(path, destParent, forcedName) {
    path = normalize(path);
    destParent = normalize(destParent);
    if (!fs[path] || !fs[destParent] || fs[destParent].type !== 'dir') return null;
    const parent = parentOf(path);
    let name = forcedName || nameOf(path);
    let destPath = destParent === '/' ? '/' + name : destParent + '/' + name;
    // avoid collisions in the destination
    let i = 1;
    const base = name.replace(/(\.[^.]*)?$/, '');
    const ext = name.slice(base.length);
    while (fs[destPath]) {
      name = `${base} (${i})${ext}`;
      destPath = destParent === '/' ? '/' + name : destParent + '/' + name;
      i++;
    }
    fs[destPath] = fs[path];
    delete fs[path];
    if (fs[parent]) fs[parent].children = fs[parent].children.filter(c => c !== nameOf(path));
    fs[destParent].children.push(name);
    if (fs[destPath].type === 'dir') {
      const fixChildren = (oldBase, newBase) => {
        Object.keys(fs).forEach(k => {
          if (k.startsWith(oldBase + '/')) {
            const suffix = k.slice(oldBase.length);
            const nk = newBase + suffix;
            fs[nk] = fs[k];
            delete fs[k];
          }
        });
      };
      fixChildren(path, destPath);
    }
    save();
    return destPath;
  }

  // Recycle Bin
  function trash(path) {
    path = normalize(path);
    if (path === '/' || path === '/Trash' || !fs[path]) return false;
    const origin = path;
    const destPath = move(path, '/Trash');
    if (!destPath) return false;
    trashMeta[nameOf(destPath)] = origin;
    saveTrashMeta(trashMeta);
    return true;
  }

  function listTrash() {
    return list('/Trash').map(name => ({ name, path: '/Trash/' + name, origin: trashMeta[name] || null }));
  }

  function restore(trashName) {
    const trashPath = '/Trash/' + trashName;
    if (!fs[trashPath]) return false;
    const origin = trashMeta[trashName];
    const destParent = origin ? (parentOf(origin) || '/') : '/';
    const destName = origin ? nameOf(origin) : trashName;
    if (!fs[destParent]) {
      const restored = move(trashPath, '/');
      delete trashMeta[trashName];
      saveTrashMeta(trashMeta);
      return restored;
    }
    const restored = move(trashPath, destParent, destName);
    delete trashMeta[trashName];
    saveTrashMeta(trashMeta);
    return restored;
  }

  function emptyTrash() {
    listTrash().forEach(item => remove(item.path));
    trashMeta = {};
    saveTrashMeta(trashMeta);
  }

  return { list, read, write, mkdir, touch, remove, rename, move, exists, isDir, normalize, parentOf, nameOf, reset, trash, listTrash, restore, emptyTrash };
})();
