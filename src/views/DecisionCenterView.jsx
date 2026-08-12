import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

export default function DecisionCenterView({ onNavigateToDashboard, onNavigateToShipments, onSelectShipment }) {
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'history'
  const [activeShipments, setActiveShipments] = useState([]);
  const [historyShipments, setHistoryShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionSuccessMessage, setActionSuccessMessage] = useState(null);
  const [executingId, setExecutingId] = useState(null);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [activeData, historyData] = await Promise.all([
        apiService.getDecisionCenterShipments(),
        apiService.getDecisionCenterHistory()
      ]);
      setActiveShipments(activeData);
      setHistoryShipments(historyData);
    } catch (err) {
      console.error('Error fetching decision center data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleExecuteAction = async (shipment_id, action) => {
    try {
      setExecutingId(shipment_id);
      const res = await apiService.executeDecisionAction(shipment_id, action, "Operator approved via Decision Center.");
      
      const newStatus = res.updated_shipment?.current_status || 'Updated';
      const newLocation = res.updated_shipment?.current_location || 'Updated Location';
      
      setActionSuccessMessage({
        text: `Action "${action}" executed on ${shipment_id}! Status is now "${newStatus}" (${newLocation}).`,
        shipmentId: shipment_id
      });
      
      await fetchAllData();
      
      // Auto dismiss banner after 10 seconds if not closed manually
      setTimeout(() => setActionSuccessMessage(null), 10000);
    } catch (err) {
      alert("Error executing decision action: " + (err.response?.data?.detail || err.message));
    } finally {
      setExecutingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500 text-[28px]">bolt</span>
              <h1 className="text-2xl font-extrabold text-on-surface">Decision Center (Action Engine)</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold border border-amber-300">
                AI Recovery Protocols
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              Control center for cold chain risk management. Executing actions (Priority Express, Re-route, Liquidate, Nearest Hub) updates the status instantly in the FastAPI backend and moves the record into the audit history & main shipments registry.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {onNavigateToShipments && (
              <button
                onClick={onNavigateToShipments}
                className="px-3.5 py-2 bg-surface border border-outline-variant hover:bg-surface-container text-on-surface text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                View All Shipments
              </button>
            )}
            <button
              onClick={() => onNavigateToDashboard && onNavigateToDashboard()}
              className="px-3.5 py-2 bg-primary-container text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1 hover:opacity-90 cursor-pointer"
            >
              Dashboard KPIs →
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-outline-variant/40 gap-4 text-xs font-bold pt-2">
          <button
            onClick={() => setActiveTab('active')}
            className={`pb-2.5 flex items-center gap-2 border-b-2 cursor-pointer transition-all ${
              activeTab === 'active'
                ? 'border-primary text-primary font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">warning</span>
            Active Action Required ({activeShipments.length})
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 flex items-center gap-2 border-b-2 cursor-pointer transition-all ${
              activeTab === 'history'
                ? 'border-primary text-primary font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">history_toggle_off</span>
            Executed Actions & Audit History ({historyShipments.length})
          </button>
        </div>
      </div>

      {/* Action Execution Success Toast / Notification Banner */}
      {actionSuccessMessage && (
        <div className="p-4 bg-emerald-700 text-white rounded-xl shadow-xl font-bold text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn border border-emerald-500">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px]">task_alt</span>
            <div>
              <p className="font-extrabold text-sm">{actionSuccessMessage.text}</p>
              <p className="text-[11px] font-normal opacity-90">
                The shipment parameters were saved to the backend database and logged in the immutable GxP audit trail.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => {
                setActiveTab('history');
                setActionSuccessMessage(null);
              }}
              className="px-3 py-1.5 bg-white text-emerald-900 rounded-lg text-xs font-black shadow hover:bg-emerald-50 cursor-pointer"
            >
              View in Audit History
            </button>
            {onNavigateToShipments && (
              <button
                onClick={() => {
                  onNavigateToShipments();
                  setActionSuccessMessage(null);
                }}
                className="px-3 py-1.5 bg-emerald-950 text-white rounded-lg text-xs font-bold hover:bg-emerald-900 border border-emerald-600 cursor-pointer"
              >
                Go to Main Shipments
              </button>
            )}
            <button onClick={() => setActionSuccessMessage(null)} className="text-white hover:text-emerald-200 p-1">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Content for Tab 1: Active Interventions Required */}
      {activeTab === 'active' && (
        <>
          {loading ? (
            <div className="py-12 text-center text-xs font-semibold text-slate-500">
              Fetching Action-Required Cargo from FastAPI Backend...
            </div>
          ) : activeShipments.length === 0 ? (
            <div className="p-8 bg-surface-container-lowest border border-outline-variant/60 rounded-2xl text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[28px]">task_alt</span>
              </div>
              <h3 className="text-base font-bold text-on-surface">All Active Shipments Nominal</h3>
              <p className="text-xs text-on-surface-variant">There are currently no active thermal breach alerts requiring intervention.</p>
              <button
                onClick={() => setActiveTab('history')}
                className="px-4 py-2 bg-surface border border-outline-variant rounded-xl text-xs font-bold text-primary hover:bg-surface-container cursor-pointer"
              >
                View Executed Actions History →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {activeShipments.map((s) => (
                <div key={s.id} className="glass-card bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 shadow-md space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-outline-variant/40 gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-primary font-mono">{s.id}</span>
                        <span className="font-bold text-on-surface text-sm">{s.product_name}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.current_status === 'Warning' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-red-100 text-red-900 border border-red-300 animate-pulse'
                        }`}>
                          {s.current_status}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-0.5">{s.origin} → {s.destination} | Current Location: {s.current_location}</p>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-label-md">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Health Score</span>
                        <span className="font-extrabold text-emerald-700 text-base">{s.health_score} / 100</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Spoilage Risk</span>
                        <span className="font-extrabold text-red-600 text-base">{s.spoilage_risk}%</span>
                      </div>
                    </div>
                  </div>

                  {/* AI Recommendation Banner */}
                  <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/30 text-xs">
                    <span className="font-bold text-amber-900 block mb-0.5">AI Prescriptive Recommendation:</span>
                    <span className="text-on-surface font-semibold">{s.latest_recommendation}</span>
                  </div>

                  {/* Decision Action Buttons */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Execute Action (Calls FastAPI Backend API):</p>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      <button
                        onClick={() => handleExecuteAction(s.id, "Continue Delivery")}
                        disabled={executingId === s.id}
                        className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                        Continue
                      </button>

                      <button
                        onClick={() => handleExecuteAction(s.id, "Re-route")}
                        disabled={executingId === s.id}
                        className="py-2.5 px-3 bg-[#0065FF] hover:bg-[#0052cc] text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">alt_route</span>
                        Re-route
                      </button>

                      <button
                        onClick={() => handleExecuteAction(s.id, "Nearest Warehouse")}
                        disabled={executingId === s.id}
                        className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">warehouse</span>
                        Nearest Hub
                      </button>

                      <button
                        onClick={() => handleExecuteAction(s.id, "Priority Delivery")}
                        disabled={executingId === s.id}
                        className="py-2.5 px-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">speed</span>
                        Priority Express
                      </button>

                      <button
                        onClick={() => handleExecuteAction(s.id, "Secondary Marketplace")}
                        disabled={executingId === s.id}
                        className="py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1 cursor-pointer col-span-2 sm:col-span-1"
                      >
                        <span className="material-symbols-outlined text-[16px]">storefront</span>
                        Liquidate
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Content for Tab 2: Executed Actions & Audit Log */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/60 text-xs text-on-surface-variant flex justify-between items-center">
            <span>Showing all resolved cold chain decision events saved to FastAPI backend repository.</span>
            {onNavigateToShipments && (
              <button
                onClick={onNavigateToShipments}
                className="font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                Go to Main Shipments List →
              </button>
            )}
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs font-semibold text-slate-500">
              Loading executed actions history...
            </div>
          ) : historyShipments.length === 0 ? (
            <div className="p-8 bg-surface-container-lowest border border-outline-variant/60 rounded-2xl text-center space-y-2">
              <span className="material-symbols-outlined text-slate-400 text-[32px]">manage_history</span>
              <p className="text-xs text-slate-500">No executed recovery actions found in audit history yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {historyShipments.map((s) => (
                <div key={s.id} className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/60 shadow-sm space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-outline-variant/30">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-primary font-mono text-base">{s.id}</span>
                        <span className="font-bold text-on-surface text-xs">{s.product_name}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          s.current_status === 'Re-routed' ? 'bg-blue-100 text-blue-900 border-blue-300' :
                          s.current_status === 'Liquidated' ? 'bg-purple-100 text-purple-900 border-purple-300' :
                          'bg-emerald-100 text-emerald-900 border-emerald-300'
                        }`}>
                          {s.current_status}
                        </span>
                      </div>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">
                        Location: <span className="font-bold text-slate-800">{s.current_location}</span> | Value: ${s.shipment_value.toLocaleString()}
                      </p>
                    </div>

                    {onSelectShipment && (
                      <button
                        onClick={() => onSelectShipment(s.id)}
                        className="px-3 py-1.5 bg-surface border border-outline-variant hover:bg-surface-container text-on-surface text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1"
                      >
                        View Shipment Telemetry
                      </button>
                    )}
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                    <span className="font-bold text-slate-700 block mb-0.5">Audit Log & Backend Resolution:</span>
                    <p className="text-slate-800 font-medium">{s.latest_recommendation}</p>
                  </div>

                  {s.status_timeline && s.status_timeline.length > 0 && (
                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      <span>Last Updated: {s.status_timeline[s.status_timeline.length - 1].timestamp} ({s.status_timeline[s.status_timeline.length - 1].note})</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
