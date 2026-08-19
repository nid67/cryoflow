import React from 'react';

// Indian city coordinates mapped to percentage positions on the map canvas
// The map area covers roughly lat 8-35°N, lon 68-97°E (India bounding box)
const INDIA_CITIES = {
  "Delhi":       { x: 52, y: 18 },
  "New Delhi":   { x: 52, y: 18 },
  "Mumbai":      { x: 32, y: 55 },
  "Chennai":     { x: 56, y: 82 },
  "Kolkata":     { x: 78, y: 42 },
  "Hyderabad":   { x: 50, y: 65 },
  "Bangalore":   { x: 48, y: 80 },
  "Bengaluru":   { x: 48, y: 80 },
  "Pune":        { x: 35, y: 60 },
  "Ahmedabad":   { x: 30, y: 40 },
  "Jaipur":      { x: 42, y: 25 },
  "Lucknow":     { x: 58, y: 25 },
  "Chandigarh":  { x: 48, y: 12 },
  "Kochi":       { x: 42, y: 90 },
  "Visakhapatnam": { x: 65, y: 62 },
  "Nagpur":      { x: 50, y: 48 },
  "Indore":      { x: 40, y: 42 },
  "Guwahati":    { x: 85, y: 25 },
  "Bhopal":      { x: 45, y: 40 },
  "Surat":       { x: 28, y: 48 },
  "Vadodara":    { x: 30, y: 44 },
  "Coimbatore":  { x: 46, y: 86 },
  "Thiruvananthapuram": { x: 40, y: 95 },
};

function getCityPosition(locationStr) {
  if (!locationStr) return null;
  const loc = locationStr.trim();
  for (const [city, pos] of Object.entries(INDIA_CITIES)) {
    if (loc.toLowerCase().includes(city.toLowerCase())) {
      return pos;
    }
  }
  return null;
}

function getShipmentPosition(shipment, index) {
  // Try current_location first
  let pos = getCityPosition(shipment.current_location);
  if (pos) return pos;

  // Try origin
  pos = getCityPosition(shipment.origin);
  if (pos) return pos;

  // Try destination
  pos = getCityPosition(shipment.destination);
  if (pos) return pos;

  // Distribute unknown shipments across the map
  const fallbackPositions = [
    { x: 45, y: 35 }, { x: 55, y: 50 }, { x: 38, y: 65 },
    { x: 65, y: 45 }, { x: 50, y: 75 }, { x: 72, y: 30 },
    { x: 35, y: 55 }, { x: 60, y: 60 }, { x: 48, y: 42 },
  ];
  return fallbackPositions[index % fallbackPositions.length];
}

