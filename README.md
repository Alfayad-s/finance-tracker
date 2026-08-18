# Finance Tracker

A calm, private, offline-first personal finance manager. All data stays on this device (IndexedDB via Dexie). There is no account and no server.

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

The app is a Progressive Web App. After the first visit it works offline. Chrome and Edge show an **Install** button on Home and in Settings; on iPhone use Share → Add to Home Screen.

## Deploy on Vercel

1. Push this repo to GitHub (`git@github.com:Alfayad-s/finance-tracker.git`).
2. In [Vercel](https://vercel.com/new), import that repository.
3. Use the defaults: **Framework preset** Vite, **Build command** `npm run build`, **Output directory** `dist`.
4. Deploy. The live URL is HTTPS, which is required for install and the service worker.

Local data stays in each visitor's browser (IndexedDB). It is not stored on Vercel.
