import React from 'react';
import { LayoutDashboard, Wand2, Sparkles, TrendingUp, X } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen }) {
  const tabs = [
    { id: 'analytics', label: 'Analytics', icon: LayoutDashboard },
    { id: 'aify', label: 'AIfy Post', icon: Wand2 },
    { id: 'create', label: 'Create Post with AI', icon: Sparkles },
    { id: 'trends', label: 'Trends', icon: TrendingUp },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed top-0 left-0 h-screen w-72 bg-white/80 backdrop-blur-2xl border-r border-slate-200/60 p-6 flex flex-col z-50 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        md:sticky md:top-0 md:flex md:w-72 shadow-[4px_0_24px_rgba(0,0,0,0.02)] md:shadow-none
      `}>
        <div className="flex items-center justify-between mb-10 mt-2 pl-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-400 to-orange-400 flex items-center justify-center shadow-lg shadow-rose-200">
              <Sparkles size={18} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent tracking-tight">
              Vincent.ai
            </h1>
          </div>

          {/* Mobile close button */}
          <button
            className="md:hidden p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mx-3 mb-4">Creator Menu</div>

        <nav className="flex-1 space-y-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (window.innerWidth < 768) setIsOpen(false);
                }}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-medium text-left transition-all duration-300 group ${isActive
                    ? 'bg-rose-50 text-rose-600 shadow-sm shadow-rose-100/50'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
              >
                <Icon size={20} className={`transition-transform duration-300 ${isActive ? 'text-rose-500 scale-110' : 'text-slate-400 group-hover:scale-110 group-hover:text-slate-600'}`} />
                <span className="text-[15px]">{tab.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"></div>
                )}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-200/60 flex items-center gap-3 pl-2 group cursor-pointer hover:bg-slate-50 p-2 rounded-2xl transition-colors">
          <img src="https://ui-avatars.com/api/?name=Creator&background=f43f5e&color=fff&rounded=true" alt="User" className="w-10 h-10 rounded-full shadow-sm" />
          <div>
            <div className="text-sm font-semibold text-slate-800 group-hover:text-rose-600 transition-colors">Digital Creator</div>
            <div className="text-xs text-slate-500">Premium Account</div>
          </div>
        </div>
      </div>
    </>
  );
}
