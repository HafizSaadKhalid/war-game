"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createSalt,
  getAccounts,
  hashPassword,
  restoreAccountProfile,
  saveAccounts,
  setActiveAccount,
} from "@/components/account-storage";
import { PLAYER_STORAGE_KEY } from "@/components/player";
import { loadPlayerFromSupabase, signInWithSupabase, signOutFromSupabase, signUpWithSupabase } from "@/lib/game-cloud";

type AuthMode = "signup" | "login";

export default function RegistrationForm({ initialMode = "signup" }: { initialMode?: AuthMode }) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const cleanUsername = username.trim();
    if (!/^[a-zA-Z0-9._-]{3,24}$/.test(cleanUsername) || password.length < 8) {
      setError("Use 3–24 letters, numbers, dots, underscores, or hyphens for your username and a password with at least 8 characters.");
      return;
    }

    setBusy(true);
    try {
      const accounts = getAccounts();
      const existing = accounts.find((account) => account.username.toLowerCase() === cleanUsername.toLowerCase());
      if (mode === "signup") {
        if (existing) {
          setError("That username already has an account. Log in instead.");
          return;
        }
        const salt = createSalt();
        const passwordHash = await hashPassword(password, salt);
        const cloudResult = await signUpWithSupabase(cleanUsername, password);
        if (cloudResult.confirmationRequired) {
          setError("Supabase created the account but requires email confirmation. Disable email confirmations in Supabase Auth for username-only sign-in, then log in again.");
          return;
        }
        if (cloudResult.userId) await signOutFromSupabase();
        accounts.push({ username: cleanUsername, salt, passwordHash, profile: null });
        saveAccounts(accounts);
        router.push("/login?created=1");
        return;
      }

      const cloudResult = await signInWithSupabase(cleanUsername, password);
      const localValid = existing && await hashPassword(password, existing.salt) === existing.passwordHash;
      if (!cloudResult.userId && !localValid) {
        setError("Username or password is incorrect.");
        return;
      }
      if (!cloudResult.userId && localValid) await signOutFromSupabase();
      if (!existing && cloudResult.userId) {
        const salt = createSalt();
        accounts.push({ username: cleanUsername, salt, passwordHash: await hashPassword(password, salt), profile: null });
        saveAccounts(accounts);
      }
      const signedInAccount = getAccounts().find((account) => account.username.toLowerCase() === cleanUsername.toLowerCase());
      if (!signedInAccount) {
        setError("Could not prepare your local game cache. Please try again.");
        return;
      }
      setActiveAccount(signedInAccount.username);
      const cloudProfile = cloudResult.userId ? await loadPlayerFromSupabase() : null;
      const profile = cloudProfile ?? restoreAccountProfile(signedInAccount);
      if (profile) {
        saveAccounts(getAccounts().map((account) => account.username.toLowerCase() === signedInAccount.username.toLowerCase()
          ? { ...account, profile }
          : account));
        window.localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(profile));
        router.push("/dashboard");
      } else {
        router.push("/setup");
      }
    } catch {
      setError("Local sign-in is unavailable in this browser session. Try localhost or HTTPS.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-ink text-paper">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-grid opacity-50" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between border-b border-line pb-5">
          <a className="flex items-center gap-3" href="/" aria-label="Global War home">
            <span className="grid h-9 w-9 place-items-center border border-signal text-sm font-bold text-signal">RYC</span>
            <span className="text-xs font-bold uppercase tracking-[0.18em]">Global War</span>
          </a>
          <span className="hidden text-xs uppercase tracking-[0.18em] text-muted sm:block">Represent your city · Season 01</span>
        </header>

        <section className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:py-16">
          <div className="max-w-xl animate-rise">
            <p className="mb-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] text-signal"><span className="h-px w-8 bg-signal" /> The world moves from here</p>
            <h1 className="font-display text-5xl leading-[0.98] sm:text-6xl lg:text-7xl">Claim your <span className="italic text-signal">place</span> in history.</h1>
            <p className="mt-7 max-w-md text-base leading-7 text-muted sm:text-lg">Build a city’s influence, command its strength, and shape the balance of power.</p>
            <div className="mt-12 grid max-w-md grid-cols-3 border-y border-line py-5">
              <div><p className="font-display text-2xl">04</p><p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-muted">Distinct roles</p></div>
              <div className="border-x border-line px-5"><p className="font-display text-2xl">01</p><p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-muted">Shared world</p></div>
              <div className="pl-5"><p className="font-display text-2xl">∞</p><p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-muted">Possibilities</p></div>
            </div>
          </div>

          <div className="animate-rise border border-line bg-panel p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-8" style={{ animationDelay: "100ms" }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-signal">{mode === "signup" ? "Account creation / 01" : "Player access / 02"}</p>
            <h2 className="mt-2 font-display text-3xl">{mode === "signup" ? "Create your account" : "Welcome back"}</h2>
            <p className="mt-3 text-xs leading-5 text-muted">{mode === "signup" ? "Create your account first. You will sign in before establishing your home base." : "Sign in to continue to your home base setup or resume your campaign."}</p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div><label htmlFor="username" className="field-label">Username</label><input id="username" className="field-input" autoComplete="username" maxLength={24} minLength={3} placeholder="Choose your callsign" value={username} onChange={(event) => setUsername(event.target.value)} required /></div>
              <div><label htmlFor="password" className="field-label">Password</label><input id="password" className="field-input" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={8} placeholder="At least 8 characters" value={password} onChange={(event) => setPassword(event.target.value)} required /></div>
              {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
              <button type="submit" disabled={busy} className="group flex w-full items-center justify-between bg-signal px-5 py-4 text-left text-sm font-bold text-ink transition-colors hover:bg-paper disabled:cursor-wait disabled:opacity-70"><span>{busy ? "Securing access..." : mode === "signup" ? "Create account" : "Log in"}</span><span aria-hidden="true" className="text-lg transition-transform group-hover:translate-x-1">→</span></button>
              <p className="text-center text-[11px] leading-5 text-muted">Cloud authentication when configured. Offline browser account available as fallback.</p>
            </form>
            <p className="mt-5 text-center text-xs text-muted">{mode === "signup" ? "Already have an account?" : "New to the world?"} <button type="button" className="font-semibold text-signal hover:text-paper" onClick={() => { const nextMode = mode === "signup" ? "login" : "signup"; setMode(nextMode); setError(""); router.replace(nextMode === "signup" ? "/signup" : "/login"); }}>{mode === "signup" ? "Log in" : "Create account"}</button></p>
          </div>
        </section>
        <footer className="flex justify-between border-t border-line pt-4 text-[10px] uppercase tracking-[0.16em] text-muted"><span>Global War</span><span>Diplomacy is a local affair</span></footer>
      </div>
    </main>
  );
}
