# Spa de Iloko

Booking site for Spa de Iloko — traditional Ilocano hilot and modern bodywork
across six branches in Northern Luzon.

Clients pick a branch, a spa package, and a date; the site holds a treatment
room at that branch and issues a reference code with payment instructions.
Staff verify the payment and confirm the appointment from the admin panel.

## Stack

React 19 + Vite + Tailwind 4 on the front end, Express + Drizzle ORM over
PostgreSQL (Supabase) on the back end, all served by a single Node process.
Node 20 or newer.

---

## Deploying for a client

### 1. Fill in `.env` — this is the only file that changes per client

Copy `.env.example` to `.env` and set three groups of credentials. Nothing
else in the codebase needs editing.

| Group | Keys | Where it comes from |
| --- | --- | --- |
| Database | `SQL_HOST`, `SQL_PORT`, `SQL_USER`, `SQL_PASSWORD`, `SQL_DB_NAME`, `SQL_ADMIN_USER`, `SQL_ADMIN_PASSWORD`, `SQL_SSL=true` | The client's Supabase project → Connect → **Session pooler** |
| Email sender | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | The mailbox that sends booking emails. Gmail needs an **App Password**, not the account password |
| Admin login | `ADMIN_EMAIL`, `ADMIN_INITIAL_PASSWORD` | Whatever the client should log into the admin panel with |

### 2. Create the database schema

```bash
npm install
npm run db:setup     # creates tables, then adds constraints + indexes
```

`db:setup` runs `db:push` (tables from the Drizzle schema) followed by
`db:constraints` (the double-booking exclusion constraint, status checks,
foreign-key rules, and the `branch` column). Run it **once** against a new
database. It is safe to re-run — every step is `IF NOT EXISTS` guarded.

### 3. Start

```bash
npm run build
npm start            # honours PORT, defaults to 3000
```

On first boot the server seeds itself: spa packages, treatment rooms for every
branch, the add-ons catalog, the starter site content, the payment-instruction
template, and the admin account from `ADMIN_EMAIL` / `ADMIN_INITIAL_PASSWORD`.
The first page load is a finished site, not placeholders.

If `ADMIN_INITIAL_PASSWORD` is left blank, the server generates a random
password and prints it to the console **once**. Watch the logs on first boot.

### 4. What the client still fills in via the admin panel

These are business details, not code. Log in via the lock icon in the header.

- **Branch Directory** — the six branch names, addresses, phone numbers and
  opening hours ship as placeholders and must be replaced with the real ones.
- **Admin Settings → payment instructions** — the GCash / Maya / bank account
  numbers ship as `0917-XXX-XXXX` placeholders. **Bookings cannot be paid
  until these are real.** Set the proof-of-payment email here too.
- **Spa Packages** — prices, inclusions, and how many treatment rooms each
  branch has.
- Hero image, story, services, FAQs, and package photos.

### Docker

`Dockerfile` builds a production image and works as-is on Render, Railway,
Fly.io, Cloud Run, or plain Docker. Pass the same environment variables
through the platform's settings panel rather than baking a `.env` into the
image. Run `npm run db:setup` once against the database before first deploy.

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Build the client bundle and compile the server |
| `npm start` | Run the production build from `dist/` |
| `npm run lint` | Type-check with `tsc --noEmit` |
| `npm run db:push` | Create/update tables from the Drizzle schema |
| `npm run db:constraints` | Add constraints, indexes and column migrations |
| `npm run db:setup` | `db:push` then `db:constraints` — use this for a new database |
| `npm run admin:set <email> <password>` | Reset the admin login directly |

## Booking model

One appointment holds one treatment room for one day. Availability is counted
**per branch** — each branch runs its own rooms, so a fully booked day in
Baguio has no effect on Vigan.

A booking is created as `pending`, which holds the room. Staff confirm it from
the admin panel once payment is verified. Unpaid holds are auto-released after
48 hours (configurable in Admin → Settings). A database-level exclusion
constraint makes it impossible for two bookings to hold the same room on
overlapping dates, even under a race.

The "treatment rooms" number on each package is **per branch**, and saving it
rebuilds the room inventory at every location. Rooms that already carry
bookings are never deleted.

## Security notes

- `.env` is gitignored and must never be committed. `.env.example` is the
  template and holds no real values.
- The admin panel is the only route to guest data. Change
  `ADMIN_INITIAL_PASSWORD` before going public, and note that the admin
  password is stored only as a bcrypt hash — the database is the source of
  truth, not `.env`.
- Failed admin logins are rate-limited per IP (8 attempts / 15 minutes).
- Guests whose bookings are all cancelled are anonymised after 12 months.
