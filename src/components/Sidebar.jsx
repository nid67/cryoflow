import React from 'react';

export default function Sidebar({ activeTab, setActiveTab, user, onLogout }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', badge: 'Core Live' },
    { id: 'shipments', label: 'Shipments', icon: 'local_shipping', badge: 'Core Live' },
    { id: 'prediction', label: 'AI Prediction', icon: 'psychology', badge: 'Core Live' },
    { id: 'decision', label: 'Decision Center', icon: 'bolt', badge: 'Core Live' },
    { id: 'warehouses', label: 'Warehouses', icon: 'warehouse', badge: 'Roadmap' },
    { id: 'alerts', label: 'Alerts', icon: 'notifications', badge: 'Roadmap' },
    { id: 'analytics', label: 'Analytics', icon: 'insights', badge: 'Roadmap' },
    { id: 'profile', label: 'Profile', icon: 'person', badge: '' },
  ];

  return (
    <aside className="w-64 bg-[#071328] text-white flex flex-col justify-between p-4 border-r border-slate-800 shrink-0 min-h-[calc(100vh-72px)]">
      <div className="space-y-6">
        {/* User Mini Profile */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#0065FF] text-white flex items-center justify-center font-bold text-sm">
            {user ? user.name.charAt(0) : 'A'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-slate-100 truncate">{user ? user.name : 'Dr. Elena Vance'}</p>
            <p className="text-[10px] text-slate-400 truncate">{user ? user.role : 'Operations Lead'}</p>
          </div>
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
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#0065FF] text-white shadow-md font-bold'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                    item.badge === 'Core Live' 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Logout Footer */}
      <div className="pt-4 border-t border-slate-800 space-y-2">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
