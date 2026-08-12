import React from 'react';

export default function InteractiveMap({ shipments, selectedShipmentId, onSelectShipment }) {
  const nodePositions = {
    "CRY-8842": { x: 28, y: 35, label: "FRA → BOS" },
    "CRY-9104": { x: 48, y: 48, label: "MSN → CHI" },
    "CRY-7719": { x: 24, y: 32, label: "BSL → LHR" },
    "CRY-6301": { x: 62, y: 55, label: "SNS → DEN" },
    "CRY-5049": { x: 55, y: 62, label: "IND → DFW" },
    "CRY-4190": { x: 75, y: 28, label: "ANC → SEA" }
  };

  return (
    <div className="relative w-full h-[420px] bg-[#071328] rounded-xl overflow-hidden border border-outline-variant/30 shadow-inner flex flex-col justify-between p-lg text-white">
      {/* Background Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none bg-cover bg-center"
        style={{ backgroundImage: `url('/assets/cold_chain_hero.png')` }}
      ></div>

      {/* SVG Vector Connections and Nodes */}
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

        <path d="M 28% 35% Q 38% 30%, 48% 48%" stroke="url(#normalGrad)" strokeWidth="2" strokeDasharray="4,4" fill="none" className="animate-pulse" />
        <path d="M 24% 32% Q 40% 40%, 62% 55%" stroke="url(#criticalGrad)" strokeWidth="2" strokeDasharray="6,6" fill="none" />
        <path d="M 55% 62% Q 65% 45%, 75% 28%" stroke="url(#normalGrad)" strokeWidth="2" fill="none" />
      </svg>

      {/* Map Top Bar */}
      <div className="relative z-20 flex justify-between items-center bg-[#0d1b2a]/80 backdrop-blur-md px-md py-sm rounded-lg border border-white/10">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="font-label-md text-xs tracking-wider uppercase text-slate-200">Global Cold Telemetry Mesh</span>
        </div>
        <div className="flex items-center gap-md text-xs font-label-md">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#0065FF]"></span> Normal ({shipments.filter(s=>s.status==='Normal').length})</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span> Warning ({shipments.filter(s=>s.status==='Warning').length})</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Critical ({shipments.filter(s=>s.status==='Critical').length})</span>
        </div>
      </div>

      {/* Interactive Map Pin Nodes */}
      <div className="relative z-20 w-full h-full">
        {shipments.map((s) => {
          const pos = nodePositions[s.id] || { x: 50, y: 50, label: s.id };
          const isSelected = selectedShipmentId === s.id;

          let badgeColor = "bg-[#0065FF] border-cyan-400 text-white";
          if (s.status === "Warning") badgeColor = "bg-amber-500 border-amber-300 text-amber-950 font-bold";
          if (s.status === "Critical") badgeColor = "bg-red-600 border-red-300 text-white font-bold animate-bounce";

          return (
            <div
              key={s.id}
              onClick={() => onSelectShipment(s.id)}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 ${
                isSelected ? 'scale-125 z-30' : 'hover:scale-110 z-20'
              }`}
            >
              {isSelected && (
                <div className="absolute -inset-3 rounded-full bg-primary/40 animate-ping pointer-events-none"></div>
              )}

              <div className={`px-2.5 py-1 rounded-lg border text-[11px] shadow-lg flex items-center gap-1.5 backdrop-blur-md ${badgeColor}`}>
                <span className="material-symbols-outlined text-[14px]">
                  {s.category === 'Healthcare' ? 'vaccines' : s.category === 'Dairy' ? 'local_dairy_store' : 'local_shipping'}
                </span>
                <span>{s.id} ({s.currentTemp > 0 ? `+${s.currentTemp}` : s.currentTemp}°C)</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Map Bottom Legend / Telemetry Bar */}
      <div className="relative z-20 bg-[#0d1b2a]/90 backdrop-blur-md px-md py-sm rounded-lg border border-white/10 flex justify-between items-center text-xs">
        <span className="text-slate-400">Click any shipment node on the map to inspect real-time thermal gradient and AI risk vectors.</span>
        <span className="text-primary-fixed-dim font-code font-semibold">Active Ingestion Rate: 1.2 GB/sec</span>
      </div>
    </div>
  );
}
