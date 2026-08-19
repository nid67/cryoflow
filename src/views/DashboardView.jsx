import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { apiService } from '../services/api';
import { supabase } from '../services/supabaseClient';
import InteractiveMap from '../components/InteractiveMap';

const COLORS = ['#0065FF', '#F59E0B', '#EF4444', '#10B981', '#8B5CF6'];

export default function DashboardView({ onSelectShipment, onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    try {
      const res = await apiService.getDashboardAnalytics();
      setData(res);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to fetch real-time dashboard telemetry from backend API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();

    // Subscribe to telemetry_logs INSERT events
    const channel = supabase
      .channel('telemetry_logs_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'telemetry_logs' },
        (payload) => {
          console.log('New telemetry record received:', payload);
          // Re-fetch dashboard data to update temperature, health, risk, map position, alerts, KPIs
          fetchDashboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-on-surface-variant">Connecting to FastAPI Ingestion Backend...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center space-y-3">
        <span className="material-symbols-outlined text-red-600 text-[36px]">error</span>
        <p className="text-sm font-bold text-red-800">{error || 'No data returned.'}</p>
        <button onClick={fetchDashboard} className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold">
          Retry Ingestion Connection
        </button>
      </div>
    );
  }

  const { kpis, status_distribution, spoilage_risk_distribution, product_categories_distribution, recent_alerts, recent_shipments, ai_recommendations } = data;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 shadow-sm gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-on-surface">Global Control Center</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300">
              Live FastAPI Backend Connected
            </span>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">Real-time thermal degradation telemetry & automated risk mitigation.</p>
        </div>

        <button
          onClick={fetchDashboard}
          className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface-container rounded-xl text-xs font-bold text-on-surface border border-outline-variant transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Refresh Ingestion Stream
        </button>
      </div>

      {/* Dynamic KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/50 shadow-sm text-center">
          <p className="text-[11px] font-label-md text-on-surface-variant">Total Shipments</p>
          <p className="text-xl font-extrabold text-on-surface mt-1">{kpis.total_shipments}</p>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/50 shadow-sm text-center">
          <p className="text-[11px] font-label-md text-on-surface-variant">Active Monitored</p>
          <p className="text-xl font-extrabold text-primary mt-1">{kpis.active_shipments}</p>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/50 shadow-sm text-center">
          <p className="text-[11px] font-label-md text-on-surface-variant">Delivered</p>
          <p className="text-xl font-extrabold text-emerald-600 mt-1">{kpis.delivered_shipments}</p>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/50 shadow-sm text-center">
          <p className="text-[11px] font-label-md text-on-surface-variant">High Risk</p>
          <p className="text-xl font-extrabold text-red-600 mt-1">{kpis.high_risk_shipments}</p>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/50 shadow-sm text-center">
          <p className="text-[11px] font-label-md text-on-surface-variant">Products Saved</p>
          <p className="text-xl font-extrabold text-emerald-700 mt-1">{kpis.products_saved_units.toLocaleString()}</p>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/50 shadow-sm text-center">
          <p className="text-[11px] font-label-md text-on-surface-variant">Loss Prevented</p>
          <p className="text-xl font-extrabold text-primary mt-1">${(kpis.estimated_loss_prevented_usd / 1000).toFixed(1)}k</p>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/50 shadow-sm text-center col-span-2 sm:col-span-1">
          <p className="text-[11px] font-label-md text-on-surface-variant">Carbon Saved</p>
          <p className="text-xl font-extrabold text-teal-600 mt-1">{kpis.carbon_saved_kg} kg</p>
        </div>
      </div>

      {/* Interactive Map Section */}
      <InteractiveMap
        shipments={recent_shipments}
        selectedShipmentId={null}
        onSelectShipment={onSelectShipment}
      />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status Distribution */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/60 shadow-sm space-y-2">
          <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">Shipment Status Distribution</h3>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={status_distribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={55} label>
                  {status_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Spoilage Risk Distribution */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/60 shadow-sm space-y-2">
          <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">Spoilage Risk Distribution</h3>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spoilage_risk_distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip />
                <Bar dataKey="value" fill="#0065FF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Product Categories */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/60 shadow-sm space-y-2">
          <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">Product Categories</h3>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={product_categories_distribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" stroke="#64748b" fontSize={10} />
                <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={10} width={90} />
                <Tooltip />
                <Bar dataKey="value" fill="#10B981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Alerts & AI Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recent Alerts */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/60 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500 text-[18px]">notifications_active</span>
              Backend Alerts Feed ({recent_alerts.length})
            </h3>
            <button onClick={() => onNavigate('alerts')} className="text-xs text-primary hover:underline font-semibold">
              View All →
            </button>
          </div>

          <div className="space-y-2">
            {recent_alerts.map((a) => (
              <div key={a.id} className="p-3 bg-surface rounded-xl border border-outline-variant/40 flex justify-between items-start text-xs">
                <div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    a.severity === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {a.severity}
                  </span>
                  <p className="font-bold text-on-surface mt-1">{a.title}</p>
                  <p className="text-on-surface-variant text-[11px] mt-0.5">{a.message}</p>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0 ml-2">{a.timestamp}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/60 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">psychology</span>
              AI Action Recommendations ({ai_recommendations.length})
            </h3>
            <button onClick={() => onNavigate('decision')} className="text-xs text-primary hover:underline font-semibold">
              Decision Center →
            </button>
          </div>

          <div className="space-y-2">
            {ai_recommendations.map((rec) => (
              <div key={rec.shipment_id} className="p-3 bg-primary-container/10 rounded-xl border border-primary/20 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <strong className="text-on-surface">{rec.shipment_id} - {rec.product_name}</strong>
                  <span className="text-xs font-bold text-red-600">{rec.risk}% Risk</span>
                </div>
                <p className="text-xs font-body-md text-on-surface">{rec.recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live Shipment Table */}
      <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/60 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-on-surface">Live Monitored Shipments</h3>
          <button onClick={() => onNavigate('shipments')} className="text-xs text-primary font-bold hover:underline">
            Manage All Shipments →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface border-b border-outline-variant/40 text-on-surface-variant uppercase font-label-md">
              <tr>
                <th className="p-3">Shipment ID</th>
                <th className="p-3">Product Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Location</th>
                <th className="p-3">Temp (°C)</th>
                <th className="p-3">Spoilage Risk</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {recent_shipments.map((s) => (
                <tr key={s.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="p-3 font-bold font-mono text-primary">{s.id}</td>
                  <td className="p-3 font-semibold text-on-surface">{s.product_name}</td>
                  <td className="p-3">{s.product_category}</td>
                  <td className="p-3 text-on-surface-variant">{s.current_location}</td>
                  <td className="p-3 font-bold">{s.current_temp > 0 ? `+${s.current_temp}` : s.current_temp}°C</td>
                  <td className="p-3">
                    <span className={`font-bold ${s.spoilage_risk > 30 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {s.spoilage_risk}%
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      s.current_status === 'Warning' ? 'bg-amber-100 text-amber-900' :
                      s.current_status === 'Critical Breach' ? 'bg-red-100 text-red-900' : 'bg-emerald-100 text-emerald-900'
                    }`}>
                      {s.current_status}
                    </span>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => onSelectShipment(s.id)}
                      className="px-2.5 py-1 bg-primary text-white text-[11px] font-bold rounded hover:bg-primary-container transition-all"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
