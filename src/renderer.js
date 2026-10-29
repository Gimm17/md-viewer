// renderer.js — Markdown -> sanitized HTML pipeline
// markdown-it + task-lists + texmath(KaTeX) + highlight.js, then DOMPurify.

import MarkdownIt from "markdown-it";
import taskLists from "markdown-it-task-lists";
import texmath from "markdown-it-texmath";
import katex from "katex";
import hljs from "highlight.js";
import DOMPurify from "dompurify";

const md = new MarkdownIt({
  html: true, // allow raw HTML (sanitized afterwards by DOMPurify)
  linkify: true,
  typographer: true,
  breaks: false,
  highlight(str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return (
          '<pre class="hljs"><code>' +
          hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
          "</code></pre>"
        );
      } catch (_) {
        /* fall through */
      }
    }
    return (
      '<pre class="hljs"><code>' +
      md.utils.escapeHtml(str) +
      "</code></pre>"
    );
  },
});

md.use(taskLists, { enabled: true, label: true });
md.use(texmath, {
  engine: katex,
  delimiters: "dollars",
  katexOptions: { throwOnError: false, output: "htmlAndMathml" },
});

// Open all links in the system browser instead of navigating the webview.
const defaultLinkOpen =
  md.renderer.rules.link_open ||
  function (tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
  };
md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  const token = tokens[idx];
  const href = token.attrGet("href") || "";
  if (/^https?:\/\//i.test(href)) {
    token.attrSet("target", "_blank");
    token.attrSet("rel", "noopener noreferrer");
    token.attrSet("data-external", "1");
  }
  return defaultLinkOpen(tokens, idx, options, env, self);
};

// DOMPurify config: keep target/rel and KaTeX/MathML output.
const purifyConfig = {
  ADD_ATTR: ["target", "rel", "data-external", "class", "aria-hidden"],
  ADD_TAGS: [
    "math", "semantics", "annotation", "mrow", "mi", "mo", "mn", "msup",
    "msub", "mfrac", "msqrt", "mroot", "mtable", "mtr", "mtd", "munder",
    "mover", "munderover", "mspace", "mtext", "mpadded", "mphantom",
    "menclose", "mstyle", "svg", "path", "line", "g",
  ],
  USE_PROFILES: { html: true, mathMl: true, svg: true },
};

/**
 * Render a markdown string into sanitized HTML.
 * @param {string} src
 * @returns {string}
 */
export function renderMarkdown(src) {
  const raw = md.render(src || "");
  return DOMPurify.sanitize(raw, purifyConfig);
}
