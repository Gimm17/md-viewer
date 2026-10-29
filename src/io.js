// io.js — file open/save via Neutralino dialogs + filesystem.

const DIR_KEY = "lastDir";

async function getLastDir() {
  try {
    const d = await Neutralino.storage.getData(DIR_KEY);
    return d || undefined;
  } catch (_) {
    return undefined;
  }
}

async function rememberDir(path) {
  const idx = Math.max(path.lastIndexOf("\\"), path.lastIndexOf("/"));
  if (idx > 0) {
    try {
      await Neutralino.storage.setData(DIR_KEY, path.slice(0, idx));
    } catch (_) {
      /* ignore */
    }
  }
}

export function basename(path) {
  if (!path) return "Untitled";
  const idx = Math.max(path.lastIndexOf("\\"), path.lastIndexOf("/"));
  return idx >= 0 ? path.slice(idx + 1) : path;
}

/**
 * Show open dialog + read file.
 * @returns {Promise<{path:string, content:string}|null>}
 */
export async function openFileDialog() {
  const defaultPath = await getLastDir();
  const entries = await Neutralino.os.showOpenDialog("Open Markdown file", {
    defaultPath,
    filters: [
      { name: "Markdown", extensions: ["md", "markdown", "mdown", "mkd"] },
      { name: "Text", extensions: ["txt"] },
      { name: "All files", extensions: ["*"] },
    ],
    multiSelections: false,
  });
  if (!entries || entries.length === 0) return null;
  return readFile(entries[0]);
}

/**
 * Read a file by path.
 * @returns {Promise<{path:string, content:string}>}
 */
export async function readFile(path) {
  const content = await Neutralino.filesystem.readFile(path);
  await rememberDir(path);
  return { path, content };
}

/**
 * Save content to an existing path, or prompt for a new one.
 * @param {string|null} path
 * @param {string} content
 * @returns {Promise<string|null>} the path saved to, or null if cancelled.
 */
export async function saveFile(path, content) {
  let target = path;
  if (!target) {
    target = await saveAsDialog();
    if (!target) return null;
  }
  await Neutralino.filesystem.writeFile(target, content);
  await rememberDir(target);
  return target;
}

/** Show save-as dialog. Returns chosen path or null. */
export async function saveAsDialog() {
  const defaultPath = await getLastDir();
  const chosen = await Neutralino.os.showSaveDialog("Save Markdown file", {
    defaultPath,
    filters: [
      { name: "Markdown", extensions: ["md", "markdown"] },
      { name: "All files", extensions: ["*"] },
    ],
  });
  if (!chosen) return null;
  // Ensure a sensible extension if the user typed none.
  if (!/\.[a-z0-9]+$/i.test(chosen)) return chosen + ".md";
  return chosen;
}

/**
 * Show a save dialog for exporting a PDF file.
 * @param {string} defaultName  e.g. "document.pdf"
 * @returns {Promise<string|null>} chosen path or null if cancelled.
 */
export async function exportPdfDialog(defaultName) {
  const defaultPath = await getLastDir();
  const initial = defaultPath
    ? defaultPath + "\\" + (defaultName || "export.pdf")
    : defaultName || "export.pdf";
  const chosen = await Neutralino.os.showSaveDialog("Export PDF", {
    defaultPath: initial,
    filters: [
      { name: "PDF", extensions: ["pdf"] },
      { name: "All files", extensions: ["*"] },
    ],
  });
  if (!chosen) return null;
  if (!/\.pdf$/i.test(chosen)) return chosen + ".pdf";
  return chosen;
}
