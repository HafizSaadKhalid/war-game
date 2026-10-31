# Represent Your City

A text-based geopolitical multiplayer game MVP built with Next.js App Router and Tailwind CSS.

## Run locally

Requirements: Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The game opens with a seven-second branded splash, followed by local sign-up/log-in. New accounts continue to character setup to choose country, city, and one of four roles. Work adds gold and XP with a 60-second cooldown; training uses 10 energy and grants XP and power with a 30-second cooldown. Energy restores by 5 every 10 seconds, up to 100. Businessmen earn an extra 10 gold per work action, and Commanders gain extra power when training. Level 2 begins at 100 XP and Level 3 at 250 XP.

Credentials use salted PBKDF2 hashes, and onboarding state, profile stats, action cooldown timestamps, and energy recovery progress are saved in browser `localStorage`. Accounts are local to the browser and are not server authentication; do not reuse an important password. City defense, citizen counts, and other leaderboard representatives are deterministic demo data. There is no backend or live multiplayer sync in this MVP.

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