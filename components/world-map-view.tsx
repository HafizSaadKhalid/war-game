"use client";

import { useEffect, useState } from "react";
import { divIcon } from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { getCityKey, getCityStats, PlayerProfile } from "@/components/player";

export type WorldMapAction = "work" | "attack" | "intel";
type WorldMapViewProps = { player: PlayerProfile; onAction: (country: string, city: string, action: WorldMapAction) => void };
type CityMarker = { city: string; country: string; latitude: number; longitude: number };

const CITY_MARKERS: CityMarker[] = [
  ["Karachi", "Pakistan", 24.8607, 67.0011], ["Islamabad", "Pakistan", 33.6844, 73.0479], ["Lahore", "Pakistan", 31.5204, 74.3587], ["Peshawar", "Pakistan", 34.0151, 71.5249], ["Quetta", "Pakistan", 30.1798, 66.975],
  ["Mumbai", "India", 19.076, 72.8777], ["Delhi", "India", 28.6139, 77.209], ["Bengaluru", "India", 12.9716, 77.5946], ["Kolkata", "India", 22.5726, 88.3639], ["Chennai", "India", 13.0827, 80.2707],
  ["Istanbul", "Turkey", 41.0082, 28.9784], ["Ankara", "Turkey", 39.9334, 32.8597], ["London", "United Kingdom", 51.5072, -0.1276], ["Tokyo", "Japan", 35.6762, 139.6503], ["New York", "United States", 40.7128, -74.006],
  ["Washington, D.C.", "United States", 38.9072, -77.0369], ["Beijing", "China", 39.9042, 116.4074], ["Moscow", "Russia", 55.7558, 37.6173], ["Riyadh", "Saudi Arabia", 24.7136, 46.6753], ["Abu Dhabi", "United Arab Emirates", 24.4539, 54.3773],
  ["Berlin", "Germany", 52.52, 13.405], ["Paris", "France", 48.8566, 2.3522], ["Cairo", "Egypt", 30.0444, 31.2357], ["Brasília", "Brazil", -15.7975, -47.8919], ["Ottawa", "Canada", 45.4215, -75.6972],
  ["Mexico City", "Mexico", 19.4326, -99.1332], ["Canberra", "Australia", -35.2809, 149.13], ["Seoul", "South Korea", 37.5665, 126.978], ["Jakarta", "Indonesia", -6.2088, 106.8456], ["Bangkok", "Thailand", 13.7563, 100.5018],
  ["Singapore", "Singapore", 1.3521, 103.8198], ["Nairobi", "Kenya", -1.2921, 36.8219], ["Lagos", "Nigeria", 6.5244, 3.3792], ["Cape Town", "South Africa", -33.9249, 18.4241], ["Buenos Aires", "Argentina", -34.6037, -58.3816],
  ["Santiago", "Chile", -33.4489, -70.6693], ["Kyiv", "Ukraine", 50.4501, 30.5234], ["Rome", "Italy", 41.9028, 12.4964], ["Madrid", "Spain", 40.4168, -3.7038], ["Amsterdam", "Netherlands", 52.3676, 4.9041],
  ["Doha", "Qatar", 25.2854, 51.531], ["Muscat", "Oman", 23.588, 58.3829], ["Tehran", "Iran", 35.6892, 51.389], ["Kabul", "Afghanistan", 34.5553, 69.2075], ["Dhaka", "Bangladesh", 23.8103, 90.4125],
  ["Kathmandu", "Nepal", 27.7172, 85.324], ["Colombo", "Sri Lanka", 6.9271, 79.8612], ["Hanoi", "Vietnam", 21.0278, 105.8342], ["Manila", "Philippines", 14.5995, 120.9842], ["Kuala Lumpur", "Malaysia", 3.139, 101.6869],
].map(([city, country, latitude, longitude]) => ({ city: city as string, country: country as string, latitude: latitude as number, longitude: longitude as number }));

const HOME_ICON = divIcon({ className: "world-marker-home", html: '<span class="world-marker-core"></span><span class="world-marker-ring"></span>', iconSize: [26, 26], iconAnchor: [13, 13] });
const CITY_ICON = divIcon({ className: "world-marker-city", html: '<span class="world-marker-core"></span>', iconSize: [18, 18], iconAnchor: [9, 9] });

