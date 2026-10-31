import { PLAYER_STORAGE_KEY, PlayerProfile, restorePlayerProfile } from "@/components/player";

export const ACCOUNTS_STORAGE_KEY = "represent-your-city-accounts";
export const ACTIVE_ACCOUNT_KEY = "represent-your-city-active-account";
export const LOCAL_PROFILE_UPDATED_AT_KEY = "represent-your-city-profile-updated-at";

export type LocalAccount = {
  username: string;
  salt: string;
  passwordHash: string;
  profile: PlayerProfile | null;
};

export function getAccounts(): LocalAccount[] {
  try {
    const accounts: unknown = JSON.parse(window.localStorage.getItem(ACCOUNTS_STORAGE_KEY) ?? "[]");
    if (!Array.isArray(accounts)) return [];
    return accounts.filter(isLocalAccount);
  } catch {
    return [];
  }
}

export function saveAccounts(accounts: LocalAccount[]) {
  window.localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  const key = await window.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const digest = await window.crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: new TextEncoder().encode(salt), iterations: 120_000, hash: "SHA-256" },
    key,
    256,
  );
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function createSalt(): string {
  const bytes = window.crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function setActiveAccount(username: string) {
  window.localStorage.setItem(ACTIVE_ACCOUNT_KEY, username);
}

export function getActiveAccount(): LocalAccount | null {
  const username = window.localStorage.getItem(ACTIVE_ACCOUNT_KEY);
  if (!username) return null;
  return getAccounts().find((account) => account.username.toLowerCase() === username.toLowerCase()) ?? null;
}

export function saveAccountProfile(username: string, profile: PlayerProfile) {
  const accounts = getAccounts();
  const accountIndex = accounts.findIndex((account) => account.username.toLowerCase() === username.toLowerCase());
  if (accountIndex < 0) return;
  accounts[accountIndex] = { ...accounts[accountIndex], profile };
  saveAccounts(accounts);
  window.localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(profile));
  window.localStorage.setItem(LOCAL_PROFILE_UPDATED_AT_KEY, String(Date.now()));
}

export function restoreAccountProfile(account: LocalAccount): PlayerProfile | null {
  const fromAccount = restorePlayerProfile(account.profile);
  if (fromAccount) return fromAccount;

  try {
    const legacy = restorePlayerProfile(JSON.parse(window.localStorage.getItem(PLAYER_STORAGE_KEY) ?? "null"));
    return legacy?.username.toLowerCase() === account.username.toLowerCase() ? legacy : null;
  } catch {
    return null;
  }
}

function isLocalAccount(value: unknown): value is LocalAccount {
  if (!value || typeof value !== "object") return false;
  const account = value as Partial<LocalAccount>;
  return typeof account.username === "string" && typeof account.salt === "string" && typeof account.passwordHash === "string";
}