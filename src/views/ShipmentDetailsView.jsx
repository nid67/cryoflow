import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid } from 'recharts';
import { apiService } from '../services/api';
import { supabase } from '../services/supabaseClient';

export default function ShipmentDetailsView({ shipmentId, onBack, onNavigateToPrediction, onNavigateToDecision }) {
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDetails = async (isInitial = true) => {
    try {
      if (isInitial) setLoading(true);
      const data = await apiService.getShipmentDetails(shipmentId);
      setShipment(data);
    } catch (err) {
      console.error(err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    if (shipmentId) {
      fetchDetails(true);

      const channel = supabase
        .channel(`telemetry_logs_changes_${shipmentId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'telemetry_logs', filter: `shipment_id=eq.${shipmentId}` },
          (payload) => {
            console.log('New telemetry for shipment:', payload);
            fetchDetails(false); // Update without showing loading state
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [shipmentId]);

  if (loading || !shipment) {
    return (
      <div className="py-12 text-center text-xs font-semibold text-slate-500">
        Loading FedEx-Style Shipment Telemetry from Backend API...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation Top Bar */}
      <div className="flex justify-between items-center bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/60 shadow-sm">
        <button onClick={onBack} className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-primary cursor-pointer">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to Shipments List
        </button>

        <div className="flex gap-2">
          <button
            onClick={() => onNavigateToPrediction(shipment.id)}
            className="px-3 py-1.5 bg-[#0065FF] hover:bg-[#0052cc] text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">psychology</span>
            Run AI Prediction
          </button>
          {shipment.requires_decision && (
            <button
              onClick={() => onNavigateToDecision(shipment.id)}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">bolt</span>
              Decision Center
            </button>
          )}
        </div>
      </div>

      {/* FedEx / DHL Tracking Header Banner */}
      <div className="bg-[#071328] text-white p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-4 gap-2">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black tracking-wider text-cyan-400 font-mono">{shipment.id}</span>
              <span className={`px-3 py-0.5 rounded-full text-xs font-bold ${
                shipment.current_status === 'Warning' ? 'bg-amber-500 text-slate-950' :
                shipment.current_status === 'Critical Breach' ? 'bg-red-600 text-white animate-bounce' : 'bg-emerald-500 text-white'
              }`}>
                {shipment.current_status}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-semibold mt-1">{shipment.product_name} ({shipment.product_category})</p>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-[10px] text-slate-400 uppercase font-bold">Estimated Arrival</p>
            <p className="text-sm font-bold text-slate-100">{shipment.estimated_arrival}</p>
          </div>
        </div>

        {/* Route Progress Tracker */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-2">
          <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Origin</span>
            <span className="font-bold text-slate-100 text-sm">{shipment.origin}</span>
          </div>

          <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Current Location</span>
            <span className="font-bold text-cyan-400 text-sm">{shipment.current_location}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Vehicle: {shipment.vehicle_number}</span>
          </div>

          <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Destination</span>
            <span className="font-bold text-slate-100 text-sm">{shipment.destination}</span>
          </div>
        </div>
      </div>

      {/* Vital Metrics Grid Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/60 shadow-sm text-center">
          <p className="text-[10px] font-label-md text-on-surface-variant uppercase">Current Temp</p>
          <p className="text-xl font-extrabold text-primary mt-1">
            {shipment.current_temp > 0 ? `+${shipment.current_temp}` : shipment.current_temp}°C
          </p>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/60 shadow-sm text-center">
          <p className="text-[10px] font-label-md text-on-surface-variant uppercase">Spoilage Risk</p>
          <p className={`text-xl font-extrabold mt-1 ${shipment.spoilage_risk > 30 ? 'text-red-600' : 'text-emerald-600'}`}>
            {shipment.spoilage_risk}%
          </p>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/60 shadow-sm text-center">
          <p className="text-[10px] font-label-md text-on-surface-variant uppercase">Health Score</p>
          <p className="text-xl font-extrabold text-emerald-700 mt-1">{shipment.health_score} / 100</p>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/60 shadow-sm text-center">
          <p className="text-[10px] font-label-md text-on-surface-variant uppercase">Est. Shelf Life</p>
          <p className="text-xl font-extrabold text-on-surface mt-1">{shipment.remaining_shelf_life_days} Days</p>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/60 shadow-sm text-center col-span-2 md:col-span-1">
          <p className="text-[10px] font-label-md text-on-surface-variant uppercase">Financial Loss Risk</p>
          <p className="text-xl font-extrabold text-amber-700 mt-1">${shipment.estimated_financial_loss.toLocaleString()}</p>
        </div>
      </div>

      {/* Temperature Timeline Chart */}
      <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/60 shadow-sm space-y-2">
        <div className="flex justify-between items-center text-xs">
          <h3 className="font-bold text-on-surface uppercase tracking-wider">Continuous Thermal Degradation Profile</h3>
          <span className="text-primary font-bold font-mono">Sensory Frequency: 10 Seconds</span>
        </div>

        <div className="h-56 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={shipment.temp_history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
              <Line type="monotone" dataKey="temp" stroke="#0065FF" strokeWidth={3} dot={{ r: 4, fill: '#0065FF' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Split View: Map Placeholder & Status Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Map Vector Placeholder */}
        <div className="md:col-span-7 bg-[#0a192f] rounded-2xl p-6 border border-slate-800 text-white relative min-h-[280px] flex flex-col justify-between overflow-hidden shadow-inner">
          <div 
            className="absolute inset-0 opacity-15 bg-cover bg-center pointer-events-none"
            style={{ backgroundImage: `url('/assets/cold_chain_hero.png')` }}
          ></div>

          <div className="relative z-10 flex justify-between items-center bg-slate-900/80 p-3 rounded-xl border border-slate-700">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
              Live GPS Telemetry Vector
            </span>
            <span className="text-xs font-mono text-slate-300">GPS: 41.8781° N, 87.6298° W</span>
          </div>

          <div className="relative z-10 text-center py-8">
            <span className="material-symbols-outlined text-[48px] text-cyan-400 mb-2">map</span>
            <p className="text-sm font-bold text-slate-200">Interactive Cargo Route Trajectory</p>
            <p className="text-xs text-slate-400 mt-1">Vehicle {shipment.vehicle_number} transmitting telemetry stream via Satellite 5G IoT.</p>
          </div>
        </div>

        {/* Status Timeline History */}
        <div className="md:col-span-5 bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/60 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">Status History Timeline</h3>
          <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 pl-6">
            {shipment.status_timeline.map((st, i) => (
              <div key={i} className="relative text-xs space-y-0.5">
                <div className="absolute -left-[25px] top-1 w-3 h-3 rounded-full bg-primary border-2 border-white shadow"></div>
                <p className="font-bold text-on-surface">{st.status} - <span className="text-slate-500 font-normal">{st.location}</span></p>
                <p className="text-[11px] text-on-surface-variant">{st.note}</p>
                <p className="text-[10px] text-slate-400 font-mono">{st.timestamp}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
