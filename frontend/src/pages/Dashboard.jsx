import React, { useState } from 'react';
import { Menu, Star } from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
import Analytics from '../components/dashboard/Analytics';
import AIfyPost from '../components/dashboard/AIfyPost';
import CreatePostAI from '../components/dashboard/CreatePostAI';
import Trends from '../components/dashboard/Trends';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('analytics');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'analytics':
        return <Analytics />;
      case 'aify':
        return <AIfyPost />;
      case 'create':
        return <CreatePostAI />;
      case 'trends':
        return <Trends />;
      default:
        return <Analytics />;
    }
  };

  return (
    <div className="flex h-screen bg-[#FCFBF8] text-slate-800 font-sans relative overflow-hidden">
      {/* Background soft glowing orb effect */}
      <div className="absolute top-0 w-full h-[600px] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,228,230,0.6),rgba(255,255,255,0))] pointer-events-none z-0"></div>

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <main className="flex-1 p-4 md:p-8 overflow-y-auto relative h-full z-10 w-full max-w-full overflow-x-hidden">
         <div className="max-w-6xl mx-auto space-y-8">
            <header className="flex justify-between items-center mb-6 md:mb-10 backdrop-blur-xl bg-white/70 p-4 md:p-6 rounded-3xl border border-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] relative overflow-hidden">
               {/* Header subtle shine */}
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none -translate-x-full animate-[shimmer_3s_infinite]"></div>

               <div className="flex items-center gap-4 relative z-10">
                 <button 
                    className="md:hidden p-2 bg-white hover:bg-slate-50 text-slate-600 rounded-xl transition-colors border border-slate-100 shadow-sm"
                    onClick={() => setIsSidebarOpen(true)}
                 >
                    <Menu size={20} />
                 </button>
                 <div>
                   <h2 className="text-xl md:text-3xl font-semibold text-slate-800 tracking-tight pt-1">
                     {activeTab.replace(/([A-Z])/g, ' $1').trim()}
                   </h2>
                   <p className="text-sm text-slate-500 mt-1 hidden sm:block">Manage and elevate your creator journey.</p>
                 </div>
               </div>
               <div className="flex items-center gap-2 bg-rose-50/80 px-4 py-2 rounded-xl border border-rose-100 text-rose-600 font-medium text-sm md:text-base shadow-sm relative z-10">
                  <Star size={18} className="text-rose-500" fill="currentColor" />
                  <span>Premium Active</span>
               </div>
            </header>
            
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
               {renderContent()}
            </div>
         </div>
      </main>
    </div>
  );
}
