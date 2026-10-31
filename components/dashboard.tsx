"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ENERGY_REGEN_AMOUNT,
  ENERGY_REGEN_INTERVAL_MS,
  formatCooldown,
  getCityStats,
  PLAYER_STORAGE_KEY,
  PlayerProfile,
  restorePlayerProfile,
  TRAIN_COOLDOWN_MS,
  WORK_COOLDOWN_MS,
} from "@/components/player";

type LeaderboardEntry = {
  username: string;
  power: number;
  gold: number;
  isPlayer?: boolean;
};

function createLeaderboard(city: string, player: PlayerProfile): LeaderboardEntry[] {
  const { seed } = getCityStats(city);
  const rivals = [
    { username: "HarborWolf", power: 34 + (seed % 19), gold: 240 + ((seed * 3) % 500) },
    { username: "CivicFox", power: 27 + ((seed * 5) % 24), gold: 410 + ((seed * 7) % 380) },
    { username: "IronPact", power: 42 + ((seed * 11) % 21), gold: 190 + ((seed * 13) % 620) },
    { username: "QuietSignal", power: 22 + ((seed * 17) % 26), gold: 560 + ((seed * 19) % 320) },
  ];
  return [...rivals, { username: player.username, power: player.power, gold: player.gold, isPlayer: true }]
    .sort((left, right) => (right.power * 10 + right.gold) - (left.power * 10 + left.gold));
}

function secondsUntil(timestamp: number, cooldown: number, now: number) {
  return Math.max(0, timestamp + cooldown - now);
}