function HomeBaseCenter({ player }: { player: PlayerProfile }) {
  const map = useMap();
  useEffect(() => {
    if (player.homeLatitude !== null && player.homeLongitude !== null) {
      map.flyTo([player.homeLatitude, player.homeLongitude], 8, { duration: 1.2 });
      return;
    }
    const home = CITY_MARKERS.find((marker) => marker.city.toLowerCase() === player.city.toLowerCase() && marker.country === player.country);
    map.flyTo(home ? [home.latitude, home.longitude] : [20, 0], home ? 8 : 3, { duration: 1.2 });
  }, [map, player.city, player.country, player.homeLatitude, player.homeLongitude]);
  return null;
}

export default function WorldMapView({ player, onAction }: WorldMapViewProps) {
  const [fallbackTiles, setFallbackTiles] = useState(false);
  const knownHome = CITY_MARKERS.find((marker) => marker.city.toLowerCase() === player.city.toLowerCase() && marker.country === player.country);
  const homeMarker = !knownHome && player.homeLatitude !== null && player.homeLongitude !== null
    ? { city: player.city, country: player.country, latitude: player.homeLatitude, longitude: player.homeLongitude }
    : null;
  const markers = homeMarker ? [...CITY_MARKERS, homeMarker] : CITY_MARKERS;

  function runAction(event: React.MouseEvent<HTMLButtonElement>, marker: CityMarker, action: WorldMapAction) {
    event.preventDefault();
    event.stopPropagation();
    onAction(marker.country, marker.city, action);
  }

  return (
    <section className="world-map-shell" aria-label="Interactive world map">
      <div className="world-map-hud"><div><p className="tactical-kicker">Global operations / live theater</p><h2 className="mt-1 font-display text-2xl">World Map View</h2><p className="mt-1 text-xs text-muted">Drag to pan · scroll or use controls to zoom · select a base for operations</p></div><div className="world-map-legend"><span><i className="legend-dot legend-green" /> Friendly</span><span><i className="legend-dot legend-red" /> Hostile</span><span><i className="legend-dot legend-amber" /> Intel</span></div></div>
      <MapContainer center={[20, 0]} zoom={2} minZoom={2} maxZoom={18} scrollWheelZoom zoomControl fadeAnimation={false} className="world-map-canvas">
        <TileLayer
          attribution={fallbackTiles ? '<a href="https://wikimediafoundation.org/wiki/Maps_Terms_of_Use">Wikimedia maps</a> | Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>' : 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a> | Tiles &copy; <a href="https://www.openstreetmap.de/">OpenStreetMap.de</a>'}
          url={fallbackTiles ? "https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png" : "https://tile.openstreetmap.de/{z}/{x}/{y}.png"}
          maxZoom={19}
          keepBuffer={4}
          updateWhenIdle
          updateWhenZooming={false}
          eventHandlers={{ tileerror: () => setFallbackTiles(true) }}
        />
        <HomeBaseCenter player={player} />
        {markers.map((marker) => {
          const isHome = marker.city.toLowerCase() === player.city.toLowerCase() && marker.country === player.country;
          const ledger = player.cityLedger[getCityKey(marker.country, marker.city)];
          const stats = getCityStats(marker.city);
          const role = ledger?.controllingRole ?? (isHome ? player.role : "Politician");
          return <Marker key={`${marker.country}-${marker.city}`} position={[marker.latitude, marker.longitude]} icon={isHome ? HOME_ICON : CITY_ICON}>
            <Popup className="world-map-popup"><div className="map-popup-content"><div className="map-popup-heading"><div><p className="map-popup-country">{marker.country}{isHome ? " · HOME BASE" : ""}</p><h3>{marker.city}</h3></div><span className={`map-popup-marker ${isHome ? "home" : ""}`} /></div><dl className="map-popup-stats"><div><dt>Controlling role</dt><dd>{role}</dd></div><div><dt>Defense points</dt><dd>{ledger?.defense ?? stats.defense}</dd></div><div><dt>Gold treasury</dt><dd>{ledger?.treasury ?? (100 + stats.seed % 850)} G</dd></div></dl><div className="map-popup-actions"><button type="button" className="map-popup-work" onClickCapture={(event) => runAction(event, marker, "work")}>Work Here</button><button type="button" className="map-popup-attack" onClickCapture={(event) => runAction(event, marker, "attack")}>Attack Base</button><button type="button" className="map-popup-intel" onClickCapture={(event) => runAction(event, marker, "intel")}>Gather Intel</button></div></div></Popup>
          </Marker>;
        })}
      </MapContainer>
      <div className="world-map-home-label"><span className="map-status-dot map-tone-green" /> Home base: {player.city}, {player.country}</div>
    </section>
  );
}
