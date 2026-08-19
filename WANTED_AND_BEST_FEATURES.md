# Best Features & Wanted Features

Companion to [`PERSONAL_FINANCE_PWA_DOCUMENTATION.md`](./PERSONAL_FINANCE_PWA_DOCUMENTATION.md).

This file is a product wishlist, not the build spec. The main document remains the source of truth for what is in scope, deferred, or out of scope.

**Product frame:** private, offline-first, no account, no server. Ideas below should keep money data on this device unless the user explicitly exports a file.

---

## Best features (already strong)

These are the things that make Finance Tracker feel different from a generic expense app. Protect them. New work should make these better, not bury them.

| Feature | Why it is a best feature |
| --- | --- |
| **Everything stays on this device** | No login, no cloud, no analytics. That is the product, not a footnote. |
| **Quick Add** | Center button, smart defaults, back to the previous screen. Daily use should stay under a few seconds. |
| **On-device bank import** | CSV, Excel, and text PDFs (including SuperMoney) append locally. No bank login. |
| **Keyword import rules** | Repeat merchants get easier over time, still on-device. |
| **Visual Goal Jars** | Savings feel tangible. Funding should stay obvious and satisfying. |
| **Soft insights** | Gentle notes, not nagging. Easy to turn off. |
| **Monthly review** | A calm end-of-month ritual, not a report dump. |
| **Honest privacy** | PIN / Face ID lock is a screen lock, not fake encryption. Backup is a file the user chooses. |
| **Face ID & fingerprint** | Optional device unlock on top of PIN. Stays on this device; PIN remains the backup. |
| **Hide amounts** | Cover balances and totals on a shared screen. Tap the card or the eye to peek. |
| **Installable PWA** | Home-screen app, offline after first load, update prompt when a new version is waiting. |
| **Calm light UI** | White cards, blue accents, generous space. Fast entry over dashboard clutter. |

### Best-in-class bar (how to keep winning)

- Adding a transaction should stay faster than opening a bank app.
- Import should feel smarter without ever sending a statement anywhere.
- Insights should stay optional and kind.
- Settings should keep saying, clearly: this data does not leave the browser.
- Desktop and phone should both feel like a real app, not a cramped website.

---

## Wanted features

Grouped by how well they fit this product. Prefer the first two lists. The last list is tempting but fights the vision.

### High fit — local, calm, high daily value

These stay 100% on-device and make the current app more useful.

1. **Dark / Light / System theme** — already deferred in the spec; still the most requested polish item.
2. **Payment wallets** — Cash / UPI / card / other as first-class filters and summaries (the transaction field already exists).
3. **Transfers** — move money between wallets without counting as income or expense.
5. **Subscriptions hub** — recurring items as a simple “what leaves every month” list, with skip / pause.
6. **Undo last save** — short snackbar undo after Quick Add, edit, or delete.
7. **Duplicate / template a transaction** — one tap to enter the same coffee again.
8. **Bulk select** — categorize, delete, or attach a note to several rows at once.
9. **Exclude from budget / insights** — rent, transfers, and one-offs should not distort the month.
10. **Budget rollover** — unused category budget can carry into next month (opt-in).
11. **India financial year** — April–March option for reviews and exports.
12. **Projected month-end** — “at this pace you may land around …” as a soft insight, not an alarm.
13. **Savings rate & runway** — income vs expenses this month; months of typical spend held in goals.
14. **Merchant / payee memory** — remember names from notes and imports; tap to reuse.
15. **Better import rules UI** — see, edit, and delete keyword → category rules without re-importing.
16. **Undo last import** — reverse one statement append if the mapping was wrong.
17. **More bank presets** — extra Indian statement layouts as they show up in real files.
18. **Backup reminder** — if the last JSON export is old, a quiet note on Settings / Home.
19. **Encrypted local backup** — passphrase-protected JSON; still a file, still user-controlled.
20. **PIN options** — lock immediately vs after 1 / 5 minutes.
21. **PWA shortcuts** — long-press icon → Quick Add; optional share-target / open CSV or PDF in the importer.
22. **Desktop comfort** — number-pad shortcuts, wider transaction table, keyboard to save Quick Add.
23. **Year in review** — a longer sibling of Monthly Review (local stats + a few calm charts).
24. **Spending calendar / heatmap** — which days were heavy, without turning Home into a dashboard wall.
25. **50 / 30 / 20 view** — optional needs / wants / savings split on top of existing categories.
26. **Custom category icons & colors** — beyond the built-in set.
27. **On-device receipt extras** — multiple photos per transaction; optional on-device text scan later if it stays fully local.
28. **Export monthly review** — save or share a summary image/PDF generated on this device.

### Medium fit — powerful, still local, easy to overbuild

Build only if they stay simple and do not add accounts, servers, or clutter.

- Multiple currencies with **manual** exchange rates
- Split a transaction across categories
- Envelope / pocket budgets (in addition to monthly category budgets)
- Credit-card cycle and “amount still to pay” (dates only; no bank login, no push nags)
- EMI / loan payoff tracker as a special goal type
- Reimbursements (money out that should come back)
- Category merge and archive
- Saved filters on Activity
- Comparison charts: this month vs last month vs last year
- Sankey or flow: income → categories → goals
- Home layout: show / hide cards
- Larger text / higher contrast
- Language pack (e.g. Hindi) with the same calm copy
- In-app “bills due soon” on Home when opening the app (not OS push notifications)
- Sample data on / off for demos, without mixing into real money

### Low fit — do not chase by default

These fight “private, local, calm.” Keep them out unless the product direction changes on purpose.

- Bank or SMS auto-import, screen scraping, or storing bank passwords
- Cloud sync, accounts, or multi-user sharing
- Investment / net-worth dashboards as a core module
- Push notifications for bills
- AI predictions, chat “advisor,” or sending transactions to a model
- Location tracking of spends
- Social / family ledgers in the cloud
- Ads, trackers, crash-reporting that uploads money data

---

## Best *next* features (short list)

If building from this file, start here. Highest value for the current app, still on-device:

1. Undo last save
2. Subscriptions hub (from recurring)
3. Payment wallets + transfers
4. Import rules manager + undo last import
5. Dark / system theme
6. Encrypted local backup
7. Year in review
8. India financial year
9. PIN timeout options

---

## How to use this file

- **Best features** — do not weaken them to add a wanted item.
- **High fit** — fair game when the main spec’s in-scope list is empty.
- **Medium fit** — one at a time, keep the UI quiet.
- **Low fit** — same as “out of scope” in the main document.

When a wanted item is chosen to build, add it to the main documentation and implement it there. This file can stay a living wishlist.
