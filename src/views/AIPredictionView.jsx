import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

export default function AIPredictionView({ initialShipmentId, onNavigateToDecision }) {
  const [shipments, setShipments] = useState([]);
  const [selectedId, setSelectedId] = useState(initialShipmentId || '');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchShipmentsList = async () => {
      try {
        const list = await apiService.getShipments();
        setShipments(list);
        if (!selectedId && list.length > 0) {
          setSelectedId(list[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchShipmentsList();
  }, []);

  const selectedShipment = shipments.find((s) => s.id === selectedId);

  const handleRunPrediction = async () => {
    if (!selectedId) return;
    try {
      setLoading(true);
      setPrediction(null);
      setError('');

      const [res] = await Promise.all([
        apiService.runPrediction(selectedId),
        new Promise((resolve) => setTimeout(resolve, 1800)) // Realistic ML computation delay
      ]);

      setPrediction(res);
    } catch (err) {
      console.error(err);
      setError('Error running AI prediction: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 shadow-sm space-y-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#0065FF] text-[28px]">psychology</span>
          <h1 className="text-2xl font-extrabold text-on-surface">AI Risk & Shelf-Life Predictor</h1>
        </div>
        <p className="text-xs text-on-surface-variant">
          Select any active shipment to calculate its remaining shelf life, spoilage risk percentage, health score, and carbon impact.
        </p>
      </div>

      {/* Selector & Trigger Card */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
          <div className="sm:col-span-8">
            <label className="block text-xs font-bold text-on-surface mb-2 uppercase">Select Shipment to Analyze</label>
            <select
              value={selectedId}
              onChange={(e) => {
                setSelectedId(e.target.value);
                setPrediction(null);
              }}
              className="w-full p-3 rounded-xl border border-outline-variant bg-surface text-sm font-semibold text-on-surface focus:border-primary"
            >
              {shipments.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id} - {s.product_name} ({s.product_category}) | Temp: {s.current_temp > 0 ? `+${s.current_temp}` : s.current_temp}°C | Status: {s.current_status}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-4">
            <button
              onClick={handleRunPrediction}
              disabled={loading || !selectedId}
              className="w-full py-3 bg-[#0065FF] hover:bg-[#0052cc] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Running ML Model...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                  Run AI Prediction
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold">
          {error}
        </div>
      )}

      {/* Prominent ML Model Loading Card */}
      {loading && (
        <div className="bg-surface-container-lowest p-8 rounded-2xl border border-primary/40 shadow-xl space-y-4 text-center animate-fadeIn min-h-[220px] flex flex-col items-center justify-center w-full">
          <div className="w-14 h-14 rounded-full border-4 border-primary border-t-transparent animate-spin flex items-center justify-center mb-1">
            <span className="material-symbols-outlined text-[28px] text-primary">psychology</span>
          </div>

          <div className="space-y-2 w-full text-center" style={{ width: '100%', maxWidth: '680px', margin: '0 auto' }}>
            <h3 className="text-base sm:text-lg font-black text-on-surface leading-normal">
              Running ML Model on <span className="text-primary">{selectedShipment?.product_name || selectedId}</span>...
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Please wait while computing Arrhenius kinetic degradation curves, thermal excursion risk vectors, and remaining shelf life predictions.
            </p>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200 mt-2" style={{ width: '100%', maxWidth: '400px', margin: '8px auto 0 auto' }}>
            <div className="bg-primary h-full rounded-full animate-pulse w-3/4"></div>
          </div>
        </div>
      )}

      {/* Prediction Output Results Display */}
      {prediction && (
        <div className="glass-card bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 shadow-xl space-y-6 animate-fadeIn">
          <div className="flex justify-between items-center pb-3 border-b border-outline-variant/40">
            <div>
              <span className="text-xs font-bold text-primary uppercase tracking-wider">AI Analysis Result</span>
              <h2 className="text-xl font-extrabold text-on-surface">{prediction.shipment_id} - {prediction.product_name}</h2>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Model Confidence</span>
              <span className="text-sm font-extrabold text-emerald-600">{prediction.confidence_score_percent}%</span>
            </div>
          </div>

          {/* 6 Key AI Computed Result Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-surface p-4 rounded-xl border border-outline-variant/40 text-center">
              <p className="text-[10px] font-label-md text-on-surface-variant uppercase">Remaining Shelf Life</p>
              <p className="text-2xl font-extrabold text-primary mt-1">{prediction.remaining_shelf_life_days} <span className="text-xs font-normal">Days</span></p>
            </div>

            <div className="bg-surface p-4 rounded-xl border border-outline-variant/40 text-center">
              <p className="text-[10px] font-label-md text-on-surface-variant uppercase">Spoilage Risk</p>
              <p className={`text-2xl font-extrabold mt-1 ${prediction.spoilage_risk_percent > 30 ? 'text-red-600' : 'text-emerald-600'}`}>
                {prediction.spoilage_risk_percent}%
              </p>
            </div>

            <div className="bg-surface p-4 rounded-xl border border-outline-variant/40 text-center">
              <p className="text-[10px] font-label-md text-on-surface-variant uppercase">Health Score</p>
              <p className="text-2xl font-extrabold text-emerald-700 mt-1">{prediction.health_score} / 100</p>
            </div>

            <div className="bg-surface p-4 rounded-xl border border-outline-variant/40 text-center">
              <p className="text-[10px] font-label-md text-on-surface-variant uppercase">Financial Loss</p>
              <p className="text-2xl font-extrabold text-amber-700 mt-1">${prediction.estimated_financial_loss_usd.toLocaleString()}</p>
            </div>

            <div className="bg-surface p-4 rounded-xl border border-outline-variant/40 text-center">
              <p className="text-[10px] font-label-md text-on-surface-variant uppercase">Carbon Impact</p>
              <p className="text-2xl font-extrabold text-teal-600 mt-1">{prediction.estimated_carbon_impact_kg} kg</p>
            </div>

            <div className="bg-surface p-4 rounded-xl border border-outline-variant/40 text-center">
              <p className="text-[10px] font-label-md text-on-surface-variant uppercase">Current Temp</p>
              <p className="text-2xl font-extrabold text-on-surface mt-1">{prediction.current_temp}°C</p>
            </div>
          </div>

          {/* AI Recommendation Box */}
          <div className="bg-primary-container/10 p-5 rounded-xl border border-primary/30 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-primary uppercase flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">psychology</span>
                AI Prescriptive Action Recommendation
              </span>

              {prediction.spoilage_risk_percent > 20 && (
                <button
                  onClick={() => onNavigateToDecision(prediction.shipment_id)}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">bolt</span>
                  Open Decision Center →
                </button>
              )}
            </div>

            <p className="text-sm font-semibold text-on-surface leading-relaxed">
              {prediction.ai_recommendation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