export default function Dashboard() {
  const router = useRouter();
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [notice, setNotice] = useState("");
  const [now, setNow] = useState(0);

  useEffect(() => {
    const savedProfile = window.localStorage.getItem(PLAYER_STORAGE_KEY);
    if (!savedProfile) {
      router.replace("/");
      return;
    }

    try {
      const restored = restorePlayerProfile(JSON.parse(savedProfile));
      if (!restored) throw new Error("Invalid saved profile");
      const elapsedIntervals = Math.floor((Date.now() - restored.lastEnergyRegenAt) / ENERGY_REGEN_INTERVAL_MS);
      if (elapsedIntervals > 0) {
        restored.energy = Math.min(100, restored.energy + elapsedIntervals * ENERGY_REGEN_AMOUNT);
        restored.lastEnergyRegenAt += elapsedIntervals * ENERGY_REGEN_INTERVAL_MS;
      }
      if (restored.energy >= 100) restored.lastEnergyRegenAt = Date.now();
      setPlayer(restored);
      setNow(Date.now());
    } catch {
      window.localStorage.removeItem(PLAYER_STORAGE_KEY);
      router.replace("/");
    }
  }, [router]);

  useEffect(() => {
    if (player) window.localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(player));
  }, [player]);

  useEffect(() => {
    if (!player) return;
    const timer = window.setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);
      setPlayer((current) => {
        if (!current || current.energy >= 100) return current;
        const intervals = Math.floor((currentTime - current.lastEnergyRegenAt) / ENERGY_REGEN_INTERVAL_MS);
        if (intervals < 1) return current;
        return {
          ...current,
          energy: Math.min(100, current.energy + intervals * ENERGY_REGEN_AMOUNT),
          lastEnergyRegenAt: current.lastEnergyRegenAt + intervals * ENERGY_REGEN_INTERVAL_MS,
        };
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [player !== null]);

  const leaveAssembly = useCallback(() => {
    window.localStorage.removeItem(PLAYER_STORAGE_KEY);
    router.replace("/");
  }, [router]);

  function workForCity() {
    if (!player || secondsUntil(player.lastWorkAt, WORK_COOLDOWN_MS, now) > 0) return;
    const reward = player.role === "Businessman" ? 30 : 20;
    setPlayer({ ...player, gold: player.gold + reward, lastWorkAt: now });
    setNotice(`+${reward} gold added to your treasury.`);
  }

  function train() {
    if (!player || player.energy < 10 || secondsUntil(player.lastTrainAt, TRAIN_COOLDOWN_MS, now) > 0) return;
    const powerGain = player.role === "Commander" ? 4 : 2;
    setPlayer({
      ...player,
      energy: player.energy - 10,
      xp: player.xp + 15,
      power: player.power + powerGain,
      lastTrainAt: now,
      lastEnergyRegenAt: now,
    });
    setNotice(`Training complete: +15 XP and +${powerGain} power.`);
  }

  if (!player) {
    return <main className="grid min-h-screen place-items-center bg-ink text-sm uppercase tracking-[0.16em] text-muted">Loading profile...</main>;
  }

  const workRemaining = secondsUntil(player.lastWorkAt, WORK_COOLDOWN_MS, now);
  const trainRemaining = secondsUntil(player.lastTrainAt, TRAIN_COOLDOWN_MS, now);
  const cityStats = getCityStats(player.city);
  const leaderboard = createLeaderboard(player.city, player);

  return (
    <main className="relative min-h-screen overflow-hidden bg-ink text-paper">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between border-b border-line pb-5">
          <Link className="flex items-center gap-3" href="/" aria-label="Represent Your City home">
            <span className="grid h-9 w-9 place-items-center border border-signal text-sm font-bold text-signal">RYC</span>
            <span className="text-xs font-bold uppercase tracking-[0.18em]">Civic Assembly</span>
          </Link>
          <div className="flex items-center gap-5 text-xs uppercase tracking-[0.14em]">
            <span className="hidden text-muted sm:inline">Season 01 <span className="ml-2 text-signal">●</span></span>
            <button type="button" onClick={leaveAssembly} className="text-muted transition-colors hover:text-paper">Leave</button>
          </div>
        </header>

        <section className="flex flex-1 flex-col py-8 sm:py-12">
          <div className="flex flex-col justify-between gap-6 border-b border-line pb-7 sm:flex-row sm:items-end">
            <div className="animate-rise">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-signal">City representative / {player.role}</p>
              <h1 className="font-display text-4xl sm:text-6xl">Welcome, <span className="italic text-signal">{player.username}.</span></h1>
              <p className="mt-3 text-sm text-muted">{player.city}, {player.country} · your seat is ready.</p>
            </div>
            <div className="grid grid-cols-2 gap-px border border-line bg-line">
              <div className="min-w-36 bg-panel px-5 py-3"><p className="text-[10px] uppercase tracking-[0.18em] text-muted">Treasury</p><p className="mt-1 font-display text-2xl text-signal">{player.gold} <span className="text-xs">G</span></p></div>
              <div className="min-w-36 bg-panel px-5 py-3"><p className="text-[10px] uppercase tracking-[0.18em] text-muted">Energy</p><p className="mt-1 font-display text-2xl">{player.energy}<span className="text-xs text-muted"> / 100</span></p></div>
            </div>
          </div>

          <div className="mt-7 grid gap-7 lg:grid-cols-[0.85fr_1.15fr]">
            <section aria-labelledby="profile-heading" className="animate-rise" style={{ animationDelay: "80ms" }}>
              <div className="mb-3 flex items-center justify-between"><h2 id="profile-heading" className="text-xs font-bold uppercase tracking-[0.2em]">Representative file</h2><span className="text-[10px] uppercase tracking-[0.14em] text-muted">Personal stats</span></div>
              <div className="border border-line bg-panel">
                <div className="grid grid-cols-2 border-b border-line"><div className="border-r border-line px-4 py-3"><p className="stat-label">Home city</p><p className="mt-1 text-sm">{player.city}</p></div><div className="px-4 py-3"><p className="stat-label">Office</p><p className="mt-1 text-sm">{player.role}</p></div></div>
                <div className="grid grid-cols-3 divide-x divide-line"><div className="px-4 py-3"><p className="stat-label">Power</p><p className="mt-1 font-display text-xl">{player.power}</p></div><div className="px-4 py-3"><p className="stat-label">Influence</p><p className="mt-1 font-display text-xl">{player.influence}</p></div><div className="px-4 py-3"><p className="stat-label">Intel</p><p className="mt-1 font-display text-xl">{player.intel}</p></div></div>
                <div className="border-t border-line px-4 py-3"><div className="mb-2 flex justify-between text-xs"><span className="text-muted">Experience</span><span>{player.xp} XP</span></div><div className="h-1.5 bg-ink"><div className="h-full bg-signal transition-[width]" style={{ width: `${player.xp % 100}%` }} /></div></div>
              </div>
            </section>

            <section aria-labelledby="actions-heading" className="animate-rise" style={{ animationDelay: "160ms" }}>
              <div className="mb-3 flex items-center justify-between"><h2 id="actions-heading" className="text-xs font-bold uppercase tracking-[0.2em]">Available operations</h2><span className="text-[10px] uppercase tracking-[0.14em] text-muted">Energy restores +5 / 10 sec</span></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={workForCity} disabled={workRemaining > 0} className="action-tile group text-left disabled:cursor-not-allowed disabled:opacity-65">
                  <span className="flex items-center justify-between"><span className="text-[10px] uppercase tracking-[0.16em] text-signal">⛏ Economy / +{player.role === "Businessman" ? 30 : 20} gold</span><span aria-hidden="true" className="text-xl">→</span></span>
                  <span className="mt-8 block font-display text-2xl">Work for City</span>
                  <span className="mt-2 block text-xs text-muted">{workRemaining > 0 ? `Available in ${formatCooldown(workRemaining)}` : "Earn gold for your city"}</span>
                </button>
                <button type="button" onClick={train} disabled={trainRemaining > 0 || player.energy < 10} className="action-tile group text-left disabled:cursor-not-allowed disabled:opacity-65">
                  <span className="flex items-center justify-between"><span className="text-[10px] uppercase tracking-[0.16em] text-rose-300">⚔ Strategy / -10 energy</span><span aria-hidden="true" className="text-xl">→</span></span>
                  <span className="mt-8 block font-display text-2xl">Attack / Train</span>
                  <span className="mt-2 block text-xs text-muted">{trainRemaining > 0 ? `Available in ${formatCooldown(trainRemaining)}` : player.energy < 10 ? "Recover energy to train" : "+15 XP and power"}</span>
                </button>
              </div>
              <p aria-live="polite" className="mt-4 min-h-5 text-sm text-signal">{notice}</p>
            </section>
          </div>

          <div className="mt-7 grid gap-7 border-t border-line pt-6 lg:grid-cols-[0.85fr_1.15fr]">
            <section aria-labelledby="city-heading" className="animate-rise" style={{ animationDelay: "180ms" }}>
              <div className="mb-3 flex items-center justify-between"><h2 id="city-heading" className="text-xs font-bold uppercase tracking-[0.2em]">City report</h2><span className="text-[10px] uppercase tracking-[0.14em] text-muted">{player.city}</span></div>
              <div className="grid grid-cols-2 gap-px border border-line bg-line"><div className="bg-panel px-4 py-4"><p className="stat-label">City defense</p><p className="mt-2 font-display text-3xl text-signal">{cityStats.defense}<span className="ml-1 text-xs text-muted">DEF</span></p></div><div className="bg-panel px-4 py-4"><p className="stat-label">Total citizens</p><p className="mt-2 font-display text-3xl">{cityStats.citizens.toLocaleString()}</p></div></div>
            </section>
            <section aria-labelledby="leaderboard-heading" className="animate-rise" style={{ animationDelay: "220ms" }}>
              <div className="mb-3 flex items-center justify-between"><h2 id="leaderboard-heading" className="text-xs font-bold uppercase tracking-[0.2em]">City leaderboard</h2><span className="text-[10px] uppercase tracking-[0.14em] text-muted">Simulated · {player.city}</span></div>
              <div className="border border-line bg-panel">
                <div className="grid grid-cols-[2rem_1fr_4rem_4rem] border-b border-line px-3 py-2 text-[9px] uppercase tracking-[0.14em] text-muted"><span>#</span><span>Representative</span><span className="text-right">Power</span><span className="text-right">Gold</span></div>
                {leaderboard.map((entry, index) => <div key={entry.username} className={`grid grid-cols-[2rem_1fr_4rem_4rem] items-center px-3 py-2.5 text-xs ${index < leaderboard.length - 1 ? "border-b border-line/70" : ""} ${entry.isPlayer ? "text-signal" : "text-paper"}`}><span className="font-display">{String(index + 1).padStart(2, "0")}</span><span className="truncate">{entry.username}{entry.isPlayer ? " (you)" : ""}</span><span className="text-right">{entry.power}</span><span className="text-right">{entry.gold}</span></div>)}
              </div>
            </section>
          </div>
          <div className="mt-auto pt-8 text-[10px] uppercase tracking-[0.16em] text-muted">City first. The rest is history.</div>
        </section>
      </div>
    </main>
  );
}