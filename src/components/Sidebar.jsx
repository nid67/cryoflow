import React from 'react';

export default function Sidebar({ activeTab, setActiveTab, user, onLogout }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'shipments', label: 'Shipments', icon: 'local_shipping' },
    { id: 'prediction', label: 'AI Prediction', icon: 'psychology' },
    { id: 'decision', label: 'Decision Center', icon: 'bolt' },
    { id: 'warehouses', label: 'Warehouses', icon: 'warehouse' },
    { id: 'alerts', label: 'Alerts', icon: 'notifications' },
    { id: 'analytics', label: 'Analytics', icon: 'insights' },
    { id: 'profile', label: 'Profile', icon: 'person' },
  ];

  return (
    <aside className="w-64 bg-[#071328] text-white flex flex-col justify-between p-4 border-r border-slate-800 shrink-0 sticky top-[72px] h-[calc(100vh-72px)] overflow-y-auto z-30">
      <div className="space-y-5">
        {/* User Profile Card with Sign Out directly underneath */}
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0065FF] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
              {user?.name ? user.name.charAt(0) : 'D'}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-bold text-slate-100 truncate">{user?.name || 'Dr. Elena Vance'}</p>
              <p className="text-[10px] text-slate-400 truncate font-medium">{user?.role || 'Cold Operations Director'}</p>
            </div>
          </div>

          {/* Sign Out Button directly below profile */}
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-red-400 hover:text-white bg-red-500/10 hover:bg-red-600 transition-all border border-red-500/20 cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            <span>Sign Out</span>
          </button>
        </div>

        {/* Navigation List */}
        <nav className="space-y-1">
          <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Main Navigation</p>
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#0065FF] text-white shadow-md font-bold'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Branding */}
      <div className="pt-4 border-t border-slate-800 text-[10px] text-slate-500 font-mono text-center">
        <span>Valtway AI v2.4 • 21 CFR Part 11</span>
      </div>
    </aside>
  );
}
