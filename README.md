<div align="center">

# 📝 MD Viewer

### Lightweight Windows Desktop Markdown Viewer & Editor (Neutralinojs + WebView2)

[![Neutralinojs](https://img.shields.io/badge/Neutralinojs-WebView2-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://neutralino.js.org/)
[![CodeMirror](https://img.shields.io/badge/Editor-CodeMirror%206-D30707?style=for-the-badge)](https://codemirror.net/)
[![KaTeX](https://img.shields.io/badge/Math-KaTeX%20Offline-329B8C?style=for-the-badge)](https://katex.org/)
[![Platform](https://img.shields.io/badge/Platform-Windows%2010%20%2F%2011-0078D6?style=for-the-badge&logo=windows&logoColor=white)](https://www.microsoft.com/windows)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

*Purpose-built like Notepad for `.md` files — crisp GitHub-style rendering, offline KaTeX math, live editing, TOC navigation, and one-click PDF export in a ~4–5 MB portable EXE.*

</div>

---

## ✨ Features

| Feature | Details |
| :--- | :--- |
| **View + Edit Modes** | Switch cleanly via toolbar tabs or `Ctrl+E` (powered by **CodeMirror 6**) |
| **GitHub-Style Rendering** | `markdown-it` with GFM tables, task lists, strikethrough, and typographer |
| **Syntax Highlighting** | Fenced code blocks highlighted offline via `highlight.js` |
| **Offline Math (KaTeX)** | Inline `$...$` and block `$$...$$` math with vendored fonts |
| **Light / Dark Theme** | Toggle via toolbar button or `Ctrl+Shift+T` with saved preference |
| **Table of Contents** | Auto-generated heading sidebar (`Ctrl+B`) with smooth click-to-scroll |
| **Export to PDF & Print** | One-click PDF export (`Ctrl+Shift+P`) or standard Print (`Ctrl+P`) |
| **Drag & Drop + Safe HTML** | Drop `.md` files directly onto the window; sanitized via **DOMPurify** |

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl+O` | Open file |
| `Ctrl+S` | Save file |
| `Ctrl+P` | Print |
| `Ctrl+Shift+P` | Export as PDF |
| `Ctrl+E` | Toggle View / Edit |
| `Ctrl+B` | Toggle TOC sidebar |
| `Ctrl+Shift+T` | Toggle light / dark theme |

---

## 📁 Project Structure

```text
md-viewer/
├── src/
│   ├── main.js               # Entry: init, UI wiring, mode switching, shortcuts
│   ├── renderer.js           # markdown-it + KaTeX + highlight.js + DOMPurify
│   ├── editor.js             # CodeMirror 6 editor
│   ├── toc.js                # Table-of-contents builder
│   ├── io.js                 # Open/save dialogs + filesystem access
│   ├── theme.js              # Light/dark toggle + persistence
│   └── styles.css            # Application chrome
├── scripts/
│   └── copy-assets.js        # Vendors CSS/fonts/client-lib into resources/
├── resources/                # Runtime assets loaded by WebView2
├── samples/demo.md           # Feature showcase Markdown
└── neutralino.config.json
```

---

## 🚀 Development, Build & Windows File Association

```bash
# 1. Install dependencies
npm install

# 2. Run in development mode (esbuild watch + neu run)
npm run dev

# 3. Build single self-contained Windows EXE (~4–5 MB)
npm run build
# Output: dist/md-viewer/md-viewer-win_x64.exe

# 4. Register "Open with -> MD Viewer" per-user (no admin required)
npm run install:app

# Uninstall file association
npm run uninstall:app
```

---

## 📄 License & Credits

- [MIT License](LICENSE)
- Built with [Neutralinojs](https://neutralino.js.org) and Windows WebView2
- Tray icon (`trayIcon.png`) by Freepik via Flaticon
