"use client";

import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { divIcon } from "leaflet";
import { getCityKey, getCityStats, PlayerProfile } from "@/components/player";

export type WorldMapAction = "work" | "attack" | "intel";

type WorldMapViewProps = {
  player: PlayerProfile;
  onAction: (country: string, city: string, action: WorldMapAction) => void;
};

type CityMarker = { city: string; country: string; latitude: number; longitude: number };

const CITY_MARKERS: CityMarker[] = [
  { city: "Karachi", country: "Pakistan", latitude: 24.8607, longitude: 67.0011 },
  { city: "Islamabad", country: "Pakistan", latitude: 33.6844, longitude: 73.0479 },
  { city: "Lahore", country: "Pakistan", latitude: 31.5204, longitude: 74.3587 },
  { city: "Peshawar", country: "Pakistan", latitude: 34.0151, longitude: 71.5249 },
  { city: "Quetta", country: "Pakistan", latitude: 30.1798, longitude: 66.975 },
  { city: "Hyderabad", country: "Pakistan", latitude: 25.396, longitude: 68.3578 },
  { city: "Sukkur", country: "Pakistan", latitude: 27.7052, longitude: 68.8574 },
  { city: "Rawalpindi", country: "Pakistan", latitude: 33.5651, longitude: 73.0169 },
  { city: "Faisalabad", country: "Pakistan", latitude: 31.4504, longitude: 73.135 },
  { city: "Multan", country: "Pakistan", latitude: 30.1575, longitude: 71.5249 },
  { city: "Abbottabad", country: "Pakistan", latitude: 34.1688, longitude: 73.2215 },
  { city: "Mardan", country: "Pakistan", latitude: 34.1989, longitude: 72.0231 },
  { city: "Gwadar", country: "Pakistan", latitude: 25.1264, longitude: 62.3225 },
  { city: "Turbat", country: "Pakistan", latitude: 26.0031, longitude: 63.0485 },
  { city: "Mumbai", country: "India", latitude: 19.076, longitude: 72.8777 },
  { city: "Pune", country: "India", latitude: 18.5204, longitude: 73.8567 },
  { city: "Nagpur", country: "India", latitude: 21.1458, longitude: 79.0882 },
  { city: "Delhi", country: "India", latitude: 28.6139, longitude: 77.209 },
  { city: "New Delhi", country: "India", latitude: 28.6139, longitude: 77.209 },
  { city: "Bengaluru", country: "India", latitude: 12.9716, longitude: 77.5946 },
  { city: "Mysuru", country: "India", latitude: 12.2958, longitude: 76.6394 },
  { city: "Mangaluru", country: "India", latitude: 12.9141, longitude: 74.856 },
  { city: "Kolkata", country: "India", latitude: 22.5726, longitude: 88.3639 },
  { city: "Howrah", country: "India", latitude: 22.5958, longitude: 88.2636 },
  { city: "Siliguri", country: "India", latitude: 26.7271, longitude: 88.3953 },
  { city: "Chennai", country: "India", latitude: 13.0827, longitude: 80.2707 },
  { city: "Coimbatore", country: "India", latitude: 11.0168, longitude: 76.9558 },
  { city: "Madurai", country: "India", latitude: 9.9252, longitude: 78.1198 },
  { city: "Istanbul", country: "Turkey", latitude: 41.0082, longitude: 28.9784 },
  { city: "Ankara", country: "Turkey", latitude: 39.9334, longitude: 32.8597 },
  { city: "Izmir", country: "Turkey", latitude: 38.4237, longitude: 27.1428 },
  { city: "Bursa", country: "Turkey", latitude: 40.1885, longitude: 29.061 },
  { city: "Antalya", country: "Turkey", latitude: 36.8969, longitude: 30.7133 },
  { city: "London", country: "United Kingdom", latitude: 51.5072, longitude: -0.1276 },
  { city: "Tokyo", country: "Japan", latitude: 35.6762, longitude: 139.6503 },
  { city: "New York", country: "United States", latitude: 40.7128, longitude: -74.006 },
  { city: "Colombo", country: "Sri Lanka", latitude: 6.9271, longitude: 79.8612 },
  { city: "Kandy", country: "Sri Lanka", latitude: 7.2906, longitude: 80.6337 },
  { city: "Galle", country: "Sri Lanka", latitude: 6.0535, longitude: 80.221 },
  { city: "Jaffna", country: "Sri Lanka", latitude: 9.6615, longitude: 80.0255 },
  { city: "Negombo", country: "Sri Lanka", latitude: 7.2083, longitude: 79.8358 },
  { city: "Kuala Lumpur", country: "Malaysia", latitude: 3.139, longitude: 101.6869 },
  { city: "George Town", country: "Malaysia", latitude: 5.4141, longitude: 100.3288 },
  { city: "Johor Bahru", country: "Malaysia", latitude: 1.4927, longitude: 103.7414 },
  { city: "Ipoh", country: "Malaysia", latitude: 4.5975, longitude: 101.0901 },
  { city: "Kota Kinabalu", country: "Malaysia", latitude: 5.9804, longitude: 116.0735 },
];

