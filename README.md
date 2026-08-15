# Booking Easy — Multi-Tenant Booking Platform

A subscription SaaS for barbershops, spas, salons, nail studios, and massage
businesses: each business gets its own hosted booking site plus an admin
dashboard to manage services, staff, and bookings.

This repo is an npm-workspaces monorepo. Today it holds one Next.js app (at
the repo root, serving both the public `/[slug]` booking sites and `/admin`)
plus a shared database package — the app is being split into separate
`customer`/`business`/`platform` apps incrementally; check
`~/.claude/plans/` (or ask) for the current stage if picking this up fresh.

## Stack

- **Next.js 16** (App Router, Turbopack)
- **Prisma 7** + PostgreSQL (Neon on Vercel), as `@booking-easy/db` — a
  shared workspace package, not app-local
- **Tailwind CSS v4**
- Self-rolled session auth (signed JWT in an httpOnly cookie via `jose`) for
  the admin dashboard — no third-party auth service required

## Features

- **Multi-tenant public sites** at `/[slug]` (e.g. `/the-studio`): home page,
  service catalog, and a 4-step booking wizard (service → stylist → time →
  contact info), fully isolated per business
- **Live availability**: time slots are computed from each staff member's
  weekly schedule, minus existing appointments and time off
- **Admin dashboard** (`/admin`, session-scoped to one business): overview
  stats, bookings list with status updates, and full CRUD for services and
  staff (including weekly schedules and which services each staff member
  offers)

## Local setup

1. Install dependencies (installs every workspace, including
   `packages/db`, and runs `prisma generate`):

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in the values:

   ```bash
   cp .env.example .env
   ```

   - `DATABASE_URL` — a Postgres connection string
   - `AUTH_SECRET` — generate with `openssl rand -base64 32`
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` — credentials for the first admin user,
     used by the seed script

3. Create the schema and seed demo data (a demo business, services, staff,
   and the admin user):

   ```bash
   npm run db:deploy
   npm run db:seed
   ```

4. Start the dev server:

   ```bash
   npm run dev
   ```

   Visit `http://localhost:3000/the-studio` for the demo business's site and
   `/admin/login` for the dashboard (sign in with the `ADMIN_EMAIL` /
   `ADMIN_PASSWORD` from step 2).

## Deploying to Vercel

1. Push this project to a GitHub repo and import it in Vercel.
2. Add the **Vercel Postgres** (Neon) integration to the project, or connect
   any other Postgres instance — set `DATABASE_URL` in the project's
   environment variables either way.
3. Set `AUTH_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` as environment
   variables.
4. **Migrations are a separate, manual step — the app's `build` script is
   plain `next build` and does not apply migrations.** Before merging or
   deploying any change that includes a new migration, run:

   ```bash
   npm run db:deploy    # applies pending migrations, no prompts
   ```

   against production `DATABASE_URL` yourself first (locally, with the env
   var pointed at production). This is deliberate: once more than one app in
   this monorepo deploys against the same database, having every build try
   to run `prisma migrate deploy` concurrently risks races/lock contention —
   see `packages/db/package.json`'s `db:deploy` script, which is the one
   place migrations should ever be triggered from.
5. (Optional) Seed demo data once, from your machine with `DATABASE_URL`
   pointed at production:

   ```bash
   npm run db:seed     # creates a demo business, services/staff, and an admin user
   ```

   For a real launch, skip the seed step and create real businesses through
   the signup flow (once built) or directly in the database instead.

## Project structure

```
packages/db/                      Shared @booking-easy/db workspace package
  prisma/schema.prisma             Data model (Business, Service, Staff, Appointment, AdminUser, PlatformAdmin, ...)
  prisma/seed.ts                    Demo business + services/staff + first admin user
  src/client.ts                     The Prisma client singleton (pg.Pool + adapter)
  src/index.ts                      Re-exports the generated client, enums, and the singleton — import from "@booking-easy/db"
src/proxy.ts                      Route guard for /admin (Next 16 renamed "middleware" to "proxy")
src/lib/session.ts                JWT session cookie helpers
src/lib/dal.ts                    verifySession() — call at the top of any protected page/action; returns businessId/businessSlug
src/lib/business.ts               getBusinessBySlug() — resolves the tenant for every /[slug] page
src/lib/availability.ts           Slot-generation logic used by the booking flow
src/lib/actions/                  Server Actions (booking, admin CRUD, auth)
src/app/[slug]/                   Public site per tenant: home, services, booking wizard
src/app/admin/(dashboard)/        Admin dashboard (bookings, services, staff) — scoped to the logged-in admin's business
src/app/admin/(auth)/login        Admin sign-in page
```

## Notes

- Business hours are modeled per staff member (`StaffSchedule`), not
  shop-wide — set each person's weekly hours from `/admin/staff`.
- Times are handled in the server's local timezone; if you deploy across
  timezones, pin the deployment's `TZ` environment variable to the shop's
  timezone.
- `AdminUser.email` is globally unique (not per-business) — the single
  global `/admin/login` form resolves email → admin → business with no slug
  in the URL to disambiguate.
