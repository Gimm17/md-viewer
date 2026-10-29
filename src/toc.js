// toc.js — build a table of contents from rendered headings.

let headingEls = [];

/**
 * Slugify heading text into a valid id.
 */
function slugify(text, used) {
  let base = text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  if (!base) base = "section";
  let slug = base;
  let i = 1;
  while (used.has(slug)) {
    slug = `${base}-${i++}`;
  }
  used.add(slug);
  return slug;
}

/**
 * Scan the preview for h1-h4, assign ids, and build the TOC nav.
 * @param {HTMLElement} previewEl
 * @param {HTMLElement} tocEl
 * @param {(el:HTMLElement)=>void} onClickScroll
 */
export function buildToc(previewEl, tocEl, onClickScroll) {
  const used = new Set();
  headingEls = Array.from(previewEl.querySelectorAll("h1, h2, h3, h4"));

  if (headingEls.length === 0) {
    tocEl.innerHTML = '<div class="toc-empty">No headings</div>';
    return;
  }

  const ul = document.createElement("ul");
  headingEls.forEach((h) => {
    if (!h.id) h.id = slugify(h.textContent || "", used);
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.textContent = h.textContent || "";
    a.href = `#${h.id}`;
    a.className = `toc-${h.tagName.toLowerCase()}`;
    a.dataset.target = h.id;
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const target = document.getElementById(h.id);
      if (target) onClickScroll(target);
    });
    li.appendChild(a);
    ul.appendChild(li);
  });

  tocEl.innerHTML = "";
  tocEl.appendChild(ul);
}

/**
 * Highlight the TOC entry nearest the top of the scroll container.
 * @param {HTMLElement} scrollContainer
 * @param {HTMLElement} tocEl
 */
export function syncActiveToc(scrollContainer, tocEl) {
  if (headingEls.length === 0) return;
  const top = scrollContainer.scrollTop;
  let activeId = headingEls[0].id;
  for (const h of headingEls) {
    if (h.offsetTop - 80 <= top) activeId = h.id;
    else break;
  }
  tocEl.querySelectorAll("a").forEach((a) => {
    a.classList.toggle("active", a.dataset.target === activeId);
  });
}
