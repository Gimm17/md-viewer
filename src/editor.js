// editor.js — CodeMirror 6 setup for Edit mode.

import { EditorState, Compartment } from "@codemirror/state";
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  drawSelection,
} from "@codemirror/view";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import {
  syntaxHighlighting,
  defaultHighlightStyle,
  indentOnInput,
  bracketMatching,
} from "@codemirror/language";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { oneDark } from "@codemirror/theme-one-dark";

const themeCompartment = new Compartment();

/**
 * Create a CodeMirror editor.
 * @param {HTMLElement} parent
 * @param {string} initialDoc
 * @param {(doc:string)=>void} onChange
 * @param {boolean} dark
 * @returns {EditorView}
 */
export function createEditor(parent, initialDoc, onChange, dark) {
  const updateListener = EditorView.updateListener.of((v) => {
    if (v.docChanged) onChange(v.state.doc.toString());
  });

  const state = EditorState.create({
    doc: initialDoc || "",
    extensions: [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightActiveLine(),
      history(),
      drawSelection(),
      indentOnInput(),
      bracketMatching(),
      highlightSelectionMatches(),
      EditorView.lineWrapping,
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      markdown({ base: markdownLanguage, codeLanguages: [] }),
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        ...searchKeymap,
        indentWithTab,
      ]),
      themeCompartment.of(dark ? oneDark : []),
      updateListener,
    ],
  });

  return new EditorView({ state, parent });
}

/** Replace the whole document (e.g. after opening a file). */
export function setEditorDoc(view, doc) {
  view.dispatch({
    changes: { from: 0, to: view.state.doc.length, insert: doc || "" },
  });
}

/** Get current document text. */
export function getEditorDoc(view) {
  return view.state.doc.toString();
}

/** Switch editor light/dark theme. */
export function setEditorTheme(view, dark) {
  view.dispatch({
    effects: themeCompartment.reconfigure(dark ? oneDark : []),
  });
}
