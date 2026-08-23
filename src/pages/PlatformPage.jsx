import React, { useState } from 'react';

export default function PlatformPage({ onNavigate, onOpenDemo }) {
  const [productType, setProductType] = useState('Vaccines');
  const [ambientTemp, setAmbientTemp] = useState(8.5);
  const [transitHours, setTransitHours] = useState(24);

  const calculateMetrics = () => {
    let baseThreshold = 4.0;
    if (productType === 'mRNA Vaccines') baseThreshold = -70.0;
    if (productType === 'Vaccines') baseThreshold = 8.0;
    if (productType === 'Fresh Produce') baseThreshold = 4.0;
    if (productType === 'Dairy Products') baseThreshold = 4.0;

    let delta = ambientTemp - baseThreshold;
    if (productType === 'mRNA Vaccines') delta = ambientTemp - (-70);

    let riskPercent = 2;
    if (delta > 0) {
      riskPercent = Math.min(99.9, Math.max(5, (delta * 8.5) + (transitHours * 0.8)));
    } else {
      riskPercent = Math.max(0.5, transitHours * 0.1);
    }

    let freshness = Math.max(0, 100 - riskPercent).toFixed(1);
    let remainingLifeDays = Math.max(0, ((100 - riskPercent) * 0.14)).toFixed(1);

    let riskLevel = "LOW";
    let riskBadgeClass = "bg-emerald-100 text-emerald-800 border-emerald-300";
    if (riskPercent > 25 && riskPercent <= 60) {
      riskLevel = "MEDIUM";
      riskBadgeClass = "bg-amber-100 text-amber-800 border-amber-300";
    } else if (riskPercent > 60) {
      riskLevel = "CRITICAL BREACH";
      riskBadgeClass = "bg-red-100 text-red-800 border-red-300 animate-pulse";
    }

    return {
      riskPercent: riskPercent.toFixed(1),
      freshness,
      remainingLifeDays,
      riskLevel,
      riskBadgeClass
    };
  };

  const metrics = calculateMetrics();

  return (
    <div className="space-y-24">
      {/* Hero Section */}
      <section className="py-16 md:py-24 relative overflow-hidden flex flex-col items-center text-center">
        <div 
          className="absolute inset-0 z-[-1] opacity-15 pointer-events-none bg-cover bg-center"
          style={{ backgroundImage: `url('/assets/cold_chain_hero.png')` }}
        ></div>

        <div className="inline-flex items-center gap-2 bg-surface-container-high px-4 py-2 rounded-full mb-6 shadow-sm border border-outline-variant/60">
          <span className="material-symbols-outlined text-primary text-[20px]">verified</span>
          <span className="text-xs font-bold text-primary tracking-wider uppercase">Next-Gen Cold Chain Intelligence</span>
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl max-w-4xl tracking-tight mb-6 text-on-surface font-extrabold leading-tight">
          Prevent Waste <span className="text-[#0065FF]">Before It Happens</span>
        </h1>

        <p className="text-base md:text-xl text-on-surface-variant max-w-3xl mb-8 leading-relaxed">
          Valtway AI uses real-time cold-chain intelligence to predict spoilage, estimate remaining shelf life, and recommend proactive recovery actions before food, vaccines, and dairy products are lost.
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          <button 
            onClick={() => onNavigate('dashboard')}
            className="bg-[#0065FF] text-white font-bold text-sm px-6 py-3.5 rounded-xl hover:bg-[#0052cc] transition-all soft-shadow hover:scale-105 flex items-center gap-2.5 cursor-pointer shadow-md"
          >
            <span className="material-symbols-outlined text-[20px]">dashboard</span>
            Explore Fleet Dashboard
          </button>
          <button 
            onClick={onOpenDemo}
            className="bg-white text-on-surface border border-outline-variant font-bold text-sm px-6 py-3.5 rounded-xl hover:bg-surface-variant transition-all soft-shadow hover:scale-105 flex items-center gap-2.5 cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">calendar_today</span>
            Request Live Demo
          </button>
        </div>

        {/* Live Metrics Stats Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-4xl w-full px-2">
          <div className="glass-card bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/60 text-center">
            <p className="text-2xl md:text-3xl font-extrabold text-primary">$4.2M+</p>
            <p className="text-xs font-semibold text-on-surface-variant mt-1">Spoilage Value Saved</p>
          </div>
          <div className="glass-card bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/60 text-center">
            <p className="text-2xl md:text-3xl font-extrabold text-primary">99.98%</p>
            <p className="text-xs font-semibold text-on-surface-variant mt-1">Cargo Integrity Rate</p>
          </div>
          <div className="glass-card bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/60 text-center">
            <p className="text-2xl md:text-3xl font-extrabold text-primary">14,200+</p>
            <p className="text-xs font-semibold text-on-surface-variant mt-1">Active Sensor Nodes</p>
          </div>
          <div className="glass-card bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/60 text-center">
            <p className="text-2xl md:text-3xl font-extrabold text-primary">&lt; 15s</p>
            <p className="text-xs font-semibold text-on-surface-variant mt-1">Excursion Alert Speed</p>
          </div>
        </div>
      </section>

      {/* Feature Cards Bento */}
      <section className="py-md">
        <div className="text-center max-w-2xl mx-auto mb-xl">
          <h2 className="font-headline-lg text-headline-lg md:text-[32px] text-on-surface font-bold">Core Platform Capabilities</h2>
          <p className="font-body-md text-on-surface-variant mt-2">Continuous environmental sensing powered by kinetic degradation machine learning.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          <div className="glass-card rounded-xl p-lg soft-shadow flex flex-col hover:-translate-y-1 transition-transform duration-300 border-t-4 border-t-primary">
            <span className="material-symbols-outlined text-primary text-3xl mb-md">monitor_heart</span>
            <h3 className="font-headline-md text-headline-md text-on-surface mb-sm">Real-Time Monitoring</h3>
            <p className="font-body-md text-body-md text-on-surface-variant">Continuous tracking of GPS, Temperature, Humidity, and Door Open events across your entire multi-modal fleet.</p>
          </div>

          <div className="glass-card rounded-xl p-lg soft-shadow flex flex-col hover:-translate-y-1 transition-transform duration-300 border-t-4 border-t-primary">
            <span className="material-symbols-outlined text-primary text-3xl mb-md">calendar_month</span>
            <h3 className="font-headline-md text-headline-md text-on-surface mb-sm">Shelf-Life Prediction</h3>
            <p className="font-body-md text-body-md text-on-surface-variant">Dynamic Freshness Score and Predicted Expiry calculated continuously using thermal integration models.</p>
          </div>

          <div className="glass-card rounded-xl p-lg soft-shadow flex flex-col hover:-translate-y-1 transition-transform duration-300 border-t-4 border-t-error">
            <span className="material-symbols-outlined text-error text-3xl mb-md">warning</span>
            <h3 className="font-headline-md text-headline-md text-on-surface mb-sm">Spoilage Risk Modeling</h3>
            <p className="font-body-md text-body-md text-on-surface-variant">Automated risk categorization (Low/Medium/High) and exact risk percentage forecast before physical spoilage occurs.</p>
          </div>
        </div>
      </section>

      {/* Interactive Spoilage Predictor Engine Widget */}
      <section className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-lg md:p-xl shadow-lg">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-center">
          <div className="lg:col-span-5 space-y-md">
            <div className="inline-flex items-center gap-2 bg-primary-container/10 px-3 py-1 rounded-full text-primary font-label-md text-xs">
              <span className="material-symbols-outlined text-[16px]">calculate</span>
              Interactive AI Predictor
            </div>
            <h2 className="text-headline-lg font-bold text-on-surface">Simulate Thermal Excursion Impact</h2>
            <p className="text-body-md text-on-surface-variant">
              Adjust environmental variables below to witness how Valtway AI predicts freshness degradation and calculates remaining shelf life in real time.
            </p>

            <div className="space-y-md pt-sm">
              <div>
                <label className="block font-label-md text-xs text-on-surface-variant mb-1">Cargo Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Vaccines', 'mRNA Vaccines', 'Fresh Produce', 'Dairy Products'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setProductType(type)}
                      className={`px-3 py-2 rounded-lg text-xs font-label-md transition-all ${
                        productType === type
                          ? 'bg-primary text-white font-bold shadow'
                          : 'bg-surface hover:bg-surface-container text-on-surface border border-outline-variant'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-label-md mb-1">
                  <span className="text-on-surface-variant">Ambient Sensor Temp (°C)</span>
                  <span className="font-bold text-primary">{ambientTemp}°C</span>
                </div>
                <input
                  type="range"
                  min={productType === 'mRNA Vaccines' ? -90 : -10}
                  max={productType === 'mRNA Vaccines' ? -50 : 35}
                  step="0.5"
                  value={ambientTemp}
                  onChange={(e) => setAmbientTemp(parseFloat(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-label-md mb-1">
                  <span className="text-on-surface-variant">Transit Excursion Duration (Hours)</span>
                  <span className="font-bold text-primary">{transitHours} hrs</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="120"
                  step="1"
                  value={transitHours}
                  onChange={(e) => setTransitHours(parseInt(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-surface-container rounded-xl p-lg border border-outline-variant/40 space-y-md">
            <div className="flex justify-between items-center pb-sm border-b border-outline-variant/30">
              <span className="font-label-md text-xs text-on-surface-variant">AI Assessment Output</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${metrics.riskBadgeClass}`}>
                Risk: {metrics.riskLevel} ({metrics.riskPercent}%)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-md">
              <div className="bg-surface-container-lowest p-md rounded-lg text-center border border-outline-variant/30">
                <p className="text-xs font-label-md text-on-surface-variant">Freshness Index</p>
                <p className="text-3xl font-extrabold text-primary mt-1">{metrics.freshness}%</p>
              </div>

              <div className="bg-surface-container-lowest p-md rounded-lg text-center border border-outline-variant/30">
                <p className="text-xs font-label-md text-on-surface-variant">Est. Shelf Life Left</p>
                <p className="text-3xl font-extrabold text-on-surface mt-1">{metrics.remainingLifeDays} <span className="text-xs font-normal">Days</span></p>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-md rounded-lg border border-outline-variant/30 space-y-2">
              <p className="text-xs font-label-md text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-primary text-[16px]">psychology</span>
                Recommended Recovery Action:
              </p>
              <p className="text-sm font-body-md text-on-surface font-semibold">
                {metrics.riskLevel === 'CRITICAL BREACH' 
                  ? "CRITICAL ALERT: Immediately reroute to nearest refrigerated hub or apply active emergency LN2 purge."
                  : metrics.riskLevel === 'MEDIUM'
                  ? "WARNING: Adjust compressor cooling setpoint -2.5°C and prioritize priority lane dispatch."
                  : "NORMAL: Cargo parameters within safe kinetic stability window. No action needed."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Diagram */}
      <section className="py-md">
        <div className="text-center max-w-2xl mx-auto mb-xl">
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">Closed-Loop Recovery Architecture</h2>
          <p className="font-body-md text-on-surface-variant mt-2">How Valtway AI turns raw telemetry into automated risk mitigation.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-md relative">
          <div className="glass-card rounded-xl p-lg text-center space-y-sm relative">
            <div className="w-12 h-12 bg-blue-100 text-[#0065FF] rounded-xl flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[24px]">sensors</span>
            </div>
            <h4 className="font-bold text-on-surface text-base">1. Multi-Sensor Ingestion</h4>
            <p className="text-xs text-on-surface-variant">5G IoT trackers stream continuous Temp, GPS, Light, & Shock payload every 10s.</p>
          </div>

          <div className="glass-card rounded-xl p-lg text-center space-y-sm relative">
            <div className="w-12 h-12 bg-blue-100 text-[#0065FF] rounded-xl flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[24px]">insights</span>
            </div>
            <h4 className="font-bold text-on-surface text-base">2. Thermal Integration</h4>
            <p className="text-xs text-on-surface-variant">XGBoost degradation models integrate time-above-threshold curves.</p>
          </div>

          <div className="glass-card rounded-xl p-lg text-center space-y-sm relative">
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[24px]">notifications_active</span>
            </div>
            <h4 className="font-bold text-on-surface text-base">3. Early Warning Dispatch</h4>
            <p className="text-xs text-on-surface-variant">Instant push alerts to dispatchers before irreversible spoilage occurs.</p>
          </div>

          <div className="glass-card rounded-xl p-lg text-center space-y-sm relative border border-primary">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[24px]">published_with_changes</span>
            </div>
            <h4 className="font-bold text-on-surface text-base">4. Automated Recovery</h4>
            <p className="text-xs text-on-surface-variant">Dynamic rerouting to cold storage hubs & automated carrier claim generation.</p>
          </div>
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="bg-gradient-to-r from-primary-container to-[#0065FF] text-white rounded-2xl p-lg md:p-xl text-center shadow-xl space-y-md">
        <h2 className="text-2xl md:text-4xl font-extrabold">Ready to Eliminate Cold Chain Losses?</h2>
        <p className="max-w-2xl mx-auto text-blue-100 text-sm md:text-base">
          Join leading biopharma manufacturers, food distributors, and global carriers protecting billions in cold cargo.
        </p>
        <div className="pt-sm flex justify-center gap-md">
          <button
            onClick={onOpenDemo}
            className="bg-white text-primary font-bold px-lg py-3 rounded-lg hover:bg-slate-100 transition-all shadow-md"
          >
            Book Custom Enterprise Demo
          </button>
        </div>
      </section>
    </div>
  );
}
