// scripts/copy-assets.js
// Vendors CSS/fonts/client-lib from node_modules into resources/ so the app
// runs fully offline. Scopes GitHub-markdown and highlight.js themes under
// html[data-theme="light|dark"] so the in-app theme toggle switches both.

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const nm = path.join(root, "node_modules");
const resCss = path.join(root, "resources", "css");
const resFonts = path.join(resCss, "fonts");
const resJs = path.join(root, "resources", "js");

function ensureDir(d) {
  fs.mkdirSync(d, { recursive: true });
}

function read(p) {
  return fs.readFileSync(p, "utf8");
}

function write(p, content) {
  fs.writeFileSync(p, content, "utf8");
  console.log("  wrote", path.relative(root, p));
}

function copy(src, dest) {
  fs.copyFileSync(src, dest);
  console.log("  copied", path.relative(root, dest));
}

/**
 * Prefix every occurrence of `selector` with a theme scope so the two
 * stylesheets can coexist and be toggled via html[data-theme].
 */
function scope(css, selector, scopeSel) {
  // Replace ".markdown-body" -> `${scopeSel} .markdown-body`, but not when it's
  // already part of a longer class name.
  const re = new RegExp(escapeRe(selector) + "(?![\\w-])", "g");
  return css.replace(re, scopeSel + " " + selector);
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

ensureDir(resCss);
ensureDir(resFonts);
ensureDir(resJs);

console.log("Copying vendored assets -> resources/ ...");

// 1) GitHub markdown CSS (light + dark, scoped + merged).
{
  const light = read(
    path.join(nm, "github-markdown-css", "github-markdown-light.css")
  );
  const dark = read(
    path.join(nm, "github-markdown-css", "github-markdown-dark.css")
  );
  const merged =
    "/* github-markdown-css (light) scoped */\n" +
    scope(light, ".markdown-body", 'html[data-theme="light"]') +
    "\n\n/* github-markdown-css (dark) scoped */\n" +
    scope(dark, ".markdown-body", 'html[data-theme="dark"]') +
    "\n";
  write(path.join(resCss, "github-markdown.css"), merged);
}

// 2) highlight.js themes (light + dark, scoped + merged).
{
  const light = read(path.join(nm, "highlight.js", "styles", "github.css"));
  const dark = read(path.join(nm, "highlight.js", "styles", "github-dark.css"));
  const merged =
    "/* highlight.js github (light) scoped */\n" +
    scope(light, ".hljs", 'html[data-theme="light"]') +
    "\n\n/* highlight.js github-dark (dark) scoped */\n" +
    scope(dark, ".hljs", 'html[data-theme="dark"]') +
    "\n";
  write(path.join(resCss, "highlight-github.css"), merged);
}

// 3) KaTeX CSS + fonts.
{
  copy(
    path.join(nm, "katex", "dist", "katex.min.css"),
    path.join(resCss, "katex.min.css")
  );
  const fontsDir = path.join(nm, "katex", "dist", "fonts");
  let n = 0;
  for (const f of fs.readdirSync(fontsDir)) {
    if (f.endsWith(".woff2")) {
      copy(path.join(fontsDir, f), path.join(resFonts, f));
      n++;
    }
  }
  console.log(`  (${n} KaTeX woff2 fonts)`);
}

// 4) App chrome CSS (src/styles.css -> resources/css/app.css).
copy(path.join(root, "src", "styles.css"), path.join(resCss, "app.css"));

// 5) Neutralino client library.
{
  const candidates = [
    path.join(nm, "@neutralinojs", "neu", "src", "cli", "neutralino.js"),
    path.join(nm, "@neutralinojs", "neu", "bin", "neutralino.js"),
  ];
  const existing = candidates.find((p) => fs.existsSync(p));
  const destClient = path.join(resJs, "neutralino.js");
  if (existing) {
    copy(existing, destClient);
  } else if (fs.existsSync(destClient)) {
    console.log("  (kept existing resources/js/neutralino.js from scaffold)");
  } else {
    console.warn(
      "  WARNING: neutralino.js client not found; run `neu update` to fetch it."
    );
  }
}

console.log("Done.");
