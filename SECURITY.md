# Security Policy

## Scope

Invoice Generator is a client-side-only application. All data is stored in the browser's `localStorage`. No data is transmitted to any server.

## Data Storage

- Invoices, clients, settings, and templates are stored in `localStorage`
- Data never leaves the user's device unless explicitly exported via the JSON backup feature
- PDF generation happens entirely in the browser using jsPDF

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do not** open a public issue
2. Email the maintainer directly with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

You should receive an acknowledgment within 48 hours.

## Known Limitations

- `localStorage` is origin-scoped and accessible to any JavaScript running on the same origin
- `localStorage` has a storage limit (typically 5-10 MB)
- Data is not encrypted at rest
- This application is designed for personal/small-business use on trusted devices

## Dependencies

Invoice Generator uses the following third-party libraries loaded via CDN:

| Library | Purpose | Source |
|---------|---------|--------|
| jsPDF | PDF generation | https://cdnjs.cloudflare.com |
| PDF.js | PDF text extraction | https://mozilla.github.io |

These libraries are loaded at runtime. Pin versions in `index.html` to prevent supply chain issues.
