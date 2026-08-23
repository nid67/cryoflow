import React, { useState } from 'react';

export default function ImpactPage({ onOpenDemo }) {
  const [annualShipments, setAnnualShipments] = useState(25000);
  const [avgCargoValue, setAvgCargoValue] = useState(18000); // $
  const [spoilageRate, setSpoilageRate] = useState(3.2); // %

  // Calculation Engine
  const totalValueAtRisk = annualShipments * avgCargoValue;
  const currentAnnualLoss = totalValueAtRisk * (spoilageRate / 100);
  const valtwaySavings = currentAnnualLoss * 0.86; // 86% average reduction in spoilage
  const co2PreventedTons = Math.round(annualShipments * (spoilageRate / 100) * 1.85);
  const rescuedUnitsCount = Math.round(annualShipments * (spoilageRate / 100) * 45);

  return (
    <div className="space-y-16">
      {/* Header */}
      <section className="text-center max-w-3xl mx-auto py-6 space-y-3">
        <div className="inline-flex items-center gap-2 bg-emerald-100 px-4 py-1.5 rounded-full text-emerald-800 font-bold text-xs border border-emerald-300">
          <span className="material-symbols-outlined text-[18px]">eco</span>
          ROI & Environmental Sustainability Estimator
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-on-surface">Quantify Your Cold Chain Savings</h1>
        <p className="text-base text-on-surface-variant leading-relaxed">
          See how much your organization can save in financial value, rescued product, and CO2 emission reductions with Valtway AI.
        </p>
      </section>

      {/* Interactive Calculator Section */}
      <section className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-6 md:p-10 shadow-xl max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Slider Inputs Column */}
          <div className="lg:col-span-6 space-y-6">
            <h3 className="text-xl font-extrabold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[24px]">tune</span>
              Organization Operational Inputs
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-on-surface-variant">Annual Cold Chain Shipments</span>
                  <span className="text-primary font-mono text-sm">{annualShipments.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="100000"
                  step="1000"
                  value={annualShipments}
                  onChange={(e) => setAnnualShipments(parseInt(e.target.value))}
                  className="w-full accent-primary h-2 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-on-surface-variant">Average Cargo Value ($ USD)</span>
                  <span className="text-primary font-mono text-sm">${avgCargoValue.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="100000"
                  step="1000"
                  value={avgCargoValue}
                  onChange={(e) => setAvgCargoValue(parseInt(e.target.value))}
                  className="w-full accent-primary h-2 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-on-surface-variant">Baseline Spoilage / Loss Rate (%)</span>
                  <span className="text-red-600 font-mono text-sm">{spoilageRate}%</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="10.0"
                  step="0.1"
                  value={spoilageRate}
                  onChange={(e) => setSpoilageRate(parseFloat(e.target.value))}
                  className="w-full accent-red-500 h-2 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Savings Display Column */}
          <div className="lg:col-span-6 bg-gradient-to-br from-[#071328] to-slate-900 text-white rounded-2xl p-8 space-y-6 shadow-2xl border border-slate-800">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimated Annual Financial Loss Prevented</p>
              <h2 className="text-4xl md:text-5xl font-black text-cyan-400 mt-2 font-mono">${(valtwaySavings / 1000000).toFixed(2)}M / yr</h2>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-4 text-xs font-semibold">
              <div>
                <p className="text-slate-400">CO2 Emissions Reduced</p>
                <p className="text-lg font-bold text-teal-400 mt-1">{co2PreventedTons.toLocaleString()} Metric Tons</p>
              </div>
              <div>
                <p className="text-slate-400">Rescued Product Doses</p>
                <p className="text-lg font-bold text-emerald-400 mt-1">{rescuedUnitsCount.toLocaleString()} Units</p>
              </div>
            </div>

            <button
              onClick={onOpenDemo}
              className="w-full py-3.5 bg-[#0065FF] hover:bg-[#0052cc] text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">assessment</span>
              Request Custom Enterprise Audit
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
