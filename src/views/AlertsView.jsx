import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';

export default function AlertsView() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlertsList = async () => {
    try {
      setLoading(true);
      const data = await apiService.getAlerts();
      setAlerts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertsList();
  }, []);

  const handleResolve = async (id) => {
    try {
      await apiService.resolveAlert(id);
      fetchAlertsList();
    } catch (err) {
      alert("Error resolving alert: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 shadow-sm space-y-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-red-600 text-[28px]">notifications_active</span>
          <h1 className="text-2xl font-extrabold text-on-surface">Automated Alert Feed</h1>
          <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 text-[11px] font-bold border border-blue-300">
            Live Stream Connected
          </span>
        </div>
        <p className="text-xs text-on-surface-variant">Real-time alerts triggered by FastAPI backend upon temperature breaches, delay risk thresholds, or warehouse capacity events.</p>
      </div>

      {/* Feature Roadmap Card */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-2 text-xs">
        <span className="font-bold text-cyan-400 uppercase tracking-wider block">Planned Notification Integrations (Phase 2):</span>
        <p className="text-slate-300">Automatic SMS dispatch via Twilio, Webhook payload forwarding, and Slack/Teams emergency incident channels.</p>
      </div>

      <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/60 shadow-sm space-y-3">
        {loading ? (
          <div className="py-8 text-center text-xs font-semibold text-slate-500">Loading alerts from API...</div>
        ) : (
          <div className="space-y-3">
            {alerts.map((a) => (
              <div key={a.id} className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
                a.resolved ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-surface border-outline-variant/50 shadow-sm'
              }`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                      a.severity === 'Critical' ? 'bg-red-100 text-red-800 border border-red-300' :
                      a.severity === 'High' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {a.severity}
                    </span>
                    <span className="font-bold text-on-surface text-sm">{a.title}</span>
                    {a.shipment_id && <span className="font-mono text-primary text-xs font-bold">({a.shipment_id})</span>}
                  </div>
                  <p className="text-xs text-on-surface-variant">{a.message}</p>
                  <span className="text-[10px] text-slate-400 font-mono block">{a.timestamp}</span>
                </div>

                {!a.resolved ? (
                  <button
                    onClick={() => handleResolve(a.id)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow cursor-pointer shrink-0"
                  >
                    Mark Resolved
                  </button>
                ) : (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 shrink-0">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    Resolved
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
