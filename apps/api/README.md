# Split API (groups only)

Personal finance stays in the PWA IndexedDB. This service stores **only** shared groups, expenses, shares, and settlements.

## Setup

From the repo root:

```bash
cp apps/api/.env.example apps/api/.env   # set DATABASE_URL and APP_ORIGIN
npm install
npm run db:migrate
npm run dev
```

`npm run dev` starts **api** (port 8787) and **app** (Vite) together via Turborepo.

Realtime: `ws://localhost:8787/ws?token=SESSION`
