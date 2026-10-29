# MD Viewer

A lightweight Windows desktop app for **viewing and editing Markdown (`.md`) files** —
like Notepad, but purpose-built for Markdown with clean, GitHub-style rendering
(comparable to VSCode's Markdown preview, `Ctrl+Shift+V`).

Built with **Neutralinojs + WebView2** — the app uses the OS's built-in WebView2
(no bundled Chromium), so the final EXE is only a few MB.

## Features

- **View + Edit modes** — switch with the toolbar tabs (or `Ctrl+E`).
- **GitHub-style rendering** — `markdown-it` with GFM tables, task lists,
  strikethrough, and typographer.
- **Syntax highlighting** — fenced code blocks via `highlight.js`.
- **Math** — inline `$...$` and block `$$...$$` via **KaTeX** (fonts vendored, works offline).
- **Light / Dark theme** — toggle with 🌓 (or `Ctrl+Shift+T`); preference remembered.
- **Table of Contents sidebar** — auto-generated from headings, click to scroll (toggle with `Ctrl+B`).
- **Export as PDF** — one-click PDF export (`Ctrl+Shift+P`); the rendered
  document is saved to a file you pick, keeping the Markdown structure
  (headings, tables, code blocks, math, lists) clean and tidy.
- **Print** — standard print dialog (`Ctrl+P`); use "Save as PDF" there for
  selectable-text output, or send to a printer.
- **Drag & drop** — drop a `.md` file onto the window to open it.
- **Safe rendering** — output sanitized with DOMPurify.

## Keyboard shortcuts

| Shortcut         | Action                  |
| ---------------- | ----------------------- |
| `Ctrl+O`         | Open file               |
| `Ctrl+S`         | Save file               |
| `Ctrl+P`         | Print                   |
| `Ctrl+Shift+P`   | Export as PDF (file)    |
| `Ctrl+E`         | Toggle View / Edit      |
| `Ctrl+B`         | Toggle TOC sidebar      |
| `Ctrl+Shift+T`   | Toggle light/dark theme |

## Development

```bash
npm install          # install dependencies
npm run dev          # copy assets, watch-bundle JS, and launch (neu run)
```

`npm run dev` runs esbuild in watch mode over `src/` and launches the app via `neu run`.

## Build a release EXE

```bash
npm run build
```

Produces a single self-contained executable at:

```
dist/md-viewer/md-viewer-win_x64.exe
```

(Resources are embedded via `--embed-resources`, so it's one portable file, ~4–5 MB.
Requires WebView2, which ships with Windows 10/11.)

## Install & file association (Windows)

To make MD Viewer appear in the **"Open with"** menu and open `.md` files on
double-click, run the installer after building. It works **per-user, without
administrator rights** — it copies the EXE to `%LOCALAPPDATA%\MD Viewer\` and
registers the `.md` / `.markdown` / `.mdown` / `.mkd` association in `HKCU`.

```bash
npm run build         # build the EXE first
npm run install:app   # copy EXE + register file association
```

Then right-click any `.md` file → **Open with → MD Viewer** (tick *Always* to
make it the default). Double-clicking a `.md` file will open it directly in the
rendered view.

To remove it:

```bash
npm run uninstall:app
```


## Project structure

```
src/            App source (bundled by esbuild)
  main.js         Entry: init, UI wiring, mode switching, shortcuts
  renderer.js     markdown-it + KaTeX + highlight.js + DOMPurify pipeline
  editor.js       CodeMirror 6 (Edit mode)
  toc.js          Table-of-contents builder
  io.js           Open/save dialogs + filesystem
  theme.js        Light/dark toggle + persistence
  styles.css      App chrome (copied to resources/css/app.css)
scripts/
  copy-assets.js  Vendors CSS/fonts/client-lib into resources/
resources/      Runtime assets loaded by the webview
samples/
  demo.md         Feature showcase
neutralino.config.json
```

## License

[MIT](LICENSE)

## Credits

- Icons: `trayIcon.png` by [Freepik](https://www.freepik.com) via [Flaticon](https://www.flaticon.com).
- Built on [Neutralinojs](https://neutralino.js.org).
