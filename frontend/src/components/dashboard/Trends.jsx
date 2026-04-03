import React from 'react';
import { TrendingUp, Globe, Flame } from 'lucide-react';

export default function Trends() {
  const trends = [
    { id: 1, topic: '#DigitalNomadLife', growth: '+1,240%', category: 'Lifestyle', trend: 'up' },
    { id: 2, topic: 'Aesthetic Desktops', growth: '+850%', category: 'Inspiration', trend: 'up' },
    { id: 3, topic: 'Minimalist Fashion', growth: '+420%', category: 'Style', trend: 'up' },
    { id: 4, topic: 'Healthy Recipes', growth: '+310%', category: 'Wellness', trend: 'up' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3 tracking-tight">
             <Flame size={32} className="text-rose-500" />
             Trending Concepts
          </h2>
          <p className="text-slate-500 mt-2 text-lg">See what your audience is loving right now.</p>
        </div>
        <button className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 shadow-sm transition-all font-medium">
           <Globe size={18} className="text-slate-400" /> Explore Global
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8">
        {trends.map((trend) => (
          <div key={trend.id} className="p-6 rounded-3xl bg-white border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all cursor-pointer group flex items-center justify-between">
             <div className="flex items-center gap-5">
                 <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center font-bold text-xl border border-rose-100 shadow-sm">
                   #{trend.id}
                 </div>
                 <div>
                    <h3 className="font-bold text-slate-800 text-lg group-hover:text-rose-500 transition-colors">{trend.topic}</h3>
                    <span className="text-sm font-medium text-slate-400">{trend.category}</span>
                 </div>
             </div>
             <div className="flex items-center gap-1.5 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-100">
                <TrendingUp size={16} className="text-emerald-500" />
                <span className="text-emerald-600 text-sm font-bold tracking-wide">{trend.growth}</span>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
