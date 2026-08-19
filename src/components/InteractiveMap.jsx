import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, ZoomControl } from 'react-leaflet';
import L from 'leaflet';

// Real Geographical Coordinates (Lat, Lng) for Indian & Global Cities
const CITY_COORDS = {
  "Delhi":              [28.6139, 77.2090],
  "New Delhi":          [28.6139, 77.2090],
  "Mumbai":             [19.0760, 72.8777],
  "Chennai":            [13.0827, 80.2707],
  "Kolkata":            [22.5726, 88.3639],
  "Hyderabad":          [17.3850, 78.4867],
  "Bangalore":          [12.9716, 77.5946],
  "Bengaluru":          [12.9716, 77.5946],
  "Pune":               [18.5204, 73.8567],
  "Ahmedabad":          [23.0225, 72.5714],
  "Jaipur":             [26.9124, 75.7873],
  "Lucknow":            [26.8467, 80.9462],
  "Chandigarh":         [30.7333, 76.7794],
  "Kochi":              [9.9312, 76.2673],
  "Visakhapatnam":      [17.6868, 83.2185],
  "Nagpur":             [21.1458, 79.0882],
  "Indore":             [22.7196, 75.8577],
  "Guwahati":           [26.1445, 91.7362],
  "Bhopal":             [23.2599, 77.4126],
  "Surat":              [21.1702, 72.8311],
  "Vadodara":           [22.3072, 73.1812],
  "Coimbatore":         [11.0168, 76.9558],
  "Thiruvananthapuram": [8.5241, 76.9366],
  "Patna":              [25.5941, 85.1376],
  "Agra":               [27.1767, 78.0081],
  "Ambala":             [30.3782, 76.7767],
  "Anantapur":          [14.6819, 77.6006],

  // Global Hubs
  "Frankfurt":          [50.1109, 8.6821],
  "Boston":             [42.3601, -71.0589],
  "Basel":              [47.5596, 7.5886],
  "London":             [51.5074, -0.1278]
};

function getCoords(locationStr) {
  if (!locationStr) return null;
  const loc = locationStr.trim();
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    if (loc.toLowerCase().includes(city.toLowerCase())) {
      return coords;
    }
  }
  return null;
}

function getShipmentPosition(s, index) {
  let coords = getCoords(s.current_location);
  if (coords) return coords;

  coords = getCoords(s.origin);
  if (coords) return coords;

  coords = getCoords(s.destination);
  if (coords) return coords;

  const fallbacks = [
    [22.0, 78.0], [15.0, 76.0], [26.0, 80.0],
    [20.0, 85.0], [11.0, 78.0], [24.0, 73.0]
  ];
  return fallbacks[index % fallbacks.length];
}

const TILE_LAYERS = {
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
  },
  googleRoadmap: {
    url: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    attribution: "&copy; Google Maps"
  },
  googleSatellite: {
    url: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    attribution: "&copy; Google Maps Satellite"
  }
};

