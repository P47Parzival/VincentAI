import React, { useState } from 'react';
import { Search, Sparkles, AlertCircle, Video, Clock, CheckCircle2, Play, Activity, Heart, MessageCircle, TrendingUp } from 'lucide-react';
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
    <div className="space-y-8 pb-20 text-[#F0F0F0]">
      <div className="max-w-3xl">
        <h2 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3 tracking-tight" style={{ fontFamily: "'Clash Display', 'DM Sans', sans-serif" }}>
           <Sparkles size={36} className="text-[#8B5CF6]" /> AIfy Post Analyzer
        </h2>
        <p className="text-gray-400 mt-2 text-lg">Paste a link from Instagram, LinkedIn, X, or YouTube. We'll extract your post, rewrite it for virality, and analyze your video frame-by-frame.</p>
      </div>

      <div className="bg-white/5 p-4 md:p-6 rounded-[2rem] border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.2)] backdrop-blur-md flex flex-col md:flex-row gap-4 items-center">
         <div className="flex-1 w-full relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input 
              type="text" 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://instagram.com/p/..."
              className="w-full bg-[#080808]/50 border border-white/10 outline-none pl-12 pr-4 py-4 rounded-xl text-white font-medium placeholder:text-gray-600 focus:ring-2 focus:ring-[#8B5CF6]/50 transition-all"
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            />
         </div>
         <button 
           onClick={handleAnalyze} 
           disabled={loading || !url}
           className="w-full md:w-auto bg-[#8B5CF6]/20 hover:bg-[#8B5CF6]/30 border border-[#8B5CF6]/40 text-[#8B5CF6] px-8 py-4 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shrink-0 shadow-[0_0_16px_rgba(139,92,246,0.2)]"
         >
           {loading ? <Activity className="animate-spin" size={20} /> : "Run Deep Analysis"}
         </button>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center p-20 border-2 border-dashed border-white/10 bg-white/5 backdrop-blur-md rounded-[2rem] text-gray-400">
           <div className="relative w-20 h-20 mb-6">
              <div className="absolute inset-0 border-4 border-[#8B5CF6]/20 rounded-full animate-ping opacity-75"></div>
              <div className="absolute inset-0 border-4 border-[#8B5CF6] rounded-full border-t-transparent animate-spin shadow-[0_0_16px_rgba(139,92,246,0.6)]"></div>
           </div>
           <p className="text-lg font-medium animate-pulse text-[#8B5CF6]">Scraping social link & running AI models...</p>
           <p className="text-sm mt-2 text-gray-500 text-center">This dynamically connects to Apify and queries Llama3 via Groq.</p>
        </div>
      )}

      {result && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
           {/* LEFT: ORIGINAL DATA */}
           <div className="space-y-6">
              <div className="bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 h-full flex flex-col shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
                 <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    Original Scraped Content 
                    <span className="bg-white/10 text-gray-300 px-2 py-0.5 rounded text-[10px] border border-white/10">{result.platform}</span>
                 </h3>
                 <p className="text-white text-lg whitespace-pre-wrap flex-1">{result.original_text}</p>
                 
                 <div className="flex gap-4 mt-4 text-gray-400 font-bold border-t border-white/10 pt-4">
                    <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg text-sm border border-white/5"><Heart size={16} className="text-[#FF3D6E] fill-[#FF3D6E]/20"/> {result.original_likes?.toLocaleString() || 0}</span>
                    <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg text-sm border border-white/5"><MessageCircle size={16} className="text-[#00F5FF] fill-[#00F5FF]/20"/> {result.original_comments?.toLocaleString() || 0}</span>
                 </div>
                 
                 {result.scrape_error && (
                    <div className="mt-4 bg-[#FF3D6E]/10 text-[#FF3D6E] p-3 rounded-xl border border-[#FF3D6E]/20 text-sm">
                       <p className="font-bold mb-1 flex items-center gap-1"><AlertCircle size={14}/> Live Apify Scrape Failed (Fired Clean Mock)</p>
                       <p className="font-mono text-xs break-all">{result.scrape_error}</p>
                    </div>
                 )}

                 <div className="mt-6 aspect-video bg-[#080808] border border-white/10 rounded-2xl relative overflow-hidden flex items-center justify-center shadow-inner">
                    <Video className="text-white/20" size={64} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]">
                         <Play className="text-[#FF3D6E] fill-[#FF3D6E] mb-2 shadow-[0_0_16px_rgba(255,61,110,0.5)]" size={32} />
                         <p className="text-white/90 text-sm font-semibold">Simulated Video Asset</p>
                    </div>
                 </div>
              </div>
           </div>

           {/* RIGHT: AIFIED RESULTS */}
           <div className="space-y-6">
              <div className="bg-gradient-to-br from-[#8B5CF6]/20 to-[#FF3D6E]/20 border border-[rgba(255,255,255,0.08)] backdrop-blur-xl p-6 md:p-8 rounded-[2rem] shadow-[0_0_40px_rgba(139,92,246,0.15)] text-white relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
                    <Sparkles size={120} className="text-[#8B5CF6]" />
                 </div>
                 <h3 className="text-sm font-bold text-[#8B5CF6] uppercase tracking-widest mb-4 flex items-center justify-between relative z-10 w-full drop-shadow-md">
                    <span className="flex items-center gap-2">AIfied Replacement</span>
                    <div className="flex gap-3 text-white font-bold bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs md:text-sm border border-white/10">
                       <span className="flex items-center gap-1 text-[#00F5FF]"><TrendingUp size={14} className="mr-1 shadow-sm"/></span>
                       <span className="flex items-center gap-1 text-[#FF3D6E]"><Heart size={14} className="fill-[#FF3D6E]/30"/> {result.projected_likes?.toLocaleString() || 0}</span>
                       <span className="flex items-center gap-1 text-[#00F5FF]"><MessageCircle size={14} className="fill-[#00F5FF]/30"/> {result.projected_comments?.toLocaleString() || 0}</span>
                    </div>
                 </h3>
                 <p className="text-white text-lg md:text-xl font-medium leading-relaxed whitespace-pre-wrap relative z-10">
                    {result.enhanced_text}
                 </p>
                 <button className="mt-6 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-white px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 relative z-10 shadow-sm">
                    <CheckCircle2 size={16} className="text-[#00F5FF]" /> Copy to Clipboard
                 </button>
              </div>

              {/* FRAME ANALYSIS TIMELINE */}
              <div className="bg-white/5 backdrop-blur-md p-6 md:p-8 rounded-[2rem] border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
                 <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2" style={{ fontFamily: "'Clash Display', 'DM Sans', sans-serif" }}>
                    <Video className="text-[#FF3D6E]" /> Frame-by-Frame Retention Analysis
                 </h3>
                 
                 {/* CSS Timeline Layout */}
                 <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-[1px] before:bg-gradient-to-b before:from-transparent before:via-white/20 before:to-transparent">
                    {result.video_analysis && result.video_analysis.map((frame, i) => (
                       <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#080808] bg-[#00F5FF] text-[#080808] shadow-[0_0_12px_rgba(0,245,255,0.6)] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                             <Clock size={16} />
                          </div>
                          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm shadow-sm hover:bg-white/10 transition-all group-hover:-translate-y-1 group-hover:border-white/20">
                             <div className="flex items-center justify-between mb-3">
                                <span className="font-mono font-bold text-[#00F5FF] bg-[#00F5FF]/10 px-2 py-0.5 rounded text-xs border border-[#00F5FF]/20">{frame.timestamp}</span>
                             </div>
                             <p className="text-sm font-bold text-white mb-1.5 flex items-center gap-1.5"><AlertCircle size={14} className="text-[#FF3D6E]"/> {frame.issue}</p>
                             <p className="text-sm text-gray-400 italic leading-relaxed">"{frame.tip}"</p>
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
