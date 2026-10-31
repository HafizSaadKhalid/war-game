"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { CITIES_BY_COUNTRY, createPlayerProfile, PLAYER_STORAGE_KEY, PlayerRole, ROLE_OPTIONS } from "@/components/player";

export default function RegistrationForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [role, setRole] = useState<PlayerRole | "">("");
  const [error, setError] = useState("");

  function handleCountryChange(value: string) {
    setCountry(value);
    setCity("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanUsername = username.trim();
    if (!cleanUsername || !country || !city || !role) {
      setError("Complete each field to join the table.");
      return;
    }

    window.localStorage.setItem(
      PLAYER_STORAGE_KEY,
      JSON.stringify(createPlayerProfile({ username: cleanUsername, country, city, role })),
    );
    router.push("/dashboard");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-ink text-paper">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-grid opacity-50" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between border-b border-line pb-5">
          <a className="flex items-center gap-3" href="/" aria-label="Represent Your City home">
            <span className="grid h-9 w-9 place-items-center border border-signal text-sm font-bold text-signal">RYC</span>
            <span className="text-xs font-bold uppercase tracking-[0.18em]">Civic Assembly</span>
          </a>
          <span className="hidden text-xs uppercase tracking-[0.18em] text-muted sm:block">Global season 01 <span className="ml-2 text-signal">● Live soon</span></span>
        </header>

        <section className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:py-16">
          <div className="max-w-xl animate-rise">
            <p className="mb-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] text-signal">
              <span className="h-px w-8 bg-signal" /> Your city. Your stake.
            </p>
            <h1 className="font-display text-5xl leading-[0.98] sm:text-6xl lg:text-7xl">
              The world moves <span className="italic text-signal">from here.</span>
            </h1>
            <p className="mt-7 max-w-md text-base leading-7 text-muted sm:text-lg">
              Claim a seat at the table. Build influence for your city and decide how it meets the world.
            </p>
            <div className="mt-12 grid max-w-md grid-cols-3 border-y border-line py-5">
              <div><p className="font-display text-2xl">01</p><p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-muted">Choose a side</p></div>
              <div className="border-x border-line px-5"><p className="font-display text-2xl">04</p><p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-muted">Nations</p></div>
              <div className="pl-5"><p className="font-display text-2xl">∞</p><p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-muted">Possibilities</p></div>
            </div>
          </div>

          <div className="animate-rise border border-line bg-panel p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-8" style={{ animationDelay: "100ms" }}>
            <div className="mb-7 flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-signal">New representative</p>
                <h2 className="mt-2 font-display text-3xl">Take your place</h2>
              </div>
              <span className="border border-line px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-muted">01 / 01</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="username" className="field-label">Username</label>
                <input id="username" className="field-input" autoComplete="nickname" maxLength={24} placeholder="e.g. citybuilder" value={username} onChange={(event) => setUsername(event.target.value)} required />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="country" className="field-label">Country</label>
                  <select id="country" className="field-input" value={country} onChange={(event) => handleCountryChange(event.target.value)} required>
                    <option value="" disabled>Select country</option>
                    {Object.keys(CITIES_BY_COUNTRY).map((name) => <option key={name} value={name}>{name}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="city" className="field-label">City</label>
                  <select id="city" className="field-input disabled:cursor-not-allowed disabled:opacity-50" value={city} onChange={(event) => setCity(event.target.value)} disabled={!country} required>
                    <option value="" disabled>{country ? "Select city" : "Choose country first"}</option>
                    {(CITIES_BY_COUNTRY[country] ?? []).map((name) => <option key={name} value={name}>{name}</option>)}
                  </select>
                </div>
              </div>
              <fieldset>
                <legend className="field-label">Choose your role</legend>
                <div className="grid grid-cols-2 gap-3">
                  {ROLE_OPTIONS.map((option, index) => (
                    <label key={option.value} className={`cursor-pointer border p-3 transition-colors ${role === option.value ? "border-signal bg-signal/5" : "border-line hover:border-muted"}`}>
                      <input className="sr-only" type="radio" name="role" value={option.value} checked={role === option.value} onChange={() => setRole(option.value)} />
                      <span className="flex items-center justify-between gap-2 text-sm font-semibold"><span>{option.icon} {option.value}</span><span className={role === option.value ? "text-signal" : "text-muted"}>{String(index + 1).padStart(2, "0")}</span></span>
                      <span className="mt-2 block text-xs text-muted">{option.description}</span>
                      <span className="mt-1 block text-[10px] uppercase tracking-[0.1em] text-signal">{option.specialty}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
              <button type="submit" className="group flex w-full items-center justify-between bg-signal px-5 py-4 text-left text-sm font-bold text-ink transition-colors hover:bg-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal">
                <span>Enter the assembly</span><span aria-hidden="true" className="text-lg transition-transform group-hover:translate-x-1">→</span>
              </button>
              <p className="text-center text-[11px] leading-5 text-muted">Your profile is saved on this device. No account or password required.</p>
            </form>
          </div>
        </section>
        <footer className="flex justify-between border-t border-line pt-4 text-[10px] uppercase tracking-[0.16em] text-muted">
          <span>Represent Your City</span><span>Diplomacy is a local affair</span>
        </footer>
      </div>
    </main>
  );
}