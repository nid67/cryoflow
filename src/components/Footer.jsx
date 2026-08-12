import React from 'react';

export default function Footer({ setActiveTab, onOpenDemo }) {
  return (
    <footer className="bg-surface-container-highest dark:bg-inverse-surface text-on-surface dark:text-inverse-on-surface w-full py-xl border-t border-outline-variant mt-24">
      <div className="max-w-7xl mx-auto px-lg flex flex-col md:flex-row justify-between items-center gap-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-[18px]">ac_unit</span>
          </div>
          <span className="font-headline-md text-headline-md font-bold text-on-surface dark:text-inverse-on-surface">
            CryoFlow AI
          </span>
        </div>

        <div className="flex flex-wrap gap-md justify-center">
          <button onClick={() => setActiveTab('platform')} className="text-on-surface-variant hover:text-primary underline transition-all font-label-md text-label-md">
            Platform
          </button>
          <button onClick={() => setActiveTab('healthcare')} className="text-on-surface-variant hover:text-primary underline transition-all font-label-md text-label-md">
            Healthcare
          </button>
          <button onClick={() => setActiveTab('dashboard')} className="text-on-surface-variant hover:text-primary underline transition-all font-label-md text-label-md">
            Fleet Intelligence
          </button>
          <button onClick={() => setActiveTab('technology')} className="text-on-surface-variant hover:text-primary underline transition-all font-label-md text-label-md">
            Tech & Security
          </button>
          <button onClick={() => setActiveTab('impact')} className="text-on-surface-variant hover:text-primary underline transition-all font-label-md text-label-md">
            ROI Calculator
          </button>
          <a href="#privacy" onClick={(e) => { e.preventDefault(); alert("CryoFlow AI adheres strictly to SOC2 Type II, ISO 27001, and 21 CFR Part 11 electronic records security standards."); }} className="text-on-surface-variant hover:text-primary underline transition-all font-label-md text-label-md">
            Privacy & Compliance
          </a>
        </div>

        <p className="font-body-md text-body-md text-on-surface-variant text-center md:text-right">
          © 2026 CryoFlow AI. All rights reserved. Global cold chain intelligence.
        </p>
      </div>
    </footer>
  );
}
