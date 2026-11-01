export type PlayerRole = "Commander" | "Politician" | "Businessman" | "Spy";
export type PlayerProfession = "Military Commander" | "Industrialist" | "Politician" | "Intelligence Agent";

export type PlayerProfile = {
  username: string;
  country: string;
  countryCode: string;
  city: string;
  homeState: string;
  stateCode: string;
  homeLatitude: number | null;
  homeLongitude: number | null;
  role: PlayerRole;
  profession: PlayerProfession;
  specialization: string;
  roleYieldBonusPercent: number;
  professionSelected: boolean;
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
  targetCountry: string;
  targetCity: string;
  cityLedger: Record<string, CityLedgerEntry>;
  dailyQuestDate: string;
  dailyQuestProgress: Record<string, number>;
  completedDailyQuests: string[];
  buildings: BaseBuilding[];
  baseTreasury: number;
  taxRate: number;
  electionCycleStartedAt: number;
  electionVotes: number;
  currencyScale: number;
  warfareReports: WarfareReport[];
  auctionedBuildingIds: string[];
  lastEconomyTickAt: number;
  lastTaxCollectedAt: number;
};

export type BuildingType = "SAM Missiles" | "Coastal Batteries" | "Land Forts" | "Gold Mines" | "Oil Refineries" | "Power Plants" | "Police HQ";
export type AttackDomain = "Air" | "Ground" | "Sea";

export type BaseBuilding = {
  id: string;
  type: BuildingType;
  level: number;
  damage: number;
  builtAt: number;
  lastActiveAt: number;
};

export type WarfareReport = {
  id: string;
  domain: AttackDomain;
  target: string;
  damage: number;
  createdAt: number;
  covert: boolean;
};

