# Represent Your City

A text-based geopolitical multiplayer game MVP built with Next.js App Router and Tailwind CSS.

## Run locally

Requirements: Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Choose a role and city, then use the dashboard to work for gold or train for XP and power. Work has a 60-second cooldown; training has a 30-second cooldown and uses 10 energy. Energy restores by 5 every 10 seconds, up to 100. Businessmen earn an extra 10 gold per work action, and Commanders gain extra power when training.

Profile stats, action cooldown timestamps, and energy recovery progress are saved in browser `localStorage`; they are not shared across browsers or devices. City defense, citizen counts, and other leaderboard representatives are deterministic demo data. There is no backend or live multiplayer sync in this MVP.

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