import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { apiService } from '../services/api';

export default function DecisionCenterView({ onNavigateToDashboard, onNavigateToShipments, onSelectShipment }) {
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'history'
  const [activeShipments, setActiveShipments] = useState([]);
  const [historyShipments, setHistoryShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionSuccessMessage, setActionSuccessMessage] = useState(null);
  const [executingId, setExecutingId] = useState(null);

  // Modal State for Action Explanation & Confirmation
  const [pendingModal, setPendingModal] = useState(null); // { shipment, actionKey, notes }
  const [operatorNotes, setOperatorNotes] = useState('');

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

  const openActionModal = (shipment, actionKey) => {
    setOperatorNotes('');
    setPendingModal({ shipment, actionKey });
  };

  const closeActionModal = () => {
    setPendingModal(null);
    setOperatorNotes('');
  };

  const getActionDetails = (shipment, actionKey) => {
    if (!shipment) return {};
    const id = shipment.id;
    const product = shipment.product_name || 'Cargo';
    const loc = shipment.current_location || shipment.origin || 'Current Checkpoint';
    const dest = shipment.destination || 'Destination Hub';
    const origin = shipment.origin || 'Origin';
    const value = shipment.shipment_value || 0;
    const recoveredVal = Math.round(value * 0.75).toLocaleString();

    let title = "";
    let icon = "";
    let iconBg = "";
    let currentLocText = "";
    let targetLocText = "";
    let explanation = "";
    let expectedOutcome = "";
    let timeOrCostImpact = "";

    if (actionKey === "Continue Delivery" || actionKey === "Continue") {
      title = "Continue Standard Delivery Route";
      icon = "local_shipping";
      iconBg = "bg-emerald-600";
      currentLocText = `${loc} (En route ${origin} → ${dest})`;
      targetLocText = `${dest} (Standard Route)`;
      explanation = `Shipment ${id} (${product}) is currently at ${loc}. Choosing "Continue Route" maintains the scheduled delivery path to ${dest} under active telemetry monitoring. The driver will be instructed to inspect refrigeration setpoints and door seals at the next checkpoint.`;
      expectedOutcome = "Standard delivery path maintained; driver notified to verify door seals and setpoints.";
      timeOrCostImpact = "No route detour; scheduled arrival ETA maintained.";
    } else if (actionKey === "Re-route" || actionKey === "Re-route Cargo") {
      title = "Re-route via Alternative Express Corridor";
      icon = "alt_route";
      iconBg = "bg-[#0065FF]";
      currentLocText = `${loc} (En route ${origin} → ${dest})`;
      targetLocText = `Alternative Express Bypass Corridor → ${dest}`;
      explanation = `Shipment ${id} (${product}) is currently at ${loc}. Re-routing diverts the vehicle onto an alternative express highway corridor to ${dest}, bypassing heavy traffic bottlenecks and road delays to stabilize temperature and reduce remaining transit time by ~3.5 hours.`;
      expectedOutcome = "Traffic congestion bypassed; temperature stabilized at target setpoint.";
      timeOrCostImpact = "Saves ~3.5 hours transit time; reduces spoilage risk to < 3%.";
    } else if (actionKey === "Nearest Warehouse" || actionKey === "Nearest Hub") {
      let hubName = "Bangalore Biologics & Cold Hub (WH-BLR-03)";
      let hubLoc = "Bangalore";
      const locLower = (loc + " " + dest).toLowerCase();
      if (locLower.includes("mumbai") || locLower.includes("surat") || locLower.includes("ahmedabad")) {
        hubName = "Mumbai JNPT Cold Logistics (WH-BOM-02)";
        hubLoc = "Mumbai";
      } else if (locLower.includes("delhi") || locLower.includes("patna") || locLower.includes("ambala") || locLower.includes("chandigarh")) {
        hubName = "Delhi Air Cargo Cold Hub (WH-DEL-01)";
        hubLoc = "Delhi";
      } else if (locLower.includes("chennai") || locLower.includes("kochi")) {
        hubName = "Chennai Port Freezer Terminal (WH-MAA-04)";
        hubLoc = "Chennai";
      }

      title = "Emergency Diversion to Nearest Cold Hub";
      icon = "warehouse";
      iconBg = "bg-indigo-600";
      currentLocText = `${loc}`;
      targetLocText = `${hubName} (${hubLoc})`;
      explanation = `Shipment ${id} (${product}) is currently at ${loc}. Initiating emergency cold storage diversion to the nearest available facility: ${hubName}. The truck will dock within ~35 minutes for immediate pallet offloading into climate-controlled storage.`;
      expectedOutcome = "Immediate offload into climate-controlled cold storage vault.";
      timeOrCostImpact = "Docking ETA ~35 minutes; 100% cargo thermal safety guaranteed.";
    } else if (actionKey === "Priority Delivery" || actionKey === "Priority Express") {
      title = "Engage Priority Express Protocol";
      icon = "speed";
      iconBg = "bg-purple-600";
      currentLocText = `${loc}`;
      targetLocText = `${dest} (Priority Express Corridor)`;
      explanation = `Shipment ${id} (${product}) is currently at ${loc}. Priority Express Protocol boosts vehicle cooling compressor output to maximum power (+100% cooling) and assigns express toll lanes to accelerate delivery to ${dest}, cutting arrival ETA by 4 hours.`;
      expectedOutcome = "Maximum cooling boost engaged + express speed corridor assigned.";
      timeOrCostImpact = "Cuts transit time by 4 hours; restores thermal equilibrium.";
    } else if (actionKey === "Secondary Marketplace" || actionKey === "Liquidate") {
      title = "Liquidate to Local Secondary Market";
      icon = "storefront";
      iconBg = "bg-amber-600";
      currentLocText = `${loc}`;
      targetLocText = `Local Secondary Grocery Exchange (${loc})`;
      explanation = `Shipment ${id} (${product}) is currently at ${loc}. Liquidating cargo to a local secondary grocery distributor in ${loc} before thermal degradation causes total spoilage. Prevents a total write-off and recovers estimated $${recoveredVal} (75% of shipment value).`;
      expectedOutcome = "Immediate local secondary sale; prevents 100% product loss.";
      timeOrCostImpact = `Recovers ~$${recoveredVal} of cargo financial value.`;
    }

    return { title, icon, iconBg, currentLocText, targetLocText, explanation, expectedOutcome, timeOrCostImpact };
  };

  const handleConfirmAction = async () => {
    if (!pendingModal) return;
    const { shipment, actionKey } = pendingModal;
    try {
      setExecutingId(shipment.id);
      const details = getActionDetails(shipment, actionKey);
      const noteToSend = operatorNotes ? `${details.explanation} (Operator note: ${operatorNotes})` : details.explanation;

      const res = await apiService.executeDecisionAction(shipment.id, actionKey, noteToSend);
      
      const newStatus = res.updated_shipment?.current_status || 'Updated';
      const newLocation = res.updated_shipment?.current_location || 'Updated Location';
      
      setActionSuccessMessage({
        text: `Action "${details.title}" executed on ${shipment.id}! Status is now "${newStatus}" (${newLocation}).`,
        explanation: details.explanation,
        shipmentId: shipment.id
      });
      
      closeActionModal();
      await fetchAllData();
      
      setTimeout(() => setActionSuccessMessage(null), 12000);
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
              <h1 className="text-2xl font-extrabold text-on-surface">Decision Center</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold border border-amber-300">
                Emergency Actions
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              Review at-risk shipments and trigger recovery actions such as re-routing, priority shipping, or warehouse diversion.
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
            Action Required ({activeShipments.length})
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
            Action History ({historyShipments.length})
          </button>
        </div>
      </div>

      {/* Action Execution Success Toast / Notification Banner */}
      {actionSuccessMessage && (
        <div className="p-5 bg-emerald-800 text-white rounded-2xl shadow-xl font-bold text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn border border-emerald-600">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[28px] text-emerald-300 shrink-0 mt-0.5">task_alt</span>
            <div className="space-y-1">
              <p className="font-extrabold text-sm text-white">{actionSuccessMessage.text}</p>
              {actionSuccessMessage.explanation && (
                <p className="text-xs font-normal text-emerald-100 leading-relaxed bg-emerald-900/60 p-2.5 rounded-lg border border-emerald-700">
                  {actionSuccessMessage.explanation}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
            <button
              onClick={() => {
                setActiveTab('history');
                setActionSuccessMessage(null);
              }}
              className="px-3.5 py-2 bg-white text-emerald-950 rounded-xl text-xs font-black shadow hover:bg-emerald-50 cursor-pointer"
            >
              View in Audit History
            </button>
            <button onClick={() => setActionSuccessMessage(null)} className="text-white hover:text-emerald-200 p-1">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Content for Tab 1: Active Interventions Required */}
      {activeTab === 'active' && (
        <>
          {loading ? (
            <div className="py-12 text-center text-xs font-semibold text-slate-500">
              Fetching Action-Required Cargo from Backend Server...
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
                View Action History →
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
                      <p className="text-xs text-on-surface-variant mt-0.5">{s.origin} → {s.destination} | Current Location: <strong className="text-on-surface">{s.current_location}</strong></p>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-label-md">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Estimated Loss</span>
                        <span className="font-extrabold text-amber-600 text-base">${s.estimated_financial_loss?.toLocaleString() || 0}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Spoilage Risk</span>
                        <span className="font-extrabold text-red-600 text-base">{s.spoilage_risk}%</span>
                      </div>
                    </div>
                  </div>

                  {/* AI Recommendation Banner */}
                  <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/30 text-xs space-y-1.5">
                    <span className="font-bold text-amber-900 block">Recommendation Reason:</span>
                    <span className="text-on-surface block text-[11px]">Risk thresholds exceeded due to thermal degradation. Action required to mitigate financial and product loss.</span>
                    <span className="font-bold text-amber-900 block pt-1">AI Prescriptive Recommendation:</span>
                    <span className="text-on-surface font-semibold block">{s.latest_recommendation}</span>
                  </div>

                  {/* Decision Action Buttons */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Execute Recovery Action:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      <button
                        onClick={() => openActionModal(s, "Continue")}
                        disabled={executingId === s.id}
                        className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">local_shipping</span>
                        Continue
                      </button>

                      <button
                        onClick={() => openActionModal(s, "Re-route")}
                        disabled={executingId === s.id}
                        className="py-2.5 px-3 bg-[#0065FF] hover:bg-[#0052cc] text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">alt_route</span>
                        Re-route
                      </button>

                      <button
                        onClick={() => openActionModal(s, "Nearest Hub")}
                        disabled={executingId === s.id}
                        className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">warehouse</span>
                        Nearest Hub
                      </button>

                      <button
                        onClick={() => openActionModal(s, "Priority Express")}
                        disabled={executingId === s.id}
                        className="py-2.5 px-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">speed</span>
                        Priority Express
                      </button>

                      <button
                        onClick={() => openActionModal(s, "Liquidate")}
                        disabled={executingId === s.id}
                        className="py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer col-span-2 sm:col-span-1"
                      >
                        <span className="material-symbols-outlined text-[18px]">storefront</span>
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
            <span>Showing all resolved decision events and location updates saved to system repository.</span>
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
              Loading action history...
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
                        Location: <span className="font-bold text-slate-800">{s.current_location}</span> | Value: ${(s.shipment_value || 0).toLocaleString()}
                      </p>
                    </div>

                    {onSelectShipment && (
                      <button
                        onClick={() => onSelectShipment(s.id)}
                        className="px-3 py-1.5 bg-surface border border-outline-variant hover:bg-surface-container text-on-surface text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1"
                      >
                        View Telemetry
                      </button>
                    )}
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                    <span className="font-bold text-slate-700 block">Action Details & Location Explanation:</span>
                    <p className="text-slate-800 font-medium leading-relaxed">{s.latest_recommendation}</p>
                  </div>

                  {s.status_timeline && s.status_timeline.length > 0 && (
                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      <span>Last Updated: {s.status_timeline[s.status_timeline.length - 1].timestamp}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Interactive Action Explanation & Confirmation Modal */}
      {pendingModal && createPortal(
        (() => {
          const details = getActionDetails(pendingModal.shipment, pendingModal.actionKey);
          const s = pendingModal.shipment;

          return (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
              <div 
                className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-300 space-y-5 max-h-[90vh] overflow-y-auto text-left"
                style={{ width: '92%', maxWidth: '580px', margin: 'auto' }}
              >
                
                {/* Modal Header */}
                <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${details.iconBg} text-white flex items-center justify-center shadow-md shrink-0`}>
                      <span className="material-symbols-outlined text-[22px]">{details.icon}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900">{details.title}</h3>
                      <p className="text-xs text-slate-500 font-mono">
                        Shipment <strong className="text-primary">{s.id}</strong> ({s.product_name})
                      </p>
                    </div>
                  </div>

                  <button onClick={closeActionModal} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                {/* Location Route Bar */}
                <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-[11px] font-mono uppercase text-slate-400">Current Checkpoint</span>
                    <span className="font-semibold text-amber-400">📍 {details.currentLocText}</span>
                  </div>
                  <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-slate-100">
                    <span className="text-[11px] font-mono uppercase text-slate-400">Action Route Destination</span>
                    <span className="font-bold text-cyan-400">🎯 {details.targetLocText}</span>
                  </div>
                </div>

                {/* Clear & Detailed Explanation Text */}
                <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-xl space-y-2 text-xs">
                  <span className="font-bold text-blue-900 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-blue-600">info</span>
                    Detailed Action Explanation:
                  </span>
                  <p className="text-blue-950 font-medium leading-relaxed">{details.explanation}</p>
                </div>

                {/* Expected Impact Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Expected Outcome</span>
                    <p className="font-bold text-emerald-700 text-xs">{details.expectedOutcome}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Time / Cost Impact</span>
                    <p className="font-bold text-primary text-xs">{details.timeOrCostImpact}</p>
                  </div>
                </div>

                {/* Operator Notes Input */}
                <div className="space-y-1 text-xs">
                  <label className="block font-bold text-slate-700">Optional Dispatcher Note:</label>
                  <input
                    type="text"
                    placeholder="e.g. Approved by Chief Dispatcher for express toll lane..."
                    value={operatorNotes}
                    onChange={(e) => setOperatorNotes(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-xs focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={closeActionModal}
                    className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleConfirmAction}
                    disabled={executingId === s.id}
                    className={`w-2/3 py-3 ${details.iconBg} text-white font-bold text-xs rounded-xl shadow-lg hover:opacity-90 cursor-pointer transition-all flex items-center justify-center gap-2`}
                  >
                    {executingId === s.id ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Executing Action...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                        Confirm & Execute {pendingModal.actionKey}
                      </>
                    )}
                  </button>
                </div>

              </div>
            </div>
          );
        })(),
        document.body
      )}
    </div>
  );
}
