# Finance Tracker

Turborepo with two apps:

- **`apps/app`** — Vite PWA. Personal money stays on this device.
- **`apps/api`** — Split groups API (Postgres / Neon). The only cloud data.

## Develop

```bash
npm install
cp apps/api/.env.example apps/api/.env   # Neon DATABASE_URL
npm run db:migrate
npm run dev
```

That runs the PWA and the API together. Separate:

```bash
npm run dev:app
npm run dev:api
```

## Build

```bash
npm run build
```

## Deploy on Vercel

Import the GitHub repo. Build command and output directory are in the root `vercel.json` (`turbo run build --filter=app`, `apps/app/dist`). Host `apps/api` separately (Railway, Render, Fly) and set `VITE_SPLIT_API_URL` on the PWA build plus `APP_ORIGIN` on the API.
