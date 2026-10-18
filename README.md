# HACS Repositories

Search and discover [Home Assistant Community Store (HACS)](https://hacs.xyz/) repositories with instant filtering, sorting, and stats.

[![CI](https://github.com/HugoGresse/hacs-repositories/actions/workflows/ci.yml/badge.svg)](https://github.com/HugoGresse/hacs-repositories/actions/workflows/ci.yml)
[![Daily HACS Data Sync](https://github.com/HugoGresse/hacs-repositories/actions/workflows/update-data.yml/badge.svg)](https://github.com/HugoGresse/hacs-repositories/actions/workflows/update-data.yml)
[![Deploy to GitHub Pages](https://github.com/HugoGresse/hacs-repositories/actions/workflows/deploy.yml/badge.svg)](https://github.com/HugoGresse/hacs-repositories/actions/workflows/deploy.yml)

---

## Architecture Overview

```
[HACS Default Repositories] + [GitHub GraphQL API / HACS data-v2]
                           │
                           ▼ (Daily GitHub Action)
               [scripts/fetch-packages.ts]
                           │
                           ▼
               [public/data/packages.json]
                           │
                           ▼
                    [Astro SSG Build]
                           │
                           ▼
            [GitHub Pages / Cloudflare Pages]
```

This project has been redesigned to run **100% serverless** with zero backend infrastructure costs or limitations:

- **No Cloud Function Timeouts**: Data fetching is executed inside scheduled GitHub Actions with a 6-hour execution ceiling (eliminating Firebase 540s timeouts).
- **No Firestore Quotas or Document Limits**: The catalog is saved as static, compressed JSON datasets (`public/data/packages.json`), removing the Firestore 1MB document cap.
- **Ultra-Fast Static Astro Frontend**: Built with **Astro 5**, **React 19**, and **Tailwind CSS v4**, providing instant, debounced multi-token search and filtering across 4,200+ packages at 60 FPS.
- **Automated Daily Sync**: A GitHub Action runs daily at `03:00 UTC` to sync new repositories from `hacs/default`, query GitHub GraphQL for stars/forks/watchers/issues, fall back to `data-v2.hacs.xyz` when rate-limited, and automatically deploy the updated site.

---

## Features

- **Instant Full-Text Search**: Search by repository name, author/owner, description, or topic tags with keyboard shortcut (`/`).
- **Flexible Sorting**:
  - Recently updated
  - Most stars
  - Newest added
  - Most forks
  - Alphabetical (A-Z)
- **Category Filtering**: Integration, Plugin (Lovelace cards), AppDaemon Apps, NetDaemon Apps, Python scripts, Themes.
- **Metric Range Sliders**: Filter by minimum stars, forks, watchers, and maximum open issues.
- **Dark & Light Mode**: Automatic system preference detection with persistent toggle.
- **One-Click Actions**: Direct GitHub links, copy repository clone URLs, and category badges.

---

## Local Development

### Prerequisites

- [Node.js](https://nodejs.org/) v20+ (v22 or v24 recommended)
- [pnpm](https://pnpm.io/) v9+ (or npm)

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Fetch Catalog Data

Fetch the package catalog. For fast local development (under 2 seconds using HACS data-v2):

```bash
pnpm run fetch-data:fast
```

To run a quick sample with GitHub GraphQL metadata (first 20 per category):

```bash
GITHUB_TOKEN=your_token pnpm run fetch-data:quick
```

To run the full pipeline across all 4,200+ repositories:

```bash
GITHUB_TOKEN=your_token pnpm run fetch-data
```

### 3. Start Development Server

```bash
pnpm run dev
```

Open [http://localhost:4321](http://localhost:4321) in your browser.

### 4. Build for Production

```bash
pnpm run build
pnpm run preview
```

---

## CI / CD Workflows

| Workflow | File | Trigger | Purpose |
|---|---|---|---|
| **CI** | `.github/workflows/ci.yml` | Push & PR | Runs `pnpm run check` (typecheck) and `pnpm run build` |
| **Data Sync** | `.github/workflows/update-data.yml` | Cron (`0 3 * * *`) & Manual | Fetches latest HACS package data via `scripts/fetch-packages.ts` and commits changes |
| **Deploy** | `.github/workflows/deploy.yml` | Push to `master` & Manual | Builds Astro static site and deploys to GitHub Pages |

---

## License & Credits

- Created by [Hugo Gresse](https://hugo.gresse.io)
- Modernized & migrated to Astro by [Mauro Druwel](https://github.com/MauroDruwel)
- Licensed under the [MIT License](LICENSE.md)
