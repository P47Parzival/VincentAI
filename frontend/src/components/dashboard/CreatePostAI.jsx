import React from 'react';
import { PenTool, Target, Zap } from 'lucide-react';

export default function CreatePostAI() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-rose-500 to-orange-400 bg-clip-text text-transparent inline-block mb-4 tracking-tight">Post Creator Studio</h2>
        <p className="text-slate-500 text-lg max-w-xl mx-auto">Generate completely personalized content from scratch using our advanced topic-based engine.</p>
      </div>
      
      <div className="p-8 md:p-10 rounded-[2.5rem] bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
         {/* Decorative gradient corner */}
         <div className="absolute -top-20 -right-20 w-64 h-64 bg-orange-50 blur-[60px] rounded-full pointer-events-none"></div>

         <div className="space-y-8 relative z-10">
           <div>
             <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3 ml-2">
               <Target size={18} className="text-orange-400" /> Topic / Subject
             </label>
             <input 
                type="text" 
                className="w-full bg-[#FCFBF8] border border-slate-200 focus:border-orange-300 focus:ring-4 focus:ring-orange-100 text-slate-800 px-5 py-4 rounded-2xl transition-all outline-none shadow-inner text-lg placeholder:text-slate-400"
                placeholder="e.g. My Morning Routine for Productivity"
             />
           </div>

           <div>
             <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3 ml-2">
               <PenTool size={18} className="text-orange-400" /> Vibe & Context
             </label>
             <textarea 
                className="w-full bg-[#FCFBF8] border border-slate-200 focus:border-orange-300 focus:ring-4 focus:ring-orange-100 text-slate-800 px-5 py-4 rounded-2xl min-h-[180px] outline-none transition-all resize-none shadow-inner text-lg placeholder:text-slate-400"
                placeholder="Describe your target audience and the feeling you want to convey..."
             ></textarea>
           </div>
           
           <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-400 to-rose-400 hover:from-orange-500 hover:to-rose-500 text-white font-bold py-4.5 rounded-2xl shadow-lg shadow-orange-200 transition-all text-lg group transform hover:scale-[1.01] active:scale-95">
             <Zap size={22} className="group-hover:animate-pulse" fill="currentColor" />
             Draft Masterpiece
           </button>
         </div>
      </div>
    </div>
  );
}
