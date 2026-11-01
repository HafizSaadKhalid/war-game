"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getActiveAccount, getLocalRoleDistribution, restoreAccountProfile, saveAccountProfile } from "@/components/account-storage";
import {
  createPlayerProfile,
  getRoleDemand,
  hasCompletedCharacterSetup,
  PLAYER_STORAGE_KEY,
  PlayerProfession,
  PROFESSION_OPTIONS,
  PROFESSION_SPECIALIZATIONS,
  RoleDistribution,
} from "@/components/player";
import { fetchCountryRoleDistribution, syncPlayerToSupabase } from "@/lib/game-cloud";
import type { LocationOption } from "@/components/location-data";
const EMPTY_DISTRIBUTION: RoleDistribution = {
  "Military Commander": 0,
  Industrialist: 0,
  Politician: 0,
  "Intelligence Agent": 0,
};

export default function CharacterSetup() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [country, setCountry] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [homeState, setHomeState] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [city, setCity] = useState("");
  const [countryOptions, setCountryOptions] = useState<LocationOption[]>([]);
  const [states, setStates] = useState<LocationOption[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [profession, setProfession] = useState<PlayerProfession | "">("");
  const [specialization, setSpecialization] = useState("");
  const [roleDistribution, setRoleDistribution] = useState<RoleDistribution>(EMPTY_DISTRIBUTION);
  const [demandLoading, setDemandLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    void fetch("/api/locations")
      .then((response) => response.json() as Promise<{ countries?: LocationOption[] }>)
      .then((data) => { if (active) setCountryOptions(data.countries ?? []); })
      .finally(() => { if (active) setLocationsLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!countryCode) {
      setStates([]);
      setCities([]);
      return;
    }
    let active = true;
    setLocationsLoading(true);
    const params = new URLSearchParams({ countryCode, stateCode });
    void fetch(`/api/locations?${params}`)
      .then((response) => response.json() as Promise<{ states?: LocationOption[]; cities?: string[] }>)
      .then((data) => {
        if (!active) return;
        const nextStates = data.states ?? [];
        setStates(nextStates);
        setCities(data.cities ?? []);
        if (!nextStates.length) setHomeState("No subdivision");
        else if (stateCode) setHomeState(nextStates.find((option) => option.code === stateCode)?.name ?? homeState);
      })
      .finally(() => { if (active) setLocationsLoading(false); });
    return () => { active = false; };
  }, [countryCode, stateCode]);

  useEffect(() => {
    if (!countryCode) {
      setRoleDistribution(EMPTY_DISTRIBUTION);
      return;
    }
    const countryName = countryOptions.find((option) => option.code === countryCode)?.name ?? "";
    setRoleDistribution(getLocalRoleDistribution(countryName));
    let active = true;
    setDemandLoading(true);
    void fetchCountryRoleDistribution(countryCode).then((remoteDistribution) => {
      if (active && remoteDistribution) setRoleDistribution(remoteDistribution);
      if (active) setDemandLoading(false);
    });
    return () => { active = false; };
  }, [countryCode, countryOptions]);

  useEffect(() => {
    const account = getActiveAccount();
    if (!account) {
      router.replace("/login");
      return;
    }
    const existingProfile = restoreAccountProfile(account);
    if (hasCompletedCharacterSetup(existingProfile)) {
      window.localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(existingProfile));
      router.replace("/dashboard?view=world");
      return;
    }
    setUsername(account.username);
    if (existingProfile) {
      setCountry(existingProfile.country);
      setCountryCode(existingProfile.countryCode);
      setHomeState(existingProfile.homeState);
      setStateCode(existingProfile.stateCode);
      setCity(existingProfile.city);
      if (existingProfile.professionSelected) {
        setProfession(existingProfile.profession);
        setSpecialization(existingProfile.specialization);
      }
      if (existingProfile.country && existingProfile.homeState && existingProfile.city) setStep(2);
    }
    setReady(true);
  }, [router]);

  function continueToProfession() {
    if (locationsLoading) {
      setError("Loading the country location catalog. Please wait a moment.");
      return;
    }
    if (!country || city.trim().length < 2 || (states.length > 0 && !homeState)) {
      setError("Choose a country and state, then enter your home city.");
      return;
    }
    setError("");
    setStep(2);
  }

  async function finishSetup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const account = getActiveAccount();
    if (!account) {
      router.replace("/login");
      return;
    }
    if (!profession || !specialization) {
      setError("Choose a profession and specialization branch to continue.");
      return;
    }
    const demand = getRoleDemand(roleDistribution, profession);
    if (!demand.isAvailable) {
      setError("Commander slots are currently limited in this country. Choose another high-demand profession.");
      return;
    }
    const previousProfile = restoreAccountProfile(account);
    let homeCoordinates: { latitude: number; longitude: number } | null = null;
    try {
      const params = new URLSearchParams({ countryCode, stateCode, city: city.trim() });
      const response = await fetch(`/api/locations?${params}`);
      const data = await response.json() as { coordinates?: { latitude: number; longitude: number } | null };
      homeCoordinates = data.coordinates ?? null;
    } catch {
      homeCoordinates = null;
    }
    const newProfile = createPlayerProfile({
      username: account.username,
      country,
      countryCode,
      homeState,
      stateCode,
      city: city.trim(),
      profession,
      specialization,
      roleYieldBonusPercent: demand.bonusPercent,
      homeCoordinates,
    });
    const profile = previousProfile ? {
      ...newProfile,
      gold: previousProfile.gold,
      level: previousProfile.level,
      xp: previousProfile.xp,
      energy: previousProfile.energy,
      power: previousProfile.power,
      influence: previousProfile.influence,
      intel: previousProfile.intel,
      lastWorkAt: previousProfile.lastWorkAt,
      lastTrainAt: previousProfile.lastTrainAt,
      cityLedger: {
        ...previousProfile.cityLedger,
        ...newProfile.cityLedger,
      },
      dailyQuestDate: previousProfile.dailyQuestDate,
      dailyQuestProgress: previousProfile.dailyQuestProgress,
      completedDailyQuests: previousProfile.completedDailyQuests,
      professionSelected: true,
    } : newProfile;
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
              <div><label htmlFor="country" className="field-label">Country / territory</label><select id="country" className="field-input" value={countryCode} onChange={(event) => { const selected = countryOptions.find((option) => option.code === event.target.value); setCountryCode(selected?.code ?? ""); setCountry(selected?.name ?? ""); setHomeState(""); setStateCode(""); setCity(""); setProfession(""); setSpecialization(""); }} disabled={!countryOptions.length} required><option value="" disabled>{countryOptions.length ? `Select from ${countryOptions.length} countries` : "Loading countries…"}</option>{countryOptions.map((option) => <option key={option.code} value={option.code}>{option.name}</option>)}</select></div>
              <div><label htmlFor="state" className="field-label">State / province / region</label><select id="state" className="field-input disabled:cursor-not-allowed disabled:opacity-50" value={stateCode} onChange={(event) => { const selected = states.find((option) => option.code === event.target.value); setStateCode(selected?.code ?? ""); setHomeState(selected?.name ?? "No subdivision"); setCity(""); }} disabled={!countryCode || locationsLoading || states.length === 0} required={states.length > 0}><option value="">{!countryCode ? "Choose a country first" : locationsLoading ? "Loading subdivisions…" : states.length ? "Select a subdivision" : "No subdivision listed"}</option>{states.map((option) => <option key={option.code} value={option.code}>{option.name}</option>)}</select></div>
              <div className="sm:col-span-2"><label htmlFor="city" className="field-label">Home city</label><input id="city" className="field-input" autoComplete="address-level2" list="city-suggestions" maxLength={60} placeholder="Type a city or settlement" value={city} onChange={(event) => setCity(event.target.value)} disabled={!countryCode || locationsLoading} required /><datalist id="city-suggestions">{cities.map((name) => <option key={name} value={name} />)}</datalist><p className="mt-2 text-[10px] text-muted">Suggestions show up to 250 cities; any city or settlement can be entered.</p></div>
            </div>
            <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-muted">Your home base anchors your first map view.</p><button type="button" onClick={continueToProfession} disabled={locationsLoading} className="group flex items-center justify-between gap-8 bg-signal px-5 py-4 text-left text-sm font-bold text-ink transition-colors hover:bg-paper disabled:cursor-wait disabled:opacity-50"><span>{locationsLoading ? "Loading locations…" : "Continue to profession"}</span><span aria-hidden="true" className="text-lg transition-transform group-hover:translate-x-1">→</span></button></div>
          </div> : <form onSubmit={finishSetup} className="space-y-7">
            <div className="grid gap-3 sm:grid-cols-2">
              {PROFESSION_OPTIONS.map((option, index) => {
                const demand = getRoleDemand(roleDistribution, option.value);
                const selected = profession === option.value;
                return <label key={option.value} className={`cursor-pointer border p-5 transition-colors ${!demand.isAvailable ? "cursor-not-allowed border-war/60 bg-war/5 opacity-70" : selected ? "border-signal bg-signal/5" : "border-line bg-panel hover:border-muted"}`}><input className="sr-only" type="radio" name="profession" value={option.value} checked={selected} disabled={!demand.isAvailable} onChange={() => { setProfession(option.value); setSpecialization(""); }} /><span className="flex items-center justify-between gap-2"><span className="text-lg font-semibold">{option.icon} {option.value}</span><span className={demand.status === "limited-slots" ? "text-war" : "text-economy"}>{demand.status === "limited-slots" ? "LIMITED SLOTS" : demand.status === "high-demand" ? "HIGH DEMAND" : "BONUS ACTIVE"}</span></span><span className="mt-3 block min-h-10 text-sm leading-5 text-muted">{option.description}</span><span className="mt-3 block border-t border-line pt-3 text-[10px] font-bold uppercase tracking-[0.13em] text-signal">{option.bonus}</span><span className="mt-2 block text-[10px] text-muted">{demandLoading ? "Updating country demand…" : `${demand.count} of ${demand.total} players${demand.bonusPercent ? ` · +${demand.bonusPercent}% production yield` : ""}`}</span>{selected && <select aria-label={`${option.value} specialization`} className="field-input mt-4" value={specialization} onChange={(event) => setSpecialization(event.target.value)} required><option value="" disabled>Select specialization branch</option>{PROFESSION_SPECIALIZATIONS[option.value].map((branch) => <option key={branch}>{branch}</option>)}</select>}</label>;
              })}
            </div>
            <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between"><button type="button" onClick={() => { setStep(1); setError(""); }} className="px-2 py-3 text-left text-xs font-bold uppercase tracking-[0.14em] text-muted hover:text-paper">← Back to location</button><button type="submit" disabled={!profession || !specialization || !getRoleDemand(roleDistribution, profession).isAvailable} className="group flex items-center justify-between gap-8 bg-signal px-5 py-4 text-left text-sm font-bold text-ink transition-colors hover:bg-paper disabled:cursor-not-allowed disabled:opacity-50"><span>Establish home base</span><span aria-hidden="true" className="text-lg transition-transform group-hover:translate-x-1">→</span></button></div>
          </form>}
          {error && <p role="alert" className="mt-4 text-sm text-rose-300">{error}</p>}
          <div className="mt-7 flex items-center gap-2" aria-label={`Setup step ${step} of 2`}><span className={`h-1 w-12 ${step === 1 ? "bg-signal" : "bg-line"}`} /><span className={`h-1 w-12 ${step === 2 ? "bg-signal" : "bg-line"}`} /></div>
        </section>
        <footer className="flex justify-between border-t border-line pt-4 text-[10px] uppercase tracking-[0.16em] text-muted"><span>Global War</span><span>Represent your city</span></footer>
      </div>
    </main>
  );
}
