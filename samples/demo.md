# MD Viewer — Demo

Welcome to **MD Viewer**, a lightweight Markdown viewer & editor. This file shows
off what the renderer can do. Toggle **View / Edit** in the toolbar, flip the
theme with the 🌓 button, and open the **Contents** sidebar with ☰.

## Text formatting

You can write **bold**, *italic*, ***bold italic***, ~~strikethrough~~, and
`inline code`. Links open in your browser: [neutralino.js.org](https://neutralino.js.org).

> Blockquotes look like this.
>
> — with multiple paragraphs, too.

## Lists

- Unordered item
  - Nested item
  - Another nested item
- Back to top level

1. Ordered item one
2. Ordered item two
3. Ordered item three

### Task list

- [x] Set up the project
- [x] Render Markdown neatly
- [ ] Ship the EXE

## Table

| Feature        | Status | Notes                         |
| -------------- | :----: | ----------------------------- |
| Rendering      |   ✅   | GitHub-style via markdown-it  |
| Syntax highlight |  ✅   | highlight.js                  |
| Math           |   ✅   | KaTeX                         |
| PDF export     |   ✅   | one-click file (Ctrl+Shift+P) |

## Code with syntax highlighting

```javascript
function greet(name) {
  const message = `Hello, ${name}!`;
  console.log(message);
  return message;
}

greet("Markdown");
```

```python
def fib(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a
```

## Math (KaTeX)

Inline math renders like $E = mc^2$ and $\sqrt{a^2 + b^2}$ right in the text.

Block math is centered on its own line:

$$
\int_{-\infty}^{\infty} e^{-x^2}\,dx = \sqrt{\pi}
$$

$$
\frac{\partial}{\partial t}\Psi = \frac{i\hbar}{2m}\nabla^2\Psi
$$

## Blockquote with code

> Run the app in development mode:
>
> ```bash
> npm run dev
> ```

---

### Horizontal rules & emphasis

That line above is a horizontal rule. Below is a final note.

*Thanks for trying MD Viewer!* 🎉
