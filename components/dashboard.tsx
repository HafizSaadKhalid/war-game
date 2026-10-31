"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ENERGY_REGEN_AMOUNT,
  ENERGY_REGEN_INTERVAL_MS,
  CITIES_BY_COUNTRY,
  formatCooldown,
  getCityKey,
  getCityStats,
  getDailyQuestDate,
  getLevelProgress,
  PLAYER_STORAGE_KEY,
  PlayerProfile,
  restorePlayerProfile,
  TRAIN_COOLDOWN_MS,
  WORK_COOLDOWN_MS,
} from "@/components/player";
import { ACTIVE_ACCOUNT_KEY, getActiveAccount, restoreAccountProfile, saveAccountProfile } from "@/components/account-storage";
import { getDailyQuests, QuestAction } from "@/components/daily-quests";
import { loadPlayerFromSupabase, signOutFromSupabase, syncPlayerToSupabase } from "@/lib/game-cloud";
import DailyQuestList from "@/components/daily-quest-list";
import TacticalMap from "@/components/tactical-map";
import type { WorldMapAction } from "@/components/world-map-view";

const WorldMapView = dynamic(() => import("@/components/world-map-view"), { ssr: false });

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

function playActionFeedback(levelUp = false) {
  if (typeof window === "undefined") return;
  if ("vibrate" in navigator) navigator.vibrate(levelUp ? [35, 40, 70] : 18);
  try {
    const audio = new AudioContext();
    const oscillator = audio.createOscillator();
    const volume = audio.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = levelUp ? 880 : 520;
    volume.gain.setValueAtTime(0.035, audio.currentTime);
    volume.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + (levelUp ? 0.38 : 0.14));
    oscillator.connect(volume);
    volume.connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + (levelUp ? 0.38 : 0.14));
    oscillator.onended = () => void audio.close();
  } catch {
    // Audio feedback is optional; gameplay remains fully available without it.
  }
}

function progressQuests(profile: PlayerProfile, action: QuestAction, amount = 1) {
  let next = { ...profile, dailyQuestProgress: { ...profile.dailyQuestProgress }, completedDailyQuests: [...profile.completedDailyQuests] };
  let rewardGold = 0;
  let rewardXp = 0;
  for (const quest of getDailyQuests(profile.role)) {
    if (quest.action !== action || next.completedDailyQuests.includes(quest.id)) continue;
    const progress = Math.min(quest.goal, (next.dailyQuestProgress[quest.id] ?? 0) + amount);
    next.dailyQuestProgress[quest.id] = progress;
    if (progress >= quest.goal) {
      next.completedDailyQuests.push(quest.id);
      rewardGold += quest.rewardGold;
      rewardXp += quest.rewardXp;
    }
  }
  if (rewardGold || rewardXp) {
    next = { ...next, gold: next.gold + rewardGold, xp: next.xp + rewardXp };
    next.level = getLevelProgress(next.xp).level;
  }
  return { player: next, rewardGold, rewardXp };
}

function withTargetLedger(player: PlayerProfile) {
  const key = getCityKey(player.targetCountry, player.targetCity);
  const saved = player.cityLedger[key];
  if (saved) return { key, ledger: saved };
  const stats = getCityStats(player.targetCity);
  return {
    key,
    ledger: {
      treasury: 100 + (stats.seed % 850),
      defense: stats.defense,
      influence: 20 + (stats.seed % 70),
      controllingRole: "Politician" as PlayerProfile["role"],
    },
  };
}

