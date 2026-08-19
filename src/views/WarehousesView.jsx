import React, { useState, useMemo, useEffect } from 'react';
import { apiService } from '../services/api';

// Status styles for badges
const STATUS_STYLES = {
  active: { dot: 'bg-emerald-500', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Active' },
  maintenance: { dot: 'bg-amber-500', bg: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Maintenance' },
  offline: { dot: 'bg-rose-500', bg: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Offline' },
};

// City coordinates mapping database
const CITY_COORDINATES = {
  "delhi": { lat: 28.7041, lng: 77.1025, city: "Delhi" },
  "delhi / ncr": { lat: 28.7041, lng: 77.1025, city: "Delhi" },
  "mumbai": { lat: 19.0760, lng: 72.8777, city: "Mumbai" },
  "bengaluru": { lat: 12.9716, lng: 77.5946, city: "Bengaluru" },
  "bangalore": { lat: 12.9716, lng: 77.5946, city: "Bengaluru" },
  "bengaluru (bangalore)": { lat: 12.9716, lng: 77.5946, city: "Bengaluru" },
  "chennai": { lat: 13.0827, lng: 80.2707, city: "Chennai" },
  "pune": { lat: 18.5204, lng: 73.8567, city: "Pune" },
  "hyderabad": { lat: 17.3850, lng: 78.4867, city: "Hyderabad" },
  "kolkata": { lat: 22.5726, lng: 88.3639, city: "Kolkata" },
  "ahmedabad": { lat: 23.0225, lng: 72.5714, city: "Ahmedabad" },
  "lucknow": { lat: 26.8467, lng: 80.9462, city: "Lucknow" },
  "jaipur": { lat: 26.9124, lng: 75.7873, city: "Jaipur" },
  "chandigarh": { lat: 30.7333, lng: 76.7794, city: "Chandigarh" },
  "kochi": { lat: 9.9312, lng: 76.2673, city: "Kochi" },
  "surat": { lat: 21.1702, lng: 72.8311, city: "Surat" },
  "indore": { lat: 22.7196, lng: 75.8577, city: "Indore" },
  "patna": { lat: 25.5941, lng: 85.1376, city: "Patna" }
};

// Comprehensive multi-city cold storage warehouse dataset
const DEFAULT_WAREHOUSES = [
  // DELHI
  {
    id: "wh-delhi",
    name: "Delhi Air Cargo Cold Hub",
    code: "DEL-HUB-01",
    latitude: 28.5562,
    longitude: 77.1000,
    address: "IGI Airport Logistics Sector 21",
    city: "Delhi",
    country: "India",
    status: "active",
    zones: [
      { id: "del_z1", zone_name: "Ultra-Cold Vault (Vaccines)", min_temp_c: -85, max_temp_c: -70, pallet_capacity: 150, pallets_occupied: 90, available_capacity: 60, power_backup: true },
      { id: "del_z2", zone_name: "Deep Frozen Vault", min_temp_c: -25, max_temp_c: -18, pallet_capacity: 250, pallets_occupied: 180, available_capacity: 70, power_backup: true },
      { id: "del_z3", zone_name: "Pharma Chilled Zone A", min_temp_c: 2, max_temp_c: 8, pallet_capacity: 300, pallets_occupied: 210, available_capacity: 90, power_backup: true },
    ],
  },
  {
    id: "wh-delhi-narela",
    name: "Narela Pharma Storage Vault",
    code: "DEL-HUB-02",
    latitude: 28.8526,
    longitude: 77.0911,
    address: "Plot 14, Narela Industrial Complex",
    city: "Delhi",
    country: "India",
    status: "active",
    zones: [
      { id: "del_z4", zone_name: "Frozen Chamber A", min_temp_c: -22, max_temp_c: -15, pallet_capacity: 180, pallets_occupied: 120, available_capacity: 60, power_backup: true },
      { id: "del_z5", zone_name: "Standard Chilled Zone", min_temp_c: 1, max_temp_c: 5, pallet_capacity: 170, pallets_occupied: 60, available_capacity: 110, power_backup: true },
    ],
  },

  // MUMBAI
  {
    id: "wh-mumbai",
    name: "Mumbai JNPT Cold Logistics",
    code: "BOM-HUB-01",
    latitude: 18.9500,
    longitude: 72.9500,
    address: "JNPT Port Logistics Park, Nhava Sheva",
    city: "Mumbai",
    country: "India",
    status: "active",
    zones: [
      { id: "bom_z1", zone_name: "Deep Frozen Marine & Pharma", min_temp_c: -25, max_temp_c: -18, pallet_capacity: 450, pallets_occupied: 380, available_capacity: 70, power_backup: true },
      { id: "bom_z2", zone_name: "Chilled Vault B", min_temp_c: 2, max_temp_c: 8, pallet_capacity: 350, pallets_occupied: 270, available_capacity: 80, power_backup: true },
    ],
  },
  {
    id: "wh-mumbai-navi",
    name: "Navi Mumbai Biologics Vault",
    code: "BOM-HUB-02",
    latitude: 19.0330,
    longitude: 73.0297,
    address: "TTC Industrial Area, Turbhe",
    city: "Mumbai",
    country: "India",
    status: "active",
    zones: [
      { id: "bom_z3", zone_name: "Ultra-Cold Biologics Vault", min_temp_c: -85, max_temp_c: -70, pallet_capacity: 200, pallets_occupied: 110, available_capacity: 90, power_backup: true },
      { id: "bom_z4", zone_name: "Vaccine Cold Chamber", min_temp_c: 2, max_temp_c: 8, pallet_capacity: 250, pallets_occupied: 110, available_capacity: 140, power_backup: true },
    ],
  },

  // BENGALURU
  {
    id: "wh-bangalore",
    name: "Bangalore Biologics & Cold Hub",
    code: "BLR-HUB-01",
    latitude: 12.9716,
    longitude: 77.5946,
    address: "Whitefield Logistics & Biotech Zone",
    city: "Bengaluru",
    country: "India",
    status: "active",
    zones: [
      { id: "blr_z1", zone_name: "Ultra-Cold Vaccine Vault", min_temp_c: -85, max_temp_c: -70, pallet_capacity: 150, pallets_occupied: 85, available_capacity: 65, power_backup: true },
      { id: "blr_z2", zone_name: "Pharma Chilled A", min_temp_c: 2, max_temp_c: 8, pallet_capacity: 250, pallets_occupied: 125, available_capacity: 125, power_backup: true },
    ],
  },
  {
    id: "wh-bangalore-whitefield",
    name: "Whitefield Tech Cold Park",
    code: "BLR-HUB-02",
    latitude: 12.9698,
    longitude: 77.7500,
    address: "EPIP Zone, Whitefield",
    city: "Bengaluru",
    country: "India",
    status: "active",
    zones: [
      { id: "blr_z3", zone_name: "Deep Frozen Chamber", min_temp_c: -25, max_temp_c: -18, pallet_capacity: 350, pallets_occupied: 210, available_capacity: 140, power_backup: true },
      { id: "blr_z4", zone_name: "Fresh Dairy & Groceries", min_temp_c: 1, max_temp_c: 6, pallet_capacity: 250, pallets_occupied: 180, available_capacity: 70, power_backup: true },
    ],
  },

  // CHENNAI
  {
    id: "wh-chennai",
    name: "Chennai Port Freezer Terminal",
    code: "MAA-HUB-01",
    latitude: 13.0827,
    longitude: 80.2707,
    address: "SIPCOT Logistics Park, Ennore Port Corridor",
    city: "Chennai",
    country: "India",
    status: "active",
    zones: [
      { id: "maa_z1", zone_name: "Ultra-Cold Vaccine Vault", min_temp_c: -85, max_temp_c: -70, pallet_capacity: 150, pallets_occupied: 50, available_capacity: 100, power_backup: true },
      { id: "maa_z2", zone_name: "Marine Deep Freeze Vault", min_temp_c: -30, max_temp_c: -20, pallet_capacity: 350, pallets_occupied: 290, available_capacity: 60, power_backup: true },
      { id: "maa_z3", zone_name: "Pharma Cold Chamber", min_temp_c: 2, max_temp_c: 8, pallet_capacity: 250, pallets_occupied: 190, available_capacity: 60, power_backup: true },
    ],
  },
  {
    id: "wh-chennai-sri",
    name: "Sriperumbudur Cold Depot",
    code: "MAA-HUB-02",
    latitude: 12.9699,
    longitude: 79.9400,
    address: "Sriperumbudur Industrial Expressway",
    city: "Chennai",
    country: "India",
    status: "active",
    zones: [
      { id: "maa_z4", zone_name: "Chilled Storage A", min_temp_c: 1, max_temp_c: 6, pallet_capacity: 220, pallets_occupied: 100, available_capacity: 120, power_backup: true },
      { id: "maa_z5", zone_name: "Frozen Vault B", min_temp_c: -20, max_temp_c: -15, pallet_capacity: 180, pallets_occupied: 110, available_capacity: 70, power_backup: true },
    ],
  },

  // PUNE
  {
    id: "wh-pune",
    name: "Pune Agro-Cold Facility",
    code: "PNQ-HUB-01",
    latitude: 18.5204,
    longitude: 73.8567,
    address: "Hadapsar Industrial Estate",
    city: "Pune",
    country: "India",
    status: "active",
    zones: [
      { id: "pnq_z1", zone_name: "Produce Cool Zone", min_temp_c: 0, max_temp_c: 6, pallet_capacity: 200, pallets_occupied: 110, available_capacity: 90, power_backup: true },
      { id: "pnq_z2", zone_name: "Deep Freeze Chamber", min_temp_c: -22, max_temp_c: -15, pallet_capacity: 150, pallets_occupied: 80, available_capacity: 70, power_backup: true },
    ],
  },
  {
    id: "wh-pune-chakan",
    name: "Chakan Biologics Vault",
    code: "PNQ-HUB-02",
    latitude: 18.7600,
    longitude: 73.8500,
    address: "Chakan MIDC Phase 2",
    city: "Pune",
    country: "India",
    status: "active",
    zones: [
      { id: "pnq_z3", zone_name: "Ultra-Cold Vault (Vaccines)", min_temp_c: -85, max_temp_c: -70, pallet_capacity: 120, pallets_occupied: 40, available_capacity: 80, power_backup: true },
      { id: "pnq_z4", zone_name: "Pharma Chilled B", min_temp_c: 2, max_temp_c: 8, pallet_capacity: 180, pallets_occupied: 100, available_capacity: 80, power_backup: true },
    ],
  },

  // HYDERABAD
  {
    id: "wh-hyderabad",
    name: "Hyderabad Vaccine & Biologics Depot",
    code: "HYD-HUB-01",
    latitude: 17.3850,
    longitude: 78.4867,
    address: "Genome Valley Biotech Park, Shamirpet",
    city: "Hyderabad",
    country: "India",
    status: "active",
    zones: [
      { id: "hyd_z1", zone_name: "Ultra-Cold Vault", min_temp_c: -85, max_temp_c: -70, pallet_capacity: 250, pallets_occupied: 110, available_capacity: 140, power_backup: true },
      { id: "hyd_z2", zone_name: "Vaccine Storage Chamber", min_temp_c: 2, max_temp_c: 8, pallet_capacity: 300, pallets_occupied: 150, available_capacity: 150, power_backup: true },
    ],
  },

  // KOLKATA
  {
    id: "wh-kolkata",
    name: "Kolkata Port Cold Facility",
    code: "CCU-HUB-01",
    latitude: 22.5726,
    longitude: 88.3639,
    address: "Kolkata Port Logistics Zone, Kidderpore",
    city: "Kolkata",
    country: "India",
    status: "active",
    zones: [
      { id: "ccu_z1", zone_name: "Ultra-Cold Vault", min_temp_c: -85, max_temp_c: -70, pallet_capacity: 150, pallets_occupied: 60, available_capacity: 90, power_backup: true },
      { id: "ccu_z2", zone_name: "Deep Freeze Vault", min_temp_c: -25, max_temp_c: -16, pallet_capacity: 280, pallets_occupied: 190, available_capacity: 90, power_backup: true },
      { id: "ccu_z3", zone_name: "Chilled Produce Zone", min_temp_c: 2, max_temp_c: 8, pallet_capacity: 200, pallets_occupied: 120, available_capacity: 80, power_backup: true },
    ],
  },

  // AHMEDABAD
  {
    id: "wh-ahmedabad",
    name: "Ahmedabad Cold Logistics Depot",
    code: "AMD-HUB-01",
    latitude: 23.0225,
    longitude: 72.5714,
    address: "Changodar Industrial Estate",
    city: "Ahmedabad",
    country: "India",
    status: "active",
    zones: [
      { id: "amd_z1", zone_name: "Deep Freeze A", min_temp_c: -22, max_temp_c: -15, pallet_capacity: 240, pallets_occupied: 130, available_capacity: 110, power_backup: true },
      { id: "amd_z2", zone_name: "Pharma Chilled B", min_temp_c: 2, max_temp_c: 8, pallet_capacity: 180, pallets_occupied: 110, available_capacity: 70, power_backup: true },
    ],
  },

  // LUCKNOW
  {
    id: "wh-lucknow",
    name: "Lucknow Central Cold Depot",
    code: "LKO-HUB-01",
    latitude: 26.8467,
    longitude: 80.9462,
    address: "Transport Nagar Warehousing Hub",
    city: "Lucknow",
    country: "India",
    status: "active",
    zones: [
      { id: "lko_z1", zone_name: "Vaccine Chilled Chamber", min_temp_c: 2, max_temp_c: 8, pallet_capacity: 180, pallets_occupied: 80, available_capacity: 100, power_backup: true },
      { id: "lko_z2", zone_name: "Fresh Produce Cool", min_temp_c: 1, max_temp_c: 6, pallet_capacity: 140, pallets_occupied: 60, available_capacity: 80, power_backup: true },
    ],
  },

  // JAIPUR
  {
    id: "wh-jaipur",
    name: "Jaipur Agro-Cold Facility",
    code: "JAI-HUB-01",
    latitude: 26.9124,
    longitude: 75.7873,
    address: "VKI Industrial Area",
    city: "Jaipur",
    country: "India",
    status: "active",
    zones: [
      { id: "jai_z1", zone_name: "Chilled Storage Vault", min_temp_c: 1, max_temp_c: 6, pallet_capacity: 160, pallets_occupied: 70, available_capacity: 90, power_backup: true },
    ],
  },

  // CHANDIGARH
  {
    id: "wh-chandigarh",
    name: "Chandigarh Cold Corridor Depot",
    code: "IXC-HUB-01",
    latitude: 30.7333,
    longitude: 76.7794,
    address: "Derabassi Cold Chain Hub",
    city: "Chandigarh",
    country: "India",
    status: "active",
    zones: [
      { id: "ixc_z1", zone_name: "Deep Freeze Chamber", min_temp_c: -25, max_temp_c: -15, pallet_capacity: 200, pallets_occupied: 90, available_capacity: 110, power_backup: true },
      { id: "ixc_z2", zone_name: "Vaccine Chilled Vault", min_temp_c: 2, max_temp_c: 8, pallet_capacity: 160, pallets_occupied: 70, available_capacity: 90, power_backup: true },
    ],
  },

  // KOCHI
  {
    id: "wh-kochi",
    name: "Kochi Marine & Cold Storage",
    code: "COK-HUB-01",
    latitude: 9.9312,
    longitude: 76.2673,
    address: "Cochin Port Trust Logistics Area",
    city: "Kochi",
    country: "India",
    status: "active",
    zones: [
      { id: "cok_z1", zone_name: "Marine Deep Freeze (-30°C)", min_temp_c: -30, max_temp_c: -20, pallet_capacity: 220, pallets_occupied: 140, available_capacity: 80, power_backup: true },
      { id: "cok_z2", zone_name: "Chilled Pharma Chamber", min_temp_c: 2, max_temp_c: 8, pallet_capacity: 180, pallets_occupied: 100, available_capacity: 80, power_backup: true },
    ],
  }
];

// Origin city presets with geographical coordinates
const CITY_PRESETS = [
  { label: "Bengaluru (Bangalore)", city: "Bengaluru", lat: 12.9716, lng: 77.5946 },
  { label: "Delhi / NCR", city: "Delhi", lat: 28.7041, lng: 77.1025 },
  { label: "Mumbai", city: "Mumbai", lat: 19.0760, lng: 72.8777 },
  { label: "Chennai", city: "Chennai", lat: 13.0827, lng: 80.2707 },
  { label: "Pune", city: "Pune", lat: 18.5204, lng: 73.8567 },
  { label: "Hyderabad", city: "Hyderabad", lat: 17.3850, lng: 78.4867 },
  { label: "Kolkata", city: "Kolkata", lat: 22.5726, lng: 88.3639 },
  { label: "Ahmedabad", city: "Ahmedabad", lat: 23.0225, lng: 72.5714 },
  { label: "Lucknow", city: "Lucknow", lat: 26.8467, lng: 80.9462 },
  { label: "Jaipur", city: "Jaipur", lat: 26.9124, lng: 75.7873 },
  { label: "Chandigarh", city: "Chandigarh", lat: 30.7333, lng: 76.7794 },
  { label: "Kochi", city: "Kochi", lat: 9.9312, lng: 76.2673 },
];

// Haversine formula (km distance calculation)
function haversineKm(lat1, lng1, lat2, lng2) {
  if (!lat1 || !lng1 || !lat2 || !lng2) return 0;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Check if city names match or overlap (e.g. Bangalore / Bengaluru, Delhi / NCR)
function isCityMatch(whCity, selectedCity) {
  if (!whCity || !selectedCity) return false;
  const c1 = whCity.toLowerCase().trim();
  const c2 = selectedCity.toLowerCase().trim();

  if (c1 === c2) return true;
  if ((c1.includes("bengaluru") || c1.includes("bangalore")) && (c2.includes("bengaluru") || c2.includes("bangalore"))) return true;
  if ((c1.includes("delhi")) && (c2.includes("delhi"))) return true;
  if ((c1.includes("mumbai")) && (c2.includes("mumbai"))) return true;
  if ((c1.includes("chennai")) && (c2.includes("chennai"))) return true;
  if ((c1.includes("pune")) && (c2.includes("pune"))) return true;
  if ((c1.includes("hyderabad")) && (c2.includes("hyderabad"))) return true;
  if ((c1.includes("kolkata")) && (c2.includes("kolkata"))) return true;
  if ((c1.includes("ahmedabad")) && (c2.includes("ahmedabad"))) return true;
  if ((c1.includes("lucknow")) && (c2.includes("lucknow"))) return true;
  if ((c1.includes("jaipur")) && (c2.includes("jaipur"))) return true;
  if ((c1.includes("chandigarh")) && (c2.includes("chandigarh"))) return true;
  if ((c1.includes("kochi")) && (c2.includes("kochi"))) return true;
  return false;
}

// Check if a warehouse temperature zone satisfies criteria
function zoneFits(zone, wh, query) {
  const requiredMin = Number.isFinite(query.required_temp_min) ? query.required_temp_min : -85;
  const requiredMax = Number.isFinite(query.required_temp_max) ? query.required_temp_max : 15;
  const normMin = Math.min(requiredMin, requiredMax);
  const normMax = Math.max(requiredMin, requiredMax);

  // Temperature overlap check: zone min <= requiredMax and zone max >= requiredMin
  const rangeOk = zone.min_temp_c <= normMax && zone.max_temp_c >= normMin;
  const capOk = Number.isFinite(zone.available_capacity) && zone.available_capacity >= (query.pallets_needed || 1);

  // City / Location filter check if user types text search
  if (query.city_text && query.city_text.trim().length > 0) {
    const filter = query.city_text.trim().toLowerCase();
    const whCity = (wh.city || wh.location || "").toLowerCase();
    const whName = (wh.name || "").toLowerCase();
    if (!whCity.includes(filter) && !whName.includes(filter)) {
      return false;
    }
  }

  return rangeOk && capOk;
}

// Score candidate based on distance, same city local bonus, capacity headroom, and power backup
function scoreCandidate(distanceKm, zone, query, isSameCity) {
  // Give a huge bonus (+500) if warehouse is located in the requested origin city so local facilities ALWAYS rank #1 Best Match!
  const localBonus = isSameCity ? 500 : 0;
  const distanceScore = Math.max(0, 100 - distanceKm / 10);
  const headroom = zone.available_capacity - (query.pallets_needed || 1);
  const capacityScore = Math.min(30, headroom / 2);
  const backupBonus = zone.power_backup ? 8 : 0;
  return Math.round((localBonus + distanceScore + capacityScore + backupBonus) * 10) / 10;
}

// Find matching candidates
function findCandidates(warehouses, query) {
  const candidates = [];
  for (const wh of warehouses) {
    if (wh.status === "offline") continue;
    if (!wh.zones || !Array.isArray(wh.zones)) continue;

    const whCity = wh.city || wh.location || "";
    const isSameCity = isCityMatch(whCity, query.city_name);

    for (const zone of wh.zones) {
      if (!zoneFits(zone, wh, query)) continue;
      
      const distance_km = isSameCity ? 0 : Math.round(haversineKm(query.lat, query.lng, wh.latitude || 0, wh.longitude || 0) * 10) / 10;
      const score = scoreCandidate(distance_km, zone, query, isSameCity);
      candidates.push({ warehouse: wh, zone, zone_id: zone.id, distance_km, score });
    }
  }
  return candidates.sort((a, b) => b.score - a.score);
}

function TempBadge({ min, max }) {
  const ultraCold = min <= -70;
  const deepFreeze = min <= -15 && !ultraCold;
  
  let colorStyle = "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (ultraCold) colorStyle = "bg-purple-50 text-purple-700 border-purple-200 font-bold";
  else if (deepFreeze) colorStyle = "bg-sky-50 text-sky-700 border-sky-200";

  return (
    <span className={`inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded border ${colorStyle}`}>
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
        <span>{occupied}/{capacity} pallets occupied</span>
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
            {wh.address || `${wh.city}, ${wh.country || 'India'}`}
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
  const isTop = rank === 0;

  return (
    <div
      className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border transition-all ${
        isTop
          ? 'bg-blue-50/80 border-primary/40 shadow-sm'
          : 'bg-surface-container-low/80 border-outline-variant/40 hover:bg-surface-container-low'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-sm shrink-0 ${
            isTop ? 'bg-primary text-white shadow-md' : 'bg-slate-200 text-slate-700'
          }`}
        >
          {isTop ? '★1' : `#${rank + 1}`}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-on-surface text-sm">{c.warehouse.name}</span>
            <span className="text-xs font-semibold text-slate-500">({c.warehouse.city})</span>
            {isTop && (
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-primary text-white">
                Best Match
              </span>
            )}
          </div>
          <p className="text-xs text-on-surface-variant mt-0.5 flex flex-wrap items-center gap-2">
            <span>Zone: <strong className="text-on-surface">{c.zone.zone_name}</strong></span>
            <span>•</span>
            <TempBadge min={c.zone.min_temp_c} max={c.zone.max_temp_c} />
            <span>•</span>
            <span className="font-mono font-bold text-emerald-700">{c.zone.available_capacity} pallets available</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-outline-variant/30">
        <div className="text-left sm:text-right font-mono">
          <div className="text-xs font-bold text-on-surface flex items-center gap-1 sm:justify-end">
            <span className="material-symbols-outlined text-[15px] text-primary">navigation</span>
            {c.distance_km === 0 ? 'Local Facility (0 km)' : `${c.distance_km} km away`}
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

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const res = await apiService.getWarehouses();
        if (res && res.length > 0) {
          const mapped = res.map(wh => {
            const whCityKey = (wh.location || wh.city || '').toLowerCase().trim();
            const coordLookup = CITY_COORDINATES[whCityKey] || { lat: 20.5937, lng: 78.9629, city: wh.location || 'India' };
            const match = DEFAULT_WAREHOUSES.find(d => d.id === wh.id || d.name.toLowerCase() === wh.name.toLowerCase() || d.city.toLowerCase() === whCityKey);

            return {
              ...wh,
              latitude: match?.latitude || coordLookup.lat,
              longitude: match?.longitude || coordLookup.lng,
              city: wh.location || match?.city || coordLookup.city,
              zones: match?.zones || [{
                id: wh.id + '_z1',
                zone_name: 'Main Cold Chamber',
                min_temp_c: wh.min_temp_celsius,
                max_temp_c: wh.max_temp_celsius,
                pallet_capacity: wh.total_capacity_pallets,
                pallets_occupied: wh.used_capacity_pallets,
                available_capacity: wh.total_capacity_pallets - wh.used_capacity_pallets,
                power_backup: true
              }]
            };
          });
          setWarehouses(mapped);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchWarehouses();
  }, []);

  const [query, setQuery] = useState({
    lat: CITY_PRESETS[0].lat,
    lng: CITY_PRESETS[0].lng,
    city_name: CITY_PRESETS[0].city,
    city_text: '',
    required_temp_min: -80,
    required_temp_max: 4,
    pallets_needed: 10,
  });

  const [selectedCityIndex, setSelectedCityIndex] = useState(0);
  const [ranSearch, setRanSearch] = useState(false);

  const candidates = useMemo(() => findCandidates(warehouses, query), [warehouses, query]);

  const handleCityChange = (e) => {
    const nextIndex = Number(e.target.value);
    const preset = CITY_PRESETS[nextIndex];
    setSelectedCityIndex(nextIndex);
    setQuery((q) => ({ ...q, lat: preset.lat, lng: preset.lng, city_name: preset.city, city_text: '' }));
  };

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-on-surface">Warehouse Network & Storage</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300">
              Active Network
            </span>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            Search cold storage facilities by origin city, temperature requirements (°C), and available pallet capacity.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-blue-50 text-blue-800 px-3 py-1.5 rounded-xl border border-blue-200">
          <span className="material-symbols-outlined text-[16px] text-blue-600">inventory_2</span>
          <span>{warehouses.length} Active Storage Hubs</span>
        </div>
      </div>

      {/* Temperature & City Filter Search Engine */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <span className="material-symbols-outlined text-[22px]">manage_search</span>
            <h2>Cold Storage Facility Search Engine</h2>
          </div>

          <span className="text-[11px] font-semibold text-slate-500">
            Multi-Zone Cold Chain Matching
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 pt-1">
          {/* Origin City Dropdown */}
          <div>
            <label className="text-[11px] font-bold text-on-surface mb-1.5 uppercase block">Origin City Location</label>
            <select
              value={selectedCityIndex}
              onChange={handleCityChange}
              className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-xs text-on-surface focus:outline-none focus:border-primary font-semibold"
            >
              {CITY_PRESETS.map((p, i) => (
                <option key={p.label} value={i}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Min Required Temp °C */}
          <div>
            <label className="text-[11px] font-bold text-on-surface mb-1.5 uppercase block">Min Required °C</label>
            <input
              type="number"
              value={query.required_temp_min}
              onChange={(e) => setQuery((q) => ({ ...q, required_temp_min: Number(e.target.value) }))}
              className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary font-mono font-bold"
              placeholder="-85"
            />
          </div>

          {/* Max Required Temp °C */}
          <div>
            <label className="text-[11px] font-bold text-on-surface mb-1.5 uppercase block">Max Required °C</label>
            <input
              type="number"
              value={query.required_temp_max}
              onChange={(e) => setQuery((q) => ({ ...q, required_temp_max: Number(e.target.value) }))}
              className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary font-mono font-bold"
              placeholder="8"
            />
          </div>

          {/* Pallets Needed */}
          <div>
            <label className="text-[11px] font-bold text-on-surface mb-1.5 uppercase block">Pallets Needed</label>
            <input
              type="number"
              min={1}
              value={query.pallets_needed}
              onChange={(e) => setQuery((q) => ({ ...q, pallets_needed: Math.max(1, Number(e.target.value)) }))}
              className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary font-mono font-bold"
            />
          </div>

          {/* Filter City Text Input */}
          <div>
            <label className="text-[11px] font-bold text-on-surface mb-1.5 uppercase block">Filter Name / City</label>
            <input
              type="text"
              placeholder="e.g. Chennai, Whitefield..."
              value={query.city_text}
              onChange={(e) => setQuery((q) => ({ ...q, city_text: e.target.value }))}
              className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => setRanSearch(true)}
            className="bg-[#0065FF] hover:bg-[#0052cc] text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">search</span>
            Search Available Warehouses
          </button>

          {ranSearch && (
            <button
              onClick={() => {
                setRanSearch(false);
                setQuery((q) => ({ ...q, required_temp_min: -80, required_temp_max: 4, pallets_needed: 10, city_text: '' }));
              }}
              className="px-4 py-2.5 bg-surface border border-outline-variant text-slate-700 text-xs font-semibold rounded-xl hover:bg-surface-container cursor-pointer"
            >
              Reset Search
            </button>
          )}
        </div>

        {/* Search Results Display Section */}
        {ranSearch && (
          <div className="pt-4 border-t border-outline-variant/40 space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center text-xs">
              <span className="font-extrabold text-on-surface">
                Found <span className="text-primary font-mono">{candidates.length}</span> Matching Facilities for [{query.city_name}] ({query.required_temp_min}°C to {query.required_temp_max}°C)
              </span>
              <span className="text-slate-500 font-mono">Local City Preferred & Proximity Ranked</span>
            </div>

            {candidates.length === 0 ? (
              <div className="p-8 bg-amber-50/70 border border-amber-200 rounded-2xl text-center space-y-2">
                <span className="material-symbols-outlined text-amber-600 text-[32px]">warning</span>
                <h4 className="font-bold text-amber-900 text-sm">No Warehouses Found Matching Criteria</h4>
                <p className="text-xs text-amber-800">
                  No cold storage facility satisfies required temperature range [{query.required_temp_min}°C to {query.required_temp_max}°C] with {query.pallets_needed} available pallets in {query.city_name}.
                </p>
                <p className="text-xs text-slate-600 pt-1">Try widening the temperature range or adjusting pallet quantity.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {candidates.map((c, idx) => (
                  <CandidateRow key={`${c.warehouse.id}-${c.zone_id}`} c={c} rank={idx} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* All Warehouses Grid View */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider">All Network Cold Storage Depots</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {warehouses.map((wh) => (
            <WarehouseCard key={wh.id} wh={wh} />
          ))}
        </div>
      </div>
    </div>
  );
}
