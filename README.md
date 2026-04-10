# Pouch of Essentials

A shared family grocery list that works on any phone, syncs across everyone,
and has no servers, no subscriptions, and nothing that can be taken away.

**Live:** https://bemo5.github.io/pouch-of-essentials/

## How the sync works

- The app is hosted for free on **GitHub Pages**.
- The shared state (items + history) lives in a **private GitHub Gist** that
  you own. It's a single JSON file.
- Every device polls the gist every few seconds (using ETags so most polls
  are free) and pushes on change. A read‑merge‑write on every push means
  two people editing at once don't clobber each other.
- On the same device, tabs and the installed PWA window sync instantly via
  `BroadcastChannel` — no network round‑trip.

No accounts to manage, no database to pay for, nothing to deploy. If you ever
want to walk away, delete the gist — your data is gone. That's it.

## First-time setup (for you)

1. Open the live URL on your phone.
2. Tap **Open GitHub token page** in the welcome screen — it opens GitHub
   with the correct scope (`gist`) pre-filled.
3. Set an expiration (I recommend "No expiration" for family use) and tap
   **Generate token**. Copy it.
4. Paste it into the app and tap **Connect**. A new private gist is created
   automatically.
5. On iPhone: tap Share → Add to Home Screen. On Android: Chrome will prompt
   you to install.

## Sharing with family (the easy way)

1. Open Settings (the sync chip top-right).
2. Tap **Copy family setup link**.
3. Text it to your family.
4. They open the link on their phone — the token and gist are pre-filled,
   they tap **Connect**, done.

Only share the setup link with people you trust — it contains the token.

## Features

- Add items with optional quantity (`milk — 2L`).
- Mark any item **urgent** — urgent items pin to the top in a highlighted
  section.
- Check items off as you shop; done items fade and move to the bottom.
- When the whole list is done, it auto-archives into history.
- **History** tab with collapsible past lists.
- **Tombstones + last-write-wins merge** so concurrent edits and deletes
  converge cleanly across devices.
- **RTL-friendly** inputs — Arabic and English mix without extra config.
- **Offline-first** via service worker; works with no signal, syncs when
  back online.
- **Dark mode** follows the OS.

## Running locally

```bash
npm install
npm run dev
```

For a build preview that mimics Pages:

```bash
npm run build
npm run preview
```

## Deploying your own fork

The repo includes `.github/workflows/deploy.yml`. After you fork:

1. In your repo → **Settings → Pages → Build and deployment → Source**: choose
   **GitHub Actions**.
2. If your repo name isn't `pouch-of-essentials`, update the `base` in
   `vite.config.js` to match (`'/your-repo-name/'`).
3. Push to `main`. The workflow builds and publishes automatically.

## Folder map

```
src/
  components/  UI (list, rows, history, sync chip, settings modal)
  hooks/       useGroceryStore (IndexedDB + tombstones), useSync (gist cloud sync + BroadcastChannel)
  ocr/         placeholder — Arabic receipt OCR lives here later
  utils/db.js  idb setup
public/        manifest.json, sw.js, icon.svg
.github/workflows/deploy.yml  Pages auto-deploy
```

## What's not here yet

- OCR for Arabic receipts (see `src/ocr/README.md` — the plan is sketched).
- Multi-list / multi-household support (one gist = one shared pouch).
- Per-user attribution beyond "who edited last".
