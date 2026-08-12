import React, { useState } from 'react';

export default function TechnologyPage({ onOpenDemo }) {
  const [apiPayload, setApiPayload] = useState({
    sensor_id: "SN-99821-X",
    temp_celsius: 4.2,
    humidity_percent: 54,
    gps: { lat: 41.8781, lng: -87.6298 },
    door_state: "CLOSED"
  });

  const [apiResult, setApiResult] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const handleTestPayload = () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setApiResult({
        status: 200,
        message: "Telemetry payload ingested successfully",
        spoilage_risk_percent: 1.8,
        freshness_index: 99.2,
        action_required: "NONE",
        timestamp_utc: new Date().toISOString()
      });
    }, 800);
  };

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="mb-12 text-center md:text-left py-12 border-b border-outline-variant/30">
        <div className="inline-flex items-center gap-2 bg-surface-container-high px-4 py-2 rounded-full mb-4 shadow-sm border border-outline-variant/60">
          <span className="material-symbols-outlined text-primary text-[20px]">memory</span>
          <span className="text-xs font-bold text-primary tracking-wider uppercase">Architecture & Security</span>
        </div>
        <h1 className="text-4xl md:text-5xl text-on-surface mb-4 font-extrabold leading-tight">The Intelligence Behind the Integrity</h1>
        <p className="text-base md:text-lg text-on-surface-variant max-w-3xl leading-relaxed">
          Our platform leverages a sophisticated stack of multi-modal sensory networks, advanced predictive machine learning, and enterprise-grade security protocols to ensure absolute cold chain reliability.
        </p>
      </section>

      {/* Bento Grid Layout matching design */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* IoT & Sensor Fusion */}
        <div className="md:col-span-8 bg-surface-container-lowest rounded-2xl border border-outline-variant/60 p-6 shadow-md hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-primary text-[28px]">sensors</span>
            <h2 className="text-xl text-on-surface font-extrabold">IoT & Sensor Fusion</h2>
          </div>
          <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">Continuous ingestion of telemetry from diverse hardware ecosystems. We harmonize disparate data streams into a unified truth.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-surface p-4 rounded-xl border border-outline-variant/40 flex flex-col items-center justify-center text-center">
              <span className="material-symbols-outlined text-secondary text-[24px] mb-1">thermostat</span>
              <span className="text-xs text-on-surface font-bold">Temperature</span>
            </div>
            <div className="bg-surface p-4 rounded-xl border border-outline-variant/40 flex flex-col items-center justify-center text-center">
              <span className="material-symbols-outlined text-secondary text-[24px] mb-1">water_drop</span>
              <span className="text-xs text-on-surface font-bold">Humidity</span>
            </div>
            <div className="bg-surface p-4 rounded-xl border border-outline-variant/40 flex flex-col items-center justify-center text-center">
              <span className="material-symbols-outlined text-secondary text-[24px] mb-1">location_on</span>
              <span className="text-xs text-on-surface font-bold">GPS & Altitude</span>
            </div>
            <div className="bg-surface p-4 rounded-xl border border-outline-variant/40 flex flex-col items-center justify-center text-center">
              <span className="material-symbols-outlined text-secondary text-[24px] mb-1">vibration</span>
              <span className="text-xs text-on-surface font-bold">Shock & Tilt</span>
            </div>
          </div>
        </div>

        {/* 21 CFR Part 11 */}
        <div className="md:col-span-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/60 p-6 shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-emerald-600 text-[28px]">verified_user</span>
              <h2 className="text-xl text-on-surface font-extrabold">21 CFR Part 11</h2>
            </div>
            <p className="text-sm text-on-surface-variant mb-4 leading-relaxed">Full GxP compliance with cryptographically signed, immutable audit trails for every telemetry entry.</p>
          </div>
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
              <span className="material-symbols-outlined text-[18px]">lock</span>
              Tamper-Proof Ledger
            </div>
            <p className="text-[11px] text-emerald-700 mt-1 font-mono">SHA-256 Checksum Signature Verified</p>
          </div>
        </div>

        {/* Predictive AI Engine */}
        <div className="md:col-span-6 bg-surface-container-lowest rounded-2xl border border-outline-variant/60 p-6 shadow-md hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-purple-600 text-[28px]">psychology</span>
            <h2 className="text-xl text-on-surface font-extrabold">Predictive AI Engine</h2>
          </div>
          <p className="text-sm text-on-surface-variant mb-4 leading-relaxed">Machine learning algorithms trained on thermal degradation curves estimate exact remaining shelf life (RSL) in real-time.</p>
          <div className="p-4 bg-slate-900 text-white rounded-xl font-mono text-xs space-y-1">
            <p className="text-purple-400 font-bold">// Kinetic Thermal Degradation Model</p>
            <p className="text-slate-300">RSL = ∫ f(T(t), H(t), Category) dt</p>
            <p className="text-emerald-400">Confidence Score: 98.4% Accuracy</p>
          </div>
        </div>

        {/* Live Interactive Sandbox */}
        <div className="md:col-span-6 bg-surface-container-lowest rounded-2xl border border-outline-variant/60 p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#0065FF] text-[28px]">code</span>
              <h2 className="text-xl text-on-surface font-extrabold">REST API Telemetry Sandbox</h2>
            </div>
            <button
              onClick={handleTestPayload}
              disabled={isSending}
              className="px-4 py-2 bg-[#0065FF] text-white text-xs font-bold rounded-xl hover:bg-[#0052cc] transition-all cursor-pointer"
            >
              {isSending ? 'Transmitting...' : 'Send Test Ingest'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 bg-slate-900 text-slate-200 rounded-xl space-y-1">
              <p className="text-cyan-400 font-bold">// Input Telemetry Request</p>
              <pre className="text-[11px] whitespace-pre-wrap">{JSON.stringify(apiPayload, null, 2)}</pre>
            </div>

            <div className="p-3 bg-slate-950 text-slate-200 rounded-xl space-y-1">
              <p className="text-emerald-400 font-bold">// Response Payload</p>
              {apiResult ? (
                <pre className="text-[11px] whitespace-pre-wrap">{JSON.stringify(apiResult, null, 2)}</pre>
              ) : (
                <p className="text-slate-500 italic">Click "Send Test Ingest" to simulate FastAPI ingestion response.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
