import React, { useState } from 'react';

export default function HealthcarePage({ onNavigate, onOpenDemo }) {
  const [activeSolution, setActiveSolution] = useState('vaccines');

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative min-h-[540px] flex items-center justify-center overflow-hidden rounded-3xl border border-outline-variant/40 shadow-xl my-6 bg-surface">
        {/* Background Image Layer */}
        <div 
          className="absolute inset-0 z-0 w-full h-full bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url('/assets/medical_biologics.png')` }}
        ></div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-surface-container-lowest/95 via-surface-container-lowest/85 to-transparent"></div>

        <div className="relative z-20 max-w-7xl mx-auto px-6 md:px-10 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-12">
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 bg-surface-container-high px-4 py-2 rounded-full w-fit border border-outline-variant/60 shadow-sm">
              <span className="material-symbols-outlined text-primary text-[20px]">verified_user</span>
              <span className="text-xs font-bold text-primary tracking-wider uppercase">Healthcare & Life Sciences</span>
            </div>

            <h1 className="text-4xl md:text-5xl text-on-background max-w-2xl font-extrabold leading-tight">
              Protecting <span className="text-[#0065FF]">Life-Saving Biologics</span>
            </h1>

            <p className="text-base md:text-lg text-on-surface-variant max-w-xl leading-relaxed">
              Precision cold chain intelligence for vaccines, blood products, and advanced gene therapies. Ensure 100% regulatory compliance and efficacy from manufacturing to point-of-care.
            </p>

            <div className="flex flex-wrap gap-4 mt-2">
              <button 
                onClick={() => onNavigate('dashboard')}
                className="bg-[#0065FF] text-white font-bold text-sm px-6 py-3.5 rounded-xl shadow-md hover:bg-[#0052cc] transition-all hover:scale-105 cursor-pointer"
              >
                Explore Live Telemetry
              </button>
              <button 
                onClick={onOpenDemo}
                className="bg-surface-container-lowest border border-outline-variant text-on-surface font-bold text-sm px-6 py-3.5 rounded-xl hover:bg-surface-container-low transition-all cursor-pointer shadow-sm"
              >
                Talk to Biopharma Sales
              </button>
            </div>
          </div>

          {/* Bento Style Hero Graphic Card */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-4">
            <div className="glass-card bg-surface-container-lowest rounded-2xl p-6 flex flex-col justify-between shadow-xl border border-outline-variant/60 col-span-1 row-span-2 space-y-4">
              <div>
                <p className="text-xs font-semibold text-on-surface-variant mb-1">Vaccine Stability Index</p>
                <h3 className="text-3xl text-primary font-extrabold">99.8%</h3>
              </div>

              {/* Sparkline Visual */}
              <div className="h-32 bg-surface-container rounded-xl flex items-end p-2 gap-1 border border-outline-variant/30">
                <div className="w-full h-[40%] bg-[#0065FF] rounded-t-sm opacity-30"></div>
                <div className="w-full h-[55%] bg-[#0065FF] rounded-t-sm opacity-50"></div>
                <div className="w-full h-[70%] bg-[#0065FF] rounded-t-sm opacity-75"></div>
                <div className="w-full h-[90%] bg-[#0065FF] rounded-t-sm opacity-90"></div>
                <div className="w-full h-[98%] bg-[#0065FF] rounded-t-sm"></div>
              </div>

              <div className="flex items-center gap-1.5 text-emerald-800 bg-emerald-100 w-fit px-3 py-1 rounded-full border border-emerald-300">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                <span className="text-[11px] font-bold">Optimal Integrity</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-[#0065FF] shrink-0">
                <span className="material-symbols-outlined text-[28px]">ac_unit</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-on-surface-variant">Live Temp Sensor</p>
                <p className="text-lg text-on-background font-extrabold">-80.5°C</p>
              </div>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                <span className="material-symbols-outlined text-[28px]">task_alt</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-on-surface-variant">Audit Standard</p>
                <p className="text-lg text-on-background font-extrabold">21 CFR Part 11</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Solutions Tabs */}
      <section className="py-4">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h2 className="text-3xl md:text-4xl text-on-background font-extrabold mb-3">End-to-End Healthcare Logistics</h2>
          <p className="text-base text-on-surface-variant">Specialized monitoring tailored for the strict demands of clinical environments and life sciences distribution.</p>
        </div>

        <div className="flex justify-center gap-3 mb-8 flex-wrap">
          {[
            { id: 'vaccines', label: 'mRNA & Vaccines', icon: 'vaccines' },
            { id: 'blood', label: 'Blood & Plasma', icon: 'bloodtype' },
            { id: 'therapies', label: 'Cell & Gene Therapies', icon: 'science' },
            { id: 'pharma', label: 'Pharma API Payload', icon: 'medication' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSolution(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSolution === tab.id
                  ? 'bg-[#0065FF] text-white shadow-md'
                  : 'bg-surface-container-lowest border border-outline-variant text-on-surface hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Detail Banner */}
        <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/60 shadow-xl max-w-4xl mx-auto space-y-4">
          {activeSolution === 'vaccines' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#0065FF] text-[32px]">vaccines</span>
                <h3 className="text-xl font-extrabold text-on-surface">mRNA & Ultra-Cold Vaccine Management</h3>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Requires continuous LN2 dry shipper monitoring between -90°C and -60°C. Valtway AI alerts operations within 10 seconds of ambient heat transfer anomalies before core dry-ice sublimation reaches critical levels.
              </p>
            </div>
          )}
          {activeSolution === 'blood' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-red-600 text-[32px]">bloodtype</span>
                <h3 className="text-xl font-extrabold text-on-surface">Blood Bank & Whole Plasma Supply Chain</h3>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Strict 2°C to 6°C refrigeration enforcement. Integrated shock and agitation sensory arrays detect rough road transit that can rupture red blood cell cell membranes.
              </p>
            </div>
          )}
          {activeSolution === 'therapies' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-purple-600 text-[32px]">science</span>
                <h3 className="text-xl font-extrabold text-on-surface">Autologous Cell & Gene Therapy Logistics</h3>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Patient-specific biological materials with zero margin for error. Real-time chain of custody verification combined with predictive ETA tracking to ensure hospital lab readiness.
              </p>
            </div>
          )}
          {activeSolution === 'pharma' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-emerald-600 text-[32px]">medication</span>
                <h3 className="text-xl font-extrabold text-on-surface">Active Pharmaceutical Ingredients (API)</h3>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Bulk pharmaceutical chemical transport between -20°C and 25°C controlled room temperature (CRT). Automated GxP validation report generation for quality assurance approval.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
