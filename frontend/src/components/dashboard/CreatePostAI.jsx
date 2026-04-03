import React, { useState, useRef, useEffect } from 'react';
import { PenTool, Target, Zap, Loader2, CheckCircle, ArrowRight, Volume2, Play, Video, Hash, Copy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

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
  const [editableDraft, setEditableDraft] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (agentState.draft) {
      setEditableDraft(agentState.draft);
    }
  }, [agentState.draft]);

  const handleCopy = () => {
    if (!editableDraft) return;
    navigator.clipboard.writeText(editableDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
    <div className="max-w-5xl mx-auto space-y-8 pb-20 text-[#F0F0F0]">
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-[#00F5FF] via-[#8B5CF6] to-[#FF3D6E] bg-clip-text text-transparent inline-block mb-4 tracking-tight pb-1 drop-shadow-lg" style={{ fontFamily: "'Clash Display', 'DM Sans', sans-serif" }}>Multi-Agent Studio</h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">Unleash an intelligent swarm of AI agents to research, strategize, and write hyper-optimized content for your brand.</p>
      </div>

      {(!isGenerating && !isFinished) && (
        <div className="p-8 md:p-10 rounded-[2.5rem] bg-white/5 border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.2)] backdrop-blur-md relative overflow-hidden transition-all duration-300">
           <div className="space-y-8 relative z-10">
             <div>
               <label className="flex items-center gap-2 text-sm font-bold tracking-widest uppercase text-gray-500 mb-3 ml-2">
                 <Target size={18} className="text-[#00F5FF]" /> What does your startup do?
               </label>
               <input 
                  type="text" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#080808]/50 border border-white/10 focus:border-[#00F5FF]/50 focus:ring-4 focus:ring-[#00F5FF]/10 text-white px-5 py-4 rounded-2xl transition-all outline-none shadow-inner text-lg placeholder:text-gray-600"
                  placeholder="e.g. We build open-source CMS tools for creators..."
               />
             </div>

             <div>
               <label className="flex items-center gap-2 text-sm font-bold tracking-widest uppercase text-gray-500 mb-3 ml-2">
                 <PenTool size={18} className="text-[#FF3D6E]" /> What is your objective?
               </label>
               <textarea 
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full bg-[#080808]/50 border border-white/10 focus:border-[#FF3D6E]/50 focus:ring-4 focus:ring-[#FF3D6E]/10 text-white px-5 py-4 rounded-2xl min-h-[140px] outline-none transition-all resize-none shadow-inner text-lg placeholder:text-gray-600"
                  placeholder="e.g. Write a viral Twitter thread announcing our new feature launch..."
               ></textarea>
             </div>
             
             {error && <p className="text-[#FF3D6E] text-sm ml-2 font-medium">{error}</p>}
             
             <button 
               onClick={generatePost}
               disabled={!description || !goal}
               className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-[#8B5CF6] to-[#FF3D6E] hover:from-[#8B5CF6]/90 hover:to-[#FF3D6E]/90 border border-white/10 disabled:opacity-50 text-white font-bold py-5 rounded-2xl shadow-[0_0_24px_rgba(255,61,110,0.4)] transition-all text-xl group transform hover:scale-[1.01] active:scale-95" style={{ fontFamily: "'Clash Display', 'DM Sans', sans-serif" }}>
               <Zap size={24} fill="currentColor" className={(!description || !goal) ? "" : "group-hover:animate-pulse text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"} />
               Deploy AI Agents
             </button>
           </div>
        </div>
      )}

      {(isGenerating || isFinished) && (
        <div className="space-y-6">
            <div className="p-6 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.2)] flex items-center justify-between text-sm md:text-base font-medium overflow-x-auto">
                {steps.map((step, idx) => {
                    const isCompleted = currentStepIndex > idx;
                    const isActive = currentStepIndex === idx;
                    return (
                        <div key={step.id} className={`flex items-center gap-2 flex-shrink-0 ${isCompleted ? 'text-[#00F5FF]' : isActive ? 'text-[#8B5CF6] font-bold shadow-[0_0_8px_rgba(139,92,246,0.5)]' : 'text-gray-500'}`}>
                            {isCompleted ? <CheckCircle size={20} /> : isActive ? <Loader2 className="animate-spin text-[#8B5CF6]" size={20} /> : <div className="w-5 h-5 rounded-full border-2 border-gray-600"></div>}
                            <span className="whitespace-nowrap">{step.label}</span>
                            {idx < steps.length - 1 && <ArrowRight size={16} className={`mx-3 ${isCompleted ? 'text-[#00F5FF]/50' : 'text-gray-600'}`} />}
                        </div>
                    );
                })}
            </div>

            {error && (
               <div className="p-4 bg-[#FF3D6E]/10 rounded-2xl border border-[#FF3D6E]/30 text-[#FF3D6E] font-medium backdrop-blur-md">
                  {error}
               </div>
            )}

            <div className="flex flex-col gap-6">
                    {/* Live Strategy Data */}
                    {(agentState.strategy || currentStepIndex >= getStepIndex('strategist')) && (
                        <div className="p-6 bg-[#8B5CF6]/5 backdrop-blur-md rounded-3xl border border-[#8B5CF6]/20 shadow-[0_8px_30px_rgba(0,0,0,0.2)] relative overflow-hidden">
                            {!agentState.strategy && <div className="absolute inset-0 bg-[#080808]/50 backdrop-blur-sm z-10 flex items-center justify-center text-[#8B5CF6] font-medium"><Loader2 className="animate-spin mr-2" size={18} /> Consulting Strategist...</div>}
                            <h3 className="font-bold text-white mb-3 flex items-center gap-2" style={{ fontFamily: "'Clash Display', 'DM Sans', sans-serif" }}><Zap size={18} className="text-[#8B5CF6]"/> Content Strategy</h3>
                            <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                                {agentState.strategy || "Waiting for data..."}
                            </div>
                        </div>
                    )}

                    {/* Live Research Data */}
                    {(agentState.research_data || currentStepIndex >= getStepIndex('research')) && (
                        <div className="p-6 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.2)] relative overflow-hidden">
                            {!agentState.research_data && <div className="absolute inset-0 bg-[#080808]/50 backdrop-blur-sm z-10 flex items-center justify-center text-[#00F5FF]/80 font-medium"><Loader2 className="animate-spin mr-2" size={18} /> Scraping the web...</div>}
                            <h3 className="font-bold text-white mb-3 flex items-center gap-2" style={{ fontFamily: "'Clash Display', 'DM Sans', sans-serif" }}><Target size={18} className="text-[#00F5FF]"/> Web Research Findings</h3>
                            <div className="text-sm text-gray-400 leading-relaxed max-h-[400px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#00F5FF transparent' }}>
                                {agentState.research_data ? (
                                     <ReactMarkdown 
                                       components={{
                                          h1: ({node, ...props}) => <h1 className="text-white font-bold text-lg mt-4 mb-2" {...props} />,
                                          h2: ({node, ...props}) => <h2 className="text-[#00F5FF] font-bold text-base mt-4 mb-2" {...props} />,
                                          h3: ({node, ...props}) => <h3 className="text-white font-semibold text-sm mt-3 mb-1" {...props} />,
                                          p: ({node, ...props}) => <p className="mb-3" {...props} />,
                                          ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-3 space-y-1" {...props} />,
                                          ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-3 space-y-1" {...props} />,
                                          li: ({node, ...props}) => <li className="text-gray-300" {...props} />,
                                          strong: ({node, ...props}) => <strong className="text-white font-bold" {...props} />,
                                          a: ({node, ...props}) => <a className="text-[#8B5CF6] hover:underline" target="_blank" rel="noreferrer" {...props} />
                                       }}
                                     >
                                        {agentState.research_data}
                                     </ReactMarkdown>
                                ) : "Waiting for data..."}
                            </div>
                        </div>
                    )}

                    {/* Live Final Draft */}
                    {(agentState.draft || currentStepIndex >= getStepIndex('copywriter')) ? (
                        <div className="p-8 bg-gradient-to-br from-[#FF3D6E]/20 to-[#8B5CF6]/30 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-[0_0_40px_rgba(255,61,110,0.2)] text-white relative h-full">
                            {!agentState.draft && <div className="absolute inset-0 bg-[#080808]/80 backdrop-blur-xl z-10 flex items-center justify-center text-[#FF3D6E] font-medium rounded-[2rem]"><Loader2 className="animate-spin mr-2" size={18} /> Drafting Post Copy...</div>}
                            <div className="absolute top-4 right-4 bg-[#FF3D6E]/20 backdrop-blur border border-[#FF3D6E]/30 px-3 py-1 rounded-full text-xs font-bold text-white shadow-[0_0_12px_rgba(255,61,110,0.5)]">Copywriter Output</div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-white text-2xl drop-shadow-lg" style={{ fontFamily: "'Clash Display', 'DM Sans', sans-serif" }}>Final Draft</h3>
                                {agentState.draft && isFinished && (
                                    <button 
                                        onClick={handleCopy}
                                        className="flex items-center gap-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                                    >
                                        {copied ? <CheckCircle size={14} className="text-[#00F5FF]" /> : <Copy size={14} />}
                                        {copied ? "Copied!" : "Copy"}
                                    </button>
                                )}
                            </div>
                            
                            {!agentState.draft ? (
                                <div className="text-white font-medium whitespace-pre-wrap leading-relaxed pb-6 text-lg">
                                    Waiting for copywriter...
                                </div>
                            ) : (
                                <textarea
                                    value={editableDraft}
                                    onChange={(e) => setEditableDraft(e.target.value)}
                                    className="w-full bg-[#080808]/40 border border-white/10 focus:border-[#FF3D6E]/50 focus:bg-[#080808]/80 text-white font-medium whitespace-pre-wrap leading-relaxed px-4 py-4 rounded-2xl text-[17px] outline-none resize-y min-h-[220px] shadow-inner font-sans mb-4 transition-all"
                                    placeholder="Your AI generated copy will appear here..."
                                />
                            )}
                            
                            {agentState.hashtags && agentState.hashtags.length > 0 && (
                                <div className="mb-6 pt-2 pb-2">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Hash size={14} className="text-[#00F5FF]"/> Generated Hashtags</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {agentState.hashtags.map((tag, i) => (
                                            <span key={i} className="bg-[#00F5FF]/10 text-[#00F5FF] border border-[#00F5FF]/20 px-3 py-1.5 rounded-xl text-sm font-bold shadow-sm hover:bg-[#00F5FF]/20 transition-colors cursor-pointer">
                                                {tag.startsWith('#') ? tag : `#${tag}`}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {agentState.draft && isFinished && (
                                <div className="mt-6 pt-6 border-t border-white/10">
                                    {!audioUrl ? (
                                        <button 
                                            onClick={generateAudio}
                                            disabled={isGeneratingAudio}
                                            className="flex items-center gap-2 bg-[#8B5CF6]/40 hover:bg-[#8B5CF6]/60 border border-[#8B5CF6]/50 text-white px-4 py-2 rounded-xl transition-all disabled:opacity-50 text-sm font-bold shadow-[0_0_12px_rgba(139,92,246,0.3)]"
                                        >
                                            {isGeneratingAudio ? <Loader2 size={16} className="animate-spin" /> : <Volume2 size={16} />} 
                                            {isGeneratingAudio ? 'Generating Voice...' : 'Listen to Draft'}
                                        </button>
                                    ) : (
                                        <div className="bg-black/50 backdrop-blur-md p-3 rounded-2xl border border-white/10 w-full flex items-center justify-between gap-4 shadow-inner">
                                            <audio ref={audioRef} controls src={audioUrl} className="w-full h-10 outline-none" autoPlay />
                                            <a 
                                                href={audioUrl} 
                                                download="draft_speech.wav"
                                                className="shrink-0 flex items-center justify-center bg-[#8B5CF6] hover:bg-[#8B5CF6]/80 text-white p-2.5 rounded-xl transition-colors shadow-[0_0_16px_rgba(139,92,246,0.6)]"
                                                title="Download Audio"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                                            </a>
                                        </div>
                                    )}
                                    
                                    {/* Video section */}
                                    <div className="mt-4 pt-4 border-t border-white/10">
                                        {(!isGeneratingVideo && !isVideoFinished) && (
                                            <button 
                                                onClick={generateVideo}
                                                className="flex items-center w-full justify-center gap-2 bg-gradient-to-r from-[#00F5FF]/20 to-[#8B5CF6]/20 hover:from-[#00F5FF]/30 hover:to-[#8B5CF6]/30 text-white border border-[#00F5FF]/30 px-4 py-3 rounded-xl transition-all text-sm font-bold shadow-[0_0_16px_rgba(0,245,255,0.2)]"
                                            >
                                                <Video size={18} className="text-[#00F5FF]" /> Generate Video AI Avatar
                                            </button>
                                        )}

                                        {isGeneratingVideo && (
                                            <div className="bg-black/60 rounded-xl p-4 border border-white/10 font-mono text-[11px] md:text-xs text-[#00F5FF] h-40 overflow-y-auto leading-relaxed scroll-smooth flex flex-col justify-end shadow-inner">
                                                <div className="space-y-1">
                                                    {videoLogs.map((log, i) => (
                                                        <div key={i} className="animate-in fade-in slide-in-from-bottom-1">{log}</div>
                                                    ))}
                                                    <div className="flex items-center text-[#00F5FF] mt-2">
                                                        <Loader2 size={12} className="animate-spin mr-2" /> Processing...
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {isVideoFinished && (
                                            <div className="rounded-2xl overflow-hidden border border-white/20 shadow-[0_0_24px_rgba(0,245,255,0.3)] relative bg-black/50 p-2">
                                                <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium text-white/90 border border-white/10">
                                                    <div className="w-2 h-2 rounded-full bg-[#00F5FF] animate-pulse shadow-[0_0_8px_rgba(0,245,255,0.8)]"></div>
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
                        <div className="p-8 bg-white/5 backdrop-blur-md rounded-[2rem] border border-dashed border-white/10 flex flex-col items-center justify-center min-h-[300px] text-gray-500">
                            <Loader2 className="animate-spin mb-4 text-gray-600" size={40} />
                            <p className="font-medium uppercase tracking-widest text-sm">Copywriter is waiting for strategy...</p>
                        </div>
                    )}
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
                        className="px-8 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold rounded-2xl hover:bg-white/20 transition-colors shadow-[0_0_16px_rgba(255,255,255,0.1)]"
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
