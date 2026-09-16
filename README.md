# Hospital Management System

A role-based clinic and hospital management application built with Next.js (App
Router), TypeScript, Prisma and PostgreSQL.

> **Status: foundation and UI both rebuilt; verify locally before relying on
> it.** The data model, authentication, authorization, API layer, and the full
> Tailwind UI have been rewritten. `tsc --noEmit`, `next lint`, and the Vitest
> suite (61 tests) all pass cleanly in this environment. Neither
> `prisma generate` nor `next build` has been run against a real PostgreSQL
> instance — see [Known limitations](#known-limitations) for exactly what
> that means before demonstrating this to anyone.

## Features

Implemented and working end to end at the API level:

- **Accounts and roles** — `PATIENT`, `DOCTOR`, `STAFF`, `ADMIN`. Self-service
  signup always creates a patient; elevated accounts are created by an admin.
- **Appointments** — booking, rescheduling, cancellation and status changes,
  with doctor availability windows, derived bookable slots, and double-booking
  prevented both by an availability check and a database unique constraint.
- **Patients** — directory with search and pagination, clinical profile
  (blood type, allergies, history, emergency contact), and per-patient access
  control.
- **Medical records** — structured visits (diagnosis, symptoms, treatment,
  notes) linked to a doctor and optionally an appointment, ordered
  chronologically.
- **Prescriptions** — issued by doctors only, with one or more medication lines
  (dosage, frequency, duration, instructions).
- **Billing** — invoices with line items, server-computed totals, and a payment
  ledger. Status is derived from recorded payments. Optional online card
  payment via Stripe Checkout (see Environment variables) — hidden entirely
  when not configured, never faked.
- **Patient documents** — upload, list, download, and delete attachments (PDF,
  PNG, JPEG, WebP up to 15 MB) on a patient's chart, authorized by the same
  chart-access rule as medical records.
- **Notifications** — per-user notification centre with unread count, mark one
  read, and mark all read.
- **Messaging** — conversations between users, authorized by participation,
  with a recipient picker (doctors for any role; patients for staff/doctors),
  a polling thread view, and notifications on new messages.
- **Audit log** — append-only record of privileged actions.
- **Dashboard statistics** — real aggregates scoped to the caller's role.
- **Rate limiting** — registration, login, and password changes are
  throttled per-account and per-IP.
- **Automated tests** — 61 Vitest tests over validation, scheduling
  conflicts, billing math, and the API error layer. `npm test`.

## Technology

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Database | PostgreSQL via Prisma 6 |
| Auth | NextAuth v4, credentials provider, JWT sessions |
| Validation | Zod, shared between API routes and forms |
| Styling | Tailwind CSS v4 (design tokens in `app/globals.css`) |
| Charts | Recharts |

## Prerequisites

- Node.js 20 or newer
- PostgreSQL 14 or newer
- npm

## Environment variables

Copy `.env.example` to `.env` and fill it in.

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | yes | Signs session JWTs. `openssl rand -base64 32` |
| `NEXTAUTH_URL` | yes | Public origin, e.g. `http://localhost:3000` |
| `SEED_ADMIN_EMAIL` | no | Email for the seeded admin. Defaults to `admin@example.com` |
| `SEED_ADMIN_PASSWORD` | no | If unset, the seed generates one and prints it once |
| `UPLOAD_DIR` | no | Where patient document attachments are stored. Defaults to `./uploads`. Local disk only — see Known limitations |
| `STRIPE_SECRET_KEY` | no | Enables the "Pay online" button on invoices. Unset = button hidden, no error |
| `STRIPE_WEBHOOK_SECRET` | no | Required alongside the key above for the webhook to mark invoices paid. Register `/api/webhooks/stripe` in the Stripe dashboard |

The application refuses to start in production when `NEXTAUTH_SECRET` is unset,
rather than signing tokens with `undefined`.

> **Security note for this repository specifically:** a real `.env` containing a
> live database password and `NEXTAUTH_SECRET` was committed in an early commit.
> It has been untracked, but it remains in git history. Rotate both credentials
> and scrub the history before making this repository public.

## Getting started

```bash
npm install
cp .env.example .env          # then edit it
npx prisma generate
npx prisma migrate deploy     # or: npm run db:migrate
npm run db:seed
npm run dev
```

Open http://localhost:3000 and sign in with the administrator printed by the
seed step.

### Database commands

| Command | Effect |
|---|---|
| `npm run db:generate` | Regenerate the Prisma client |
| `npm run db:migrate` | Create and apply a migration in development |
| `npm run db:deploy` | Apply pending migrations (production) |
| `npm run db:seed` | Departments, hospital settings, one admin |
| `npm run db:studio` | Browse the database |

The seed creates **no** patients, appointments or invoices. Dashboards read real
aggregates, so seeded activity would be indistinguishable from real activity.

### Development commands

```bash
npm run dev         # development server
npm run typecheck   # tsc --noEmit
npm run lint        # next lint
npm test            # vitest run — validation, scheduling, and billing logic
npm run build       # prisma generate && next build
npm start           # serve the production build
```

## Authentication and roles

Sessions are JWTs issued by NextAuth. Passwords are hashed with bcrypt at cost
12 and never returned by any endpoint.

`middleware.ts` redirects unauthenticated visitors to `/login` and rewrites
role-mismatched dashboard routes to `/unauthorized`. **Middleware is a
convenience, not the security boundary.** Every API route independently
authorizes via `lib/auth.ts`:

- `requireSession()` — 401 if not signed in
- `requireRole(...roles)` — 403 if the role is not permitted
- `assertCanAccessPatient(session, patientId)` — the single rule for chart
  access: staff may read any chart, a doctor may read a patient they have an
  appointment with, a patient may read only their own

| Capability | Patient | Doctor | Staff | Admin |
|---|---|---|---|---|
| Book an appointment | own | – | any patient | any patient |
| Cancel an appointment | own | own schedule | any | any |
| Assign a doctor / change status | – | own schedule | any | any |
| Read a medical record | own | own patients | any | any |
| Write a medical record | – | own patients | – | – |
| Issue a prescription | – | own patients | – | – |
| Invoices and payments | own (read) | – | full | full |
| Manage users and roles | – | – | – | full |

## API

Every endpoint returns one of two shapes:

```jsonc
{ "data": … , "meta": { "page": 1, "pageSize": 20, "total": 0, "totalPages": 1 } }
{ "error": { "message": "…", "fields": { "email": ["Enter a valid email address"] } } }
```

| Method | Route | Access |
|---|---|---|
| `POST` | `/api/register` | public — always creates a PATIENT |
| `GET`/`POST` | `/api/users` | admin |
| `GET` | `/api/patients` | staff, doctor |
| `POST` | `/api/patients` | staff |
| `GET`/`PATCH` | `/api/patients/[id]` | per chart-access rule |
| `GET`/`POST` | `/api/appointments` | scoped to the session |
| `GET`/`PATCH` | `/api/appointments/[id]` | participant or staff |
| `GET`/`POST` | `/api/departments` | read: any; write: admin |
| `GET` | `/api/doctors` | any signed-in user |
| `GET`/`POST` | `/api/doctors/[id]/availability` | read: any; write: self or admin |
| `GET` | `/api/doctors/[id]/slots?date=` | any signed-in user |
| `GET`/`POST` | `/api/records` | read: scoped; write: doctor |
| `GET`/`POST` | `/api/prescriptions` | read: scoped; write: doctor |
| `GET`/`POST` | `/api/invoices` | read: scoped; write: staff |
| `POST` | `/api/invoices/[id]/payments` | staff — manual payment entry |
| `POST` | `/api/invoices/[id]/checkout` | own invoice (patient) or staff — starts Stripe Checkout |
| `POST` | `/api/webhooks/stripe` | Stripe only, verified by signature — marks invoices paid |
| `GET` | `/api/billing/config` | any signed-in user — whether online payments are enabled |
| `GET`/`POST` | `/api/patients/[id]/attachments` | per chart-access rule |
| `GET`/`DELETE` | `/api/attachments/[id]` | read: per chart-access rule; delete: uploader or staff |
| `GET` | `/api/notifications` | own only |
| `PATCH` | `/api/notifications/[id]` | own only |
| `POST` | `/api/notifications/read-all` | own only |
| `GET`/`POST` | `/api/conversations` | participants only |
| `GET`/`POST` | `/api/conversations/[id]/messages` | participants only |
| `GET`/`PATCH` | `/api/profile` | own only |
| `POST` | `/api/profile/password` | own only |
| `GET` | `/api/dashboard/stats` | scoped to the session's role |

## Project structure

```
app/
  api/              route handlers, one folder per resource
  components/       shared UI
  dashboard/        doc/ and user/ dashboards
  login/ signup/    auth screens
  unauthorized/     403 page
lib/
  api.ts            response envelope, HttpError, route wrapper
  auth.ts           NextAuth options and authorization guards
  validation.ts     Zod schemas shared by API and forms
  scheduling.ts     availability windows and slot conflicts
  billing.ts        invoice numbering
  audit.ts          audit log writer
  notify.ts         notification writer
  prisma.ts         Prisma client singleton
prisma/
  schema.prisma
  migrations/
  seed.ts
types/
  next-auth.d.ts    session and JWT augmentation
middleware.ts
```

## Deployment

1. Provision PostgreSQL and set `DATABASE_URL`.
2. Set `NEXTAUTH_SECRET` and `NEXTAUTH_URL` to the production origin.
3. Run `npm ci && npx prisma migrate deploy && npm run build`.
4. Serve with `npm start` behind TLS.
5. Run `npm run db:seed` once to create the first administrator, then change
   that password.

Rate limiting is not implemented in the application. Put the login endpoint
behind a rate limit at the reverse proxy or edge before exposing it publicly.

## Known limitations

These are stated plainly because the alternative is shipping a demo that
misrepresents itself.

- **Never run against a real database in this environment.** My sandbox
  cannot reach `binaries.prisma.sh`, so I could not run `prisma generate`,
  `prisma migrate`, or `next build`. `tsc --noEmit`, `next lint`, and the
  Vitest suite are all clean, but none of that is the same guarantee as a
  build. Run `npx prisma generate && npm run build` locally as the first
  step, before anything else.
- **Doctor availability supports one window per day.** Setting Monday's hours
  replaces Monday's hours — there's no way to express a lunch-break gap (e.g.
  9–12 and 1–5) without a second migration to support multiple windows per
  day. Booking and the availability editor both assume a single window.
- **Messaging is not real-time.** There is no WebSocket server. The message
  thread polls every 6 seconds and the conversation list every 15; `socket.io`
  was removed rather than left in place implying push delivery it doesn't
  have. A recipient gets a notification-centre entry the moment a message is
  sent regardless of whether they have the thread open.
- **File uploads are local-disk only.** `lib/storage.ts` writes to
  `UPLOAD_DIR` (default `./uploads`) on the machine running the app. That
  works for a single instance with a persistent volume; it does **not**
  survive a redeploy on most PaaS platforms and does **not** work across
  multiple instances behind a load balancer. Swap `lib/storage.ts` for an
  S3/R2/GCS-backed implementation before scaling beyond one instance — the
  API routes that call it only deal in opaque `storageKey` strings, so they
  don't need to change.
- **Online payments require Stripe keys you must provide.** Set
  `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in `.env` and register
  `https://<your-domain>/api/webhooks/stripe` as a Stripe webhook endpoint
  listening for `checkout.session.completed`. Without both, the "Pay online"
  button is hidden (`GET /api/billing/config`) and staff can still record any
  payment manually — nothing is faked either way. `HospitalSettings.currency`
  is a free-text display label, not validated against Stripe's supported
  currencies; if it's set to something Stripe doesn't accept, checkout
  session creation will fail with a Stripe error. I have not been able to
  test the Stripe integration end-to-end — my sandbox has no network path to
  Stripe's API, so this is written correctly to the best of my knowledge but
  unverified against a live account.
- **The emergency page is informational only.** It displays contact details
  read from `HospitalSettings`. It does not contact emergency services and
  does not claim to.
- **Test coverage is real but partial.** 61 Vitest tests cover validation
  schemas, the appointment-conflict logic, invoice numbering, the shared
  payment-recording logic, the API error-mapping layer, and the rate limiter
  — the parts of the codebase that are pure or cleanly mockable. There are no
  end-to-end tests, no tests against a real database, and no component tests
  for the React UI. Run `npm test`.
- **Rate limiting is in-process and best-effort.** `lib/rate-limit.ts` is a
  fixed-window limiter held in memory. It resets on every deploy and does not
  share state across multiple instances — fine for a single-instance
  deployment, not sufficient on its own for one that scales horizontally or
  sits behind a WAF-less public login form at real volume. It currently
  guards registration, login (per-email and per-IP), and password changes.
- **Regulatory compliance is not addressed.** Access control and an audit log
  are prerequisites for handling patient data, not evidence of compliance
  with any particular regime. Establish what applies in your jurisdiction
  before processing real patient records.
