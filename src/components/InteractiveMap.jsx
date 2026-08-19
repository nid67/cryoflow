import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, ZoomControl } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet default icon loading issue in Vite bundle
try {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
} catch (e) {
  console.warn('Leaflet icon override warning:', e);
}


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
  "Anantapur":          [14.6819, 77.6006]
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
  // Use explicit latitude and longitude if available
  if (s.latitude && s.longitude && !isNaN(s.latitude) && !isNaN(s.longitude)) {
    return [s.latitude, s.longitude];
  }

  let coords = getCoords(s.current_location);
  if (coords) return coords;

  coords = getCoords(s.origin);
  if (coords) return coords;

  coords = getCoords(s.destination);
  if (coords) return coords;

  const fallbacks = [
    [22.5, 78.5], [15.2, 76.8], [26.8, 80.9],
    [20.1, 85.3], [11.2, 77.8], [24.1, 73.2]
  ];
  return fallbacks[index % fallbacks.length];
}

const TILE_LAYERS = {
  googleRoadmap: {
    url: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    attribution: "&copy; Google Maps"
  },
  googleSatellite: {
    url: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    attribution: "&copy; Google Maps Satellite"
  },
  lightVoyager: {
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
  }
};

export default function InteractiveMap({ shipments = [], selectedShipmentId, onSelectShipment }) {
  const [mapStyle, setMapStyle] = useState('googleRoadmap'); // Default Google Maps Light theme

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

  // Custom marker creator for Leaflet
  const createCustomIcon = (s, isSelected) => {
    const status = s.current_status || s.status;
    const category = s.product_category || s.category;
    const currentTemp = s.current_temp !== undefined ? s.current_temp : s.currentTemp;
    const displayId = s.tracking_number || s.id;

    let dotColor = "bg-blue-600";
    let badgeBorder = "border-blue-300";

    if (status === "Warning") {
      dotColor = "bg-amber-500";
      badgeBorder = "border-amber-400 font-bold bg-amber-50 text-amber-950";
    } else if (status === "Critical Breach" || status === "Critical") {
      dotColor = "bg-red-600 animate-ping";
      badgeBorder = "border-red-500 font-bold bg-red-50 text-red-950 shadow-red-200 animate-bounce";
    } else if (status === "Delivered") {
      dotColor = "bg-emerald-600";
      badgeBorder = "border-emerald-300 bg-emerald-50 text-emerald-950";
    }

    const iconSymbol = category === 'Vaccines' || category === 'Healthcare' ? '💉' : category === 'Dairy' ? '🥛' : '🚚';

    const html = `
      <div style="transform: translate(-50%, -50%); display: inline-flex; align-items: center; white-space: nowrap; pointer-events: auto;">
        <div class="px-2.5 py-1 rounded-full border shadow-md flex items-center gap-1.5 bg-white text-slate-800 text-[11px] font-semibold transition-transform hover:scale-110 ${badgeBorder}">
          <span class="w-2 h-2 rounded-full ${dotColor}"></span>
          <span>${iconSymbol} ${displayId}</span>
          <span class="px-1.5 py-0.2 rounded-md bg-slate-100 font-mono text-[10px] font-bold text-slate-700">
            ${currentTemp != null ? (currentTemp > 0 ? `+${currentTemp}` : currentTemp) : '—'}°C
          </span>
        </div>
      </div>
    `;

    return L.divIcon({
      html: html,
      className: 'custom-leaflet-marker-node',
      iconSize: [0, 0],
      iconAnchor: [0, 0]
    });
  };

  return (
    <div className="relative w-full h-[520px] rounded-2xl overflow-hidden border border-outline-variant/60 shadow-sm flex flex-col justify-between p-4 bg-surface-container-lowest text-on-surface">
      {/* Light Glassmorphic Header Bar */}
      <div className="relative z-[1000] flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          <span className="font-extrabold text-xs tracking-wider uppercase text-slate-800">
            Live Fleet Map (India Region)
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Map Layer Switcher */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-[11px] font-semibold">
            <button
              onClick={() => setMapStyle('googleRoadmap')}
              className={`px-2.5 py-1 rounded transition-all ${mapStyle === 'googleRoadmap' ? 'bg-white text-primary shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Google Maps
            </button>
            <button
              onClick={() => setMapStyle('googleSatellite')}
              className={`px-2.5 py-1 rounded transition-all ${mapStyle === 'googleSatellite' ? 'bg-white text-primary shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Satellite
            </button>
            <button
              onClick={() => setMapStyle('lightVoyager')}
              className={`px-2.5 py-1 rounded transition-all ${mapStyle === 'lightVoyager' ? 'bg-white text-primary shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Light Street
            </button>
          </div>

          {/* Status Counter Badges */}
          <div className="flex items-center gap-3 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-blue-700">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span> Normal ({normalCount})
            </span>
            <span className="flex items-center gap-1.5 text-amber-700">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> Warning ({warningCount})
            </span>
            <span className="flex items-center gap-1.5 text-red-700">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span> Critical ({criticalCount})
            </span>
          </div>
        </div>
      </div>

      {/* Leaflet Real Map Canvas */}
      <div className="relative w-full h-full rounded-xl overflow-hidden z-10 border border-slate-200">
        <MapContainer
          center={[20.5937, 78.9629]} // Geographic Center of India
          zoom={5}
          zoomControl={false}
          style={{ width: '100%', height: '100%', backgroundColor: '#f8fafc' }}
        >
          <ZoomControl position="bottomright" />
          <TileLayer
            url={TILE_LAYERS[mapStyle].url}
            attribution={TILE_LAYERS[mapStyle].attribution}
          />

          {/* Route Polylines connecting origin -> current position -> destination */}
          {shipments.map((s, idx) => {
            const originCoords = getCoords(s.origin);
            const currentCoords = getShipmentPosition(s, idx);
            const destCoords = getCoords(s.destination);

            if (!originCoords || !destCoords || !currentCoords) return null;

            const pathPositions = [originCoords, currentCoords, destCoords];
            const status = s.current_status || s.status;

            let strokeColor = "#2563EB";
            if (status === "Warning") strokeColor = "#D97706";
            if (status === "Critical Breach" || status === "Critical") strokeColor = "#DC2626";
            if (status === "Delivered") strokeColor = "#059669";

            return (
              <Polyline
                key={`route-line-${s.id}-${currentCoords[0]}-${currentCoords[1]}`}
                positions={pathPositions}
                pathOptions={{
                  color: strokeColor,
                  weight: 3,
                  dashArray: "5, 7",
                  opacity: 0.85
                }}
              />
            );

          })}

          {/* Real Shipment Pins */}
          {shipments.map((s, idx) => {
            const pos = getShipmentPosition(s, idx);
            if (!pos) return null;

            const isSelected = selectedShipmentId === s.id;
            const icon = createCustomIcon(s, isSelected);
            const tempVal = s.current_temp !== undefined ? s.current_temp : s.currentTemp;
            const riskVal = s.spoilage_risk !== undefined ? s.spoilage_risk : (s.spoilageRisk ?? 0);
            const statusVal = s.current_status || s.status;

            return (
              <Marker
                key={`marker-${s.id}-${pos[0]}-${pos[1]}-${tempVal}-${statusVal}`}
                position={pos}
                icon={icon}
                eventHandlers={{
                  click: () => onSelectShipment && onSelectShipment(s.id)
                }}
              >

                <Popup className="custom-leaflet-popup">
                  <div className="p-2 space-y-1.5 text-slate-900 font-sans text-xs min-w-[200px]">
                    <div className="flex justify-between items-center font-bold text-primary border-b border-slate-100 pb-1">
                      <span>{s.tracking_number || s.id}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-semibold">
                        {s.product_category || s.category}
                      </span>
                    </div>
                    <p className="font-bold text-slate-800 text-[13px]">{s.product_name || s.cargo}</p>
                    <p className="text-slate-600 text-[11px] font-medium">📍 {s.current_location || s.origin}</p>
                    <p className="text-slate-500 text-[10px]">Route: {s.origin} → {s.destination}</p>
                    <div className="flex justify-between items-center pt-1 border-t border-slate-100 mt-1 font-mono text-[11px]">
                      <span>Temp: <strong>{tempVal != null ? (tempVal > 0 ? `+${tempVal}` : tempVal) : '—'}°C</strong></span>
                      <span className={`font-bold ${riskVal > 30 ? 'text-red-600' : 'text-emerald-600'}`}>
                        Risk: {riskVal}%
                      </span>
                    </div>
                  </div>
                </Popup>
                <Tooltip direction="top" offset={[0, -15]} opacity={0.95}>
                  <div className="text-[11px] font-bold text-slate-900">
                    {s.product_name || s.cargo} ({s.origin} → {s.destination})
                  </div>
                </Tooltip>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Light Glassmorphic Footer Bar */}
      <div className="relative z-[1000] bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center text-xs text-slate-600 gap-1 mt-2">
        <span>Click any vehicle pin on the map to view temperature and risk details.</span>
        <span className="text-primary font-mono font-bold">Live GPS Map Connected</span>
      </div>
    </div>
  );
}
