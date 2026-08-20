import React, { useState } from 'react';

export default function DemoModal({ isOpen, onClose }) {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    industry: 'Healthcare & Biologics',
    shipmentsPerMonth: '1,000 - 5,000',
    notes: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="glass-card bg-white w-full max-w-[560px] mx-auto rounded-2xl p-6 md:p-8 shadow-2xl relative border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 cursor-pointer transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {submitted ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <span className="material-symbols-outlined text-[36px]">check_circle</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900">Demo Session Requested!</h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Thank you, <strong className="text-slate-900">{formData.name || 'Valued User'}</strong>. A CryoFlow AI Cold Chain Specialist will contact you within 2 business hours with a custom simulation tailored for <strong className="text-slate-900">{formData.company || 'your organization'}</strong>.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-xl bg-[#0065FF] text-white flex items-center justify-center shadow-md shrink-0">
                <span className="material-symbols-outlined text-[22px]">calendar_today</span>
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 leading-tight">Book a Live Intelligence Demo</h3>
                <p className="text-xs text-slate-500 mt-0.5">Experience real-time shelf life prediction for your cold fleet.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Elena Vance"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-[#0065FF] text-xs font-medium text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Work Email</label>
                  <input
                    type="email"
                    required
                    placeholder="elena@biologics.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-[#0065FF] text-xs font-medium text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Company / Organization</label>
                  <input
                    type="text"
                    required
                    placeholder="Apex Life Sciences"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-[#0065FF] text-xs font-medium text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Industry Sector</label>
                  <select
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-[#0065FF] text-xs font-medium text-slate-900"
                  >
                    <option>Healthcare & Biologics</option>
                    <option>Vaccines & Pharmaceuticals</option>
                    <option>Fresh Produce & Agriculture</option>
                    <option>Dairy & Refrigerated Foods</option>
                    <option>Logistics & Carrier Partner</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Monthly Shipment Volume</label>
                  <select
                    value={formData.shipmentsPerMonth}
                    onChange={(e) => setFormData({ ...formData, shipmentsPerMonth: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-[#0065FF] text-xs font-medium text-slate-900"
                  >
                    <option>&lt; 1,000 shipments</option>
                    <option>1,000 - 5,000</option>
                    <option>5,000 - 25,000</option>
                    <option>25,000+</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Key Challenges (Optional)</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Temperature excursions in cross-country transit..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-[#0065FF] text-xs font-medium text-slate-900 resize-none"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#0065FF] hover:bg-[#0052cc] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
                Confirm & Request Demo
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
