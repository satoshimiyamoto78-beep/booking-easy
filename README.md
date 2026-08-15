# Booking Easy — Barbershop, Spa & Salon Booking Platform

A full-stack booking platform: a public site where customers browse services
and book appointments, plus an admin dashboard to manage bookings, services,
and staff schedules.

## Stack

- **Next.js 16** (App Router, Turbopack)
- **Prisma 7** + PostgreSQL (works with Vercel Postgres / Neon)
- **Tailwind CSS v4**
- Self-rolled session auth (signed JWT in an httpOnly cookie via `jose`) for
  the admin dashboard — no third-party auth service required

## Features

- **Public site**: home page, service catalog (barbershop / spa / salon), and
  a 4-step booking wizard (service → stylist → time → contact info)
- **Live availability**: time slots are computed from each staff member's
  weekly schedule, minus existing appointments and time off
- **Admin dashboard** (`/admin`): overview stats, bookings list with status
  updates, and full CRUD for services and staff (including weekly schedules
  and which services each staff member offers)

## Local setup

1. Install dependencies:

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

3. Create the schema and seed demo data (services, staff, and the admin
   user):

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

4. Start the dev server:

   ```bash
   npm run dev
   ```

   Visit `http://localhost:3000` for the site and `/admin/login` for the
   dashboard (sign in with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` from step 2).

## Deploying to Vercel

1. Push this project to a GitHub repo and import it in Vercel.
2. Add the **Vercel Postgres** (Neon) integration to the project, or connect
   any other Postgres instance — set `DATABASE_URL` in the project's
   environment variables either way. **This must be set before the first
   build** — the `build` script runs `prisma migrate deploy` automatically,
   so schema migrations are applied on every deploy with no manual step.
3. Set `AUTH_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` as environment
   variables.
4. (Optional) Seed demo data once, from your machine with `DATABASE_URL`
   pointed at production:

   ```bash
   npm run db:seed     # creates demo services/staff and the admin user
   ```

   For a real launch, skip the seed step (or edit `prisma/seed.ts` first) and
   enter your shop's real services and staff through `/admin` instead.

## Project structure

```
prisma/schema.prisma       Data model (services, staff, schedules, appointments, admin users)
prisma/seed.ts             Demo data + first admin user
src/proxy.ts                Route guard for /admin (Next 16 renamed "middleware" to "proxy")
src/lib/session.ts          JWT session cookie helpers
src/lib/dal.ts               verifySession() — call at the top of any protected page/action
src/lib/availability.ts     Slot-generation logic used by the booking flow
src/lib/actions/            Server Actions (booking, admin CRUD, auth)
src/app/(site)/             Public site: home, services, booking wizard
src/app/admin/(dashboard)/  Admin dashboard (bookings, services, staff)
src/app/admin/(auth)/login  Admin sign-in page
```

## Notes

- Business hours are modeled per staff member (`StaffSchedule`), not
  shop-wide — set each person's weekly hours from `/admin/staff`.
- Times are handled in the server's local timezone; if you deploy across
  timezones, pin the deployment's `TZ` environment variable to the shop's
  timezone.
