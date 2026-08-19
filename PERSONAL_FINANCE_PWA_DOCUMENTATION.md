# Personal Finance Manager – Progressive Web App

### Complete Project Documentation

**Version:** 1.0  
**Last Updated:** August 2026  
**Status:** Planning & Architecture Complete

---

## 1. Project Overview

### 1.1 Vision

A calm, private, offline-first personal finance manager that lives entirely on the user’s device.  
No accounts, no cloud, no tracking — just a fast and beautiful tool to track income, expenses, budgets, and savings goals.

### 1.2 Core Principles

- **Privacy First** — All data stays on the device (IndexedDB)
- **Offline First** — Fully usable without internet
- **Simple & Calm** — Minimal interface, zero clutter
- **Fast Entry** — One-tap Quick Add with smart defaults
- **Installable** — Real Progressive Web App experience



### 1.3 Target Users

- Individuals who want a private money tracker
- People who dislike creating accounts for simple tools
- Users who prefer offline-capable apps
- Friends & family who will install the app on their own phones independently

---



## 2. Unique Selling Points


| Feature                    | Description                                               | Why It Matters               |
| -------------------------- | --------------------------------------------------------- | ---------------------------- |
| 100% Local Storage         | Data never leaves the device                              | Maximum privacy              |
| Quick Add + Smart Defaults | Floating action button remembers last category & patterns | Extremely fast entry         |
| Visual Goal Jars           | Tangible savings goals with progress visualization        | Motivating & delightful      |
| Soft Insights              | Gentle spending reality checks (not nagging)              | Helpful without stress       |
| Offline-First PWA          | Works completely offline after first load                 | Reliable anywhere            |
| Calm Minimal Design        | Clean typography, generous spacing, dark/light mode       | Pleasant daily use           |
| Zero Accounts              | No login, no email, no server                             | Instant start, zero friction |


---



## 3. Feature List



### 3.1 Phase 1 – MVP (Core Value)

- [x] Quick Add Transaction (Income / Expense)
- [x] Transaction List with search & filters
- [x] Categories (pre-defined + custom)
- [x] Home Dashboard (balance, monthly overview)
- [ ] Dark / Light / System theme (deferred — app is light-only)
- [x] Currency selection
- [x] Basic Settings
- [x] Fully offline + Installable PWA



### 3.2 Phase 2 – Budgeting & Goals

- [x] Monthly overall + category budgets
- [x] Budget progress bars
- [x] Visual Goal Jars (create, fund, track)
- [x] Recurring transactions
- [x] Subscriptions hub (monthly outgoing list, skip / pause)
- [x] Soft Insights on Home screen
- [x] Monthly spending overview charts



### 3.3 Phase 3 – Polish & Extra

- [x] Monthly Review ritual (guided end-of-month flow)
- [x] Export (CSV + JSON)
- [x] Import (JSON)
- [x] Smart bank statement import (CSV, Excel, PDF, SuperMoney, on-device)
- [x] Receipt photo attachment (stored locally)
- [x] Empty states & micro-interactions
- [x] Accessibility improvements
- [x] Performance optimizations
- [x] PWA “new version available” update prompt
- [x] Optional local PIN lock
- [x] Optional Face ID / fingerprint unlock (WebAuthn)
- [x] Hide amounts (tap to reveal balances and totals)



### 3.4 Explicitly Out of Scope

- Bank / SMS auto-import (manual CSV/Excel/PDF file import is supported; no bank login or SMS)
- Cloud sync
- Multi-user / sharing
- Investment tracking
- Net worth
- Push notifications for bills
- AI predictions

---



## 4. Tech Stack


| Layer            | Technology                   | Reason for Choice                                     | Alternatives Considered & Why Rejected                |
| ---------------- | ---------------------------- | ----------------------------------------------------- | ----------------------------------------------------- |
| Build Tool       | **Vite**                     | Extremely fast HMR, excellent PWA plugin support      | Create React App (outdated), Next.js (SSR not needed) |
| Framework        | **React 18/19 + TypeScript** | Mature ecosystem, great PWA examples, strong typing   | Svelte (lighter but smaller ecosystem), Vue           |
| Styling          | **Tailwind CSS**             | Rapid development, perfect for minimal/calm UI        | CSS Modules, Styled Components (more verbose)         |
| Local Database   | **Dexie.js**                 | Best developer experience for IndexedDB               | raw IndexedDB (painful), localStorage (too limited)   |
| State Management | **Zustand**                  | Tiny, simple, no boilerplate                          | Redux (overkill), Context only (can get messy)        |
| PWA              | **vite-plugin-pwa**          | Best DX, Workbox under the hood, easy update handling | Manual service worker                                 |
| Charts           | **Recharts**                 | Clean, responsive, React-friendly                     | Chart.js, D3, ApexCharts                              |
| Icons            | **Lucide React**             | Beautiful, consistent, tree-shakeable                 | Font Awesome (heavier), Heroicons                     |
| Forms            | **React Hook Form**          | Excellent performance & validation                    | Formik                                                |
| Date Utilities   | **date-fns**                 | Lightweight and modular                               | Moment.js (heavy & legacy), Day.js                    |
| Routing          | **React Router DOM**         | Standard and reliable                                 | —                                                     |




