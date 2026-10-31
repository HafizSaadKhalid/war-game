"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getActiveAccount,
  restoreAccountProfile,
  saveAccountProfile,
} from "@/components/account-storage";
import {
  CITIES_BY_COUNTRY,
  createPlayerProfile,
  PLAYER_STORAGE_KEY,
  PlayerRole,
  ROLE_OPTIONS,
} from "@/components/player";
import { syncPlayerToSupabase } from "@/lib/game-cloud";

export default function CharacterSetup() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [role, setRole] = useState<PlayerRole | "">("");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const account = getActiveAccount();
    if (!account) {
      router.replace("/");
      return;
    }
    const existingProfile = restoreAccountProfile(account);
    if (existingProfile) {
      window.localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(existingProfile));
      router.replace("/dashboard");
      return;
    }
    setUsername(account.username);
    setReady(true);
  }, [router]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const account = getActiveAccount();
    if (!account) {
      router.replace("/");
      return;
    }
    const cleanCity = city.trim();
    if (!country || cleanCity.length < 2 || !role) {
      setError("Choose a country, enter a city, and select a role.");
      return;
    }
    const profile = createPlayerProfile({ username: account.username, country, city: cleanCity, role });
    saveAccountProfile(account.username, profile);
    void syncPlayerToSupabase(profile);
    router.push("/dashboard");
  }

  if (!ready) return <main className="grid min-h-screen place-items-center bg-ink text-sm uppercase tracking-[0.16em] text-muted">Preparing character setup...</main>;

  return (
    <main className="relative min-h-screen overflow-hidden bg-ink text-paper">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-grid opacity-50" />
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-6 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between border-b border-line pb-5"><a className="flex items-center gap-3" href="/" aria-label="Global War home"><span className="grid h-9 w-9 place-items-center border border-signal text-sm font-bold text-signal">RYC</span><span className="text-xs font-bold uppercase tracking-[0.18em]">Global War</span></a><span className="text-xs uppercase tracking-[0.16em] text-muted">Character setup / 02</span></header>
        <section className="mx-auto w-full max-w-4xl flex-1 py-10 sm:py-14">
          <div className="mb-8 max-w-2xl"><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-signal">Welcome, {username}</p><h1 className="mt-3 font-display text-4xl sm:text-6xl">Choose your <span className="italic text-signal">ground.</span></h1><p className="mt-4 text-sm leading-6 text-muted">Set your home city and choose the office that will shape your rise.</p></div>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid gap-5 sm:grid-cols-2">
              <div><label htmlFor="country" className="field-label">Country</label><select id="country" className="field-input" value={country} onChange={(event) => setCountry(event.target.value)} required><option value="" disabled>Select country</option>{Object.keys(CITIES_BY_COUNTRY).map((name) => <option key={name}>{name}</option>)}</select></div>
              <div><label htmlFor="city" className="field-label">Home city</label><input id="city" className="field-input" autoComplete="address-level2" list="city-suggestions" maxLength={40} placeholder="e.g. Karachi" value={city} onChange={(event) => setCity(event.target.value)} required /><datalist id="city-suggestions">{(CITIES_BY_COUNTRY[country] ?? []).map((name) => <option key={name} value={name} />)}</datalist></div>
            </div>
            <fieldset>
              <legend className="mb-3 field-label">Choose your role</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {ROLE_OPTIONS.map((option) => <label key={option.value} className={`cursor-pointer border p-4 transition-colors ${role === option.value ? "border-signal bg-signal/5" : "border-line bg-panel hover:border-muted"}`}><input className="sr-only" type="radio" name="role" value={option.value} checked={role === option.value} onChange={() => setRole(option.value)} /><span className="flex items-center justify-between gap-3"><span className="text-base font-semibold">{option.icon} {option.value}</span><span className={`text-xs uppercase tracking-[0.1em] ${role === option.value ? "text-signal" : "text-muted"}`}>{option.specialty}</span></span><span className="mt-3 block text-sm text-muted">{option.description}</span><span className="mt-4 block border-t border-line pt-3 text-[10px] uppercase tracking-[0.15em] text-muted">Initial stat advantage</span><span className="mt-1 block text-xs text-paper">{option.value === "Commander" ? "+5 starting power · +4 power per training" : option.value === "Politician" ? "+5 starting influence · diplomacy focus" : option.value === "Businessman" ? "+10 gold on every work action" : "+5 starting intel · covert focus"}</span></label>)}
              </div>
            </fieldset>
            <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-muted">Starting profile: Level 1 · 0 XP · 100 Gold · 100 Energy</p><button type="submit" className="group flex items-center justify-between gap-8 bg-signal px-5 py-4 text-left text-sm font-bold text-ink transition-colors hover:bg-paper"><span>Enter the world</span><span aria-hidden="true" className="text-lg transition-transform group-hover:translate-x-1">→</span></button></div>
            {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
          </form>
        </section>
        <footer className="flex justify-between border-t border-line pt-4 text-[10px] uppercase tracking-[0.16em] text-muted"><span>Global War</span><span>Represent your city</span></footer>
      </div>
    </main>
  );
}