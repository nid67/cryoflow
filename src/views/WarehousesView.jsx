import React, { useState, useMemo, useEffect } from 'react';
import { apiService } from '../services/api';

// Status styles for badges
const STATUS_STYLES = {
  active: { dot: 'bg-emerald-500', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Active' },
  maintenance: { dot: 'bg-amber-500', bg: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Maintenance' },
  offline: { dot: 'bg-rose-500', bg: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Offline' },
};

// Initial cold storage facility dataset (with multi-zone breakdown & coordinates)
const DEFAULT_WAREHOUSES = [
  {
    id: "wh_del01",
    name: "Delhi North Cold Hub",
    code: "DEL-N1",
    latitude: 28.7041,
    longitude: 77.1025,
    address: "Plot 14, Narela Industrial Area",
    city: "Delhi",
    country: "India",
    status: "active",
    created_at: "2023-02-11T00:00:00Z",
    zones: [
      { id: "z1", warehouse_id: "wh_del01", zone_name: "Frozen A", min_temp_c: -25, max_temp_c: -18, pallet_capacity: 240, pallets_occupied: 201, available_capacity: 39, power_backup: true },
      { id: "z2", warehouse_id: "wh_del01", zone_name: "Chilled A", min_temp_c: 0, max_temp_c: 4, pallet_capacity: 180, pallets_occupied: 96, available_capacity: 84, power_backup: true },
    ],
  },
  {
    id: "wh_chn01",
    name: "Chennai Coastal Facility",
    code: "CHN-01",
    latitude: 13.0827,
    longitude: 80.2707,
    address: "SIPCOT Logistics Park",
    city: "Chennai",
    country: "India",
    status: "active",
    created_at: "2022-08-04T00:00:00Z",
    zones: [
      { id: "z3", warehouse_id: "wh_chn01", zone_name: "Frozen A", min_temp_c: -22, max_temp_c: -16, pallet_capacity: 160, pallets_occupied: 158, available_capacity: 2, power_backup: true },
      { id: "z4", warehouse_id: "wh_chn01", zone_name: "Pharma Cool", min_temp_c: 2, max_temp_c: 8, pallet_capacity: 90, pallets_occupied: 40, available_capacity: 50, power_backup: true },
    ],
  },
  {
    id: "wh_avd01",
    name: "Avadi Distribution Center",
    code: "AVD-01",
    latitude: 13.1147,
    longitude: 80.0997,
    address: "Poonamallee High Road",
    city: "Avadi",
    country: "India",
    status: "active",
    created_at: "2024-01-20T00:00:00Z",
    zones: [
      { id: "z5", warehouse_id: "wh_avd01", zone_name: "Chilled A", min_temp_c: 0, max_temp_c: 6, pallet_capacity: 120, pallets_occupied: 55, available_capacity: 65, power_backup: false },
      { id: "z6", warehouse_id: "wh_avd01", zone_name: "Frozen A", min_temp_c: -20, max_temp_c: -15, pallet_capacity: 100, pallets_occupied: 70, available_capacity: 30, power_backup: true },
    ],
  },
  {
    id: "wh_hyd01",
    name: "Hyderabad Gateway Store",
    code: "HYD-02",
    latitude: 17.385,
    longitude: 78.4867,
    address: "Ravirala Warehousing Cluster",
    city: "Hyderabad",
    country: "India",
    status: "maintenance",
    created_at: "2021-11-30T00:00:00Z",
    zones: [
      { id: "z7", warehouse_id: "wh_hyd01", zone_name: "Chilled A", min_temp_c: -2, max_temp_c: 4, pallet_capacity: 150, pallets_occupied: 20, available_capacity: 130, power_backup: true },
    ],
  },
  {
    id: "wh_blr01",
    name: "Bengaluru Tech Corridor Hub",
    code: "BLR-03",
    latitude: 12.9716,
    longitude: 77.5946,
    address: "Whitefield Logistics Zone",
    city: "Bengaluru",
    country: "India",
    status: "active",
    created_at: "2023-06-17T00:00:00Z",
    zones: [
      { id: "z8", warehouse_id: "wh_blr01", zone_name: "Frozen A", min_temp_c: -24, max_temp_c: -18, pallet_capacity: 200, pallets_occupied: 110, available_capacity: 90, power_backup: true },
      { id: "z9", warehouse_id: "wh_blr01", zone_name: "Chilled B", min_temp_c: 1, max_temp_c: 5, pallet_capacity: 140, pallets_occupied: 138, available_capacity: 2, power_backup: false },
    ],
  },
];

// Origin city presets for Haversine distance lookup
const CITY_PRESETS = [
  { label: "Avadi, Chennai", lat: 13.1147, lng: 80.0997 },
  { label: "Central Chennai", lat: 13.0827, lng: 80.2707 },
  { label: "Bengaluru", lat: 12.9716, lng: 77.5946 },
  { label: "Hyderabad", lat: 17.385, lng: 78.4867 },
  { label: "Delhi", lat: 28.7041, lng: 77.1025 },
];

// Haversine formula (km distance calculation)
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Check if a warehouse temperature zone satisfies requirement criteria
function zoneFits(zone, query) {
  const requiredMin = Number.isFinite(query.required_temp_min) ? query.required_temp_min : -Infinity;
  const requiredMax = Number.isFinite(query.required_temp_max) ? query.required_temp_max : Infinity;
  const normalizedMin = Math.min(requiredMin, requiredMax);
  const normalizedMax = Math.max(requiredMin, requiredMax);

  const rangeOk = zone.min_temp_c <= normalizedMax && zone.max_temp_c >= normalizedMin;
  const capOk = Number.isFinite(zone.available_capacity) && zone.available_capacity >= query.pallets_needed;
  return rangeOk && capOk;
}

// Composite ranking score combining distance decay, capacity headroom, and generator bonus
function scoreCandidate(distanceKm, zone, query) {
  const distanceScore = Math.max(0, 100 - distanceKm / 8);
  const headroom = zone.available_capacity - query.pallets_needed;
  const capacityScore = Math.min(30, headroom / 2);
  const backupBonus = zone.power_backup ? 8 : 0;
  return Math.round((distanceScore + capacityScore + backupBonus) * 10) / 10;
}

// Network candidates search matching query
function findCandidates(warehouses, query) {
  const candidates = [];
  for (const wh of warehouses) {
    if (wh.status !== "active") continue;
    if (!wh.zones || !Array.isArray(wh.zones)) continue;
    for (const zone of wh.zones) {
      if (!zoneFits(zone, query)) continue;
      const distance_km = Math.round(haversineKm(query.lat, query.lng, wh.latitude || 0, wh.longitude || 0) * 10) / 10;
      const score = scoreCandidate(distance_km, zone, query);
      candidates.push({ warehouse: wh, zone, zone_id: zone.id, distance_km, fits_capacity: true, score });
    }
  }
  return candidates.sort((a, b) => b.score - a.score);
}

// Helper components styled with Light Theme tokens
function TempBadge({ min, max }) {
  const cold = max <= -10;
  return (
    <span
      className={`inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded border ${
        cold ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
      }`}
    >
      <span className="material-symbols-outlined text-[13px]">thermostat</span>
      {min}° / {max}°C
    </span>
  );
}

function CapacityBar({ occupied, capacity }) {
  const pct = Math.min(100, Math.round((occupied / capacity) * 100));
  const tight = pct >= 90;
  return (
    <div className="w-full space-y-1">
      <div className="flex justify-between text-[11px] font-mono text-on-surface-variant">
        <span>{occupied}/{capacity} pallets</span>
        <span className={tight ? 'font-bold text-amber-600' : 'text-on-surface-variant'}>{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            tight ? 'bg-amber-500' : 'bg-primary'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function WarehouseCard({ wh }) {
  const st = STATUS_STYLES[wh.status] || STATUS_STYLES.active;
  return (
    <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-on-surface text-base">{wh.name}</h3>
          <p className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">location_on</span>
            {wh.city || wh.location}, {wh.country || 'India'}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${st.bg}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`}></span>
          {st.label}
        </span>
      </div>

      <div className="text-[11px] font-mono text-slate-500 bg-surface-container-low px-2 py-1 rounded w-fit border border-outline-variant/30">
        CODE: {wh.code || wh.id}
      </div>

      <div className="space-y-3 pt-1">
        {wh.zones && wh.zones.map((z) => (
          <div key={z.id} className="bg-surface-container-low/70 border border-outline-variant/40 rounded-xl p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-on-surface">{z.zone_name}</span>
              <TempBadge min={z.min_temp_c} max={z.max_temp_c} />
            </div>
            <CapacityBar occupied={z.pallets_occupied} capacity={z.pallet_capacity} />
            {z.power_backup && (
              <div className="flex items-center gap-1 text-[10px] text-amber-700 font-semibold pt-0.5">
                <span className="material-symbols-outlined text-[12px] text-amber-600">bolt</span>
                Generator & Power Backup Active
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CandidateRow({ c, rank }) {
  const st = STATUS_STYLES[c.warehouse.status] || STATUS_STYLES.active;
  const isTop = rank === 0;

  return (
    <div
      className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border transition-all ${
        isTop
          ? 'bg-blue-50/70 border-primary/40 shadow-sm'
          : 'bg-surface-container-low/80 border-outline-variant/40 hover:bg-surface-container-low'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-sm shrink-0 ${
            isTop ? 'bg-primary text-white shadow-sm' : 'bg-slate-200 text-slate-600'
          }`}
        >
          {String(rank + 1).padStart(2, "0")}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-on-surface text-sm">{c.warehouse.name}</span>
            <span className={`w-2 h-2 rounded-full ${st.dot}`}></span>
          </div>
          <p className="text-xs text-on-surface-variant mt-0.5 flex flex-wrap items-center gap-2">
            <span>Zone: <strong className="text-on-surface">{c.zone.zone_name}</strong></span>
            <span>•</span>
            <TempBadge min={c.zone.min_temp_c} max={c.zone.max_temp_c} />
            <span>•</span>
            <span className="font-mono font-semibold text-emerald-700">{c.zone.available_capacity} pallets free</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-outline-variant/30">
        <div className="text-left sm:text-right font-mono">
          <div className="text-xs font-bold text-on-surface flex items-center gap-1 sm:justify-end">
            <span className="material-symbols-outlined text-[15px] text-primary">navigation</span>
            {c.distance_km} km away
          </div>
          <div className="text-[10px] text-slate-500 font-semibold">Match Score: {c.score}</div>
        </div>
        <span className="material-symbols-outlined text-outline-variant text-[20px]">chevron_right</span>
      </div>
    </div>
  );
}

export default function WarehousesView() {
  const [warehouses, setWarehouses] = useState(DEFAULT_WAREHOUSES);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState({
    lat: CITY_PRESETS[0].lat,
    lng: CITY_PRESETS[0].lng,
    required_temp_min: -20,
    required_temp_max: -15,
    pallets_needed: 10,
  });
  const [selectedCityIndex, setSelectedCityIndex] = useState(0);
  const [ranSearch, setRanSearch] = useState(false);

  const candidates = useMemo(() => findCandidates(warehouses, query), [warehouses, query]);

  const handleCityChange = (e) => {
    const nextIndex = Number(e.target.value);
    const preset = CITY_PRESETS[nextIndex];
    setSelectedCityIndex(nextIndex);
    setQuery((q) => ({ ...q, lat: preset.lat, lng: preset.lng }));
  };

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-on-surface">Warehouse Operations Dashboard</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300">
              Live Network
            </span>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            Multi-site cold storage capacity monitoring, Haversine nearest-hub optimization & temperature-zone telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-blue-50 text-blue-800 px-3 py-1.5 rounded-xl border border-blue-200">
          <span className="material-symbols-outlined text-[16px] text-blue-600">inventory_2</span>
          <span>{warehouses.length} Active Hubs Monitored</span>
        </div>
      </div>

      {/* Nearest fit search engine */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-primary font-bold text-sm">
          <span className="material-symbols-outlined text-[20px]">search</span>
          <h2>Find Nearest Cold-Chain Fit</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-1">
          <div>
            <label className="text-[11px] font-semibold text-on-surface-variant block mb-1">Origin City Preset</label>
            <select
              value={selectedCityIndex}
              onChange={handleCityChange}
              className="w-full bg-surface border border-outline-variant/60 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary font-medium"
            >
              {CITY_PRESETS.map((p, i) => (
                <option key={p.label} value={i}>{p.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-on-surface-variant block mb-1">Min Required °C</label>
            <input
              type="number"
              value={query.required_temp_min}
              onChange={(e) => setQuery((q) => ({ ...q, required_temp_min: Number(e.target.value) }))}
              className="w-full bg-surface border border-outline-variant/60 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary font-mono"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-on-surface-variant block mb-1">Max Required °C</label>
            <input
              type="number"
              value={query.required_temp_max}
              onChange={(e) => setQuery((q) => ({ ...q, required_temp_max: Number(e.target.value) }))}
              className="w-full bg-surface border border-outline-variant/60 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary font-mono"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-on-surface-variant block mb-1">Pallets Needed</label>
            <input
              type="number"
              min={1}
              value={query.pallets_needed}
              onChange={(e) => setQuery((q) => ({ ...q, pallets_needed: Math.max(1, Number(e.target.value)) }))}
              className="w-full bg-surface border border-outline-variant/60 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary font-mono"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => setRanSearch(true)}
            className="bg-primary hover:bg-primary-container text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">tune</span>
            Search Network Fit
          </button>
          
          {ranSearch && (
            <button
              onClick={() => setRanSearch(false)}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold px-3 py-2 transition-colors cursor-pointer"
            >
              Clear Results
            </button>
          )}
        </div>

        {/* Candidate Search Results */}
        {ranSearch && (
          <div className="pt-3 space-y-3 border-t border-outline-variant/40 mt-4">
            <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">
              Recommended Depot Candidates ({candidates.length} Found)
            </h3>

            {candidates.length === 0 ? (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">warning</span>
                No temperature zone in the network satisfies that temperature range and capacity demand currently.
              </div>
            ) : (
              <div className="space-y-2">
                {candidates.map((c, rank) => (
                  <CandidateRow key={c.zone_id} c={c} rank={rank} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Network Warehouse Cards Grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-primary">domain</span>
          Cold Storage Network Hubs
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {warehouses.map((wh) => (
            <WarehouseCard key={wh.id} wh={wh} />
          ))}
        </div>
      </div>
    </div>
  );
}