export type CityLedgerEntry = {
  treasury: number;
  defense: number;
  influence: number;
  controllingRole: PlayerRole;
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

export const PROFESSION_OPTIONS: {
  value: PlayerProfession;
  gameRole: PlayerRole;
  icon: string;
  description: string;
  bonus: string;
}[] = [
  { value: "Military Commander", gameRole: "Commander", icon: "⚔️", description: "Build a stronger defense and command elite units.", bonus: "Faster fortification · stronger unit stats" },
  { value: "Industrialist", gameRole: "Businessman", icon: "💼", description: "Expand production and dominate trade routes.", bonus: "Higher factory output · better trade margins" },
  { value: "Politician", gameRole: "Politician", icon: "🏛️", description: "Win public support and steer national policy.", bonus: "More election votes · stronger tax influence" },
  { value: "Intelligence Agent", gameRole: "Spy", icon: "🕵️", description: "Gather information and operate beyond the front line.", bonus: "Faster intel gathering · covert advantage" },
];

export const PROFESSION_SPECIALIZATIONS: Record<PlayerProfession, string[]> = {
  "Military Commander": ["Air Force", "Ground Forces", "Naval Fleet"],
  Industrialist: ["Mining & Raw Materials", "Factory Manufacturing", "Power & Energy"],
  Politician: ["Treasury & Tax Policy", "Diplomacy & Alliances", "Internal Security"],
  "Intelligence Agent": ["Counter-Intel & Defense", "Sabotage & Recon", "Covert Ops"],
};

export type RoleDistribution = Record<PlayerProfession, number>;
export type RoleDemandStatus = "high-demand" | "bonus-active" | "limited-slots";

export function getRoleDemand(distribution: RoleDistribution, profession: PlayerProfession) {
  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
  const count = distribution[profession] ?? 0;
  const share = total ? count / total : 0;
  const needsSupport = total === 0 || count === 0 || share < 0.2;
  const isOverrepresentedCommander = profession === "Military Commander" && share >= 0.6;
  const bonusPercent = needsSupport ? 25 : share < 0.35 ? 10 : 5;
  const status: RoleDemandStatus = isOverrepresentedCommander
    ? "limited-slots"
    : bonusPercent >= 25
      ? "high-demand"
      : "bonus-active";
  return { total, count, share, status, bonusPercent, isAvailable: !isOverrepresentedCommander };
}

export function getProfessionForRole(role: PlayerRole): PlayerProfession {
  return PROFESSION_OPTIONS.find((option) => option.gameRole === role)?.value ?? "Military Commander";
}

export function createPlayerProfile(profile: {
  username: string;
  country: string;
  countryCode?: string;
  homeState?: string;
  stateCode?: string;
  city: string;
  homeCoordinates?: { latitude: number; longitude: number } | null;
  role?: PlayerRole;
  profession?: PlayerProfession;
  specialization?: string;
  roleYieldBonusPercent?: number;
}): PlayerProfile {
  const profession = profile.profession ?? getProfessionForRole(profile.role ?? "Commander");
  const role = PROFESSION_OPTIONS.find((option) => option.value === profession)?.gameRole ?? profile.role ?? "Commander";
  const homeState = profile.homeState ?? "";
  const now = Date.now();
  const homeCityKey = getCityKey(profile.country, profile.city);
  return {
    ...profile,
    countryCode: profile.countryCode ?? "",
    homeState,
    stateCode: profile.stateCode ?? "",
    homeLatitude: profile.homeCoordinates?.latitude ?? null,
    homeLongitude: profile.homeCoordinates?.longitude ?? null,
    role,
    profession,
    specialization: profile.specialization ?? PROFESSION_SPECIALIZATIONS[profession][0],
    roleYieldBonusPercent: profile.roleYieldBonusPercent ?? 0,
    professionSelected: Boolean(profile.profession),
    gold: 100,
    level: 1,
    energy: 100,
    xp: 0,
    power: role === "Commander" ? 15 : 10,
    influence: role === "Politician" ? 15 : 10,
    intel: role === "Spy" ? 15 : 10,
    lastWorkAt: 0,
    lastTrainAt: 0,
    lastEnergyRegenAt: now,
    targetCountry: profile.country,
    targetCity: profile.city,
    cityLedger: {
      [homeCityKey]: {
        treasury: 100,
        defense: getCityStats(profile.city).defense,
        influence: role === "Politician" ? 55 : 30,
        controllingRole: role,
      },
    },
    dailyQuestDate: getDailyQuestDate(now),
    dailyQuestProgress: {},
    completedDailyQuests: [],
    buildings: [],
    baseTreasury: 100,
    taxRate: 10,
    electionCycleStartedAt: now,
    electionVotes: 0,
    currencyScale: 10,
    warfareReports: [],
    auctionedBuildingIds: [],
    lastEconomyTickAt: now,
    lastTaxCollectedAt: now,
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
    countryCode: typeof stored.countryCode === "string" ? stored.countryCode : "",
    homeState: typeof stored.homeState === "string" ? stored.homeState : "",
    stateCode: typeof stored.stateCode === "string" ? stored.stateCode : "",
    city: stored.city,
    role: stored.role as PlayerRole,
    profession: PROFESSION_OPTIONS.some((option) => option.value === stored.profession)
      ? stored.profession as PlayerProfession
      : getProfessionForRole(stored.role as PlayerRole),
    specialization: typeof stored.specialization === "string" ? stored.specialization : undefined,
    roleYieldBonusPercent: finiteStat(stored.roleYieldBonusPercent, 0),
    homeCoordinates: typeof stored.homeLatitude === "number" && typeof stored.homeLongitude === "number"
      ? { latitude: stored.homeLatitude, longitude: stored.homeLongitude }
      : null,
  });
  return {
    ...defaults,
    ...stored,
    professionSelected: stored.professionSelected === true
      && typeof stored.profession === "string"
      && PROFESSION_OPTIONS.some((option) => option.value === stored.profession)
      && typeof stored.homeState === "string"
      && stored.homeState.trim().length > 0,
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
    targetCountry: typeof stored.targetCountry === "string" ? stored.targetCountry : defaults.targetCountry,
    targetCity: typeof stored.targetCity === "string" ? stored.targetCity : defaults.targetCity,
    cityLedger: restoreCityLedger(stored.cityLedger, defaults.cityLedger),
    dailyQuestDate: typeof stored.dailyQuestDate === "string" ? stored.dailyQuestDate : defaults.dailyQuestDate,
    dailyQuestProgress: restoreQuestProgress(stored.dailyQuestProgress),
    completedDailyQuests: Array.isArray(stored.completedDailyQuests)
      ? stored.completedDailyQuests.filter((questId): questId is string => typeof questId === "string")
      : [],
  buildings: Array.isArray(stored.buildings) ? stored.buildings.filter(isBaseBuilding) : [],
  baseTreasury: Math.max(0, finiteStat(stored.baseTreasury, 100)),
  taxRate: Math.min(50, Math.max(0, finiteStat(stored.taxRate, 10))),
  electionCycleStartedAt: finiteStat(stored.electionCycleStartedAt, Date.now()),
  electionVotes: Math.max(0, finiteStat(stored.electionVotes, 0)),
  currencyScale: Math.max(1, finiteStat(stored.currencyScale, 10)),
  warfareReports: Array.isArray(stored.warfareReports) ? stored.warfareReports.filter(isWarfareReport) : [],
  auctionedBuildingIds: Array.isArray(stored.auctionedBuildingIds)
    ? stored.auctionedBuildingIds.filter((id): id is string => typeof id === "string")
    : [],
    lastEconomyTickAt: finiteStat(stored.lastEconomyTickAt, Date.now()),
    lastTaxCollectedAt: finiteStat(stored.lastTaxCollectedAt, Date.now()),
  };
}

