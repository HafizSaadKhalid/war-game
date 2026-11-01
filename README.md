# Represent Your City

A text-based geopolitical multiplayer game MVP built with Next.js App Router and Tailwind CSS.

## Run locally

Requirements: Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The game opens with a seven-second branded splash and a full-screen landing page. Create an account at `/signup`, log in at `/login`, then complete two setup steps: country/state/city followed by one of four professions. Setup stores the selected home location and profession and opens the dashboard on the World Map view. Existing tactical map, role quests, cooldowns, and level progression continue to work.

Credentials use salted PBKDF2 hashes; onboarding state, profile stats, map targets, city ledger changes, daily quest progress, cooldown timestamps, and energy recovery progress are saved in browser `localStorage`. Accounts are local to the browser and are not server authentication; do not reuse an important password. Regional influence, non-player city data, and leaderboard representatives are deterministic demo data. There is no backend or live multiplayer sync in this MVP. Action feedback uses Web Audio and vibration when the browser supports them.

## Supabase cloud persistence

1. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from the Supabase project's API settings. Never put a service-role key in a `NEXT_PUBLIC_` variable.
2. Run [`supabase-schema.sql`](supabase-schema.sql) in the Supabase SQL Editor.
3. Enable email/password authentication and disable email confirmations for immediate username-only access. The MVP maps each username to a generated email alias because Supabase Auth's password API accepts email or phone, not arbitrary usernames.

When Supabase is configured, authentication and profile/ledger/quest changes sync to the cloud, including home country, state, city, profession, and mapped game role. The app writes to `localStorage` immediately and treats cloud sync as best-effort, so actions remain available during network outages. With no Supabase env vars, the local-only account flow continues to work. A profile restored on another device requires a successful Supabase session. Username aliases are not deliverable email addresses; configure confirmation off as noted above. Apply the updated schema SQL to add missing profile columns to an existing project.

## Push to GitHub and deploy on Vercel

1. Create an empty repository on [GitHub](https://github.com/new). In this project folder, run:

   ```bash
   git init
   git add .
   git commit -m "Build Represent Your City MVP"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
   git push -u origin main
   ```

2. Sign in to [Vercel](https://vercel.com/new) with GitHub, choose **Add New Project**, and import the repository.
3. Keep the detected Next.js framework and default build settings, then select **Deploy**.

Vercel builds the project automatically and provides a live URL. Later pushes to `main` trigger new deployments. No environment variables or database are needed for this MVP.