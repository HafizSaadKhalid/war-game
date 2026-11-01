"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getActiveAccount, restoreAccountProfile, saveAccountProfile } from "@/components/account-storage";
import {
  CITIES_BY_COUNTRY,
  CITIES_BY_STATE,
  createPlayerProfile,
  PLAYER_STORAGE_KEY,
  PlayerProfession,
  PROFESSION_OPTIONS,
  STATES_BY_COUNTRY,
} from "@/components/player";
import { syncPlayerToSupabase } from "@/lib/game-cloud";

export default function CharacterSetup() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [country, setCountry] = useState("");
  const [homeState, setHomeState] = useState("");
  const [city, setCity] = useState("");
  const [profession, setProfession] = useState<PlayerProfession | "">("");
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const account = getActiveAccount();
    if (!account) {
      router.replace("/login");
      return;
    }
    const existingProfile = restoreAccountProfile(account);
    if (existingProfile) {
      window.localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(existingProfile));
      router.replace("/dashboard?view=world");
      return;
    }
    setUsername(account.username);
    setReady(true);
  }, [router]);

  function continueToProfession() {
    if (!country || !homeState || city.trim().length < 2) {
      setError("Choose a country and state, then enter your home city.");
      return;
    }
    setError("");
    setStep(2);
  }

  function finishSetup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const account = getActiveAccount();
    if (!account) {
      router.replace("/login");
      return;
    }
    if (!profession) {
      setError("Choose a starting profession to continue.");
      return;
    }
    const profile = createPlayerProfile({
      username: account.username,
      country,
      homeState,
      city: city.trim(),
      profession,
    });
    saveAccountProfile(account.username, profile);
    void syncPlayerToSupabase(profile);
    router.push("/dashboard?view=world");
  }

  if (!ready) return <main className="grid min-h-screen place-items-center bg-ink text-sm uppercase tracking-[0.16em] text-muted">Preparing home base setup...</main>;

  return (
    <main className="relative min-h-screen overflow-hidden bg-ink text-paper">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-grid opacity-50" />
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-6 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between border-b border-line pb-5"><a className="flex items-center gap-3" href="/" aria-label="Global War home"><span className="grid h-9 w-9 place-items-center border border-signal text-sm font-bold text-signal">RYC</span><span className="text-xs font-bold uppercase tracking-[0.18em]">Global War</span></a><span className="text-xs uppercase tracking-[0.16em] text-muted">Character setup / 0{step}</span></header>
        <section className="mx-auto w-full max-w-4xl flex-1 py-10 sm:py-14">
          <div className="mb-8 max-w-2xl"><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-signal">Welcome, {username} · step {step} of 2</p><h1 className="mt-3 font-display text-4xl sm:text-6xl">{step === 1 ? <>Establish your <span className="italic text-signal">home base.</span></> : <>Choose your <span className="italic text-signal">profession.</span></>}</h1><p className="mt-4 text-sm leading-6 text-muted">{step === 1 ? "Select the country, state, and city your campaign will represent." : "Your profession shapes your starting advantage and the way you influence the world."}</p></div>

          {step === 1 ? <div className="space-y-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <div><label htmlFor="country" className="field-label">Country</label><select id="country" className="field-input" value={country} onChange={(event) => { setCountry(event.target.value); setHomeState(""); setCity(""); }} required><option value="" disabled>Select country</option>{Object.keys(STATES_BY_COUNTRY).map((name) => <option key={name}>{name}</option>)}</select></div>
              <div><label htmlFor="state" className="field-label">State / province</label><select id="state" className="field-input disabled:cursor-not-allowed disabled:opacity-50" value={homeState} onChange={(event) => { setHomeState(event.target.value); setCity(""); }} disabled={!country} required><option value="" disabled>{country ? "Select state / province" : "Choose country first"}</option>{(STATES_BY_COUNTRY[country] ?? []).map((name) => <option key={name}>{name}</option>)}</select></div>
              <div className="sm:col-span-2"><label htmlFor="city" className="field-label">Home city</label><input id="city" className="field-input" autoComplete="address-level2" list="city-suggestions" maxLength={40} placeholder="Enter your city" value={city} onChange={(event) => setCity(event.target.value)} required /><datalist id="city-suggestions">{[...(CITIES_BY_STATE[homeState] ?? []), ...(CITIES_BY_COUNTRY[country] ?? [])].filter((value, index, list) => list.indexOf(value) === index).map((name) => <option key={name} value={name} />)}</datalist></div>
            </div>
            <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-muted">Your home base anchors your first map view.</p><button type="button" onClick={continueToProfession} className="group flex items-center justify-between gap-8 bg-signal px-5 py-4 text-left text-sm font-bold text-ink transition-colors hover:bg-paper"><span>Continue to profession</span><span aria-hidden="true" className="text-lg transition-transform group-hover:translate-x-1">→</span></button></div>
          </div> : <form onSubmit={finishSetup} className="space-y-7">
            <div className="grid gap-3 sm:grid-cols-2">
              {PROFESSION_OPTIONS.map((option, index) => <label key={option.value} className={`cursor-pointer border p-5 transition-colors ${profession === option.value ? "border-signal bg-signal/5" : "border-line bg-panel hover:border-muted"}`}><input className="sr-only" type="radio" name="profession" value={option.value} checked={profession === option.value} onChange={() => setProfession(option.value)} /><span className="flex items-center justify-between"><span className="text-lg font-semibold">{option.icon} {option.value}</span><span className={profession === option.value ? "text-signal" : "text-muted"}>{String(index + 1).padStart(2, "0")}</span></span><span className="mt-3 block min-h-10 text-sm leading-5 text-muted">{option.description}</span><span className="mt-4 block border-t border-line pt-3 text-[10px] font-bold uppercase tracking-[0.13em] text-signal">{option.bonus}</span></label>)}
            </div>
            <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between"><button type="button" onClick={() => { setStep(1); setError(""); }} className="px-2 py-3 text-left text-xs font-bold uppercase tracking-[0.14em] text-muted hover:text-paper">← Back to location</button><button type="submit" disabled={!profession} className="group flex items-center justify-between gap-8 bg-signal px-5 py-4 text-left text-sm font-bold text-ink transition-colors hover:bg-paper disabled:cursor-not-allowed disabled:opacity-50"><span>Establish home base</span><span aria-hidden="true" className="text-lg transition-transform group-hover:translate-x-1">→</span></button></div>
          </form>}
          {error && <p role="alert" className="mt-4 text-sm text-rose-300">{error}</p>}
          <div className="mt-7 flex items-center gap-2" aria-label={`Setup step ${step} of 2`}><span className={`h-1 w-12 ${step === 1 ? "bg-signal" : "bg-line"}`} /><span className={`h-1 w-12 ${step === 2 ? "bg-signal" : "bg-line"}`} /></div>
        </section>
        <footer className="flex justify-between border-t border-line pt-4 text-[10px] uppercase tracking-[0.16em] text-muted"><span>Global War</span><span>Represent your city</span></footer>
      </div>
    </main>
  );
}