function isBaseBuilding(value: unknown): value is BaseBuilding {
  if (!value || typeof value !== "object") return false;
  const building = value as Partial<BaseBuilding>;
  return typeof building.id === "string"
    && typeof building.type === "string"
    && typeof building.level === "number"
    && typeof building.damage === "number"
    && typeof building.builtAt === "number"
    && typeof building.lastActiveAt === "number";
}

function isWarfareReport(value: unknown): value is WarfareReport {
  if (!value || typeof value !== "object") return false;
  const report = value as Partial<WarfareReport>;
  return typeof report.id === "string"
    && (report.domain === "Air" || report.domain === "Ground" || report.domain === "Sea")
    && typeof report.target === "string"
    && typeof report.damage === "number"
    && typeof report.createdAt === "number"
    && typeof report.covert === "boolean";
}

export function hasCompletedCharacterSetup(profile: PlayerProfile | null | undefined): boolean {
  return Boolean(
    profile
    && profile.country.trim()
    && profile.homeState.trim()
    && profile.city.trim()
    && profile.professionSelected
    && PROFESSION_OPTIONS.some((option) => option.value === profile.profession),
  );
}

function finiteStat(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function restoreCityLedger(value: unknown, fallback: Record<string, CityLedgerEntry>): Record<string, CityLedgerEntry> {
  if (!value || typeof value !== "object") return fallback;
  const restored: Record<string, CityLedgerEntry> = { ...fallback };
  for (const [key, entry] of Object.entries(value)) {
    if (!entry || typeof entry !== "object") continue;
    const city = entry as Partial<CityLedgerEntry>;
    restored[key] = {
      treasury: Math.max(0, finiteStat(city.treasury, 0)),
      defense: Math.max(0, finiteStat(city.defense, 0)),
      influence: Math.max(0, finiteStat(city.influence, 0)),
      controllingRole: ROLE_OPTIONS.some((role) => role.value === city.controllingRole)
        ? city.controllingRole as PlayerRole
        : "Politician",
    };
  }
  return restored;
}

function restoreQuestProgress(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(
    Object.entries(value).map(([questId, progress]) => [questId, Math.max(0, finiteStat(progress, 0))]),
  );
}

export function getCityKey(country: string, city: string): string {
  return `${country}::${city}`;
}

export function getDailyQuestDate(timestamp = Date.now()): string {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
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
