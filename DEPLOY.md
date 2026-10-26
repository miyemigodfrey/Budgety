# Deploying Budgety (Vercel) + installing the PWA

Budgety is a Next.js 15 app. To use it on your phone it must be live at a public
HTTPS URL. Vercel is free and connects straight to the GitHub repo.

## 1. Create the Vercel project

1. Go to vercel.com, sign in with GitHub, **Add New -> Project**.
2. Import **miyemigodfrey/Budgety**.
3. Framework preset: **Next.js** (auto-detected). Leave build/output settings default.
4. Add the environment variables below **before** the first deploy, then **Deploy**.

## 2. Environment variables (Project -> Settings -> Environment Variables)

Set these for **Production** (and Preview, if you want preview deploys to work):

| Name            | Value                                                                 | Required |
| --------------- | --------------------------------------------------------------------- | -------- |
| `DATABASE_URL`  | Your Supabase **session pooler** string (port 5432) with the resilience params, e.g. `...pooler.supabase.com:5432/postgres?connection_limit=5&pool_timeout=30&connect_timeout=15` | Yes |
| `DIRECT_URL`    | Same session-pooler host without the query params (used by Prisma for migrations) | Recommended |
| `AUTH_SECRET`   | A long random secret. Generate with `openssl rand -base64 32`          | Yes (prod) |

Notes:
- These match `src/env.js`, which validates them at build/boot.
- `connection_limit=5` keeps a page's parallel queries from starving the pool on
  a cold start (see the app's existing DB-resilience handling).
- NextAuth v5 trusts the Vercel host automatically; `AUTH_URL` is not required.
  Only add `AUTH_URL=https://your-domain` if you later use a custom domain and
  sign-in callbacks misbehave.

## 3. Database migrations

The schema is managed with `prisma db push` (the Supabase pooler rejects shadow
DBs, so `prisma migrate` is not used). The database is already in sync for this
app; after schema changes run `npm run db:push` locally against `DATABASE_URL`.
No migration step is needed in the Vercel build.

## 4. Install to your iPhone (PWA)

Once deployed (e.g. `https://budgety.vercel.app`):

1. Open the URL in **Safari** on your iPhone.
2. Tap **Share -> Add to Home Screen -> Add**.
3. Launch Budgety from the home-screen icon. It opens **full-screen** (standalone),
   shows the animated launch screen, and uses the 4-digit App Lock PIN on each
   cold open (set it in Profile first).

Requirements: iOS 16.4+ for full PWA behavior. The app is installable on Android
(Chrome shows an install prompt) and desktop Chrome/Edge too.

## What ships for the PWA

- `src/app/manifest.ts` -> served at `/manifest.webmanifest` (name, icons, standalone, theme).
- `public/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`.
- iOS + theme-color meta and the manifest link in `src/app/layout.tsx`.
- `public/sw.js` + `src/components/ServiceWorkerRegister.tsx` -> offline resilience
  (registers in **production only**; never caches `/api`, so auth and data stay live).
- `public/offline.html` -> shown when a page load has no connection.

## 5. Daily reminder notifications (Web Push)

Reminders use the browser's Web Push (no Firebase). Three extra env vars are
needed in Vercel; without them the app runs fine and the feature is just off.

1. Generate a VAPID key pair once (locally):
   ```
   npx web-push generate-vapid-keys
   ```
2. In Vercel -> Settings -> Environment Variables add (Production):

   | Name | Value |
   | --- | --- |
   | `VAPID_PUBLIC_KEY` | the public key from step 1 |
   | `VAPID_PRIVATE_KEY` | the private key from step 1 |
   | `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | the **same** public key |
   | `CRON_SECRET` | a random secret, e.g. `openssl rand -base64 24` |

   (Your local `.env` already has a working set for dev.)
3. The daily send is scheduled in `vercel.json` (`/api/cron/daily-reminder` at
   19:00 UTC = 20:00 WAT). Vercel runs it automatically and authorizes it with
   `CRON_SECRET`. On the Hobby plan, once-daily crons are supported.

**How users turn it on:** Settings -> Daily Reminder. The app asks for
notification permission and subscribes the device. On **iPhone**, push only
works when Budgety is **installed to the home screen** (iOS 16.4+), so add it to
the home screen first, then enable the toggle.

To change the time, edit the `schedule` in `vercel.json` (cron is in UTC).