const HOME_ICON = divIcon({
  className: "world-marker-home",
  html: '<span class="world-marker-core"></span><span class="world-marker-ring"></span>',
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});
const CITY_ICON = divIcon({
  className: "world-marker-city",
  html: '<span class="world-marker-core"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function HomeBaseCenter({ player }: { player: PlayerProfile }) {
  const map = useMap();
  useEffect(() => {
    const home = CITY_MARKERS.find((marker) => marker.city.toLowerCase() === player.city.toLowerCase() && marker.country === player.country);
    map.flyTo(home ? [home.latitude, home.longitude] : [player.country === "Pakistan" ? 30.3753 : 20, player.country === "Pakistan" ? 69.3451 : 0], 5, { duration: 1.4 });
  }, [map, player.city, player.country]);
  return null;
}

export default function WorldMapView({ player, onAction }: WorldMapViewProps) {
  function handlePopupAction(
    event: React.MouseEvent<HTMLButtonElement>,
    country: string,
    city: string,
    action: WorldMapAction,
  ) {
    event.preventDefault();
    event.stopPropagation();
    onAction(country, city, action);
  }

  return (
    <section className="world-map-shell" aria-label="Interactive world map">
      <div className="world-map-hud">
        <div><p className="tactical-kicker">Global operations / live theater</p><h2 className="mt-1 font-display text-2xl">World Map View</h2><p className="mt-1 text-xs text-muted">Drag to pan · scroll or use controls to zoom · select a base for operations</p></div>
        <div className="world-map-legend"><span><i className="legend-dot legend-green" /> Friendly</span><span><i className="legend-dot legend-red" /> Hostile</span><span><i className="legend-dot legend-amber" /> Intel</span></div>
      </div>
      <MapContainer center={[20, 0]} zoom={2} minZoom={2} maxZoom={13} scrollWheelZoom zoomControl className="world-map-canvas">
        <TileLayer
          attribution='<a href="https://wikimediafoundation.org/wiki/Maps_Terms_of_Use">Wikimedia maps</a> | Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
          url="https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png"
          maxZoom={19}
          keepBuffer={4}
          updateWhenIdle
          updateWhenZooming={false}
        />
        <HomeBaseCenter player={player} />
        {CITY_MARKERS.map((marker) => {
          const isHome = marker.city.toLowerCase() === player.city.toLowerCase() && marker.country === player.country;
          const ledger = player.cityLedger[getCityKey(marker.country, marker.city)];
          const cityStats = getCityStats(marker.city);
          const defense = ledger?.defense ?? cityStats.defense;
          const treasury = ledger?.treasury ?? (100 + (cityStats.seed % 850));
          const controllingRole = ledger?.controllingRole ?? (isHome ? player.role : "Politician");
          return <Marker
            key={`${marker.country}-${marker.city}`}
            position={[marker.latitude, marker.longitude]}
            icon={isHome ? HOME_ICON : CITY_ICON}
          >
            <Popup className="world-map-popup">
              <div className="map-popup-content">
                <div className="map-popup-heading"><div><p className="map-popup-country">{marker.country}{isHome ? " · HOME BASE" : ""}</p><h3>{marker.city}</h3></div><span className={`map-popup-marker ${isHome ? "home" : ""}`} /></div>
                <dl className="map-popup-stats"><div><dt>Controlling role</dt><dd>{controllingRole}</dd></div><div><dt>Defense points</dt><dd>{defense}</dd></div><div><dt>Gold treasury</dt><dd>{treasury} G</dd></div></dl>
                <div className="map-popup-actions"><button type="button" className="map-popup-work" onClickCapture={(event) => handlePopupAction(event, marker.country, marker.city, "work")}>Work Here</button><button type="button" className="map-popup-attack" onClickCapture={(event) => handlePopupAction(event, marker.country, marker.city, "attack")}>Attack Base</button><button type="button" className="map-popup-intel" onClickCapture={(event) => handlePopupAction(event, marker.country, marker.city, "intel")}>Gather Intel</button></div>
              </div>
            </Popup>
          </Marker>;
        })}
      </MapContainer>
      <div className="world-map-home-label"><span className="map-status-dot map-tone-green" /> Home base: {player.city}, {player.country}</div>
    </section>
  );
}
