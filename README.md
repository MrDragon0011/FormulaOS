# 🐉 DragonOS

A full web-based operating system — window manager, taskbar, start menu, virtual file system, and built-in apps — running entirely in the browser with zero build step.

## Apps
- 📁 File Explorer (virtual FS persisted to `localStorage`)
- 📝 Notepad (save/open files)
- ⌨️ Terminal (`ls`, `cd`, `cat`, `mkdir`, `touch`, `rm`, `neofetch`, `open <app>`, ...)
- 🌐 Browser (iframe-based)
- 🧮 Calculator
- 🗒️ Sticky Notes
- 🖼️ Photos / wallpaper picker
- ⚙️ Settings (theme, accent color, wallpaper)

## Run locally
No build step — just serve the static files:

```bash
npx serve .
# or
python3 -m http.server 8080
```

Then open http://localhost:8080 (or the port shown).

## Deploy

### Netlify
```bash
npx netlify-cli deploy --prod
```
(config already in `netlify.toml` — publish directory is `.`)

### Vercel
```bash
npx vercel --prod
```
(config already in `vercel.json`)

Both are zero-config static deployments — no build command needed.
