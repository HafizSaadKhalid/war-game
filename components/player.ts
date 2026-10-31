export type PlayerRole = "Commander" | "Politician" | "Businessman" | "Spy";

export type PlayerProfile = {
  username: string;
  country: string;
  city: string;
  role: PlayerRole;
  gold: number;
  level: number;
  energy: number;
  xp: number;
  power: number;
  influence: number;
  intel: number;
  lastWorkAt: number;
  lastTrainAt: number;
  lastEnergyRegenAt: number;
};

export const PLAYER_STORAGE_KEY = "represent-your-city-player";
export const WORK_COOLDOWN_MS = 60_000;
export const TRAIN_COOLDOWN_MS = 30_000;
export const ENERGY_REGEN_INTERVAL_MS = 10_000;
export const ENERGY_REGEN_AMOUNT = 5;
export const LEVEL_XP_THRESHOLDS = [0, 100, 250, 450, 700, 1_000, 1_350, 1_750, 2_200, 2_700];

export function getLevelProgress(xp: number) {
  const levelIndex = LEVEL_XP_THRESHOLDS.findIndex((threshold, index) => {
    const nextThreshold = LEVEL_XP_THRESHOLDS[index + 1];
    return xp >= threshold && (nextThreshold === undefined || xp < nextThreshold);
  });
  const index = Math.max(0, levelIndex);
  const currentLevelXp = LEVEL_XP_THRESHOLDS[index];
  const nextLevelXp = LEVEL_XP_THRESHOLDS[index + 1] ?? currentLevelXp + 500;
  return {
    level: index + 1,
    currentLevelXp,
    nextLevelXp,
    progress: Math.min(100, ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100),
  };
}

export const ROLE_OPTIONS: { value: PlayerRole; icon: string; description: string; specialty: string }[] = [
  { value: "Commander", icon: "⚔️", description: "Lead from the front.", specialty: "Military focus" },
  { value: "Politician", icon: "🏛️", description: "Shape the agenda.", specialty: "Diplomacy focus" },
  { value: "Businessman", icon: "💼", description: "Build the city economy.", specialty: "+10 work gold" },
  { value: "Spy", icon: "🕵️", description: "See what others miss.", specialty: "Intel operations" },
];

export function createPlayerProfile(profile: Pick<PlayerProfile, "username" | "country" | "city" | "role">): PlayerProfile {
  const now = Date.now();
  return {
    ...profile,
    gold: 100,
    level: 1,
    energy: 100,
    xp: 0,
    power: profile.role === "Commander" ? 15 : 10,
    influence: profile.role === "Politician" ? 15 : 10,
    intel: profile.role === "Spy" ? 15 : 10,
    lastWorkAt: 0,
    lastTrainAt: 0,
    lastEnergyRegenAt: now,
  };
}

export function restorePlayerProfile(value: unknown): PlayerProfile | null {
  if (!value || typeof value !== "object") return null;
  const stored = value as Partial<PlayerProfile>;
  if (
    typeof stored.username !== "string" ||
    typeof stored.country !== "string" ||
    typeof stored.city !== "string" ||
    !ROLE_OPTIONS.some((role) => role.value === stored.role)
  ) return null;

  const defaults = createPlayerProfile({
    username: stored.username,
    country: stored.country,
    city: stored.city,
    role: stored.role as PlayerRole,
  });
  return {
    ...defaults,
    ...stored,
    gold: finiteStat(stored.gold, defaults.gold),
    energy: Math.min(100, Math.max(0, finiteStat(stored.energy, defaults.energy))),
    level: finiteStat(stored.level, defaults.level),
    xp: finiteStat(stored.xp, defaults.xp),
    power: finiteStat(stored.power, defaults.power),
    influence: finiteStat(stored.influence, defaults.influence),
    intel: finiteStat(stored.intel, defaults.intel),
    lastWorkAt: finiteStat(stored.lastWorkAt, 0),
    lastTrainAt: finiteStat(stored.lastTrainAt, 0),
    lastEnergyRegenAt: finiteStat(stored.lastEnergyRegenAt, Date.now()),
  };
}

function finiteStat(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function getCityStats(city: string) {
  const seed = Array.from(city).reduce((total, character) => total + character.charCodeAt(0), 0);
  return {
    defense: 40 + (seed % 51),
    citizens: 1_200 + ((seed * 137) % 18_801),
    seed,
  };
}

export function formatCooldown(remainingMs: number): string {
  const seconds = Math.ceil(Math.max(0, remainingMs) / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export const CITIES_BY_COUNTRY: Record<string, string[]> = {
  Pakistan: ["Karachi", "Lahore", "Islamabad", "Peshawar", "Quetta"],
  India: ["Mumbai", "Delhi", "Bengaluru", "Kolkata", "Chennai"],
  Turkey: ["Istanbul", "Ankara", "Izmir", "Bursa", "Antalya"],
  "Sri Lanka": ["Colombo", "Kandy", "Galle", "Jaffna", "Negombo"],
  Malaysia: ["Kuala Lumpur", "George Town", "Johor Bahru", "Ipoh", "Kota Kinabalu"],
};