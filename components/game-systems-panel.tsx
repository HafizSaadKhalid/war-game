"use client";

import { AttackDomain, BaseBuilding, BuildingType, PlayerProfile } from "@/components/player";
import {
  BUILDING_CATALOG,
  ELECTION_CYCLE_MS,
  formatDuration,
  getAssetAuctionValue,
  getBaseDefense,
  getBuildingCost,
  getBuildingGoldPerHour,
  getElectionState,
  getHourlyProduction,
  getTaxRevenuePerDay,
  INACTIVE_ASSET_MS,
} from "@/components/game-systems";

type GameSystemsPanelProps = {
  player: PlayerProfile;
  now: number;
  notice: string;
  onBuild: (type: BuildingType) => void;
  onRepair: (id: string) => void;
  onStrike: (domain: AttackDomain) => void;
  onScout: () => void;
  onSabotage: () => void;
  onTaxRate: (rate: number) => void;
  onVote: () => void;
  onAuction: (id: string) => void;
  onCurrencyScale: (scale: number) => void;
};

export default function GameSystemsPanel({
  player,
  now,
  notice,
  onBuild,
  onRepair,
  onStrike,
  onScout,
  onSabotage,
  onTaxRate,
  onVote,
  onAuction,
  onCurrencyScale,
}: GameSystemsPanelProps) {
  const election = getElectionState(player, now);
  const production = getHourlyProduction(player);
  const activeBuildings = player.buildings.filter((building) => !player.auctionedBuildingIds.includes(building.id));
  const auctionable = activeBuildings.filter((building) => now - building.lastActiveAt >= INACTIVE_ASSET_MS);

  function getBuildingStatus(building: BaseBuilding) {
    if (building.damage >= 100) return "Destroyed · rebuild required";
    if (building.damage > 0) return `${100 - building.damage}% integrity`;
    return "Operational";
  }

  return (
    <div className="space-y-6 py-7">
      <section className="tactical-panel">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="tactical-kicker">Home base / construction</p>
            <h2 className="mt-1 font-display text-2xl">Base Grid</h2>
          </div>
          <div className="text-right">
            <p className="stat-label">Active production</p>
            <p className="font-display text-xl text-economy">{production} G / hour</p>
            <p className="text-xs text-muted">Defense rating {Math.round(getBaseDefense(activeBuildings))}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {BUILDING_CATALOG.map((definition) => {
            const count = activeBuildings.filter((building) => building.type === definition.type).length;
            const cost = getBuildingCost(definition.type);
            return (
              <article key={definition.type} className="base-building-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-intel">{definition.domain}</p>
                    <h3 className="mt-1 text-sm font-semibold">{definition.icon} {definition.type}</h3>
                  </div>
                  <span className="font-display text-lg">{count}</span>
                </div>
                <p className="mt-2 min-h-9 text-xs leading-5 text-muted">{definition.description}</p>
                <p className="mt-3 text-[10px] text-economy">Yield: {definition.goldPerHour} G / hour per level</p>
                <button type="button" className="system-button mt-3 w-full" onClick={() => onBuild(definition.type)} disabled={player.gold < cost}>Build · {cost} G</button>
              </article>
            );
          })}
        </div>

        {activeBuildings.length > 0 && (
          <div className="mt-5 border-t border-line pt-4">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.15em]">Installed assets</h3>
            <div className="space-y-2">
              {activeBuildings.map((building) => {
                const repairCost = Math.max(20, building.damage * 2);
                return (
                  <div key={building.id} className="flex flex-wrap items-center justify-between gap-2 border border-line bg-ink/60 px-3 py-2">
                    <div>
                      <p className="text-xs font-semibold">{building.type} · Level {building.level}</p>
                      <p className={`mt-1 text-[10px] ${building.damage ? "text-war" : "text-economy"}`}>
                        {getBuildingStatus(building)}{building.damage ? ` · ${getBuildingGoldPerHour(building, player.roleYieldBonusPercent)} G/hour` : ""}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {building.damage > 0 && <button type="button" className="system-button" onClick={() => onRepair(building.id)} disabled={player.gold < repairCost}>Repair · {repairCost} G</button>}
                      {now - building.lastActiveAt >= INACTIVE_ASSET_MS && <button type="button" className="system-button system-danger" onClick={() => onAuction(building.id)}>Auction · {getAssetAuctionValue(building)} G</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <section className="tactical-panel">
        <div className="mb-4">
          <p className="tactical-kicker">Air / ground / sea operations</p>
          <h2 className="mt-1 font-display text-2xl">Warfare &amp; Intelligence</h2>
          <p className="mt-1 text-xs text-muted">Simulated raids permanently damage base assets until repaired or rebuilt.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {(["Air", "Ground", "Sea"] as const).map((domain) => (
            <button key={domain} type="button" className="system-button system-danger min-h-12" onClick={() => onStrike(domain)} disabled={player.energy < 15}>Launch {domain} strike · 15 Energy</button>
          ))}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <button type="button" className="system-button" onClick={onScout} disabled={player.intel < 5}>Scout target · 5 Intel</button>
          <button type="button" className="system-button system-danger" onClick={onSabotage} disabled={player.intel < 10}>Sabotage target · 10 Intel</button>
        </div>
        <div className="mt-4 border-t border-line pt-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-muted">Recent combat reports</p>
          {player.warfareReports.length ? (
            <div className="mt-2 space-y-1">
              {player.warfareReports.slice(0, 4).map((report) => (
                <p key={report.id} className="text-xs text-muted"><span className={report.covert ? "text-intel" : "text-war"}>{report.covert ? "COVERT" : report.domain.toUpperCase()}</span> · {report.target} · {report.damage} damage</p>
              ))}
            </div>
          ) : <p className="mt-2 text-xs text-muted">No combat reports yet.</p>}
        </div>
      </section>

      <section className="tactical-panel">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div><p className="tactical-kicker">Governance / 30-day cycle</p><h2 className="mt-1 font-display text-2xl">National Treasury</h2></div>
          <div className="text-right"><p className="stat-label">Election cycle</p><p className="font-display text-lg text-intel">Day {election.day} / 30</p><p className="text-xs text-muted">Resets in {formatDuration(election.timeRemainingMs)}</p></div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="border border-line bg-ink/60 p-4">
            <p className="stat-label">Treasury balance</p><p className="mt-2 font-display text-2xl text-economy">{player.baseTreasury} G</p>
            <p className="mt-1 text-xs text-muted">Gold-backed currency: {(player.baseTreasury * player.currencyScale).toLocaleString()} credits</p>
            <label className="mt-4 block text-[10px] uppercase tracking-[0.12em] text-muted" htmlFor="currency-scale">Credits per Gold · {player.currencyScale}</label>
            <input id="currency-scale" className="mt-2 w-full accent-[#75efaa]" type="range" min="1" max="100" value={player.currencyScale} onChange={(event) => onCurrencyScale(Number(event.target.value))} />
          </div>
          <div className="border border-line bg-ink/60 p-4">
            <p className="stat-label">National tax rate</p><p className="mt-2 font-display text-2xl">{player.taxRate}%</p>
            <p className="mt-1 text-xs text-muted">Estimated revenue {getTaxRevenuePerDay(player).toLocaleString()} G / day</p>
            <input aria-label="National tax rate" className="mt-4 w-full accent-[#ffc257]" type="range" min="0" max="50" step="1" value={player.taxRate} onChange={(event) => onTaxRate(Number(event.target.value))} />
          </div>
          <div className="border border-line bg-ink/60 p-4">
            <p className="stat-label">Election votes</p><p className="mt-2 font-display text-2xl text-intel">{player.electionVotes.toLocaleString()}</p>
            <p className="mt-1 text-xs text-muted">Campaign to increase your mandate.</p>
            <button type="button" className="system-button mt-3 w-full" onClick={onVote} disabled={player.gold < 15}>Campaign · 15 G</button>
            <p className="mt-2 text-[10px] text-muted">Cycle length: {ELECTION_CYCLE_MS / 86_400_000} days</p>
          </div>
        </div>
      </section>

      {auctionable.length > 0 && (
        <section className="tactical-panel">
          <p className="tactical-kicker">Inactive assets / liquidation</p><h2 className="mt-1 font-display text-2xl">Asset Auction</h2>
          <p className="mt-2 text-xs text-muted">Assets inactive for seven days can be sold back into the treasury.</p>
          <div className="mt-3 space-y-2">
            {auctionable.map((building) => <div key={building.id} className="flex items-center justify-between gap-3 border border-line p-3"><span className="text-sm">{building.type} · Level {building.level}</span><button type="button" className="system-button" onClick={() => onAuction(building.id)}>Sell for {getAssetAuctionValue(building)} G</button></div>)}
          </div>
        </section>
      )}
      <p aria-live="polite" className="min-h-5 text-sm text-signal">{notice}</p>
    </div>
  );
}
