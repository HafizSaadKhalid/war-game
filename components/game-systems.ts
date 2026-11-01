import { AttackDomain, BaseBuilding, BuildingType, PlayerProfile, getCityStats } from "@/components/player";

export const BUILDING_CATALOG: { type: BuildingType; icon: string; cost: number; goldPerHour: number; domain: string; description: string }[] = [
  { type: "SAM Missiles", icon: "⌁", cost: 180, goldPerHour: 0, domain: "Air defense", description: "Intercept incoming air strikes." },
  { type: "Coastal Batteries", icon: "≋", cost: 160, goldPerHour: 0, domain: "Sea defense", description: "Protect coastlines and shipping lanes." },
  { type: "Land Forts", icon: "▦", cost: 140, goldPerHour: 0, domain: "Ground defense", description: "Reduce damage from ground assaults." },
  { type: "Gold Mines", icon: "◈", cost: 120, goldPerHour: 48, domain: "Economy", description: "Extract gold for your home treasury." },
  { type: "Oil Refineries", icon: "⌇", cost: 190, goldPerHour: 72, domain: "Industry", description: "Refine resources into trade revenue." },
  { type: "Power Plants", icon: "ϟ", cost: 170, goldPerHour: 36, domain: "Energy", description: "Power industrial output and city services." },
  { type: "Police HQ", icon: "⬡", cost: 130, goldPerHour: 0, domain: "Security", description: "Protect the city and resist covert actions." },
];

export const ELECTION_CYCLE_MS = 30 * 24 * 60 * 60 * 1000;
export const INACTIVE_ASSET_MS = 7 * 24 * 60 * 60 * 1000;

export function getBuildingDefinition(type: BuildingType) {
  return BUILDING_CATALOG.find((building) => building.type === type)!;
}

export function getBuildingCost(type: BuildingType, level = 1): number {
  return Math.round(getBuildingDefinition(type).cost * (1 + (level - 1) * 0.65));
}

export function getBuildingGoldPerHour(building: BaseBuilding, bonusPercent = 0): number {
  const definition = getBuildingDefinition(building.type);
  const healthFactor = Math.max(0, 1 - building.damage / 100);
  return Math.round(definition.goldPerHour * building.level * healthFactor * (1 + bonusPercent / 100));
}

export function getHourlyProduction(profile: PlayerProfile): number {
  return profile.buildings
    .filter((building) => !profile.auctionedBuildingIds.includes(building.id) && building.damage < 100)
    .reduce((sum, building) => sum + getBuildingGoldPerHour(building, profile.roleYieldBonusPercent), 0);
}

export function getBuildingDefense(type: BuildingType): number {
  if (type === "SAM Missiles") return 20;
  if (type === "Coastal Batteries") return 18;
  if (type === "Land Forts") return 22;
  if (type === "Police HQ") return 12;
  return 0;
}

export function getDomainBuildingTypes(domain: AttackDomain): BuildingType[] {
  if (domain === "Air") return ["SAM Missiles", "Power Plants", "Gold Mines"];
  if (domain === "Ground") return ["Land Forts", "Police HQ", "Gold Mines"];
  return ["Coastal Batteries", "Oil Refineries", "Power Plants"];
}

export function getBaseDefense(buildings: BaseBuilding[]): number {
  return buildings.filter((building) => building.damage < 100)
    .reduce((sum, building) => sum + getBuildingDefense(building.type) * building.level * (1 - building.damage / 100), 0);
}

export function getAssetAuctionValue(building: BaseBuilding): number {
  return Math.round(getBuildingDefinition(building.type).cost * building.level * (1 - building.damage / 100) * 0.45);
}

export function getElectionState(profile: PlayerProfile, now = Date.now()) {
  const elapsed = Math.max(0, now - profile.electionCycleStartedAt);
  const cycles = Math.floor(elapsed / ELECTION_CYCLE_MS);
  const cycleStartedAt = profile.electionCycleStartedAt + cycles * ELECTION_CYCLE_MS;
  return {
    cycleStartedAt,
    endsAt: cycleStartedAt + ELECTION_CYCLE_MS,
    timeRemainingMs: Math.max(0, cycleStartedAt + ELECTION_CYCLE_MS - now),
    day: Math.min(30, Math.floor((now - cycleStartedAt) / (24 * 60 * 60 * 1000)) + 1),
    shouldReset: cycles > 0,
  };
}

export function getTaxRevenuePerDay(profile: PlayerProfile): number {
  const citizens = getCityStats(profile.city).citizens;
  const influenceMultiplier = 1 + Math.min(profile.influence, 100) / 200;
  return Math.round(citizens * profile.taxRate / 1000 * influenceMultiplier);
}

export function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.ceil(Math.max(0, milliseconds) / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  return days ? `${days}d ${hours}h` : hours ? `${hours}h ${minutes}m` : `${minutes}m`;
}
