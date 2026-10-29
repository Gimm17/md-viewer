// main.js — app entry: init Neutralino, wire UI, mode switching, shortcuts.

import html2pdf from "html2pdf.js";
import { renderMarkdown } from "./renderer.js";
import { buildToc, syncActiveToc } from "./toc.js";
import {
  createEditor,
  setEditorDoc,
  getEditorDoc,
  setEditorTheme,
} from "./editor.js";
import { loadTheme, toggleTheme, isDark } from "./theme.js";
import {
  openFileDialog,
  readFile,
  saveFile,
  exportPdfDialog,
  basename,
} from "./io.js";

// ---------- App state ----------
const state = {
  path: null,
  content: "",
  mode: "view", // "view" | "edit"
  dirty: false,
  editor: null,
};

// ---------- DOM refs ----------
const el = {};
function cacheEls() {
  el.filename = document.getElementById("filename");
  el.dirtyDot = document.getElementById("dirty-dot");
  el.preview = document.getElementById("preview");
  el.editorHost = document.getElementById("editor");
  el.sidebar = document.getElementById("sidebar");
  el.toc = document.getElementById("toc");
  el.content = document.getElementById("content");
  el.tabView = document.getElementById("tab-view");
  el.tabEdit = document.getElementById("tab-edit");
  el.btnToc = document.getElementById("btn-toc");
  el.btnOpen = document.getElementById("btn-open");
  el.btnSave = document.getElementById("btn-save");
  el.btnPrint = document.getElementById("btn-print");
  el.btnExport = document.getElementById("btn-export");
  el.btnTheme = document.getElementById("btn-theme");
}

