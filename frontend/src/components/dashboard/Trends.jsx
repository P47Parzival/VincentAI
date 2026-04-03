import React, { useState, useEffect } from 'react';
import { Flame, Activity, Music, PlaySquare, LayoutGrid, ExternalLink, Play, Heart, Eye } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function Trends() {
  const [googleData, setGoogleData] = useState({ items: [], keywords: [] });
  const [spotifyData, setSpotifyData] = useState({ items: [], mocked: false });
  const [youtubeData, setYoutubeData] = useState({ items: [] });
  const [socialData, setSocialData] = useState({ items: [], mocked: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllTrends = async () => {
      try {
        setLoading(true);
        const [googleRes, spotifyRes, ytRes, socialRes] = await Promise.allSettled([
          fetch('http://localhost:4000/api/trends/google').then(x => x.json()),
          fetch('http://localhost:4000/api/trends/spotify').then(x => x.json()),
          fetch('http://localhost:4000/api/trends/youtube').then(x => x.json()),
          fetch('http://localhost:4000/api/trends/social').then(x => x.json())
        ]);
        
        if (googleRes.status === 'fulfilled' && googleRes.value.items) setGoogleData(googleRes.value);
        if (spotifyRes.status === 'fulfilled' && spotifyRes.value.items) setSpotifyData(spotifyRes.value);
        if (ytRes.status === 'fulfilled' && ytRes.value.items) setYoutubeData(ytRes.value);
        if (socialRes.status === 'fulfilled' && socialRes.value.items) setSocialData(socialRes.value);
        
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
    <div className="space-y-10 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 flex items-center gap-3 tracking-tight">
             <Flame size={36} className="text-rose-500" /> Market Pulse
          </h2>
          <p className="text-slate-500 mt-2 text-lg">Real-time data from Google, YouTube, Spotify, and Social feeds.</p>
        </div>
      </div>

      {/* Google Trends Line Chart */}
      <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="mb-6 flex items-center justify-between">
           <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Activity className="text-blue-500"/> Search Interest Over Time</h3>
           <span className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-500 rounded-full">Google Trends</span>
        </div>
        <div className="h-80 w-full font-medium">
          {googleData.items.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={googleData.items} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                    <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', fontWeight: '600' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '14px' }}/>
                    {googleData.keywords.map((kw, i) => (
                        <Line key={kw} type="monotone" dataKey={kw} stroke={chartColors[i % chartColors.length]} strokeWidth={3} dot={false} activeDot={{ r: 8 }} />
                    ))}
                </LineChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-full flex items-center justify-center text-slate-400">Failed to load Google Trends data</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* YouTube Trending Tab */}
        <div className="space-y-4">
            <div className="flex items-center justify-between mx-2">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><PlaySquare className="text-red-500"/> Trending Videos</h3>
            </div>
            <div className="flex flex-col gap-4">
                {youtubeData.items.length > 0 ? youtubeData.items.map((video) => (
                    <a key={video.id} href={`https://youtube.com/watch?v=${video.id}`} target="_blank" rel="noreferrer" className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="relative w-32 md:w-40 aspect-video rounded-xl overflow-hidden shrink-0 bg-slate-100">
                            <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                        </div>
                        <div className="flex flex-col justify-between h-full py-1">
                            <h4 className="font-bold text-slate-800 line-clamp-2 text-sm md:text-base leading-snug group-hover:text-red-500 transition-colors">{video.title}</h4>
                            <div>
                                <p className="text-slate-500 text-xs font-medium mt-1">{video.channelTitle}</p>
                                <p className="text-slate-400 text-xs mt-1 flex gap-3">
                                    <span>{(video.viewCount / 1000000).toFixed(1)}M views</span>
                                    <span>{(video.likeCount / 1000).toFixed(0)}K likes</span>
                                </p>
                            </div>
                        </div>
                    </a>
                )) : (
                    <div className="p-8 bg-white rounded-2xl border border-slate-100 text-center text-slate-400">Add YouTube API Key to see live trends</div>
                )}
            </div>
        </div>

        {/* Right Column: Spotify & Social */}
        <div className="space-y-8">
            
            {/* Spotify Viral Audio */}
            <div className="bg-slate-900 rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                    <Music size={120} />
                </div>
                <div className="flex items-center justify-between mb-6 relative z-10">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2"><Music className="text-green-400"/> Viral Sounds</h3>
                    {spotifyData.mocked && <span className="text-[10px] font-bold bg-slate-800 text-slate-400 px-2 py-1 rounded">MOCKED</span>}
                </div>
                <div className="space-y-4 relative z-10">
                    {spotifyData.items.map((track, i) => (
                        <div key={track.id} className="flex items-center gap-4 bg-slate-800/50 p-3 rounded-2xl hover:bg-slate-800 transition-colors">
                            <div className="w-6 text-center font-bold text-slate-500">{i + 1}</div>
                            <img src={track.image} alt="Album Art" className="w-12 h-12 rounded-xl object-cover shadow-md" />
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-slate-100 truncate">{track.title}</h4>
                                <p className="text-slate-400 text-xs truncate">{track.artist}</p>
                            </div>
                            <div className="pr-3">
                                <div className="text-xs font-mono text-green-400 p-1.5 bg-green-400/10 rounded-lg">
                                    {track.popularity}%
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Social Scraper (Apify Mock) */}
            <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><LayoutGrid className="text-purple-500"/> Scraped Viral Posts</h3>
                    {socialData.mocked && <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded">MOCKED</span>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {socialData.items.map((post) => (
                        <div key={post.id} className="relative aspect-[3/4] rounded-2xl overflow-hidden group">
                            <img src={post.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="post" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                            
                            <div className="absolute top-3 left-3 p-1.5 bg-white/20 backdrop-blur-md rounded-lg">
                                {post.platform === 'tiktok' ? <Play size={14} className="text-white fill-white" /> : <Eye size={14} className="text-white" />}
                            </div>

                            <div className="absolute bottom-3 left-3 right-3">
                                <p className="text-white text-xs font-medium mb-2 line-clamp-2 leading-snug">{post.caption}</p>
                                <div className="flex items-center justify-between text-white/80 text-[10px] font-bold">
                                    <span>{post.author}</span>
                                    <div className="flex items-center gap-1"><Heart size={10} className="fill-rose-500 text-rose-500"/> {(post.likes / 1000).toFixed(0)}k</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}
