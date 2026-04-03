import React, { useState } from 'react';
import { Search, Sparkles, AlertCircle, Video, Clock, CheckCircle2, Play, Activity } from 'lucide-react';

export default function AIfyPost() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleAnalyze = async () => {
    if (!url) return;
    try {
      setLoading(true);
      setResult(null);
      const res = await fetch('http://localhost:4000/api/agents/analyze-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="max-w-3xl">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-800 flex items-center gap-3 tracking-tight">
           <Sparkles size={36} className="text-purple-500" /> AIfy Post Analyzer
        </h2>
        <p className="text-slate-500 mt-2 text-lg">Paste a link from Instagram, LinkedIn, X, or YouTube. We'll extract your post, rewrite it for virality, and analyze your video frame-by-frame.</p>
      </div>

      <div className="bg-white p-4 md:p-6 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col md:flex-row gap-4 items-center">
         <div className="flex-1 w-full relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://instagram.com/p/..."
              className="w-full bg-slate-50 border-none outline-none pl-12 pr-4 py-4 rounded-xl text-slate-700 font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-purple-100 transition-all"
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            />
         </div>
         <button 
           onClick={handleAnalyze} 
           disabled={loading || !url}
           className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
         >
           {loading ? <Activity className="animate-spin" size={20} /> : "Run Deep Analysis"}
         </button>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center p-20 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400">
           <div className="relative w-20 h-20 mb-6">
              <div className="absolute inset-0 border-4 border-purple-200 rounded-full animate-ping opacity-75"></div>
              <div className="absolute inset-0 border-4 border-purple-500 rounded-full border-t-transparent animate-spin"></div>
           </div>
           <p className="text-lg font-medium animate-pulse text-purple-600">Scraping social link & running AI models...</p>
           <p className="text-sm mt-2 text-slate-500 text-center">This dynamically connects to Apify and queries Llama3 via Groq.</p>
        </div>
      )}

      {result && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
           {/* LEFT: ORIGINAL DATA */}
           <div className="space-y-6">
              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 h-full flex flex-col">
                 <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    Original Scraped Content 
                    <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-[10px]">{result.platform}</span>
                 </h3>
                 <p className="text-slate-700 text-lg whitespace-pre-wrap flex-1">{result.original_text}</p>
                 
                 {result.scrape_error && (
                    <div className="mt-4 bg-amber-50 text-amber-700 p-3 rounded-xl border border-amber-200 text-sm">
                       <p className="font-bold mb-1 flex items-center gap-1"><AlertCircle size={14}/> Live Apify Scrape Failed (Fired Clean Mock)</p>
                       <p className="font-mono text-xs break-all">{result.scrape_error}</p>
                    </div>
                 )}

                 <div className="mt-6 aspect-video bg-slate-900 rounded-2xl relative overflow-hidden flex items-center justify-center shadow-inner">
                    <Video className="text-slate-800" size={64} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]">
                         <Play className="text-white fill-white mb-2" size={32} />
                         <p className="text-white/90 text-sm font-semibold">Simulated Video Asset</p>
                    </div>
                 </div>
              </div>
           </div>

           {/* RIGHT: AIFIED RESULTS */}
           <div className="space-y-6">
              <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-6 md:p-8 rounded-[2rem] shadow-xl text-white relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <Sparkles size={120} />
                 </div>
                 <h3 className="text-sm font-bold text-purple-200 uppercase tracking-wider mb-4 flex items-center gap-2 relative z-10">
                    AIfied Replacement Caption
                 </h3>
                 <p className="text-white text-lg md:text-xl font-medium leading-relaxed whitespace-pre-wrap relative z-10">
                    {result.enhanced_text}
                 </p>
                 <button className="mt-6 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 relative z-10">
                    <CheckCircle2 size={16} /> Copy to Clipboard
                 </button>
              </div>

              {/* FRAME ANALYSIS TIMELINE */}
              <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                 <h3 className="text-xl font-bold text-slate-800 mb-8 flex items-center gap-2">
                    <Video className="text-rose-500" /> Frame-by-Frame Retention Analysis
                 </h3>
                 
                 {/* CSS Timeline Layout */}
                 <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                    {result.video_analysis && result.video_analysis.map((frame, i) => (
                       <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-100 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                             <Clock size={16} />
                          </div>
                          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all group-hover:-translate-y-1">
                             <div className="flex items-center justify-between mb-3">
                                <span className="font-mono font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded text-xs border border-purple-100">{frame.timestamp}</span>
                             </div>
                             <p className="text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5"><AlertCircle size={14} className="text-amber-500"/> {frame.issue}</p>
                             <p className="text-sm text-slate-500 italic leading-relaxed">"{frame.tip}"</p>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>

           </div>
        </div>
      )}
    </div>
  );
}
