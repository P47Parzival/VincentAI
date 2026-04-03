import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function AIfyPost() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div>
          <h3 className="text-3xl font-bold text-slate-800 mb-2 tracking-tight">Elevate your content</h3>
          <p className="text-slate-500 text-lg">Transform ordinary text into highly engaging posts customized for your audience.</p>
        </div>
        
        <div className="p-6 md:p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
           <textarea 
              className="w-full bg-[#FCFBF8] border border-slate-200 text-slate-700 p-5 rounded-3xl min-h-[220px] outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-100 transition-all resize-none shadow-inner text-lg placeholder:text-slate-400"
              placeholder="Paste your original draft here..."
           ></textarea>
           
           <div className="flex justify-between items-center mt-6 pl-2">
              <span className="text-sm font-medium text-slate-400">0 / 5000 chars</span>
              <button className="flex items-center gap-2 bg-gradient-to-r from-rose-400 to-orange-400 hover:from-rose-500 hover:to-orange-500 text-white font-semibold px-8 py-3.5 rounded-full shadow-lg shadow-rose-200 transition-all transform hover:scale-[1.02] active:scale-95">
                <Sparkles size={18} />
                AIfy Now
              </button>
           </div>
        </div>
      </div>

      <div className="flex flex-col justify-center items-center h-full p-8 hidden lg:flex relative">
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,228,230,0.8),transparent_70%)] pointer-events-none"></div>
         <div className="relative z-10 w-32 h-32 bg-white rounded-full border border-rose-100 flex items-center justify-center shadow-[0_8px_30px_rgba(244,63,94,0.1)]">
            <div className="absolute inset-0 bg-rose-400/20 blur-2xl rounded-full animate-pulse"></div>
            <ArrowRight size={48} className="text-rose-400 relative z-20" />
         </div>
      </div>
    </div>
  );
}
