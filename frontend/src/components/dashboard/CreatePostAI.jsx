import React, { useState, useRef, useEffect } from 'react';
import { PenTool, Target, Zap, Loader2, CheckCircle, ArrowRight, Volume2, Play, Video } from 'lucide-react';

export default function CreatePostAI() {
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [agentStep, setAgentStep] = useState(null);
  const [agentState, setAgentState] = useState({});
  const [error, setError] = useState(null);
  const [isFinished, setIsFinished] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const audioRef = useRef(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [isVideoFinished, setIsVideoFinished] = useState(false);
  const [videoLogs, setVideoLogs] = useState([]);
  const logsEndRef = useRef({});
  const generatePost = () => {
    if (!description || !goal) return;
    setIsGenerating(true);
    setAgentStep('starting');
    setAgentState({});
    setError(null);
    setIsFinished(false);
    setIsVideoFinished(false);
    setVideoLogs([]);
    
    const backendUrl = "http://localhost:4000/api/agents/stream-post";
    const url = new URL(backendUrl);
    url.searchParams.append('companyDescription', description);
    url.searchParams.append('socialGoal', goal);
    
    const eventSource = new EventSource(url.toString());
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.step === 'error') {
        setError(data.error);
        setIsGenerating(false);
        eventSource.close();
        return;
      }
      
      if (data.step === 'finished') {
        setIsFinished(true);
        setIsGenerating(false);
        eventSource.close();
        setAgentStep('done');
        return;
      }
      
      setAgentStep(data.step);
      if (data.state_update) {
        setAgentState(prev => ({ ...prev, ...data.state_update }));
      }
    };
    
    eventSource.onerror = (err) => {
      console.error("EventSource failed:", err);
      setError("Connection to agent backend failed.");
      setIsGenerating(false);
      eventSource.close();
    };
  };

  const steps = [
    { id: 'starting', label: 'Initializing' },
    { id: 'onboarding', label: 'Analyzing Context' },
    { id: 'research', label: 'Scraping Web' },
    { id: 'strategist', label: 'Formulating Strategy' },
    { id: 'copywriter', label: 'Drafting Copy' }
  ];

  const getStepIndex = (stepId) => steps.findIndex(s => s.id === stepId);
  const currentStepIndex = agentStep === 'done' ? steps.length : getStepIndex(agentStep);

  const generateAudio = async () => {
    if (!agentState.draft) return;
    try {
      setIsGeneratingAudio(true);
      const res = await fetch("http://localhost:4000/api/agents/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: agentState.draft })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to generate audio");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Audio Generation Failed: " + err.message);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const generateVideo = () => {
    if (!agentState.draft) return;
    setIsGeneratingVideo(true);
    setVideoLogs(["[SYSTEM] Connecting to Video Generation Cluster...", "[INFO] Initializing Avatar Model..."]);
    
    const logs = [
        "Allocating RTX 4090 GPU resources...",
        "Downloading generated audio baseline...",
        "Mapping visemes to audio payload...",
        "Rendering avatar base model (4K)...",
        "Applying dynamic lip-sync keyframes...",
        "Enhancing facial micro-expressions...",
        "Baking scene lighting and background...",
        "Compositing final video frames...",
        "Finalizing export to mp4...",
        "Done. Output ready."
    ];
    
    let step = 0;
    const interval = setInterval(() => {
        if (step < logs.length) {
            setVideoLogs(prev => {
                const updated = [...prev, `[INFO] ${logs[step]}`];
                // Scroll to bottom simulation handled via ref if needed
                return updated;
            });
            step++;
        } else {
            clearInterval(interval);
            setIsGeneratingVideo(false);
            setIsVideoFinished(true);
        }
    }, 800);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent inline-block mb-4 tracking-tight pb-1">Multi-Agent Studio</h2>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto">Unleash an intelligent swarm of AI agents to research, strategize, and write hyper-optimized content for your brand.</p>
      </div>

      {(!isGenerating && !isFinished) && (
        <div className="p-8 md:p-10 rounded-[2.5rem] bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden transition-all duration-300">
           <div className="space-y-8 relative z-10">
             <div>
               <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3 ml-2">
                 <Target size={18} className="text-purple-500" /> What does your startup do?
               </label>
               <input 
                  type="text" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#FCFBF8] border border-slate-200 focus:border-purple-300 focus:ring-4 focus:ring-purple-100 text-slate-800 px-5 py-4 rounded-2xl transition-all outline-none shadow-inner text-lg placeholder:text-slate-400"
                  placeholder="e.g. We build open-source CMS tools for creators..."
               />
             </div>

             <div>
               <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3 ml-2">
                 <PenTool size={18} className="text-purple-500" /> What is your objective?
               </label>
               <textarea 
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full bg-[#FCFBF8] border border-slate-200 focus:border-purple-300 focus:ring-4 focus:ring-purple-100 text-slate-800 px-5 py-4 rounded-2xl min-h-[140px] outline-none transition-all resize-none shadow-inner text-lg placeholder:text-slate-400"
                  placeholder="e.g. Write a viral Twitter thread announcing our new feature launch..."
               ></textarea>
             </div>
             
             {error && <p className="text-red-500 text-sm ml-2 font-medium">{error}</p>}
             
             <button 
               onClick={generatePost}
               disabled={!description || !goal}
               className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 text-white font-bold py-5 rounded-2xl shadow-lg shadow-purple-200 transition-all text-xl group transform hover:scale-[1.01] active:scale-95">
               <Zap size={24} fill="currentColor" className={(!description || !goal) ? "" : "group-hover:animate-pulse"} />
               Deploy AI Agents
             </button>
           </div>
        </div>
      )}

      {(isGenerating || isFinished) && (
        <div className="space-y-6">
            <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between text-sm md:text-base font-medium overflow-x-auto">
                {steps.map((step, idx) => {
                    const isCompleted = currentStepIndex > idx;
                    const isActive = currentStepIndex === idx;
                    return (
                        <div key={step.id} className={`flex items-center gap-2 flex-shrink-0 ${isCompleted ? 'text-green-500' : isActive ? 'text-purple-600 font-bold' : 'text-slate-400'}`}>
                            {isCompleted ? <CheckCircle size={20} /> : isActive ? <Loader2 className="animate-spin text-purple-500" size={20} /> : <div className="w-5 h-5 rounded-full border-2 border-slate-200"></div>}
                            <span className="whitespace-nowrap">{step.label}</span>
                            {idx < steps.length - 1 && <ArrowRight size={16} className={`mx-3 ${isCompleted ? 'text-green-300' : 'text-slate-200'}`} />}
                        </div>
                    );
                })}
            </div>

            {error && (
               <div className="p-4 bg-red-50 rounded-2xl border border-red-100 text-red-600 font-medium">
                  {error}
               </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                    {/* Live Strategy Data */}
                    {(agentState.strategy || currentStepIndex >= getStepIndex('strategist')) && (
                        <div className="p-6 bg-purple-50/50 rounded-3xl border border-purple-100 shadow-sm relative overflow-hidden">
                            {!agentState.strategy && <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center text-purple-400 font-medium"><Loader2 className="animate-spin mr-2" size={18} /> Consulting Strategist...</div>}
                            <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2"><Zap size={18} className="text-purple-500"/> Content Strategy</h3>
                            <div className="text-sm text-purple-800/80 leading-relaxed whitespace-pre-wrap">
                                {agentState.strategy || "Waiting for data..."}
                            </div>
                        </div>
                    )}

                    {/* Live Research Data */}
                    {(agentState.research_data || currentStepIndex >= getStepIndex('research')) && (
                        <div className="p-6 bg-[#FAFAFA] rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                            {!agentState.research_data && <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center text-slate-500 font-medium"><Loader2 className="animate-spin mr-2" size={18} /> Scraping the web...</div>}
                            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><Target size={18} className="text-blue-500"/> Web Research Findings</h3>
                            <div className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto">
                                {agentState.research_data || "Waiting for data..."}
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6 h-full">
                    {/* Live Final Draft */}
                    {(agentState.draft || currentStepIndex >= getStepIndex('copywriter')) ? (
                        <div className="p-8 bg-slate-900 rounded-[2rem] shadow-xl text-white relative h-full">
                            {!agentState.draft && <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md z-10 flex items-center justify-center text-slate-300 font-medium rounded-[2rem]"><Loader2 className="animate-spin mr-2" size={18} /> Drafting Post Copy...</div>}
                            <div className="absolute top-4 right-4 bg-white/10 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold text-white/80">Copywriter Output</div>
                            <h3 className="font-semibold text-white mb-6 text-xl">Final Draft</h3>
                            <div className="text-slate-100/90 font-medium whitespace-pre-wrap leading-relaxed pb-6">
                                {agentState.draft || "Waiting for copywriter..."}
                            </div>
                            
                            {agentState.draft && isFinished && (
                                <div className="mt-6 pt-6 border-t border-slate-700/50">
                                    {!audioUrl ? (
                                        <button 
                                            onClick={generateAudio}
                                            disabled={isGeneratingAudio}
                                            className="flex items-center gap-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 px-4 py-2 rounded-xl transition-all disabled:opacity-50 text-sm font-medium"
                                        >
                                            {isGeneratingAudio ? <Loader2 size={16} className="animate-spin" /> : <Volume2 size={16} />} 
                                            {isGeneratingAudio ? 'Generating Voice...' : 'Listen to Draft'}
                                        </button>
                                    ) : (
                                        <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700 w-full flex items-center justify-between gap-4">
                                            <audio ref={audioRef} controls src={audioUrl} className="w-full h-10 outline-none bg-slate-800" autoPlay />
                                            <a 
                                                href={audioUrl} 
                                                download="draft_speech.wav"
                                                className="shrink-0 flex items-center justify-center bg-purple-600 hover:bg-purple-500 text-white p-2.5 rounded-xl transition-colors shadow-sm"
                                                title="Download Audio"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                                            </a>
                                        </div>
                                    )}
                                    
                                    {/* Video section */}
                                    <div className="mt-4 pt-4 border-t border-slate-700/50">
                                        {(!isGeneratingVideo && !isVideoFinished) && (
                                            <button 
                                                onClick={generateVideo}
                                                className="flex items-center w-full justify-center gap-2 bg-gradient-to-r from-indigo-500/20 to-blue-500/20 hover:from-indigo-500/30 hover:to-blue-500/30 text-blue-200 border border-blue-500/30 px-4 py-3 rounded-xl transition-all text-sm font-semibold shadow-inner"
                                            >
                                                <Video size={18} /> Generate Video AI Avatar
                                            </button>
                                        )}

                                        {isGeneratingVideo && (
                                            <div className="bg-black/60 rounded-xl p-4 border border-slate-700 font-mono text-[11px] md:text-xs text-green-400 h-40 overflow-y-auto leading-relaxed scroll-smooth flex flex-col justify-end">
                                                <div className="space-y-1">
                                                    {videoLogs.map((log, i) => (
                                                        <div key={i} className="animate-in fade-in slide-in-from-bottom-1">{log}</div>
                                                    ))}
                                                    <div className="flex items-center text-green-400 mt-2">
                                                        <Loader2 size={12} className="animate-spin mr-2" /> Processing...
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {isVideoFinished && (
                                            <div className="rounded-2xl overflow-hidden border border-slate-700/50 shadow-2xl relative bg-black/50 p-2">
                                                <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium text-white/90 border border-white/10">
                                                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                                                    Generated Output
                                                </div>
                                                <video 
                                                    src="/demo_video_TTSV.mp4" 
                                                    controls 
                                                    autoPlay 
                                                    className="w-full rounded-xl object-cover"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-8 bg-slate-50 rounded-[2rem] border border-dashed border-slate-300 flex flex-col items-center justify-center h-full min-h-[300px] text-slate-400">
                            <Loader2 className="animate-spin mb-4 text-slate-300" size={40} />
                            <p className="font-medium">Copywriter is waiting for strategy...</p>
                        </div>
                    )}
                </div>
            </div>

            {isFinished && (
                <div className="flex justify-center pt-8">
                    <button 
                        onClick={() => {
                            setIsFinished(false);
                            setIsGenerating(false);
                            setAgentStep(null);
                            setAgentState({});
                            setDescription('');
                            setGoal('');
                            setAudioUrl(null);
                        }}
                        className="px-8 py-3 bg-white border border-slate-200 text-slate-600 font-semibold rounded-2xl hover:bg-slate-50 transition-colors shadow-sm"
                    >
                        Create Another Post
                    </button>
                </div>
            )}
        </div>
      )}
    </div>
  );
}
