import React, { useEffect, useState, useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { apiService } from '../services/api';

// Initial Carrier Datasets
const CARRIERS_DATA = [
  {
    id: 'car-01',
    name: 'BlueDart Cold Logistics',
    type: 'Biologics & Pharma Express',
    rating: 4.9,
    compliance_rate: 99.2,
    excursion_rate: 0.4,
    on_time_rate: 98.6,
    active_reefers: 42,
    status: 'Top Tier',
    primary_hub: 'Mumbai & Delhi',
    temp_stability: 'Ultra-Stable (±0.2°C)'
  },
  {
    id: 'car-02',
    name: 'ColdEx Express India',
    type: 'Vaccines & Cold Supply Chain',
    rating: 4.7,
    compliance_rate: 97.8,
    excursion_rate: 1.2,
    on_time_rate: 96.5,
    active_reefers: 35,
    status: 'Top Tier',
    primary_hub: 'Bangalore & Chennai',
    temp_stability: 'High Stability (±0.4°C)'
  },
  {
    id: 'car-03',
    name: 'TCI Cold Chain Solutions',
    type: 'Heavy Reefer Transport',
    rating: 4.4,
    compliance_rate: 95.4,
    excursion_rate: 2.1,
    on_time_rate: 94.2,
    active_reefers: 58,
    status: 'Good',
    primary_hub: 'Hyderabad & Pune',
    temp_stability: 'Moderate (±0.8°C)'
  },
  {
    id: 'car-04',
    name: 'Snowman Logistics Mesh',
    type: 'Multi-Temp Produce & Dairy',
    rating: 3.9,
    compliance_rate: 92.1,
    excursion_rate: 3.8,
    on_time_rate: 91.0,
    active_reefers: 28,
    status: 'Review Required',
    primary_hub: 'Kolkata & Lucknow',
    temp_stability: 'Variable (±1.4°C)'
  },
  {
    id: 'car-05',
    name: 'VRL Cold Express',
    type: 'Regional Perishables',
    rating: 3.5,
    compliance_rate: 89.5,
    excursion_rate: 5.2,
    on_time_rate: 87.8,
    active_reefers: 19,
    status: 'Review Required',
    primary_hub: 'Ahmedabad & Surat',
    temp_stability: 'High Variance (±2.1°C)'
  }
];

// Transit Route Risk Heatmap Datasets
const ROUTE_HEATMAP_DATA = [
  {
    id: 'rt-01',
    corridor: 'Kolkata → Delhi Northern Transit Corridor',
    origin: 'Kolkata',
    destination: 'Delhi',
    risk_level: 'High Risk',
    risk_score: 38.5,
    avg_temp: 11.2,
    breach_frequency: '18.4%',
    primary_risk: 'Ambient heat soak + Jharkhand/Bihar border traffic delay',
    recommended_bypass: 'Express Toll Bypass via Varanasi Link Road',
    carrier_assigned: 'Snowman Logistics'
  },
  {
    id: 'rt-02',
    corridor: 'Pune → Chennai Southern Transit Route',
    origin: 'Pune',
    destination: 'Chennai',
    risk_level: 'Medium Risk',
    risk_score: 22.4,
    avg_temp: 6.5,
    breach_frequency: '8.2%',
    primary_risk: 'Compressor power overload during peak afternoon sun',
    recommended_bypass: 'Pre-cool check at Hosur Logistics Depot',
    carrier_assigned: 'TCI Cold Chain'
  },
  {
    id: 'rt-03',
    corridor: 'Delhi → Mumbai Express Highway',
    origin: 'Delhi',
    destination: 'Mumbai',
    risk_level: 'Low Risk',
    risk_score: 4.2,
    avg_temp: 3.8,
    breach_frequency: '1.1%',
    primary_risk: 'Minor highway surface heat fluctuation',
    recommended_bypass: 'Standard Dedicated Cold Corridor',
    carrier_assigned: 'BlueDart Cold Logistics'
  },
  {
    id: 'rt-04',
    corridor: 'Chandigarh → Delhi Airport Route',
    origin: 'Chandigarh',
    destination: 'Delhi',
    risk_level: 'Low Risk',
    risk_score: 2.1,
    avg_temp: 4.8,
    breach_frequency: '0.5%',
    primary_risk: 'None - Optimal Cold Corridor',
    recommended_bypass: 'Direct NH44 Speed Lane',
    carrier_assigned: 'ColdEx Express'
  },
  {
    id: 'rt-05',
    corridor: 'Ahmedabad → Mumbai Coastal Highway',
    origin: 'Ahmedabad',
    destination: 'Mumbai',
    risk_level: 'Low Risk',
    risk_score: 5.1,
    avg_temp: 3.1,
    breach_frequency: '1.4%',
    primary_risk: 'Coastal humidity spikes during port loading',
    recommended_bypass: 'Surat Fast Track Terminal Link',
    carrier_assigned: 'VRL Cold Express'
  },
  {
    id: 'rt-06',
    corridor: 'Kochi → Chennai Peninsula Link',
    origin: 'Kochi',
    destination: 'Chennai',
    risk_level: 'Low Risk',
    risk_score: 1.8,
    avg_temp: 2.8,
    breach_frequency: '0.4%',
    primary_risk: 'Dock unloading queue delays at terminal',
    recommended_bypass: 'Express Green Channel Unloading',
    carrier_assigned: 'ColdEx Express'
  }
];

export default function AnalyticsView() {
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'compliance' | 'routes' | 'financial'

  // Carrier Filters
  const [carrierSearch, setCarrierSearch] = useState('');
  const [carrierFilter, setCarrierFilter] = useState('All');

  // Route Filters
  const [routeRiskFilter, setRouteRiskFilter] = useState('All');

  // Financial Interactive Estimator State
  const [monthlyVolume, setMonthlyVolume] = useState(2500000); // $2.5M
  const [spoilageRatePct, setSpoilageRatePct] = useState(8.5); // 8.5%
  const [insuranceCoveragePct, setInsuranceCoveragePct] = useState(70); // 70%

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

  // Filtered Carriers
  const filteredCarriers = useMemo(() => {
    return CARRIERS_DATA.filter((c) => {
      const matchSearch = c.name.toLowerCase().includes(carrierSearch.toLowerCase()) ||
                          c.type.toLowerCase().includes(carrierSearch.toLowerCase());
      const matchStatus = carrierFilter === 'All' ? true : c.status === carrierFilter;
      return matchSearch && matchStatus;
    });
  }, [carrierSearch, carrierFilter]);

  // Filtered Routes
  const filteredRoutes = useMemo(() => {
    return ROUTE_HEATMAP_DATA.filter((r) => {
      if (routeRiskFilter === 'All') return true;
      return r.risk_level === routeRiskFilter;
    });
  }, [routeRiskFilter]);

  // Dynamic Financial Risk Computations
  const financialMetrics = useMemo(() => {
    const monthlyUnprotectedLoss = monthlyVolume * (spoilageRatePct / 100);
    const monthlyPreventedSavings = monthlyUnprotectedLoss * 0.88; // 88% saved with Valtway AI
    const monthlyRemainingLoss = monthlyUnprotectedLoss - monthlyPreventedSavings;
    const monthlyInsuranceRisk = monthlyRemainingLoss * (1 - insuranceCoveragePct / 100);
    const annualSavings = monthlyPreventedSavings * 12;

    // Generate 12-month projections
    const chartProjections = [
      { month: 'Jan', WithoutValtway: Math.round(monthlyUnprotectedLoss / 1000), WithValtway: Math.round(monthlyRemainingLoss / 1000) },
      { month: 'Feb', WithoutValtway: Math.round((monthlyUnprotectedLoss * 1.05) / 1000), WithValtway: Math.round((monthlyRemainingLoss * 1.02) / 1000) },
      { month: 'Mar', WithoutValtway: Math.round((monthlyUnprotectedLoss * 1.1) / 1000), WithValtway: Math.round((monthlyRemainingLoss * 0.95) / 1000) },
      { month: 'Apr', WithoutValtway: Math.round((monthlyUnprotectedLoss * 1.15) / 1000), WithValtway: Math.round((monthlyRemainingLoss * 0.9) / 1000) },
      { month: 'May', WithoutValtway: Math.round((monthlyUnprotectedLoss * 1.25) / 1000), WithValtway: Math.round((monthlyRemainingLoss * 0.85) / 1000) },
      { month: 'Jun', WithoutValtway: Math.round((monthlyUnprotectedLoss * 1.3) / 1000), WithValtway: Math.round((monthlyRemainingLoss * 0.8) / 1000) },
      { month: 'Jul', WithoutValtway: Math.round((monthlyUnprotectedLoss * 1.2) / 1000), WithValtway: Math.round((monthlyRemainingLoss * 0.82) / 1000) },
      { month: 'Aug', WithoutValtway: Math.round((monthlyUnprotectedLoss * 1.1) / 1000), WithValtway: Math.round((monthlyRemainingLoss * 0.85) / 1000) },
      { month: 'Sep', WithoutValtway: Math.round((monthlyUnprotectedLoss * 1.05) / 1000), WithValtway: Math.round((monthlyRemainingLoss * 0.88) / 1000) },
      { month: 'Oct', WithoutValtway: Math.round((monthlyUnprotectedLoss * 1.0) / 1000), WithValtway: Math.round((monthlyRemainingLoss * 0.9) / 1000) },
      { month: 'Nov', WithoutValtway: Math.round((monthlyUnprotectedLoss * 0.95) / 1000), WithValtway: Math.round((monthlyRemainingLoss * 0.88) / 1000) },
      { month: 'Dec', WithoutValtway: Math.round((monthlyUnprotectedLoss * 1.18) / 1000), WithValtway: Math.round((monthlyRemainingLoss * 0.84) / 1000) },
    ];

    return {
      monthlyUnprotectedLoss,
      monthlyPreventedSavings,
      monthlyRemainingLoss,
      monthlyInsuranceRisk,
      annualSavings,
      chartProjections
    };
  }, [monthlyVolume, spoilageRatePct, insuranceCoveragePct]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[28px]">insights</span>
              <h1 className="text-2xl font-extrabold text-on-surface">Analytics & Reports Console</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300">
                Live Insights Active
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              Carrier compliance ratings, transit route temperature risk heatmaps, and financial loss models.
            </p>
          </div>

          {/* Module Selector Bar */}
          <div className="flex items-center bg-surface border border-outline-variant/60 rounded-xl p-1 text-xs font-bold gap-1 shadow-sm">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'all' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Modules
            </button>
            <button
              onClick={() => setActiveTab('compliance')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'compliance' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Carrier Compliance
            </button>
            <button
              onClick={() => setActiveTab('routes')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'routes' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Route Heatmaps
            </button>
            <button
              onClick={() => setActiveTab('financial')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'financial' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Financial Risk
            </button>
          </div>
        </div>
      </div>

      {/* Analytical KPI Summary Cards */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/60 shadow-sm text-center">
            <p className="text-xs font-label-md text-on-surface-variant uppercase">Waste Prevented</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">{(data.kpis?.products_saved_units ?? 0).toLocaleString()} Units</p>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/60 shadow-sm text-center">
            <p className="text-xs font-label-md text-on-surface-variant uppercase">Carbon Saved</p>
            <p className="text-2xl font-extrabold text-teal-600 mt-1">{data.kpis?.carbon_saved_kg ?? 0} kg CO2e</p>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/60 shadow-sm text-center">
            <p className="text-xs font-label-md text-on-surface-variant uppercase">Financial Savings</p>
            <p className="text-2xl font-extrabold text-primary mt-1">${(((data.kpis?.estimated_loss_prevented_usd ?? 0) / 1000)).toFixed(1)}k Saved</p>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/60 shadow-sm text-center">
            <p className="text-xs font-label-md text-on-surface-variant uppercase">Recovered Batches</p>
            <p className="text-2xl font-extrabold text-indigo-600 mt-1">{data.kpis?.active_shipments ?? 0} Active Batches</p>
          </div>
        </div>
      )}

      {/* MODULE 1: Carrier Compliance Matrix */}
      {(activeTab === 'all' || activeTab === 'compliance') && (
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b border-outline-variant/40">
            <div>
              <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">local_shipping</span>
                Carrier Compliance & Thermal Reliability Matrix
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Rating cold-chain transport carriers by temperature compliance %, excursion frequency, and thermal stability.
              </p>
            </div>

            {/* Filter Search */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search carrier name..."
                value={carrierSearch}
                onChange={(e) => setCarrierSearch(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-outline-variant bg-surface text-xs text-on-surface focus:outline-none focus:border-primary"
              />
              <select
                value={carrierFilter}
                onChange={(e) => setCarrierFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-outline-variant bg-surface text-xs text-on-surface"
              >
                <option value="All">All Tiers</option>
                <option value="Top Tier">Top Tier (&gt;97%)</option>
                <option value="Good">Good (&gt;95%)</option>
                <option value="Review Required">Review Required (&lt;95%)</option>
              </select>
            </div>
          </div>

          {/* Carrier Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface border-b border-outline-variant/40 text-on-surface-variant uppercase font-label-md">
                <tr>
                  <th className="p-3">Carrier Name</th>
                  <th className="p-3">Specialization</th>
                  <th className="p-3">Rating</th>
                  <th className="p-3">Compliance Rate</th>
                  <th className="p-3">Excursion Rate</th>
                  <th className="p-3">On-Time %</th>
                  <th className="p-3">Thermal Stability</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {filteredCarriers.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="p-3 font-bold text-on-surface">
                      <div>{c.name}</div>
                      <span className="text-[10px] text-slate-400 font-mono font-normal">Hub: {c.primary_hub}</span>
                    </td>
                    <td className="p-3 text-on-surface-variant">{c.type}</td>
                    <td className="p-3 font-bold text-amber-600 font-mono">
                      ★ {c.rating} / 5.0
                    </td>
                    <td className="p-3 font-mono font-bold text-emerald-600">
                      <div className="flex items-center gap-2">
                        <span>{c.compliance_rate}%</span>
                        <div className="w-16 h-1.5 rounded-full bg-slate-200 overflow-hidden hidden md:block">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${c.compliance_rate}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className={`p-3 font-mono font-bold ${c.excursion_rate > 3 ? 'text-red-600' : 'text-slate-700'}`}>
                      {c.excursion_rate}%
                    </td>
                    <td className="p-3 font-mono text-slate-800">{c.on_time_rate}%</td>
                    <td className="p-3 text-slate-600 text-[11px] font-medium">{c.temp_stability}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                        c.status === 'Top Tier' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                        c.status === 'Good' ? 'bg-blue-50 text-blue-800 border-blue-300' : 'bg-amber-50 text-amber-900 border-amber-300'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODULE 2: Transit Route Temperature Heatmap */}
      {(activeTab === 'all' || activeTab === 'routes') && (
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b border-outline-variant/40">
            <div>
              <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">map</span>
                Transit Route Temperature Risk Heatmaps
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Thermal risk classification across major Indian cold-chain transit corridors.
              </p>
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <span className="text-slate-500 mr-1">Filter Risk:</span>
              <button
                onClick={() => setRouteRiskFilter('All')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  routeRiskFilter === 'All' ? 'bg-slate-800 text-white font-bold' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setRouteRiskFilter('High Risk')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  routeRiskFilter === 'High Risk' ? 'bg-red-600 text-white font-bold' : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                High Risk
              </button>
              <button
                onClick={() => setRouteRiskFilter('Medium Risk')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  routeRiskFilter === 'Medium Risk' ? 'bg-amber-600 text-white font-bold' : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
              >
                Medium Risk
              </button>
              <button
                onClick={() => setRouteRiskFilter('Low Risk')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  routeRiskFilter === 'Low Risk' ? 'bg-emerald-600 text-white font-bold' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                Low Risk
              </button>
            </div>
          </div>

          {/* Route Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRoutes.map((r) => (
              <div key={r.id} className="bg-surface p-4 rounded-xl border border-outline-variant/50 shadow-sm space-y-3 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-[10px] text-slate-400 font-bold uppercase">{r.origin} → {r.destination}</span>
                    <h3 className="font-bold text-on-surface text-xs mt-0.5">{r.corridor}</h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    r.risk_level === 'High Risk' ? 'bg-red-100 text-red-900 border-red-300 animate-pulse' :
                    r.risk_level === 'Medium Risk' ? 'bg-amber-100 text-amber-900 border-amber-300' :
                    'bg-emerald-100 text-emerald-900 border-emerald-300'
                  }`}>
                    {r.risk_level}
                  </span>
                </div>

                {/* Risk Level Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-slate-500">Excursion Risk Index</span>
                    <span className="font-bold text-slate-800">{r.risk_score}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        r.risk_level === 'High Risk' ? 'bg-red-600' :
                        r.risk_level === 'Medium Risk' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, r.risk_score * 2)}%` }}
                    />
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-[11px] space-y-1 font-sans">
                  <div className="flex justify-between text-slate-600">
                    <span>Avg Transit Temp:</span>
                    <strong className="text-slate-900 font-mono">{r.avg_temp}°C</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Thermal Breach Freq:</span>
                    <strong className="text-slate-900 font-mono">{r.breach_frequency}</strong>
                  </div>
                  <div className="pt-1 border-t border-slate-100 text-slate-700">
                    <span className="font-bold block text-[10px] text-slate-500 uppercase">Primary Thermal Risk:</span>
                    <span>{r.primary_risk}</span>
                  </div>
                </div>

                <div className="text-[10px] text-primary font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">alt_route</span>
                  <span>Bypass: {r.recommended_bypass}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODULE 3: Financial Risk & Insurance Write-off Estimator */}
      {(activeTab === 'all' || activeTab === 'financial') && (
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 shadow-sm space-y-6">
          <div className="pb-2 border-b border-outline-variant/40">
            <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">payments</span>
              Financial Loss Prevention & Insurance Claim Model
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Interactive financial simulation model estimating waste reduction, insurance exposure, and annual ROI.
            </p>
          </div>

          {/* Interactive Controls & Live Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            
            {/* Left Controls Sliders */}
            <div className="md:col-span-5 bg-surface p-5 rounded-xl border border-outline-variant/50 space-y-5 text-xs">
              <h3 className="font-bold text-on-surface uppercase tracking-wider text-[11px]">Financial Risk Parameters</h3>

              {/* Monthly Volume Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <label className="text-slate-700">Monthly Fleet Cargo Value ($)</label>
                  <span className="font-mono font-bold text-primary">${(monthlyVolume).toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={500000}
                  max={10000000}
                  step={250000}
                  value={monthlyVolume}
                  onChange={(e) => setMonthlyVolume(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>$500k</span>
                  <span>$5.0M</span>
                  <span>$10.0M</span>
                </div>
              </div>

              {/* Spoilage Rate Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <label className="text-slate-700">Historical Unprotected Spoilage Rate (%)</label>
                  <span className="font-mono font-bold text-red-600">{spoilageRatePct}%</span>
                </div>
                <input
                  type="range"
                  min={2.0}
                  max={20.0}
                  step={0.5}
                  value={spoilageRatePct}
                  onChange={(e) => setSpoilageRatePct(Number(e.target.value))}
                  className="w-full accent-red-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>2.0% (Low)</span>
                  <span>10.0% (Avg)</span>
                  <span>20.0% (Severe)</span>
                </div>
              </div>

              {/* Insurance Coverage Selector */}
              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-700">Insurance Claim Coverage Option</label>
                <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-bold">
                  {[50, 70, 90].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => setInsuranceCoveragePct(pct)}
                      className={`py-2 rounded-lg border transition-all cursor-pointer ${
                        insuranceCoveragePct === pct
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {pct}% Policy
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Computed Metrics Output Grid */}
            <div className="md:col-span-7 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-surface p-4 rounded-xl border border-outline-variant/40 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Unprotected Loss / Mo</span>
                  <p className="text-xl font-extrabold text-red-600 mt-1">${Math.round(financialMetrics.monthlyUnprotectedLoss).toLocaleString()}</p>
                </div>

                <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 text-center">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase">Valtway Savings / Mo</span>
                  <p className="text-xl font-extrabold text-emerald-700 mt-1">${Math.round(financialMetrics.monthlyPreventedSavings).toLocaleString()}</p>
                </div>

                <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200 text-center">
                  <span className="text-[10px] font-bold text-blue-800 uppercase">Annualized ROI Savings</span>
                  <p className="text-xl font-extrabold text-primary mt-1">${Math.round(financialMetrics.annualSavings).toLocaleString()}</p>
                </div>
              </div>

              {/* Recharts Projections Chart */}
              <div className="bg-surface p-4 rounded-xl border border-outline-variant/40 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800 uppercase">12-Month Financial Loss Comparison ($k USD)</span>
                  <span className="text-emerald-700 font-bold font-mono">88% Recovery Rate Achieved</span>
                </div>
                <div className="h-52 w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={financialMetrics.chartProjections}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                      <Bar dataKey="WithoutValtway" fill="#ef4444" name="Loss Without Valtway ($k)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="WithValtway" fill="#10b981" name="Remaining Loss With Valtway ($k)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
