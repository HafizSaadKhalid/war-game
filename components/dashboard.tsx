"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PLAYER_STORAGE_KEY, PlayerProfile } from "@/components/player";

export default function Dashboard() {
  const router = useRouter();
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const savedProfile = window.localStorage.getItem(PLAYER_STORAGE_KEY);
    if (!savedProfile) {
      router.replace("/");
      return;
    }

    try {
      setPlayer(JSON.parse(savedProfile) as PlayerProfile);
    } catch {
      window.localStorage.removeItem(PLAYER_STORAGE_KEY);
      router.replace("/");
    }
  }, [router]);

  function leaveAssembly() {
    window.localStorage.removeItem(PLAYER_STORAGE_KEY);
    router.replace("/");
  }

  if (!player) {
    return <main className="grid min-h-screen place-items-center bg-ink text-sm uppercase tracking-[0.16em] text-muted">Loading profile...</main>;
  }

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

        <section className="flex flex-1 flex-col py-10 sm:py-14">
          <div className="flex flex-col justify-between gap-6 border-b border-line pb-8 sm:flex-row sm:items-end">
            <div className="animate-rise">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-signal">City representative / Level {player.level}</p>
              <h1 className="font-display text-4xl sm:text-6xl">Welcome, <span className="italic text-signal">{player.username}.</span></h1>
              <p className="mt-3 text-sm text-muted">Your seat is ready. Make your city count.</p>
            </div>
            <div className="flex min-w-44 items-center justify-between border border-line bg-panel px-5 py-4">
              <div><p className="text-[10px] uppercase tracking-[0.18em] text-muted">Treasury</p><p className="mt-1 text-xs text-muted">Available gold</p></div>
              <p className="font-display text-3xl text-signal">{player.gold}<span className="ml-2 text-sm">G</span></p>
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <section aria-labelledby="profile-heading" className="animate-rise" style={{ animationDelay: "80ms" }}>
              <div className="mb-4 flex items-center justify-between">
                <h2 id="profile-heading" className="text-xs font-bold uppercase tracking-[0.2em]">Your profile</h2>
                <span className="text-[10px] uppercase tracking-[0.14em] text-muted">Representative file</span>
              </div>
              <div className="border border-line bg-panel">
                <div className="border-b border-line px-5 py-4"><p className="text-[10px] uppercase tracking-[0.16em] text-muted">Nation</p><p className="mt-1 text-lg">{player.country}</p></div>
                <div className="border-b border-line px-5 py-4"><p className="text-[10px] uppercase tracking-[0.16em] text-muted">Home city</p><p className="mt-1 text-lg">{player.city}</p></div>
                <div className="flex items-center justify-between px-5 py-4"><div><p className="text-[10px] uppercase tracking-[0.16em] text-muted">Office</p><p className="mt-1 text-lg">{player.role}</p></div><span className="grid h-10 w-10 place-items-center border border-line text-sm text-signal">{player.role === "Commander" ? "C" : "P"}</span></div>
              </div>
            </section>

            <section aria-labelledby="actions-heading" className="animate-rise" style={{ animationDelay: "160ms" }}>
              <div className="mb-4 flex items-center justify-between">
                <h2 id="actions-heading" className="text-xs font-bold uppercase tracking-[0.2em]">Available operations</h2>
                <span className="text-[10px] uppercase tracking-[0.14em] text-muted">Two actions</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={() => setNotice("City work is not active in this MVP yet.")} className="action-tile group text-left">
                  <span className="flex items-center justify-between"><span className="text-[10px] uppercase tracking-[0.16em] text-signal">Economy / 01</span><span aria-hidden="true" className="text-xl transition-transform group-hover:translate-x-1">→</span></span>
                  <span className="mt-12 block font-display text-2xl">Work for City</span>
                  <span className="mt-2 block text-xs text-muted">Contribute to the local treasury</span>
                </button>
                <button type="button" onClick={() => setNotice("Neighbor actions are not active in this MVP yet.")} className="action-tile group text-left">
                  <span className="flex items-center justify-between"><span className="text-[10px] uppercase tracking-[0.16em] text-rose-300">Strategy / 02</span><span aria-hidden="true" className="text-xl transition-transform group-hover:translate-x-1">→</span></span>
                  <span className="mt-12 block font-display text-2xl">Attack Neighbor</span>
                  <span className="mt-2 block text-xs text-muted">Challenge a neighboring city</span>
                </button>
              </div>
              <p aria-live="polite" className="mt-4 min-h-5 text-sm text-signal">{notice}</p>
            </section>
          </div>
          <div className="mt-auto pt-12 text-[10px] uppercase tracking-[0.16em] text-muted">City first. The rest is history.</div>
        </section>
      </div>
    </main>
  );
}