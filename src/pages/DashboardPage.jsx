import React, { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid } from 'recharts';
import InteractiveMap from '../components/InteractiveMap';
import { INITIAL_SHIPMENTS } from '../data/shipmentsData';

export default function DashboardPage({ onOpenDemo }) {
  const [shipments, setShipments] = useState(INITIAL_SHIPMENTS);
  const [selectedId, setSelectedId] = useState("CRY-9104"); // Default selected shipment (warning status for demo)
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [recoveryLog, setRecoveryLog] = useState(null);

  const selectedShipment = shipments.find(s => s.id === selectedId) || shipments[0];

  // Filtering shipments
  const filteredShipments = shipments.filter(s => {
    const matchesSearch = s.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.cargo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.carrier.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || s.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Simulated Automated Recovery Action
  const handleTriggerRecovery = () => {
    setShipments(prev => prev.map(s => {
      if (s.id === selectedId) {
        return {
          ...s,
          status: "Normal",
          currentTemp: (s.targetTempMin + s.targetTempMax) / 2,
          spoilageRisk: 1.1,
          freshnessScore: 98.6,
          recoveryAction: "RECOVERY PROTOCOL EXECUTED: Cold store reroute confirmed. Temperature stabilized at setpoint.",
          tempHistory: s.tempHistory.map(h => ({
            ...h,
            temp: (s.targetTempMin + s.targetTempMax) / 2
          }))
        };
      }
      return s;
    }));

    setRecoveryLog(`[RECOVERY DISPATCHED] Emergency compressor override signal sent to unit #${selectedId}. Thermal equilibrium restored.`);
    setTimeout(() => setRecoveryLog(null), 5000);
  };

  return (
    <div class="space-y-md">
      {/* Top Header & KPI Summary Bar */}
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-md bg-surface-container-lowest p-lg rounded-2xl border border-outline-variant/50 shadow-sm">
        <div>
          <h1 class="text-headline-lg font-extrabold text-on-surface flex items-center gap-3">
            Global Fleet Intelligence Console
            <span class="text-xs font-label-md px-2.5 py-1 rounded-full bg-blue-100 text-[#0065FF] border border-blue-200">
              Live IoT Mesh
            </span>
          </h1>
          <p class="text-body-md text-on-surface-variant text-xs mt-1">Real-time thermal degradation telemetry & automated risk mitigation.</p>
        </div>

        <div class="flex flex-wrap items-center gap-md">
          <div class="px-md py-2 bg-surface rounded-xl border border-outline-variant/40 text-center">
            <p class="text-[11px] font-label-md text-on-surface-variant">Active Monitored</p>
            <p class="text-base font-bold text-on-surface">{shipments.length} Cargo Fleets</p>
          </div>
          <div class="px-md py-2 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
            <p class="text-[11px] font-label-md text-emerald-800">Normal Cargo</p>
            <p class="text-base font-bold text-emerald-700">{shipments.filter(s => s.status === 'Normal').length}</p>
          </div>
          <div class="px-md py-2 bg-amber-50 rounded-xl border border-amber-200 text-center">
            <p class="text-[11px] font-label-md text-amber-800">Warnings</p>
            <p class="text-base font-bold text-amber-700">{shipments.filter(s => s.status === 'Warning').length}</p>
          </div>
          <div class="px-md py-2 bg-red-50 rounded-xl border border-red-200 text-center">
            <p class="text-[11px] font-label-md text-red-800">Critical Breaches</p>
            <p class="text-base font-bold text-red-600">{shipments.filter(s => s.status === 'Critical').length}</p>
          </div>
        </div>
      </div>

      {/* Recovery Execution Success Banner */}
      {recoveryLog && (
        <div class="bg-emerald-600 text-white p-md rounded-xl shadow-lg flex items-center justify-between animate-fadeIn">
          <div class="flex items-center gap-3">
            <span class="material-symbols-outlined text-[24px]">published_with_changes</span>
            <span class="font-body-md text-sm font-semibold">{recoveryLog}</span>
          </div>
          <button onClick={() => setRecoveryLog(null)} class="text-white hover:text-emerald-200">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
      )}

      {/* Interactive Map Section */}
      <InteractiveMap
        shipments={shipments}
        selectedShipmentId={selectedId}
        onSelectShipment={(id) => setSelectedId(id)}
      />

      {/* Main Console Split View: Left List + Right Inspector */}
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-lg">
        {/* Left Column: Shipment List & Filters */}
        <div class="lg:col-span-5 bg-surface-container-lowest rounded-2xl border border-outline-variant/60 p-md space-y-md shadow-sm">
          {/* Search & Filters */}
          <div class="space-y-sm">
            <div class="relative">
              <span class="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[18px]">search</span>
              <input
                type="text"
                placeholder="Search shipment ID, cargo, carrier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                class="w-full pl-9 pr-md py-2 rounded-lg border border-outline-variant bg-surface text-xs focus:outline-none focus:border-primary"
              />
            </div>

            <div class="flex gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                class="w-1/2 px-2 py-1.5 rounded-lg border border-outline-variant bg-surface text-xs text-on-surface"
              >
                <option value="All">All Categories</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Dairy">Dairy</option>
                <option value="Fresh Produce">Fresh Produce</option>
                <option value="Frozen Seafood">Frozen Seafood</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                class="w-1/2 px-2 py-1.5 rounded-lg border border-outline-variant bg-surface text-xs text-on-surface"
              >
                <option value="All">All Statuses</option>
                <option value="Normal">Normal Only</option>
                <option value="Warning">Warning Only</option>
                <option value="Critical">Critical Only</option>
              </select>
            </div>
          </div>

          {/* List of Shipments */}
          <div class="space-y-2 max-h-[560px] overflow-y-auto pr-1">
            {filteredShipments.map((s) => {
              const isSelected = s.id === selectedId;
              let statusBadge = "bg-emerald-100 text-emerald-800 border-emerald-300";
              if (s.status === "Warning") statusBadge = "bg-amber-100 text-amber-900 border-amber-300 font-bold";
              if (s.status === "Critical") statusBadge = "bg-red-100 text-red-900 border-red-300 font-bold animate-pulse";

              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  class={`p-md rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-primary-container/10 border-primary shadow-md'
                      : 'bg-surface hover:bg-surface-container-low border-outline-variant/40'
                  }`}
                >
                  <div class="flex justify-between items-start mb-1">
                    <div>
                      <span class="font-bold text-on-surface text-sm">{s.id}</span>
                      <span class="text-xs text-on-surface-variant ml-2 font-mono">({s.carrier})</span>
                    </div>
                    <span class={`text-[11px] px-2 py-0.5 rounded-full border ${statusBadge}`}>
                      {s.status}
                    </span>
                  </div>

                  <p class="text-xs font-body-md text-on-surface font-semibold truncate">{s.cargo}</p>

                  <div class="flex justify-between items-center text-xs mt-2 pt-2 border-t border-outline-variant/30">
                    <span class="text-on-surface-variant flex items-center gap-1">
                      <span class="material-symbols-outlined text-[16px]">thermostat</span>
                      Temp: <strong class="text-on-surface">{s.currentTemp > 0 ? `+${s.currentTemp}` : s.currentTemp}°C</strong>
                    </span>
                    <span class="text-on-surface-variant flex items-center gap-1">
                      <span class="material-symbols-outlined text-[16px]">warning</span>
                      Risk: <strong class={s.spoilageRisk > 30 ? 'text-red-600 font-bold' : 'text-on-surface'}>{s.spoilageRisk}%</strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Telemetry Inspector */}
        <div class="lg:col-span-7 bg-surface-container-lowest rounded-2xl border border-outline-variant/60 p-lg space-y-md shadow-sm">
          {/* Header of Inspector */}
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-md border-b border-outline-variant/40 gap-sm">
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-headline-md font-extrabold text-on-surface">{selectedShipment.id}</h3>
                <span class="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 font-mono text-slate-700">
                  {selectedShipment.origin} → {selectedShipment.destination}
                </span>
              </div>
              <p class="text-xs text-on-surface-variant font-body-md mt-0.5">{selectedShipment.cargo}</p>
            </div>

            <div class="flex items-center gap-2">
              <span class="text-xs font-label-md text-on-surface-variant">Freshness Index:</span>
              <span class="text-lg font-extrabold text-primary">{selectedShipment.freshnessScore}%</span>
            </div>
          </div>

          {/* Temperature History Chart */}
          <div class="space-y-xs">
            <div class="flex justify-between items-center text-xs font-label-md text-on-surface-variant">
              <span>Real-Time Thermal Profile (°C) vs Operating Range</span>
              <span class="text-primary font-bold">Target: [{selectedShipment.targetTempMin}°C to {selectedShipment.targetTempMax}°C]</span>
            </div>

            <div class="h-56 w-full bg-surface rounded-xl p-sm border border-outline-variant/30 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={selectedShipment.tempHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <ReferenceLine y={selectedShipment.targetTempMin} stroke="#0065FF" strokeDasharray="4 4" label={{ value: 'Min Limit', fill: '#0065FF', fontSize: 10 }} />
                  <ReferenceLine y={selectedShipment.targetTempMax} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Max Threshold', fill: '#ef4444', fontSize: 10 }} />
                  <Line type="monotone" dataKey="temp" stroke="#0050cd" strokeWidth={3} dot={{ r: 4, fill: '#0050cd' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Vital Telemetry Sensors Grid */}
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-sm">
            <div class="bg-surface p-sm rounded-xl border border-outline-variant/30 text-center">
              <span class="material-symbols-outlined text-secondary text-[20px]">thermostat</span>
              <p class="text-[10px] font-label-md text-on-surface-variant">Current Temp</p>
              <p class="text-sm font-bold text-on-surface">{selectedShipment.currentTemp > 0 ? `+${selectedShipment.currentTemp}` : selectedShipment.currentTemp}°C</p>
            </div>

            <div class="bg-surface p-sm rounded-xl border border-outline-variant/30 text-center">
              <span class="material-symbols-outlined text-secondary text-[20px]">water_drop</span>
              <p class="text-[10px] font-label-md text-on-surface-variant">Humidity</p>
              <p class="text-sm font-bold text-on-surface">{selectedShipment.humidity}%</p>
            </div>

            <div class="bg-surface p-sm rounded-xl border border-outline-variant/30 text-center">
              <span class="material-symbols-outlined text-secondary text-[20px]">battery_charging_full</span>
              <p class="text-[10px] font-label-md text-on-surface-variant">Sensor Battery</p>
              <p class="text-sm font-bold text-on-surface">{selectedShipment.battery}%</p>
            </div>

            <div class="bg-surface p-sm rounded-xl border border-outline-variant/30 text-center">
              <span class="material-symbols-outlined text-secondary text-[20px]">sensor_door</span>
              <p class="text-[10px] font-label-md text-on-surface-variant">Door Openings</p>
              <p class="text-sm font-bold text-on-surface">{selectedShipment.doorEvents} Events</p>
            </div>
          </div>

          {/* Spoilage Risk Bar & AI Recommendation */}
          <div class="space-y-sm bg-surface-container rounded-xl p-md border border-outline-variant/40">
            <div class="flex justify-between items-center text-xs font-label-md">
              <span class="text-on-surface font-bold flex items-center gap-1">
                <span class="material-symbols-outlined text-primary text-[18px]">psychology</span>
                AI Spoilage Risk Forecast
              </span>
              <span class={`font-extrabold ${selectedShipment.spoilageRisk > 30 ? 'text-red-600' : 'text-emerald-700'}`}>
                {selectedShipment.spoilageRisk}% Risk
              </span>
            </div>

            <div class="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
              <div
                class={`h-full transition-all duration-500 ${
                  selectedShipment.spoilageRisk > 50
                    ? 'bg-red-600'
                    : selectedShipment.spoilageRisk > 20
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${selectedShipment.spoilageRisk}%` }}
              ></div>
            </div>

            <div class="pt-sm space-y-sm">
              <p class="text-xs font-body-md text-on-surface-variant">
                <strong class="text-on-surface">Recommended Protocol:</strong> {selectedShipment.recoveryAction}
              </p>

              {selectedShipment.status !== 'Normal' && (
                <button
                  onClick={handleTriggerRecovery}
                  class="w-full py-2.5 bg-primary hover:bg-primary-container text-white font-label-md font-bold text-xs rounded-lg shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <span class="material-symbols-outlined text-[18px]">published_with_changes</span>
                  Simulate Automated AI Recovery Protocol
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
