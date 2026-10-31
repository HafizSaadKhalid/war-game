# Represent Your City

A text-based geopolitical multiplayer game MVP built with Next.js App Router and Tailwind CSS.

## Run locally

Requirements: Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The game opens with a seven-second branded splash, followed by local sign-up/log-in and character setup. On the dashboard, the tactical map drills down from region to country and city; selecting a city sets the target for work, training/attacks, and role quests. Daily quests are tailored to each role and award bonus gold and XP. Work and training retain their cooldowns, and energy regenerates by 5 every 10 seconds up to 100. Level 2 begins at 100 XP and Level 3 at 250 XP.

Credentials use salted PBKDF2 hashes; onboarding state, profile stats, map targets, city ledger changes, daily quest progress, cooldown timestamps, and energy recovery progress are saved in browser `localStorage`. Accounts are local to the browser and are not server authentication; do not reuse an important password. Regional influence, non-player city data, and leaderboard representatives are deterministic demo data. There is no backend or live multiplayer sync in this MVP. Action feedback uses Web Audio and vibration when the browser supports them.

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