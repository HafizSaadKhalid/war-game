"use client";

import { getCityKey, getCityStats, PlayerProfile, CITIES_BY_COUNTRY } from "@/components/player";

type TacticalMapProps = {
  player: PlayerProfile;
  onSelectTarget: (country: string, city: string) => void;
};

const COUNTRY_GROUPS = [
  { region: "South Asia", influence: 72, countries: ["Pakistan", "India", "Sri Lanka"] },
  { region: "West Asia", influence: 56, countries: ["Turkey"] },
  { region: "Southeast Asia", influence: 43, countries: ["Malaysia"] },
];

const COUNTRY_TONES: Record<string, string> = {
  Pakistan: "map-tone-green",
  India: "map-tone-red",
  Turkey: "map-tone-amber",
  "Sri Lanka": "map-tone-red",
  Malaysia: "map-tone-green",
};

export default function TacticalMap({ player, onSelectTarget }: TacticalMapProps) {
  const selectedCountry = player.targetCountry;
  const selectedCity = player.targetCity;
  const cities = CITIES_BY_COUNTRY[selectedCountry] ?? [];

  function getLedger(country: string, city: string) {
    const key = getCityKey(country, city);
    const saved = player.cityLedger[key];
    const stats = getCityStats(city);
    return saved ?? {
      treasury: 100 + (stats.seed % 850),
      defense: stats.defense,
      influence: 20 + (stats.seed % 70),
      controllingRole: (stats.seed % 4 === 0 ? "Commander" : stats.seed % 3 === 0 ? "Spy" : "Politician") as PlayerProfile["role"],
    };
  }

  return (
    <section aria-labelledby="map-heading" className="tactical-panel">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div><p className="tactical-kicker">Operations theater / interactive</p><h2 id="map-heading" className="mt-1 font-display text-2xl">Tactical map</h2></div>
        <div className="flex items-center gap-3 text-[9px] uppercase tracking-[0.12em] text-muted"><span className="flex items-center gap-1"><i className="legend-dot legend-green" /> Economy</span><span className="flex items-center gap-1"><i className="legend-dot legend-red" /> Defense</span><span className="flex items-center gap-1"><i className="legend-dot legend-amber" /> Intel</span></div>
      </div>

      <div className="map-board">
        <div className="map-board-label"><span>TACTICAL OVERVIEW</span><span>GRID / 04-A</span></div>
        <div className="map-world-mark" aria-hidden="true">WORLD<br />COMMAND</div>
        <div className="map-node map-node-one" aria-hidden="true" />
        <div className="map-node map-node-two" aria-hidden="true" />
        <div className="map-node map-node-three" aria-hidden="true" />
        <div className="map-region-cards">
          {COUNTRY_GROUPS.map((group) => <div key={group.region} className="map-region-card"><p className="map-region-title">{group.region}</p><div className="map-influence-track"><span style={{ width: `${group.influence}%` }} /></div><p className="map-region-meta">{group.influence}% regional influence</p><div className="mt-3 flex flex-wrap gap-1.5">{group.countries.map((country) => <button key={country} type="button" onClick={() => onSelectTarget(country, "")} className={`map-country-button ${selectedCountry === country ? "map-country-active" : ""}`} aria-pressed={selectedCountry === country}>{country}</button>)}</div></div>)}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
        <div><p className="tactical-kicker">Country intelligence</p><h3 className="mt-1 text-sm font-semibold">{selectedCountry}</h3></div>
        <span className="text-[10px] uppercase tracking-[0.13em] text-muted">Select a city to set operation target</span>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {cities.map((city) => {
          const cityData = getLedger(selectedCountry, city);
          const isSelected = selectedCountry === player.targetCountry && city === selectedCity;
          return <button key={city} type="button" onClick={() => onSelectTarget(selectedCountry, city)} aria-pressed={isSelected} className={`map-city-card ${isSelected ? "map-city-selected" : ""}`}>
            <span className="flex items-center justify-between gap-2"><span className="truncate text-sm font-semibold">{city}</span><span className={`map-status-dot ${COUNTRY_TONES[selectedCountry]}`} /></span>
            <span className="mt-3 grid grid-cols-3 gap-1 text-left"><span><b className="map-stat-label">DEF</b><b className="map-stat-value text-war">{cityData.defense}</b></span><span><b className="map-stat-label">GOLD</b><b className="map-stat-value text-economy">{cityData.treasury}</b></span><span><b className="map-stat-label">CTRL</b><b className="map-stat-value text-intel">{cityData.controllingRole.slice(0, 3).toUpperCase()}</b></span></span>
          </button>;
        })}
      </div>
      <p className="mt-3 text-xs text-muted">Current target: <span className="font-semibold text-paper">{player.targetCity}, {player.targetCountry}</span></p>
    </section>
  );
}