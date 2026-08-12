import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';

export default function AnalyticsView() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await apiService.getDashboardAnalytics();
        setData(res);
      } catch (err) {
        console.error(err);
      }
    };
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 shadow-sm space-y-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[28px]">insights</span>
          <h1 className="text-2xl font-extrabold text-on-surface">Enterprise Analytics Console</h1>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold border border-amber-300">
            Roadmap Module Preview
          </span>
        </div>
        <p className="text-xs text-on-surface-variant">Deep-dive financial savings, waste prevention metrics, and historical degradation curves.</p>
      </div>

      {/* Analytical KPI Summary Cards */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/60 shadow-sm text-center">
            <p className="text-xs font-label-md text-on-surface-variant uppercase">Waste Prevented</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">{data.kpis.products_saved_units.toLocaleString()} Doses/Units</p>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/60 shadow-sm text-center">
            <p className="text-xs font-label-md text-on-surface-variant uppercase">Carbon Saved</p>
            <p className="text-2xl font-extrabold text-teal-600 mt-1">{data.kpis.carbon_saved_kg} kg CO2e</p>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/60 shadow-sm text-center">
            <p className="text-xs font-label-md text-on-surface-variant uppercase">Financial Savings</p>
            <p className="text-2xl font-extrabold text-primary mt-1">${(data.kpis.estimated_loss_prevented_usd / 1000).toFixed(1)}k Saved</p>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/60 shadow-sm text-center">
            <p className="text-xs font-label-md text-on-surface-variant uppercase">Recovered Batches</p>
            <p className="text-2xl font-extrabold text-indigo-600 mt-1">{data.kpis.active_shipments} Active Batches</p>
          </div>
        </div>
      )}

      {/* Feature Breakdown Spec */}
      <div className="bg-[#071328] text-white p-6 rounded-2xl border border-slate-800 space-y-3 text-xs">
        <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">Planned Analytics Module Breakdown (Phase 2):</h3>
        <ul className="space-y-2 text-slate-300 list-disc pl-4">
          <li><strong>Carrier Compliance Matrix:</strong> Rate cold-transport carriers by excursion frequency and thermal stability.</li>
          <li><strong>Lane Temperature Heatmaps:</strong> Identify high-risk geographical transit corridors across seasonal temperature spikes.</li>
          <li><strong>Predictive Financial Write-Off Models:</strong> Monte Carlo simulations for insurance claims and warranty reserve estimation.</li>
        </ul>
      </div>
    </div>
  );
}
