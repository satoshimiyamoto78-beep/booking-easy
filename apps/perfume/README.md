# Loris Parfum — Shop & Stock Management App

A luxury web app for a perfume house: a customer-facing **boutique** (catalogue,
product pages, bag, checkout, order tracking) and a staff **Studio** to manage
stock, products, categories, orders and advanced settings.

Stand-alone React 19 + Vite + Tailwind CSS v4 app — it has its own
`package.json` and does not share tooling with the Next.js booking app at the
repo root.

## Run it

```bash
cd apps/perfume
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
```

`dist/` is a static site — deploy it to Vercel, Netlify, S3, etc. (on Vercel
set the project root to `apps/perfume`, framework "Vite").

## What's inside

**Boutique** (`#/`)
- Welcome splash, Discover home (featured hero, families, best sellers, collections, new arrivals)
- Catalogue with search (name, notes, tags), family chips, sort and filters (collection, gender, concentration)
- Product page with size picker, live stock ("only 3 left"), olfactory pyramid, related scents
- Wishlist, bag, checkout with promo codes, free-delivery threshold and tax, order confirmation and status tracking

**Studio** (`#/studio`)
- **Overview** — 30-day revenue vs previous period, daily chart (7/14/30d), AOV, units & stock value at cost/retail, restock alert, recent orders, top sellers, stock by family
- **Inventory** — per-size stock levels with healthy / low / out filters, quick ±1, adjust (add / remove / set count with reason), multi-line **receive stock** against a PO, full **movement log** (every sale, receipt, adjustment, cancellation and return with running balance), CSV export
- **Products** — list/grid, bulk publish/draft/archive, editor with sizes (price, compare-at, cost, margin, SKU auto-generation, barcode, reorder point), notes, tags, flags, photo upload or a procedurally drawn flacon (shape / juice / cap colours)
- **Orders** — status pipeline (pending → confirmed → packed → shipped → delivered), payment status, cancel & restock, returns, timeline with notes, printable invoice, CSV export, and a **point-of-sale “New order”** screen for in-store / phone sales
- **Categories** — collections and olfactory families (with colours)
- **Settings** — brand & storefront (pause ordering, announcement bar, hide sold-out), currency / number format / tax (inclusive or added), delivery fee & free threshold, payment methods, promo codes, inventory rules (default reorder point, backorders, SKU prefix, default sizes), order numbering, light/dark/system theme & accent colour, staff PIN lock, JSON backup / restore, demo reset, start fresh

Stock is deducted when an order is placed (online or in Studio) and restored
when an order is cancelled or returned, so the boutique never oversells unless
backorders are enabled.

## Data & next steps

All data lives in the browser's `localStorage` (key `maison.db.v1`), and tabs
stay in sync — open the boutique in one tab and Studio in another to watch
orders arrive. Use **Settings → Backup** to export/import everything as JSON.

That makes the app fully usable on a single device/browser (e.g. the boutique
iPad). To share one inventory across many devices and real customers, the
next step is a backend: `src/lib/store.tsx` is the single place that reads and
writes data, so it can be swapped for API calls (e.g. Postgres via the
monorepo's Prisma package) with real staff accounts and an online payment
provider (Stripe) — the UI doesn't need to change.

## Structure

```
src/lib/types.ts       Data model (Product, Variant, StockMovement, Order, Settings…)
src/lib/store.tsx      State, persistence, all business actions (orders, stock, catalogue)
src/lib/seed.ts        Demo house: 12 fragrances, 4 collections, 7 families, 30 days of orders
src/components/        UI kit, icons, SVG bottle renderer
src/shop/              Customer boutique screens
src/studio/            Staff Studio screens
```
