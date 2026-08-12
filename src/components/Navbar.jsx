import React, { useState } from 'react';

export default function Navbar({ activeTab, setActiveTab, onOpenDemo, onOpenLogin, user, onLogout, isConsoleTab }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'platform', label: 'Platform' },
    { id: 'healthcare', label: 'Healthcare Solutions' },
    { id: 'dashboard', label: 'Fleet Dashboard' },
    { id: 'technology', label: 'Technology & AI' },
    { id: 'impact', label: 'ROI & Impact' },
  ];

  const handleNavClick = (id) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="bg-surface/90 dark:bg-surface/90 backdrop-blur-md fixed top-0 w-full z-50 border-b border-outline-variant/30 shadow-sm transition-all">
      <div className={`flex justify-between items-center w-full h-[72px] ${isConsoleTab ? 'px-4' : 'px-4 md:px-lg max-w-7xl mx-auto'}`}>
        {/* Brand Container - Aligned with Sidebar width in Console Mode */}
        <div className={`flex items-center gap-3 cursor-pointer ${isConsoleTab ? 'w-64 shrink-0' : ''}`} onClick={() => handleNavClick('platform')}>
          <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-white shadow-md shrink-0">
            <span className="material-symbols-outlined text-[24px]">ac_unit</span>
          </div>
          <div>
            <span className="text-headline-md font-headline-md font-bold text-on-surface dark:text-inverse-on-surface tracking-tight">
              CryoFlow <span className="text-primary-container">AI</span>
            </span>
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-label-md text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full w-fit">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>100% Operational</span>
            </div>
          </div>
        </div>

        {/* Desktop Navigation */}
        {!isConsoleTab && (
          <nav className="hidden lg:flex items-center gap-md xl:gap-lg">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`font-body-lg text-sm px-3 py-1.5 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'text-primary font-bold bg-surface-container-high border-b-2 border-primary'
                      : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        )}

        {/* CTA & User Profile Buttons */}
        <div className="hidden md:flex items-center gap-md">
          {user ? (
            <div className="flex items-center gap-sm bg-surface-container px-md py-1.5 rounded-xl border border-outline-variant/50">
              <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                {user.name ? user.name.charAt(0) : 'A'}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-on-surface leading-tight">{user.name || 'Enterprise Admin'}</p>
                <p className="text-[10px] text-on-surface-variant leading-tight">{user.organization || 'Apex Life Sciences'}</p>
              </div>
              <button
                onClick={onLogout}
                title="Sign Out"
                className="ml-2 text-on-surface-variant hover:text-red-600 p-1 rounded hover:bg-red-50 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => handleNavClick('login')}
                className={`text-xs font-bold px-4 py-2 rounded-xl transition-all border cursor-pointer ${
                  activeTab === 'login'
                    ? 'bg-primary-container text-white border-primary shadow-sm'
                    : 'text-on-surface hover:text-primary hover:bg-surface-container-low border-outline-variant'
                }`}
              >
                Login
              </button>
              <button
                onClick={onOpenDemo}
                className="text-xs font-bold bg-[#0065FF] hover:bg-[#0052cc] text-white px-4 py-2 rounded-xl transition-all shadow-md hover:scale-[1.02] cursor-pointer"
              >
                Book Demo
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden text-on-surface-variant p-2 hover:bg-surface-container rounded-lg"
          aria-label="Toggle menu"
        >
          <span className="material-symbols-outlined">{mobileMenuOpen ? 'close' : 'menu'}</span>
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-surface-container-lowest border-b border-outline-variant p-lg space-y-md animate-fadeIn shadow-xl">
          <div className="flex flex-col gap-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`text-left px-md py-3 rounded-lg text-base font-body-lg transition-colors ${
                  activeTab === item.id
                    ? 'bg-primary-container text-white font-bold'
                    : 'text-on-surface hover:bg-surface-container'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="pt-md border-t border-outline-variant/40 flex flex-col gap-md">
            {user ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="w-full text-center font-label-md text-red-600 border border-red-200 py-2.5 rounded-lg hover:bg-red-50"
              >
                Sign Out ({user.name})
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleNavClick('login');
                  }}
                  className="w-full text-center font-label-md text-on-surface py-2.5 border border-outline-variant rounded-lg"
                >
                  Login to Console
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenDemo();
                  }}
                  className="w-full text-center font-label-md bg-[#0065FF] text-white py-2.5 rounded-lg shadow-md"
                >
                  Book Live Demo
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
