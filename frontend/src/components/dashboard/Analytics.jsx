import React from 'react';
import { Users, Heart, ArrowUpRight, Activity } from 'lucide-react';

export default function Analytics() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { title: 'Total Followers', value: '1,337', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
          { title: 'Engagement Rate', value: '8.4%', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
          { title: 'Total Likes', value: '9,001', icon: Heart, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
          { title: 'Growth', value: '+24%', icon: ArrowUpRight, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' }
        ].map((stat, i) => (
          <div key={i} className="p-6 rounded-3xl bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] cursor-default">
            <div className="flex items-center justify-between mb-5">
              <div className={`p-3.5 rounded-2xl ${stat.bg} border ${stat.border}`}>
                <stat.icon size={22} className={stat.color} />
              </div>
            </div>
            <p className="text-slate-500 text-sm font-medium mb-1">{stat.title}</p>
            <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="p-6 md:p-10 rounded-[2.5rem] bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] min-h-[350px] flex flex-col justify-center items-center text-center relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 blur-[100px] rounded-full"></div>
         <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-50 blur-[100px] rounded-full"></div>
         
         <div className="w-20 h-20 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-6 shadow-sm relative z-10">
            <Activity size={36} className="text-slate-400" />
         </div>
         <h3 className="text-2xl text-slate-800 font-bold mb-3 relative z-10">Curating Insights</h3>
         <p className="text-slate-500 max-w-md relative z-10 text-lg">We're beautifully crafting your visual data points. Stunning charts will appear here shortly.</p>
      </div>
    </div>
  );
}