export default function InteractiveMap({ shipments, selectedShipmentId, onSelectShipment }) {

  return (
    <div className="relative w-full h-[420px] bg-[#071328] rounded-xl overflow-hidden border border-outline-variant/30 shadow-inner flex flex-col justify-between p-lg text-white">
      {/* India Map Outline SVG */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-[5] opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Simplified India outline */}
        <path d="M 48,5 L 55,8 L 58,10 L 60,14 L 62,18 L 65,20 L 70,22 L 75,25 L 80,28 L 85,25 L 88,30 L 85,35 L 80,38 L 78,42 L 75,48 L 70,52 L 68,56 L 65,60 L 62,65 L 58,70 L 56,75 L 55,80 L 53,85 L 50,90 L 48,92 L 45,95 L 42,92 L 40,88 L 42,82 L 44,78 L 45,74 L 42,70 L 38,65 L 35,60 L 32,55 L 30,50 L 28,45 L 25,40 L 28,35 L 30,30 L 32,25 L 35,20 L 38,15 L 42,10 L 45,7 Z"
              fill="none" stroke="#0065FF" strokeWidth="0.5" strokeDasharray="2,2" />
        {/* Major city dots */}
        {Object.values(INDIA_CITIES).slice(0, 12).map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r="0.6" fill="#0065FF" opacity="0.4" />
        ))}
      </svg>

      {/* SVG Route Lines between shipments */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
        <defs>
          <linearGradient id="normalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0065FF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#00D2FF" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="warningGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#FBBF24" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="criticalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EF4444" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#F87171" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {shipments.map((s, i) => {
          const originPos = getCityPosition(s.origin);
          const destPos = getCityPosition(s.destination);
          if (!originPos || !destPos) return null;

          const status = s.current_status || s.status;
          let gradId = "normalGrad";
          if (status === "Warning") gradId = "warningGrad";
          if (status === "Critical Breach" || status === "Critical") gradId = "criticalGrad";

          const midX = (originPos.x + destPos.x) / 2 + (i % 2 === 0 ? 5 : -5);
          const midY = (originPos.y + destPos.y) / 2 - 8;

          return (
            <path
              key={`route-${i}`}
              d={`M ${originPos.x}% ${originPos.y}% Q ${midX}% ${midY}%, ${destPos.x}% ${destPos.y}%`}
              stroke={`url(#${gradId})`}
              strokeWidth="1.5"
              strokeDasharray="4,4"
              fill="none"
              className="animate-pulse"
            />
          );
        })}
      </svg>

      {/* Map Top Bar */}
      <div className="relative z-20 flex justify-between items-center bg-[#0d1b2a]/80 backdrop-blur-md px-md py-sm rounded-lg border border-white/10">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="font-label-md text-xs tracking-wider uppercase text-slate-200">India Cold-Chain Telemetry Mesh</span>
        </div>
        <div className="flex items-center gap-md text-xs font-label-md">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#0065FF]"></span> Normal ({shipments.filter(s=>(s.current_status || s.status)==='In Transit' || (s.current_status || s.status)==='Normal' || (s.current_status || s.status)==='Delivered').length})</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span> Warning ({shipments.filter(s=>(s.current_status || s.status)==='Warning').length})</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Critical ({shipments.filter(s=>(s.current_status || s.status)==='Critical Breach' || (s.current_status || s.status)==='Critical').length})</span>
        </div>
      </div>

      {/* Interactive Map Pin Nodes */}
      <div className="relative z-20 w-full h-full">
        {shipments.map((s, index) => {
          const pos = getShipmentPosition(s, index);
          const isSelected = selectedShipmentId === s.id;
          const status = s.current_status || s.status;
          const category = s.product_category || s.category;
          const currentTemp = s.current_temp !== undefined ? s.current_temp : s.currentTemp;
          const displayId = s.tracking_number || s.id?.substring(0, 12) || s.id;

          let badgeColor = "bg-[#0065FF] border-cyan-400 text-white";
          if (status === "Warning") badgeColor = "bg-amber-500 border-amber-300 text-amber-950 font-bold";
          if (status === "Critical Breach" || status === "Critical") badgeColor = "bg-red-600 border-red-300 text-white font-bold animate-bounce";
          if (status === "Delivered") badgeColor = "bg-emerald-600 border-emerald-400 text-white";

          return (
            <div
              key={s.id}
              onClick={() => onSelectShipment(s.id)}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              className={`group absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 ${
                isSelected ? 'scale-125 z-30' : 'hover:scale-110 z-20'
              }`}
            >
              {isSelected && (
                <div className="absolute -inset-3 rounded-full bg-primary/40 animate-ping pointer-events-none"></div>
              )}

              <div className={`px-2.5 py-1 rounded-lg border text-[11px] shadow-lg flex items-center gap-1.5 backdrop-blur-md ${badgeColor}`}>
                <span className="material-symbols-outlined text-[14px]">
                  {category === 'Vaccines' || category === 'Healthcare' ? 'vaccines' : category === 'Dairy' ? 'local_dairy_store' : 'local_shipping'}
                </span>
                <span>{displayId} ({currentTemp != null ? (currentTemp > 0 ? `+${currentTemp}` : currentTemp) : '—'}°C)</span>
              </div>

              {/* Origin → Destination Tooltip on Hover */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-max opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="bg-slate-900/90 text-[9px] px-1.5 py-0.5 rounded border border-slate-700 text-slate-300">
                  {s.origin || '—'} → {s.destination || '—'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Map Bottom Legend */}
      <div className="relative z-20 bg-[#0d1b2a]/90 backdrop-blur-md px-md py-sm rounded-lg border border-white/10 flex justify-between items-center text-xs">
        <span className="text-slate-400">Click any shipment node to inspect real-time thermal gradient and AI risk vectors.</span>
        <span className="text-primary-fixed-dim font-code font-semibold">Region: India</span>
      </div>
    </div>
  );
}
