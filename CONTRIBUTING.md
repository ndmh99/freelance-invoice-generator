# Contributing to Invoice Generator

Thank you for your interest in contributing to Invoice Generator. This document provides guidelines and information for contributors.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Open `index.html` in a browser (no build step required)
4. Make your changes
5. Test thoroughly
6. Submit a pull request

## Development Setup

Invoice Generator is a zero-dependency, no-build-step project. To develop locally:

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/freelance-invoice-generator.git
cd freelance-invoice-generator

# Serve locally (any static server works)
python -m http.server 8000
# or
npx serve .

# Open http://localhost:8000
```

No `npm install` required. No build commands. Just edit and refresh.

## Project Architecture

```
index.html    # Markup and app shell
styles.css    # All styling (uses CSS custom properties for theming)
app.js        # UI controller — event binding, rendering, state
data.js       # Data layer — localStorage CRUD, calculations
pdf.js        # PDF templates and generation via jsPDF
sw.js         # Service worker for offline caching
manifest.json # PWA configuration
```

### Data Flow

```
User Action → app.js (handler) → data.js (persist) → app.js (re-render)
                                                            ↓
                                                        localStorage
                                                            ↓
Invoices ← Browser download ← jsPDF ← pdf.js ← app.js ← Export PDF
```

## Code Style

### JavaScript

- Use `const` by default; `let` only when reassignment is necessary
- No `var`
- Single quotes for strings
- 2-space indentation
- No semicolons are acceptable (the project uses them, stay consistent)
- Descriptive function names: `getLineItems`, `updateInvoiceTotal`, `calcInvoiceSubtotal`
- Keep functions focused and under 50 lines when possible

### CSS

- Use CSS custom properties for all themeable values
- Class names use kebab-case: `.item-row`, `.template-card`
- Mobile-first responsive design
- No inline styles

### HTML

- Semantic elements where appropriate
- `id` attributes for JavaScript hooks
- `class` attributes for styling
- Accessible: use `<label>` for inputs, proper heading hierarchy

## Adding a PDF Template

### Quick Method

1. Create a new file in `pdf-templates/` folder (e.g., `my-template.js`)
2. Add your template using `PDFHandler.registerTemplate()`:

```javascript
PDFHandler.registerTemplate('my-template', {
  name: 'My Template',
  description: 'Brief description of the style',
  render: (doc, invoice, client, settings) => {
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    // Your rendering logic here
    // Use DataStore.calcInvoiceSubtotal(), calcInvoiceTax(), calcInvoiceTotal()
    // Access invoice.taxRate, invoice.taxLabel for tax display
  }
});
```

3. Add the filename (without `.js`) to `pdf-templates/template-loader.js` array:

```javascript
const templateFiles = [
  'modern',
  'classic', 
  'minimal',
  'bold',
  'vintage-purple',
  'my-template'  // <-- Add your template here
];
```

4. The template automatically appears in the template selector and settings

### Required Sections

Every template should render:
- Company info (from `settings`)
- Invoice number, dates, status
- Client info (from `client`)
- Line items table
- Subtotal, tax (when `invoice.taxRate > 0`), and total due
- Notes (when `invoice.notes` exists)
- Footer

## Reporting Issues

When reporting bugs, include:

1. **Browser and version** (e.g., Chrome 120, Firefox 121)
2. **Steps to reproduce** — numbered, specific
3. **Expected behavior** — what should happen
4. **Actual behavior** — what actually happens
5. **Console errors** — open DevTools and check for errors
6. **Data state** — if relevant, export your data via Settings → Export All Data

## Feature Requests

Open an issue describing:
- The problem you're trying to solve
- Your proposed solution
- How it benefits other users

## Pull Request Guidelines

- Keep PRs focused — one feature or fix per PR
- Update documentation if behavior changes
- Test in at least two browsers before submitting
- No build step changes unless absolutely necessary (the zero-dependency philosophy is core to the project)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