// ---------- Rendering ----------
function renderPreview() {
  el.preview.innerHTML = renderMarkdown(state.content);
  buildToc(el.preview, el.toc, (target) => {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function setDirty(v) {
  state.dirty = v;
  el.dirtyDot.classList.toggle("hidden", !v);
}

function updateTitle() {
  const name = basename(state.path);
  el.filename.textContent = name;
  el.filename.title = state.path || "No file open";
  try {
    Neutralino.window.setTitle(`${name}${state.dirty ? " *" : ""} — MD Viewer`);
  } catch (_) {
    /* ignore */
  }
}

// ---------- Mode switching ----------
function ensureEditor() {
  if (state.editor) return;
  state.editor = createEditor(
    el.editorHost,
    state.content,
    (doc) => {
      state.content = doc;
      setDirty(true);
      updateTitle();
    },
    isDark()
  );
}

function setMode(mode) {
  if (mode === state.mode) return;
  state.mode = mode;
  const editing = mode === "edit";

  el.tabView.classList.toggle("active", !editing);
  el.tabEdit.classList.toggle("active", editing);
  el.tabView.setAttribute("aria-selected", String(!editing));
  el.tabEdit.setAttribute("aria-selected", String(editing));

  if (editing) {
    ensureEditor();
    setEditorDoc(state.editor, state.content);
    el.preview.classList.add("hidden");
    el.editorHost.classList.remove("hidden");
    state.editor.focus();
  } else {
    if (state.editor) state.content = getEditorDoc(state.editor);
    el.editorHost.classList.add("hidden");
    el.preview.classList.remove("hidden");
    renderPreview();
  }
}

// ---------- File actions ----------
function loadDocument(path, content) {
  state.path = path;
  state.content = content;
  setDirty(false);
  if (state.editor) setEditorDoc(state.editor, content);
  updateTitle();
  if (state.mode === "view") renderPreview();
}

async function doOpen() {
  try {
    const res = await openFileDialog();
    if (res) loadDocument(res.path, res.content);
  } catch (e) {
    await msg("Open failed", String(e && e.message ? e.message : e));
  }
}

async function doSave() {
  try {
    if (state.mode === "edit" && state.editor) {
      state.content = getEditorDoc(state.editor);
    }
    const saved = await saveFile(state.path, state.content);
    if (saved) {
      state.path = saved;
      setDirty(false);
      updateTitle();
      if (state.mode === "view") renderPreview();
    }
  } catch (e) {
    await msg("Save failed", String(e && e.message ? e.message : e));
  }
}

function doPrint() {
  // Ensure preview reflects latest content before printing.
  if (state.mode === "edit" && state.editor) {
    state.content = getEditorDoc(state.editor);
    renderPreview();
  }
  window.print();
}

/**
 * Export the rendered document as a PDF file via html2pdf.js + Neutralino.
 * Captures the live #preview (already styled & laid out like the on-screen
 * Markdown) so the PDF keeps the same structure — headings, tables, code
 * blocks, math, lists. Theme is forced light only on html2canvas's clone.
 */
async function doExportPdf() {
  // Make sure the preview reflects the latest content.
  if (state.mode === "edit" && state.editor) {
    state.content = getEditorDoc(state.editor);
  }
  if (!state.content.trim()) {
    await msg("Export PDF", "Nothing to export — open a Markdown file first.");
    return;
  }
  // Prompt save path first (fast, no heavy work yet).
  const suggested = pdfDefaultName();
  const target = await exportPdfDialog(suggested);
  if (!target) return;

  // Render into the live preview and make sure it is VISIBLE (needed in Edit
  // mode where #preview has class "hidden").  We restore everything in finally.
  renderPreview();
  const wasHidden = el.preview.classList.contains("hidden");
  if (wasHidden) el.preview.classList.remove("hidden");

  try {
    // html2pdf.js's pagebreak plugin is incompatible with jsPDF v4 and throws
    // an unhandled rejection AFTER the PDF bytes are produced. We avoid the
    // buggy legacy pagebreak path entirely (break-inside rules are already
    // handled via CSS in #preview), and add a one-shot guard that swallows any
    // stray post-resolution rejection so it can't pop the error dialog.
    const rejectGuard = (reason) => {
      // Stray rejection after a successful export — ignore it.
      console.warn("html2pdf stray rejection (ignored):", reason);
    };
    window.addEventListener("unhandledrejection", rejectGuard);

    const buf = await html2pdf()
      .set({
        margin: [0.6, 0.6, 0.7, 0.6],
        filename: suggested,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          backgroundColor: "#ffffff",
          useCORS: true,
          onclone: (clonedDoc) => {
            // Force light theme on the captured clone only (no visible flash).
            clonedDoc.documentElement.setAttribute("data-theme", "light");
          },
        },
        jsPDF: {
          unit: "in",
          format: "a4",
          orientation: "portrait",
          compress: true,
        },
        // Disable legacy pagebreak mode (the part that crashes on jsPDF v4);
        // CSS-based break-inside avoidance in #preview handles pagination.
        pagebreak: { mode: ["css"] },
      })
      .from(el.preview)
      .outputPdf("arraybuffer");

    await Neutralino.filesystem.writeBinaryFile(target, buf);
    await msg("Export PDF", "Saved:\n" + target);

    // Drop the guard after the export settled successfully.
    window.removeEventListener("unhandledrejection", rejectGuard);
  } catch (e) {
    await msg("Export PDF failed", String(e && e.message ? e.message : e));
  } finally {
    if (wasHidden) el.preview.classList.add("hidden");
  }
}

/** Suggested PDF filename derived from the open file's name. */
function pdfDefaultName() {
  const n = basename(state.path);
  return (n.replace(/\.[^.]+$/, "") || "export") + ".pdf";
}

async function doToggleTheme() {
  const t = await toggleTheme();
  if (state.editor) setEditorTheme(state.editor, t === "dark");
}

function toggleSidebar() {
  el.sidebar.classList.toggle("hidden");
}

async function msg(title, content) {
  try {
    await Neutralino.os.showMessageBox(title, content, "OK", "ERROR");
  } catch (_) {
    console.error(title, content);
  }
}

// ---------- Events ----------
function wireEvents() {
  el.tabView.addEventListener("click", () => setMode("view"));
  el.tabEdit.addEventListener("click", () => setMode("edit"));
  el.btnOpen.addEventListener("click", doOpen);
  el.btnSave.addEventListener("click", doSave);
  el.btnPrint.addEventListener("click", doPrint);
  el.btnExport.addEventListener("click", doExportPdf);
  el.btnTheme.addEventListener("click", doToggleTheme);
  el.btnToc.addEventListener("click", toggleSidebar);

  // Active-heading highlight while scrolling preview.
  el.content.addEventListener("scroll", () => {
    if (state.mode === "view") syncActiveToc(el.content, el.toc);
  });

  // External links -> system browser.
  el.preview.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-external]");
    if (a) {
      e.preventDefault();
      Neutralino.os.open(a.getAttribute("href"));
    }
  });

  // Keyboard shortcuts.
  document.addEventListener("keydown", (e) => {
    const ctrl = e.ctrlKey || e.metaKey;
    if (!ctrl) return;
    const k = e.key.toLowerCase();
    if (k === "o") { e.preventDefault(); doOpen(); }
    else if (k === "s") { e.preventDefault(); doSave(); }
    else if (e.shiftKey && k === "p") { e.preventDefault(); doExportPdf(); }
    else if (k === "p") { e.preventDefault(); doPrint(); }
    else if (k === "e") { e.preventDefault(); setMode(state.mode === "view" ? "edit" : "view"); }
    else if (k === "b") { e.preventDefault(); toggleSidebar(); }
    else if (e.shiftKey && k === "t") { e.preventDefault(); doToggleTheme(); }
  });

  // Drag-and-drop files.
  Neutralino.events.on("filesDropped", async (ev) => {
    const paths = (ev && ev.detail && ev.detail.files) || [];
    const md = paths.find((p) => /\.(md|markdown|mdown|mkd|txt)$/i.test(p)) || paths[0];
    if (md) {
      try {
        const res = await readFile(md);
        loadDocument(res.path, res.content);
      } catch (e) {
        await msg("Open failed", String(e && e.message ? e.message : e));
      }
    }
  });

  Neutralino.events.on("windowClose", () => Neutralino.app.exit());
}

// ---------- Boot ----------
async function boot() {
  Neutralino.init();
  cacheEls();
  wireEvents();
  const theme = await loadTheme();
  if (state.editor) setEditorTheme(state.editor, theme === "dark");
  renderPreview();

  // Open a file passed as CLI arg (e.g. via file association), if any.
  try {
    const args = window.NL_ARGS || [];
    const fileArg = args
      .slice(1)
      .find((a) => /\.(md|markdown|mdown|mkd|txt)$/i.test(a));
    if (fileArg) {
      const res = await readFile(fileArg);
      loadDocument(res.path, res.content);
    }
  } catch (_) {
    /* ignore */
  }
}

boot();
