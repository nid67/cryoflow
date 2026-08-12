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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-on-surface/50 backdrop-blur-sm animate-fadeIn">
      <div className="glass-card bg-surface-container-lowest max-w-lg w-full rounded-2xl p-lg md:p-xl shadow-2xl relative border border-outline-variant">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-on-surface-variant hover:text-primary p-2 rounded-full hover:bg-surface-container"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        {submitted ? (
          <div className="text-center py-xl space-y-md">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <span className="material-symbols-outlined text-[36px]">check_circle</span>
            </div>
            <h3 className="text-headline-md font-bold text-on-surface">Demo Session Requested!</h3>
            <p className="text-body-md text-on-surface-variant max-w-sm mx-auto">
              Thank you, <strong className="text-on-surface">{formData.name || 'Valued User'}</strong>. A CryoFlow AI Cold Chain Specialist will contact you within 2 business hours with a custom simulation tailored for {formData.company || 'your organization'}.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-md">
              <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-white">
                <span className="material-symbols-outlined">calendar_today</span>
              </div>
              <div>
                <h3 className="text-headline-md font-bold text-on-surface">Book a Live Intelligence Demo</h3>
                <p className="text-body-md text-on-surface-variant text-xs">Experience real-time shelf life prediction for your cold fleet.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-md mt-lg">
              <div>
                <label className="block font-label-md text-xs text-on-surface-variant mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Elena Vance"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-md py-2.5 rounded-lg border border-outline-variant bg-surface focus:outline-none focus:border-primary text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <div>
                  <label className="block font-label-md text-xs text-on-surface-variant mb-1">Work Email</label>
                  <input
                    type="email"
                    required
                    placeholder="elena@biologics.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-md py-2.5 rounded-lg border border-outline-variant bg-surface focus:outline-none focus:border-primary text-sm"
                  />
                </div>
                <div>
                  <label className="block font-label-md text-xs text-on-surface-variant mb-1">Company / Organization</label>
                  <input
                    type="text"
                    required
                    placeholder="Apex Life Sciences"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-md py-2.5 rounded-lg border border-outline-variant bg-surface focus:outline-none focus:border-primary text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <div>
                  <label className="block font-label-md text-xs text-on-surface-variant mb-1">Industry Sector</label>
                  <select
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full px-md py-2.5 rounded-lg border border-outline-variant bg-surface focus:outline-none focus:border-primary text-sm"
                  >
                    <option>Healthcare & Biologics</option>
                    <option>Vaccines & Pharmaceuticals</option>
                    <option>Fresh Produce & Agriculture</option>
                    <option>Dairy & Refrigerated Foods</option>
                    <option>Logistics & Carrier Partner</option>
                  </select>
                </div>
                <div>
                  <label className="block font-label-md text-xs text-on-surface-variant mb-1">Monthly Shipment Volume</label>
                  <select
                    value={formData.shipmentsPerMonth}
                    onChange={(e) => setFormData({ ...formData, shipmentsPerMonth: e.target.value })}
                    className="w-full px-md py-2.5 rounded-lg border border-outline-variant bg-surface focus:outline-none focus:border-primary text-sm"
                  >
                    <option>&lt; 1,000 shipments</option>
                    <option>1,000 - 5,000</option>
                    <option>5,000 - 25,000</option>
                    <option>25,000+</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-label-md text-xs text-on-surface-variant mb-1">Key Challenges (Optional)</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Temperature excursions in cross-country transit..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-md py-2 rounded-lg border border-outline-variant bg-surface focus:outline-none focus:border-primary text-sm resize-none"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-lg bg-[#0065FF] hover:bg-[#0052cc] text-white font-label-md font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">send</span>
                Confirm & Request Demo
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