### Why this stack?

- Fully client-side → perfect privacy
- Tiny bundle size possible
- Excellent offline support
- Very fast development velocity
- Easy to maintain for a single developer

---



## 5. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Progressive Web App                   │
│         (Installable • Offline-first • Local-only)      │
└──────────────────────────┬──────────────────────────────┘
                           │
           ┌───────────────▼───────────────┐
           │     React + TypeScript UI     │
           │   Tailwind + Zustand + RHF    │
           └───────────────┬───────────────┘
                           │
           ┌───────────────▼───────────────┐
           │         Dexie.js              │
           │      (IndexedDB Wrapper)      │
           │  Transactions • Categories    │
           │  Budgets • Goals • Settings   │
           └───────────────────────────────┘
```

**Key Characteristics:**

- No backend
- No authentication
- No external API calls (except optional currency rates later)
- Service Worker handles caching & updates

---



## 6. Data Model

```ts
// Transaction
interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  categoryId: string;
  date: string;               // ISO date
  note?: string;
  paymentMethod?: string;
  isRecurring?: boolean;
  recurringId?: string;
  receiptPhoto?: string;      // base64 or blob URL
  createdAt: string;
  updatedAt: string;
}

// Category
interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense' | 'both';
  isDefault: boolean;
  order: number;
}

// Budget
interface Budget {
  id: string;
  month: string;              // YYYY-MM
  categoryId: string | null;  // null = overall budget
  amount: number;
}

// Goal
interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  color: string;
  icon: string;
  deadline?: string;
  createdAt: string;
}

