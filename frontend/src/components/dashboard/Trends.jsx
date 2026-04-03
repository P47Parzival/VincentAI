import React, { useState, useEffect } from 'react';
import { Flame, Activity, Music, PlaySquare, LayoutGrid, ExternalLink, Play, Heart, Eye, Zap, Target, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function Trends() {
  const [hashtagData, setHashtagData] = useState({ items: [], mocked: false });
  const [spotifyData, setSpotifyData] = useState({ items: [], mocked: false });
  const [youtubeData, setYoutubeData] = useState({ items: [] });
  const [trendPredictions, setTrendPredictions] = useState({ items: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllTrends = async () => {
      try {
        setLoading(true);
        const [googleRes, spotifyRes, ytRes, predictRes] = await Promise.allSettled([
          fetch('http://localhost:4000/api/trends/hashtags').then(x => x.json()),
          fetch('http://localhost:4000/api/trends/spotify').then(x => x.json()),
          fetch('http://localhost:4000/api/trends/youtube').then(x => x.json()),
          fetch('http://localhost:4000/api/trends/predict').then(x => x.json())
        ]);
        
        if (googleRes.status === 'fulfilled' && googleRes.value.items) setHashtagData(googleRes.value);
        if (spotifyRes.status === 'fulfilled' && spotifyRes.value.items) setSpotifyData(spotifyRes.value);
        if (ytRes.status === 'fulfilled' && ytRes.value.items) setYoutubeData(ytRes.value);
        if (predictRes.status === 'fulfilled' && predictRes.value.items) setTrendPredictions(predictRes.value);
        
      } catch (error) {
        console.error("Failed to load trends data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllTrends();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <Activity className="animate-pulse mb-4 text-rose-400" size={48} />
        <p className="font-medium text-lg">Analyzing global trends data...</p>
      </div>
    );
  }

  const chartColors = ["#8b5cf6", "#f43f5e", "#10b981", "#3b82f6"];

  return (
    <div className="space-y-10 pb-20 text-[#F0F0F0]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3 tracking-tight" style={{ fontFamily: "'Clash Display', 'DM Sans', sans-serif" }}>
             <Flame size={36} className="text-[#FF3D6E]" /> Market Pulse
          </h2>
          <p className="text-gray-400 mt-2 text-lg">Real-time data from Google, YouTube, Spotify, and Social feeds.</p>
        </div>
      </div>

      {/* Hashtag Frequency Bar Chart */}
      <div className="bg-white/5 backdrop-blur-md p-6 md:p-8 rounded-[2rem] border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
        <div className="mb-6 flex items-center justify-between">
           <h3 className="text-xl font-bold text-white flex items-center gap-2" style={{ fontFamily: "'Clash Display', 'DM Sans', sans-serif" }}><Activity className="text-[#00F5FF]"/> Trending Video Hashtags</h3>
           <div className="flex gap-2 items-center">
               {hashtagData.mocked && <span className="text-[10px] font-bold bg-[#FF3D6E]/20 text-[#FF3D6E] px-2 py-1 rounded border border-[#FF3D6E]/30">MOCKED</span>}
               <span className="text-xs font-semibold px-3 py-1 bg-white/10 text-gray-300 rounded-full border border-white/10 tracking-widest uppercase">Global YouTube Scrape</span>
           </div>
        </div>
        <div className="h-80 w-full font-medium">
          {hashtagData.items.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hashtagData.items} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#9ca3af', fontWeight: '500' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                    <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(8,8,8,0.9)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)', color: '#fff', fontWeight: '600' }}
                        cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    />
                    <Bar dataKey="count" fill="#8B5CF6" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-full flex items-center justify-center text-gray-500 uppercase tracking-widest text-sm font-bold">Failed to load hashtag data</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* YouTube Trending Tab */}
        <div className="space-y-4">
            <div className="flex items-center justify-between mx-2">
                <h3 className="text-xl font-bold text-white flex items-center gap-2" style={{ fontFamily: "'Clash Display', 'DM Sans', sans-serif" }}><PlaySquare className="text-[#FF3D6E]"/> Trending Videos</h3>
            </div>
            <div className="flex flex-col gap-4">
                {youtubeData.items.length > 0 ? youtubeData.items.map((video) => (
                    <a key={video.id} href={`https://youtube.com/watch?v=${video.id}`} target="_blank" rel="noreferrer" className="flex items-start gap-4 p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.1)] hover:shadow-[0_0_16px_rgba(255,61,110,0.2)] hover:border-white/20 transition-all group">
                        <div className="relative w-32 md:w-40 aspect-video rounded-xl overflow-hidden shrink-0 bg-[#080808] border border-white/5">
                            <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                        </div>
                        <div className="flex flex-col justify-between h-full py-1">
                            <h4 className="font-bold text-white line-clamp-2 text-sm md:text-base leading-snug group-hover:text-[#00F5FF] transition-colors">{video.title}</h4>
                            <div>
                                <p className="text-gray-400 text-xs font-medium mt-1">{video.channelTitle}</p>
                                <p className="text-gray-500 text-xs mt-1 flex gap-3 font-bold">
                                    <span>{(video.viewCount / 1000000).toFixed(1)}M views</span>
                                    <span>{(video.likeCount / 1000).toFixed(0)}K likes</span>
                                </p>
                            </div>
                        </div>
                    </a>
                )) : (
                    <div className="p-8 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 text-center text-gray-500 uppercase tracking-widest text-sm font-bold">Add YouTube API Key to see live trends</div>
                )}
            </div>
        </div>

        {/* Right Column: Spotify & Social */}
        <div className="space-y-8">
            
            {/* Spotify Viral Audio */}
            <div className="bg-gradient-to-br from-[#8B5CF6]/10 to-[#00F5FF]/10 backdrop-blur-md rounded-[2rem] border border-[rgba(255,255,255,0.05)] p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-20 pointer-events-none">
                    <Music size={120} className="text-[#00F5FF]" />
                </div>
                <div className="flex items-center justify-between mb-6 relative z-10">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2" style={{ fontFamily: "'Clash Display', 'DM Sans', sans-serif" }}><Music className="text-[#00F5FF]"/> Viral Sounds</h3>
                    {spotifyData.mocked && <span className="text-[10px] font-bold bg-[#FF3D6E]/20 text-[#FF3D6E] px-2 py-1 rounded border border-[#FF3D6E]/30">MOCKED</span>}
                </div>
                <div className="space-y-4 relative z-10">
                    {spotifyData.items.map((track, i) => (
                        <div key={track.id} className="flex items-center gap-4 bg-black/20 p-3 rounded-2xl hover:bg-black/40 border border-white/5 transition-all">
                            <div className="w-6 text-center font-bold text-[#8B5CF6]">{i + 1}</div>
                            <img src={track.image} alt="Album Art" className="w-12 h-12 rounded-xl object-cover shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-white/10" />
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-white truncate">{track.title}</h4>
                                <p className="text-gray-400 text-xs truncate">{track.artist}</p>
                            </div>
                            <div className="pr-3">
                                <div className="text-xs font-mono font-bold text-[#00F5FF] p-1.5 bg-[#00F5FF]/10 rounded-lg border border-[#00F5FF]/20 shadow-sm">
                                    {track.popularity}%
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Predictive Micro-Trends */}
            <div className="bg-white/5 backdrop-blur-md rounded-[2rem] p-6 border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.2)] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                    <Zap size={140} className="text-[#00F5FF]" />
                </div>
                <div className="flex items-center justify-between mb-6 relative z-10">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2" style={{ fontFamily: "'Clash Display', 'DM Sans', sans-serif" }}><Target className="text-[#00F5FF]"/> Predicted Micro-Trends</h3>
                    <span className="text-[10px] font-bold bg-[#00F5FF]/10 text-[#00F5FF] px-2 py-1 rounded border border-[#00F5FF]/20 flex items-center gap-1"><Zap size={10} /> AI Synthesis</span>
                </div>
                <div className="flex flex-col gap-4 relative z-10 max-h-[500px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#00F5FF transparent' }}>
                    {trendPredictions.items && trendPredictions.items.map((trend, i) => (
                        <div key={i} className="bg-black/30 border border-white/5 rounded-2xl p-5 hover:bg-black/50 transition-all group">
                            <div className="flex justify-between items-start mb-3">
                                <h4 className="text-white font-bold text-lg leading-tight group-hover:text-[#00F5FF] transition-colors pr-2">{trend.trend_name}</h4>
                                <span className="bg-white/10 border border-white/10 text-gray-300 text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-lg shrink-0">{trend.origin_signal}</span>
                            </div>
                            <p className="text-gray-400 text-sm mb-4 leading-relaxed line-clamp-3">
                                "{trend.virality_hypothesis}"
                            </p>
                            <div className="bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 rounded-xl p-3">
                                <p className="text-xs font-bold text-[#8B5CF6] uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><ArrowRight size={12}/> How to leverage</p>
                                <p className="text-gray-300 text-sm leading-relaxed">{trend.how_to_leverage}</p>
                            </div>
                        </div>
                    ))}
                    {(!trendPredictions.items || trendPredictions.items.length === 0) && (
                        <div className="flex items-center justify-center h-40 text-gray-500 font-bold uppercase tracking-widest text-sm text-center px-4">
                           Mining Subreddits & Tavily Data...
                        </div>
                    )}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}