export default function Dashboard() {
  const router = useRouter();
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [notice, setNotice] = useState("");
  const [now, setNow] = useState(0);
  const [activeView, setActiveView] = useState<"command" | "world">("command");
  const localMutationRef = useRef(false);

  useEffect(() => {
    const account = getActiveAccount();
    if (!account) {
      router.replace("/");
      return;
    }

    try {
      const savedProfile = window.localStorage.getItem(PLAYER_STORAGE_KEY);
      const restored = restoreAccountProfile(account) ?? (savedProfile ? restorePlayerProfile(JSON.parse(savedProfile)) : null);
      if (!restored) throw new Error("Invalid saved profile");
      if (restored.dailyQuestDate !== getDailyQuestDate()) {
        restored.dailyQuestDate = getDailyQuestDate();
        restored.dailyQuestProgress = {};
        restored.completedDailyQuests = [];
      }
      const elapsedIntervals = Math.floor((Date.now() - restored.lastEnergyRegenAt) / ENERGY_REGEN_INTERVAL_MS);
      if (elapsedIntervals > 0) {
        restored.energy = Math.min(100, restored.energy + elapsedIntervals * ENERGY_REGEN_AMOUNT);
        restored.lastEnergyRegenAt += elapsedIntervals * ENERGY_REGEN_INTERVAL_MS;
      }
      if (restored.energy >= 100) restored.lastEnergyRegenAt = Date.now();
      setPlayer(restored);
      setNow(Date.now());
      void loadPlayerFromSupabase().then((cloudProfile) => {
        if (cloudProfile && !localMutationRef.current) {
          setPlayer(cloudProfile);
          setNow(Date.now());
        }
      });
    } catch {
      window.localStorage.removeItem(PLAYER_STORAGE_KEY);
      router.replace("/");
    }
  }, [router]);

  useEffect(() => {
    if (!player) return;
    const account = getActiveAccount();
    if (account) saveAccountProfile(account.username, player);
    else window.localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(player));
    const timer = window.setTimeout(() => void syncPlayerToSupabase(player), 900);
    return () => window.clearTimeout(timer);
  }, [player]);

  useEffect(() => {
    if (!player) return;
    const timer = window.setInterval(() => {
      const currentTime = Date.now();
      const currentQuestDate = getDailyQuestDate(currentTime);
      setNow(currentTime);
      setPlayer((current) => {
        if (!current) return current;
        const questReset = current.dailyQuestDate !== currentQuestDate
          ? { ...current, dailyQuestDate: currentQuestDate, dailyQuestProgress: {}, completedDailyQuests: [] }
          : current;
        if (questReset.energy >= 100) return questReset;
        const intervals = Math.floor((currentTime - questReset.lastEnergyRegenAt) / ENERGY_REGEN_INTERVAL_MS);
        if (intervals < 1) return questReset;
        return {
          ...questReset,
          energy: Math.min(100, questReset.energy + intervals * ENERGY_REGEN_AMOUNT),
          lastEnergyRegenAt: questReset.lastEnergyRegenAt + intervals * ENERGY_REGEN_INTERVAL_MS,
        };
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [player !== null]);

  const leaveAssembly = useCallback(() => {
    void signOutFromSupabase();
    window.localStorage.removeItem(ACTIVE_ACCOUNT_KEY);
    window.localStorage.removeItem(PLAYER_STORAGE_KEY);
    router.replace("/");
  }, [router]);

  function workForCity(targetCountry = player?.targetCountry, targetCity = player?.targetCity) {
    if (!player || secondsUntil(player.lastWorkAt, WORK_COOLDOWN_MS, now) > 0) return;
    const operationPlayer = { ...player, targetCountry: targetCountry ?? player.targetCountry, targetCity: targetCity ?? player.targetCity };
    const reward = player.role === "Businessman" ? 30 : 20;
    const xp = player.xp + 10;
    const { key, ledger } = withTargetLedger(operationPlayer);
    const base = {
      ...player,
      gold: player.gold + reward,
      xp,
      level: getLevelProgress(xp).level,
      lastWorkAt: now,
      cityLedger: { ...player.cityLedger, [key]: { ...ledger, treasury: ledger.treasury + reward } },
    };
    const result = progressQuests({ ...base, targetCountry: operationPlayer.targetCountry, targetCity: operationPlayer.targetCity }, "work");
    localMutationRef.current = true;
    setPlayer(result.player);
    setNotice(`+${reward} gold and +10 XP to ${operationPlayer.targetCity}.${result.rewardGold ? ` Quest reward: +${result.rewardGold} gold, +${result.rewardXp} XP.` : ""}`);
    playActionFeedback(getLevelProgress(result.player.xp).level > getLevelProgress(player.xp).level);
  }

  function train(targetCountry = player?.targetCountry, targetCity = player?.targetCity) {
    if (!player || player.energy < 10 || secondsUntil(player.lastTrainAt, TRAIN_COOLDOWN_MS, now) > 0) return;
    const operationPlayer = { ...player, targetCountry: targetCountry ?? player.targetCountry, targetCity: targetCity ?? player.targetCity };
    const powerGain = player.role === "Commander" ? 4 : 2;
    const xp = player.xp + 15;
    const { key, ledger } = withTargetLedger(operationPlayer);
    const isHomeCity = operationPlayer.targetCity === player.city && operationPlayer.targetCountry === player.country;
    const base: PlayerProfile = {
      ...player,
      energy: player.energy - 10,
      xp,
      level: getLevelProgress(xp).level,
      power: player.power + powerGain,
      lastTrainAt: now,
      lastEnergyRegenAt: now,
      targetCountry: operationPlayer.targetCountry,
      targetCity: operationPlayer.targetCity,
      cityLedger: isHomeCity ? player.cityLedger : { ...player.cityLedger, [key]: { ...ledger, defense: Math.max(0, ledger.defense - powerGain) } },
    };
    const result = progressQuests(base, "train");
    localMutationRef.current = true;
    setPlayer(result.player);
    setNotice(isHomeCity ? `Training complete: +15 XP and +${powerGain} power.` : `Operation against ${operationPlayer.targetCity}: +15 XP, +${powerGain} power; defense disrupted by ${powerGain}.`);
    playActionFeedback(getLevelProgress(result.player.xp).level > getLevelProgress(player.xp).level);
  }

  function performQuestAction(action: QuestAction) {
    if (!player) return;
    if (action === "work") return workForCity();
    if (action === "train") return train();
    const { key, ledger } = withTargetLedger(player);
    const isHomeCity = player.targetCity === player.city && player.targetCountry === player.country;
    if (["intel", "sabotage", "scout"].includes(action) && isHomeCity) {
      setNotice("Select a different target city for covert operations.");
      return;
    }

    let base: PlayerProfile = { ...player };
    let noticeText = "Objective operation complete.";
    switch (action) {
      case "fortify":
        if (player.gold < 30) return setNotice("You need 30 gold to fortify this city.");
        base = { ...base, gold: player.gold - 30, cityLedger: { ...player.cityLedger, [key]: { ...ledger, defense: ledger.defense + 12 } } };
        noticeText = `${player.targetCity} defense reinforced by 12.`;
        break;
      case "inject":
        if (player.gold < 25) return setNotice("You need 25 gold for this treasury investment.");
        base = { ...base, gold: player.gold - 25, cityLedger: { ...player.cityLedger, [key]: { ...ledger, treasury: ledger.treasury + 25 } } };
        noticeText = `25 gold invested in ${player.targetCity}'s treasury.`;
        break;
      case "campaign":
        base = { ...base, influence: base.influence + 8, cityLedger: { ...player.cityLedger, [key]: { ...ledger, influence: ledger.influence + 12 } } };
        noticeText = `Campaign gained support in ${player.targetCity}.`;
        break;
      case "influence":
        if (player.gold < 20) return setNotice("You need 20 gold to lobby for influence.");
        base = { ...base, gold: player.gold - 20, influence: base.influence + 10, cityLedger: { ...player.cityLedger, [key]: { ...ledger, influence: ledger.influence + 15 } } };
        noticeText = `${player.targetCity} influence increased by 15.`;
        break;
      case "intel":
        base = { ...base, intel: base.intel + 10 };
        noticeText = `10 intel gathered on ${player.targetCity}.`;
        break;
      case "sabotage":
        base = { ...base, cityLedger: { ...player.cityLedger, [key]: { ...ledger, defense: Math.max(0, ledger.defense - 15) } } };
        noticeText = `Sabotage reduced ${player.targetCity} defense by 15.`;
        break;
      case "patrol":
        base = { ...base, power: base.power + 1 };
        noticeText = `Patrol complete. ${player.targetCity} perimeter secured.`;
        break;
      case "market":
        base = { ...base, intel: base.intel + 5 };
        noticeText = `Market report complete. +5 intel.`;
        break;
      case "address":
        base = { ...base, influence: base.influence + 5, cityLedger: { ...player.cityLedger, [key]: { ...ledger, influence: ledger.influence + 8 } } };
        noticeText = `Public address raised ${player.targetCity} influence.`;
        break;
      case "scout":
        base = { ...base, intel: base.intel + 5 };
        noticeText = `${player.targetCity} scouted. +5 intel.`;
        break;
    }
    const result = progressQuests(base, action, action === "inject" ? 25 : action === "intel" ? 10 : 1);
    localMutationRef.current = true;
    setPlayer(result.player);
    setNotice(`${noticeText}${result.rewardGold ? ` Quest reward: +${result.rewardGold} gold, +${result.rewardXp} XP.` : ""}`);
    playActionFeedback(getLevelProgress(result.player.xp).level > getLevelProgress(player.xp).level);
  }

  function selectTarget(country: string, city: string) {
    if (!player) return;
    const targetCity = city || (country === player.targetCountry ? player.targetCity : CITIES_BY_COUNTRY[country]?.[0] ?? "");
    if (!targetCity) return;
    const key = getCityKey(country, targetCity);
    const stats = getCityStats(targetCity);
    const ledger = player.cityLedger[key] ?? {
      treasury: 100 + (stats.seed % 850),
      defense: stats.defense,
      influence: 20 + (stats.seed % 70),
      controllingRole: "Politician" as PlayerProfile["role"],
    };
    setPlayer({ ...player, targetCountry: country, targetCity, cityLedger: { ...player.cityLedger, [key]: ledger } });
    localMutationRef.current = true;
    setNotice(`Operations target set to ${targetCity}, ${country}.`);
    if ("vibrate" in navigator) navigator.vibrate(12);
  }

  function executeMapAction(country: string, city: string, action: WorldMapAction) {
    if (!player) return;
    if (action === "work") {
      workForCity(country, city);
      return;
    }
    if (action === "attack") {
      if (country === player.country && city === player.city) {
        setNotice("That is your home base. Select another city to launch an attack.");
        return;
      }
      train(country, city);
      return;
    }
    if (country === player.country && city === player.city) {
      setNotice("Select another city to gather enemy intelligence.");
      return;
    }
    const xp = player.xp;
    const base = { ...player, targetCountry: country, targetCity: city, intel: player.intel + 10 };
    const result = progressQuests(base, "intel", 10);
    localMutationRef.current = true;
    setPlayer(result.player);
    setNotice(`Gathered 10 intel on ${city}.${result.rewardGold ? ` Quest reward: +${result.rewardGold} gold, +${result.rewardXp} XP.` : ""}`);
    playActionFeedback(getLevelProgress(result.player.xp).level > getLevelProgress(xp).level);
  }

  if (!player) {
    return <main className="grid min-h-screen place-items-center bg-ink text-sm uppercase tracking-[0.16em] text-muted">Loading profile...</main>;
  }

  const workRemaining = secondsUntil(player.lastWorkAt, WORK_COOLDOWN_MS, now);
  const trainRemaining = secondsUntil(player.lastTrainAt, TRAIN_COOLDOWN_MS, now);
  const cityStats = getCityStats(player.city);
  const leaderboard = createLeaderboard(player.city, player);
  const progression = getLevelProgress(player.xp);
  const targetIsEnemy = player.targetCountry !== player.country || player.targetCity !== player.city;

  return (
    <main className="tactical-scanlines relative min-h-screen overflow-hidden bg-ink text-paper">
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

        <div className="dashboard-emblem mt-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/image-2.png" alt="Global War tactical emblem" />
          <div className="dashboard-emblem-copy"><p className="tactical-kicker">Global operations / live theater</p><p className="mt-2 font-display text-2xl sm:text-4xl">Represent your city.</p><p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-muted">Hold ground. Build influence. Shape the map.</p></div>
        </div>

        <nav className="dashboard-nav mt-4" aria-label="Dashboard views">
          <button type="button" className={`dashboard-nav-tab ${activeView === "command" ? "dashboard-nav-active" : ""}`} aria-pressed={activeView === "command"} onClick={() => setActiveView("command")}>Command Overview</button>
          <button type="button" className={`dashboard-nav-tab ${activeView === "world" ? "dashboard-nav-active" : ""}`} aria-pressed={activeView === "world"} onClick={() => setActiveView("world")}>◎ World Map View</button>
        </nav>

        {activeView === "world" ? (
          <section className="world-map-page mt-4 flex flex-1 flex-col">
            <WorldMapView player={player} onAction={executeMapAction} />
            <p aria-live="polite" className="min-h-6 pt-2 text-sm text-signal">{notice}</p>
          </section>
        ) : (
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
                <div className="border-b border-line bg-signal/5 px-4 py-4 sm:px-5">
                  <div className="flex items-end justify-between"><div><p className="stat-label">Player level</p><p className="mt-1 font-display text-4xl text-signal">{String(progression.level).padStart(2, "0")}</p></div><div className="text-right"><p className="font-display text-xl">{player.xp} <span className="text-xs text-muted">XP</span></p><p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-muted">{Math.max(0, progression.nextLevelXp - player.xp)} XP to level {progression.level + 1}</p></div></div>
                  <div className="mt-4 h-2 bg-ink"><div className="h-full bg-signal transition-[width] duration-500" style={{ width: `${progression.progress}%` }} /></div>
                  <div className="mt-1 flex justify-between text-[9px] text-muted"><span>{progression.currentLevelXp} XP</span><span>{progression.nextLevelXp} XP</span></div>
                </div>
                <div className="grid grid-cols-2 border-b border-line"><div className="border-r border-line px-4 py-3"><p className="stat-label">Home city</p><p className="mt-1 text-sm">{player.city}</p></div><div className="px-4 py-3"><p className="stat-label">Office</p><p className="mt-1 text-sm">{player.role}</p></div></div>
                <div className="grid grid-cols-3 divide-x divide-line"><div className="px-4 py-3"><p className="stat-label">Power</p><p className="mt-1 font-display text-xl">{player.power}</p></div><div className="px-4 py-3"><p className="stat-label">Influence</p><p className="mt-1 font-display text-xl">{player.influence}</p></div><div className="px-4 py-3"><p className="stat-label">Intel</p><p className="mt-1 font-display text-xl">{player.intel}</p></div></div>
              </div>
            </section>

            <section aria-labelledby="actions-heading" className="animate-rise" style={{ animationDelay: "160ms" }}>
              <div className="mb-3 flex items-center justify-between"><h2 id="actions-heading" className="text-xs font-bold uppercase tracking-[0.2em]">Available operations</h2><span className="text-[10px] uppercase tracking-[0.14em] text-muted">Energy restores +5 / 10 sec</span></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={() => workForCity()} disabled={workRemaining > 0} className="action-tile group text-left disabled:cursor-not-allowed disabled:opacity-65">
                  <span className="flex items-center justify-between"><span className="text-[10px] uppercase tracking-[0.16em] text-economy">⛏ Economy / +{player.role === "Businessman" ? 30 : 20} gold</span><span aria-hidden="true" className="text-xl">→</span></span>
                  <span className="mt-8 block font-display text-2xl">Work for City</span>
                  <span className="mt-2 block text-xs text-muted">{workRemaining > 0 ? `Available in ${formatCooldown(workRemaining)}` : `Earn gold for ${player.targetCity}`}</span>
                </button>
                <button type="button" onClick={() => train()} disabled={trainRemaining > 0 || player.energy < 10} className="action-tile group text-left disabled:cursor-not-allowed disabled:opacity-65">
                  <span className="flex items-center justify-between"><span className="text-[10px] uppercase tracking-[0.16em] text-war">⚔ {targetIsEnemy ? "Attack operation" : "Training operation"} / -10 energy</span><span aria-hidden="true" className="text-xl">→</span></span>
                  <span className="mt-8 block font-display text-2xl">Attack / Train</span>
                  <span className="mt-2 block text-xs text-muted">{trainRemaining > 0 ? `Available in ${formatCooldown(trainRemaining)}` : player.energy < 10 ? "Recover energy to train" : `Target: ${player.targetCity} · +15 XP and power`}</span>
                </button>
              </div>
              <p aria-live="polite" className="mt-4 min-h-5 text-sm text-signal">{notice}</p>
            </section>
          </div>

          <div className="mt-7"><DailyQuestList player={player} canWork={workRemaining === 0} canTrain={trainRemaining === 0 && player.energy >= 10} canTargetEnemy={targetIsEnemy} onAction={performQuestAction} /></div>

          <div className="mt-7"><TacticalMap player={player} onSelectTarget={selectTarget} /></div>

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
        )}
      </div>
    </main>
  );
}