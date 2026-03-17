# Invoice Generator

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.0.0-green.svg)]()
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-5a0fc8.svg)]()
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-None-success.svg)]()
[![Offline First](https://img.shields.io/badge/Offline-First-orange.svg)]()
[![No Build Step](https://img.shields.io/badge/Build-None-yellow.svg)]()
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen.svg)](CONTRIBUTING.md)

**The offline-first invoice generator that works anywhere.**

No accounts. No servers. No subscriptions. Just open your browser and start invoicing.

---

## Features

### Core

| Feature | Description |
|---------|-------------|
| **Instant Invoice Creation** | Create, edit, and manage invoices with a clean, fast interface |
| **4 Professional Templates** | Modern, Classic, Minimal, and Bold — each with refined typography and layout |
| **Tax Calculation** | Configurable tax rate and label (GST, VAT, Sales Tax, etc.) with automatic calculation |
| **Client Management** | Save client details, track total billed, and auto-fill on new invoices |
| **Invoice Templates** | Save frequently-used invoice structures as reusable templates |
| **PDF Export** | One-click PDF generation with professional formatting |
| **Offline-First PWA** | Works without internet. Install as an app on any device |
| **Dark & Light Theme** | Easy on the eyes, day or night |
| **Data Import/Export** | Full backup and restore via JSON. Migrate between devices seamlessly |
| **Bulk Actions** | Select multiple invoices or clients for batch export or deletion |
| **Search & Filter** | Find invoices by status, client, or free-text search |

### PDF Templates

```
┌─────────────────────────────────────────────┐
│  MODERN          CLASSIC        MINIMAL     │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐ │
│  │ Dark bar │   │ Navy top │   │          │ │
│  │ Status   │   │ Bordered │   │ Clean    │ │
│  │ badges   │   │ detail   │   │ type     │ │
│  │ Clean    │   │ box      │   │ Lots of  │ │
│  │ table    │   │ Serif    │   │ white    │ │
│  └──────────┘   │ type     │   │ space    │ │
│                 └──────────┘   └──────────┘ │
│  BOLD                                       │
│  ┌──────────┐                               │
│  │ Charcoal │                               │
│  │ + Amber  │                               │
│  │ accent   │                               │
│  └──────────┘                               │
└─────────────────────────────────────────────┘
```

Each template includes: subtotal, tax breakdown, and total due.

---

## Quick Start

### Option 1: Open Directly

```bash
git clone https://github.com/ndmh99/freelance-invoice-generator.git
cd freelance-invoice-generator
open index.html
```

### Option 2: Local Server

```bash
# Python
python -m http.server 8000

# Node.js
npx serve .

# Then open http://localhost:8000
```

### Option 3: Install as PWA

1. Open the app in your browser
2. Click the install icon in the address bar
3. Launch from your desktop or home screen

---

## Usage

### Creating an Invoice

1. Click **New Invoice** or press the `+` button
2. Select a client (or create one inline)
3. Add line items with description, quantity, and rate
4. Set tax rate and label (optional)
5. Click **Save** to store or **Export PDF** to download

### Configuring Tax

Set default tax in **Settings**:
- **Tax Rate** — percentage applied to subtotal (e.g., `5`)
- **Tax Label** — display name (e.g., `GST`, `VAT`, `Sales Tax`)

Override per-invoice when needed.

### Managing Clients

- Track client contact info, address, and tax ID
- View total billed per client
- Client data auto-fills when creating invoices

### Data Backup

Export all data (invoices, clients, settings, templates) as JSON from **Settings → Export All Data**. Import on any device to restore.

---

## Tech Stack

```
Vanilla JavaScript  ·  No build step  ·  No dependencies
```

| Component | Technology |
|-----------|------------|
| PDF Generation | [jsPDF](https://github.com/parallax/jsPDF) |
| PDF Parsing | [PDF.js](https://mozilla.github.io/pdf.js/) |
| Storage | `localStorage` |
| Offline | Service Worker + Cache API |
| Install | Web App Manifest (PWA) |

Zero npm packages. Zero build tools. Zero server-side code.

---

## Project Structure

```
freelance-invoice-generator/
├── index.html      # App shell and markup
├── styles.css      # All styles (dark/light themes)
├── app.js          # UI logic, event binding, state management
├── data.js         # Data layer (localStorage CRUD, calculations)
├── pdf.js          # PDF template definitions and rendering
├── sw.js           # Service worker for offline support
└── manifest.json   # PWA manifest for installability
```

---

## Browser Support

| Browser | Minimum Version |
|---------|----------------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |

Requires a modern browser with ES2020 support, `jsPDF`, and `localStorage`.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

<p align="center">
  <sub>Built for freelancers who value simplicity.</sub>
</p>
