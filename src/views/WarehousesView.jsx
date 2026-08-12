import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';

export default function WarehousesView() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWH = async () => {
      try {
        setLoading(true);
        const data = await apiService.getWarehouses();
        setWarehouses(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchWH();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-on-surface">Warehouse Operations Module</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold border border-amber-300">
              Planned Module Spec
            </span>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">Multi-site cold storage capacity monitoring and temperature range management.</p>
        </div>
      </div>

      {/* Feature Spec Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-[#071328] text-white p-6 rounded-2xl border border-slate-800 space-y-3">
        <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">schema</span>
          Phase 2 Warehouse Module Feature & Table Column Spec
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          Below are the active cold storage depots currently bound to the FastAPI backend API. Additional full CRUD management (capacity allocation sliders, automated maintenance scheduling, manager dispatching) will be enabled in Phase 2.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] font-mono">
          <div className="p-2 bg-slate-800/80 rounded border border-slate-700">Columns: [ID, Name, Location]</div>
          <div className="p-2 bg-slate-800/80 rounded border border-slate-700">Capacity: [Total, Used, Free]</div>
          <div className="p-2 bg-slate-800/80 rounded border border-slate-700">Temp Range: [Min °C, Max °C]</div>
          <div className="p-2 bg-slate-800/80 rounded border border-slate-700">Ops: [Create, Edit, Delete]</div>
        </div>
      </div>

      {/* Current Warehouses Table */}
      <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/60 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-on-surface">Active Refrigerated Cold Storage Hubs</h3>
        {loading ? (
          <div className="py-8 text-center text-xs font-semibold text-slate-500">Loading warehouses from API...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface border-b border-outline-variant/40 text-on-surface-variant uppercase font-label-md">
                <tr>
                  <th className="p-3">Warehouse ID</th>
                  <th className="p-3">Hub Name</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Total Pallets</th>
                  <th className="p-3">Used Capacity</th>
                  <th className="p-3">Temp Range</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Manager</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {warehouses.map((w) => (
                  <tr key={w.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="p-3 font-bold font-mono text-primary">{w.id}</td>
                    <td className="p-3 font-semibold text-on-surface">{w.name}</td>
                    <td className="p-3 text-on-surface-variant">{w.location}</td>
                    <td className="p-3">{w.total_capacity_pallets.toLocaleString()}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{w.used_capacity_pallets.toLocaleString()}</span>
                        <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-primary h-full"
                            style={{ width: `${(w.used_capacity_pallets / w.total_capacity_pallets) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-mono">{w.min_temp_celsius}°C to {w.max_temp_celsius}°C</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        {w.status}
                      </span>
                    </td>
                    <td className="p-3 text-on-surface-variant">{w.manager}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