// RecurringRule
interface RecurringRule {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  categoryId: string;
  note?: string;
  frequency: 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  nextDate: string;
  endDate?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// MonthlyReview
interface MonthlyReview {
  id: string;
  month: string;              // YYYY-MM
  note?: string;
  completedAt: string;
}

// Settings
interface Settings {
  currency: string;           // INR, USD, EUR...
  theme: 'light' | 'dark' | 'system';
  firstDayOfWeek: 0 | 1;      // 0 = Sunday
  softInsightsEnabled: boolean;
  language?: string;
}
```

---



## 7. App Structure & Navigation



### Bottom Tab Navigation

1. **Home** – Dashboard, balance, soft insights, recent transactions
2. **Add** – Center Floating Action Button → Quick Add modal/page
3. **Transactions** – Full list + search + filters
4. **Budgets** – Monthly budgets & progress
5. **Goals** – Visual Goal Jars



### Additional Screens

- Settings
- Category Management
- Monthly Review
- Export / Import (JSON backup, CSV export, bank statement CSV/Excel/PDF import)
- About / Privacy

---



## 8. Folder Structure

```
personal-finance-pwa/
├── public/
│   ├── icons/                # PWA icons
│   └── manifest.webmanifest
├── src/
│   ├── components/
│   │   ├── ui/               # Button, Input, Card, Modal, etc.
│   │   ├── TransactionForm.tsx
│   │   ├── TransactionItem.tsx
│   │   ├── BudgetProgress.tsx
│   │   ├── GoalJar.tsx
│   │   ├── SoftInsight.tsx
│   │   └── charts/
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Transactions.tsx
│   │   ├── Budgets.tsx
│   │   ├── Goals.tsx
│   │   ├── Settings.tsx
│   │   └── MonthlyReview.tsx
│   ├── db/
│   │   ├── db.ts             # Dexie instance + schema
│   │   └── hooks.ts          # useTransactions, useBudgets, etc.
│   ├── stores/
│   │   └── settingsStore.ts  # Zustand store
│   ├── hooks/
│   ├── utils/
│   │   ├── currency.ts
│   │   ├── date.ts
│   │   └── calculations.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── README.md
```

---



## 9. PWA Update Strategy

When a new version is deployed:

1. Service worker detects the update in the background.
2. A clean banner/toast appears:
  > **New version available**  
  > Update now to get the latest features
3. User taps **Update** → app reloads → new features are live.

**Configuration used:** `vite-plugin-pwa` with `registerType: 'prompt'`

This gives the best balance between automatic updates and user control.

**Important Notes:**

- The prompt only exists in the **production** app (the HTTPS Vercel URL or the installed PWA). `npm run dev` never shows it.
- `git push` only updates GitHub. Wait until Vercel finishes the deploy, then open the **live** app while online.
- The first time this prompt ships, phones may still be running an older cached version that has no banner. Close every Finance Tracker tab/window once (or reopen the installed app) so this version can take over. After that, the next deploy should show **New version available**.
- Offline users stay on the previous version until they come online.

---



## 10. Development Phases & Roadmap



### Phase 1 – MVP (Foundation)

**Goal:** Usable daily expense tracker

- Project scaffolding (Vite + React + TS + Tailwind + PWA)
- Dexie database setup
- Quick Add transaction
- Transaction list + basic filters
- Categories (CRUD)
- Home dashboard (simple)
- Theme switching
- Currency support
- Settings page



### Phase 2 – Core Value Features

**Goal:** Complete personal finance loop

- Monthly budgets (overall + per category)
- Budget progress visualization
- Goal Jars (create, add money, progress)
- Recurring transactions
- Subscriptions hub (what leaves every month; skip this occurrence or pause)
- Soft Insights
- Better charts on Home



### Phase 3 – Delight & Polish

**Goal:** Make it feel premium

- Monthly Review guided flow
- Export (CSV + JSON) & Import (JSON restore + bank CSV/Excel/PDF append)
- Receipt photo support
- Micro-interactions & empty states
- Accessibility audit
- Performance tuning

---



## 11. Key User Flows



### Quick Add Flow

1. User taps center FAB
2. Form opens with smart defaults (last category, today’s date)
3. Enter amount → select category → optional note
4. Save → instant feedback + return to previous screen



### Budget Check Flow

1. Open Home or Budgets tab
2. See remaining budget and category progress bars
3. Soft insight appears if overspending



### Goal Funding Flow

1. Open Goals tab
2. Tap a Goal Jar
3. Add money (from balance or specific transaction)
4. Visual progress updates immediately



### Subscriptions Flow

1. Open Settings → Subscriptions, or the Home card
2. See a typical monthly outgoing total and the next due date for each item
3. Skip moves the next date without adding that occurrence
4. Pause stops future entries; Resume starts them again

---



## 12. Privacy & Security

- No server, no analytics, no third-party trackers
- All data stored in browser IndexedDB
- Optional local PIN lock (4-digit screen lock on this device), with optional Face ID / fingerprint / Windows Hello via WebAuthn. The PIN is hashed on-device; biometrics stay on this device. This is not encryption. Data still lives in IndexedDB. Forgot PIN → reset the app (deletes local data). JSON backup does not include the PIN or biometric credential; restoring a backup keeps the lock already on this device.
- Optional Hide amounts: covers balances and totals on screen. Tap the balance card or the eye icon to peek. Peeking is forgotten when you leave the app.
- Export/Import is user-controlled (JSON backup, CSV export, bank statement CSV/Excel/PDF import on-device)
- Receipt photos stored only on device

---



## 13. Browser & Device Support

- Modern browsers (Chrome, Edge, Safari, Firefox)
- Android & iOS (Add to Home Screen)
- Desktop (installable)
- Minimum: Browsers with good IndexedDB + Service Worker support

---



## 14. Next to implement

Ordered remaining work from this document. Phase 1–3 core features are done except the items below.

### Next (in scope)

All Phase 3 in-scope items from this document are done.

### Deferred

- Dark / Light / System theme — listed in Phase 1; product is light-only for now.

### Later (post Phase 3)

- Optional encrypted local backup
- Multiple currencies with manual exchange rates
- Custom category icons
- Data visualization improvements
- Very light optional cloud backup (user opt-in only)

### Out of scope (do not build)

- Bank / SMS auto-import (manual file import is enough)
- Cloud sync, multi-user, investments, net worth
- Push notifications for bills
- AI predictions

---



## 15. Future Possibilities (Post Phase 3)

- Optional encrypted local backup
- Multiple currencies with manual exchange rates
- Custom category icons
- Data visualization improvements
- Very light optional cloud backup (user opt-in only)

---



## 16. Getting Started (For Developer)

```bash
# Create project
npm create vite@latest personal-finance-pwa -- --template react-ts
cd personal-finance-pwa

# Install dependencies
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install dexie zustand react-router-dom react-hook-form date-fns recharts lucide-react
npm install -D vite-plugin-pwa
```

Then configure Tailwind, Vite PWA plugin, and Dexie as documented in the implementation guides.

---



## 17. Success Metrics (Simple)

- Time to add a transaction < 8 seconds
- App usable 100% offline after first visit
- Clear visual feedback on every action
- Users feel the app is “calm” and private

---



## Document Control


| Version | Date        | Changes                    |
| ------- | ----------- | -------------------------- |
| 1.0     | August 2026 | Initial full documentation |


---

**End of Documentation**