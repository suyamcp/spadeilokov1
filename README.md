# Spa de Iloko

Booking site for Spa de Iloko — traditional Ilocano hilot and modern bodywork
across six branches in Northern Luzon.

Clients pick a branch, a spa package, and a date; the site holds a treatment
room at that branch and issues a reference code with payment instructions.
Staff verify payment and confirm the appointment from the admin panel.

## Stack

React 19 + Vite + Tailwind 4 on the front end, Express + Drizzle ORM over
PostgreSQL on the back end, all served by a single Node process.

## Running locally

```bash
npm install
cp .env.example .env    # then fill in your database and SMTP settings
npm run dev             # http://localhost:3000, or set PORT
```

The server is self-healing on boot: it creates the spa packages, gives every
branch its own treatment rooms, seeds the add-ons catalog, and creates the
admin account. No manual migration step is needed for a fresh database.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Build the client bundle and compile the server |
| `npm start` | Run the production build from `dist/` |
| `npm run lint` | Type-check with `tsc --noEmit` |
| `npm run db:push` | Push the Drizzle schema to the database |

## Booking model

One appointment holds one treatment room for one day. Availability is counted
**per branch** — each branch runs its own rooms, so a full day in Baguio has no
effect on Vigan.

Packages are configured in the admin panel. The "treatment rooms" number on
each package is per branch, and saving it rebuilds the room inventory at every
location.

## Admin panel

Reachable from the lock icon in the header or the link in the footer. The
first run prints the admin credentials to the console; set `ADMIN_EMAIL` and
`ADMIN_INITIAL_PASSWORD` in `.env` to choose them yourself.

Content — hero, story, packages, branches, services, FAQs, payment
instructions — is edited there and stored in the database, not in the code.