export default function InteractiveMap({ shipments = [], selectedShipmentId, onSelectShipment }) {
  const [mapStyle, setMapStyle] = useState('dark'); // 'dark' | 'googleRoadmap' | 'googleSatellite'

  const normalCount = shipments.filter(s => {
    const st = s.current_status || s.status;
    return st === 'In Transit' || st === 'Normal' || st === 'Delivered';
  }).length;

  const warningCount = shipments.filter(s => {
    const st = s.current_status || s.status;
    return st === 'Warning';
  }).length;

  const criticalCount = shipments.filter(s => {
    const st = s.current_status || s.status;
    return st === 'Critical Breach' || st === 'Critical';
  }).length;

  // Custom marker creator using Leaflet DivIcon
  const createCustomIcon = (s, isSelected) => {
    const status = s.current_status || s.status;
    const category = s.product_category || s.category;
    const currentTemp = s.current_temp !== undefined ? s.current_temp : s.currentTemp;
    const displayId = s.tracking_number || s.id;

    let badgeClass = "bg-[#0065FF] border-cyan-400 text-white";
    if (status === "Warning") badgeClass = "bg-amber-500 border-amber-300 text-amber-950 font-bold";
    if (status === "Critical Breach" || status === "Critical") badgeClass = "bg-red-600 border-red-300 text-white font-bold animate-bounce";
    if (status === "Delivered") badgeClass = "bg-emerald-600 border-emerald-400 text-white";

    const iconSymbol = category === 'Vaccines' || category === 'Healthcare' ? '💉' : category === 'Dairy' ? '🥛' : '🚚';

    const html = `
      <div class="relative group cursor-pointer transform -translate-x-1/2 -translate-y-1/2 ${isSelected ? 'scale-125 z-50' : 'hover:scale-110 z-30'}">
        ${isSelected ? '<div class="absolute -inset-3 rounded-full bg-cyan-400/40 animate-ping pointer-events-none"></div>' : ''}
        <div class="px-2.5 py-1 rounded-lg border text-[11px] shadow-xl flex items-center gap-1.5 backdrop-blur-md transition-transform ${badgeClass}">
          <span>${iconSymbol}</span>
          <span className="font-semibold">${displayId} (${currentTemp != null ? (currentTemp > 0 ? `+${currentTemp}` : currentTemp) : '—'}°C)</span>
        </div>
      </div>
    `;

    return L.divIcon({
      html: html,
      className: '',
      iconSize: [120, 36],
      iconAnchor: [60, 18]
    });
  };

  return (
    <div className="relative w-full h-[480px] rounded-2xl overflow-hidden border border-outline-variant/40 shadow-2xl flex flex-col justify-between p-4 bg-[#071328] text-white">
      {/* Top Header Bar */}
      <div className="relative z-[1000] flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#0d1b2a]/90 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="font-bold text-xs tracking-wider uppercase text-slate-100">
            India Cold-Chain Live Telemetry Mesh (Real Map)
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Map Tile Layer Selector */}
          <div className="flex items-center bg-slate-900/90 rounded-lg p-0.5 border border-slate-700 text-[10px] font-semibold">
            <button
              onClick={() => setMapStyle('dark')}
              className={`px-2 py-1 rounded transition-colors ${mapStyle === 'dark' ? 'bg-primary text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Dark Tech
            </button>
            <button
              onClick={() => setMapStyle('googleRoadmap')}
              className={`px-2 py-1 rounded transition-colors ${mapStyle === 'googleRoadmap' ? 'bg-primary text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Google Maps
            </button>
            <button
              onClick={() => setMapStyle('googleSatellite')}
              className={`px-2 py-1 rounded transition-colors ${mapStyle === 'googleSatellite' ? 'bg-primary text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Satellite
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1 text-cyan-300">
              <span className="w-2 h-2 rounded-full bg-[#0065FF]"></span> Normal ({normalCount})
            </span>
            <span className="flex items-center gap-1 text-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span> Warning ({warningCount})
            </span>
            <span className="flex items-center gap-1 text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> Critical ({criticalCount})
            </span>
          </div>
        </div>
      </div>

      {/* Leaflet Real Map Container */}
      <div className="relative w-full h-full rounded-xl overflow-hidden z-10 border border-slate-800">
        <MapContainer
          center={[20.5937, 78.9629]} // Geographic Center of India
          zoom={5}
          zoomControl={false}
          style={{ width: '100%', height: '100%', backgroundColor: '#071328' }}
        >
          <ZoomControl position="bottomright" />
          <TileLayer
            url={TILE_LAYERS[mapStyle].url}
            attribution={TILE_LAYERS[mapStyle].attribution}
          />

          {/* Route Polylines connecting origin -> current -> destination */}
          {shipments.map((s, idx) => {
            const originCoords = getCoords(s.origin);
            const currentCoords = getShipmentPosition(s, idx);
            const destCoords = getCoords(s.destination);

            if (!originCoords || !destCoords) return null;

            const pathPositions = [originCoords, currentCoords, destCoords];
            const status = s.current_status || s.status;

            let color = "#0065FF";
            if (status === "Warning") color = "#F59E0B";
            if (status === "Critical Breach" || status === "Critical") color = "#EF4444";
            if (status === "Delivered") color = "#10B981";

            return (
              <Polyline
                key={`route-line-${idx}`}
                positions={pathPositions}
                pathOptions={{
                  color: color,
                  weight: 3,
                  dashArray: "6, 8",
                  opacity: 0.85
                }}
              />
            );
          })}

          {/* Real Shipment Markers */}
          {shipments.map((s, idx) => {
            const pos = getShipmentPosition(s, idx);
            const isSelected = selectedShipmentId === s.id;
            const icon = createCustomIcon(s, isSelected);

            return (
              <Marker
                key={s.id}
                position={pos}
                icon={icon}
                eventHandlers={{
                  click: () => onSelectShipment && onSelectShipment(s.id)
                }}
              >
                <Popup className="custom-leaflet-popup">
                  <div className="p-2 space-y-1 text-slate-900 font-sans text-xs">
                    <div className="flex justify-between items-center font-bold text-primary">
                      <span>{s.tracking_number || s.id}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100">{s.product_category}</span>
                    </div>
                    <p className="font-semibold text-slate-800">{s.product_name}</p>
                    <p className="text-slate-600 text-[11px]">{s.origin} → {s.destination}</p>
                    <div className="flex justify-between items-center pt-1 border-t border-slate-200 mt-1 font-mono">
                      <span>Temp: <strong>{s.current_temp}°C</strong></span>
                      <span className={`font-bold ${s.spoilage_risk > 30 ? 'text-red-600' : 'text-emerald-600'}`}>
                        Risk: {s.spoilage_risk}%
                      </span>
                    </div>
                  </div>
                </Popup>
                <Tooltip direction="top" offset={[0, -20]} opacity={0.95}>
                  <div className="text-[11px] font-bold text-slate-900">
                    {s.product_name} ({s.origin} → {s.destination})
                  </div>
                </Tooltip>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Map Bottom Footer Bar */}
      <div className="relative z-[1000] bg-[#0d1b2a]/90 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-300 gap-1 mt-2">
        <span>Click any marker pin on the map to inspect real-time thermal gradient, route polyline, and AI risk vectors.</span>
        <span className="text-cyan-400 font-mono font-bold">Live Google/OSM Maps Engine Connected</span>
      </div>
    </div>
  );
}
