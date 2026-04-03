import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  Camera,
  Eye,
  RefreshCw,
  Users,
  Video
} from 'lucide-react';
import {
  fetchInstagramAnalytics,
  fetchYouTubeAnalytics
} from '../../services/analyticsApi';

const numberFormatter = new Intl.NumberFormat('en-US');

const formatNumber = (value) => {
  if (typeof value !== 'number') {
    return value || '-';
  }
  return numberFormatter.format(value);
};

export default function Analytics() {
  const [activePlatform, setActivePlatform] = useState('instagram');
  const [filters, setFilters] = useState({
    instagram: { igUserId: '', mediaLimit: 10 },
    youtube: { channelId: '', maxResults: 8 }
  });
  const [dataMap, setDataMap] = useState({ instagram: null, youtube: null });
  const [loadingMap, setLoadingMap] = useState({ instagram: false, youtube: false });
  const [errorMap, setErrorMap] = useState({ instagram: '', youtube: '' });

  const loadPlatformData = async (platform) => {
    setLoadingMap((prev) => ({ ...prev, [platform]: true }));
    setErrorMap((prev) => ({ ...prev, [platform]: '' }));

    try {
      if (platform === 'instagram') {
        const payload = await fetchInstagramAnalytics(filters.instagram);
        setDataMap((prev) => ({ ...prev, instagram: payload }));
      } else {
        const payload = await fetchYouTubeAnalytics(filters.youtube);
        setDataMap((prev) => ({ ...prev, youtube: payload }));
      }
    } catch (error) {
      setErrorMap((prev) => ({
        ...prev,
        [platform]: error.message || 'Failed to fetch analytics data.'
      }));
    } finally {
      setLoadingMap((prev) => ({ ...prev, [platform]: false }));
    }
  };

  useEffect(() => {
    loadPlatformData('instagram');
  }, []);

  useEffect(() => {
    if (!dataMap[activePlatform] && !loadingMap[activePlatform]) {
      loadPlatformData(activePlatform);
    }
  }, [activePlatform]);

  const activeData = dataMap[activePlatform];
  const activeError = errorMap[activePlatform];
  const isLoading = loadingMap[activePlatform];

  const stats = useMemo(() => {
    if (!activeData?.metrics) {
      return [];
    }

    if (activePlatform === 'instagram') {
      return [
        {
          title: 'Followers',
          value: formatNumber(activeData.metrics.followersCount),
          icon: Users,
          color: 'text-fuchsia-600',
          bg: 'bg-fuchsia-50',
          border: 'border-fuchsia-100'
        },
        {
          title: 'Reach',
          value: formatNumber(activeData.metrics.reach),
          icon: Activity,
          color: 'text-emerald-600',
          bg: 'bg-emerald-50',
          border: 'border-emerald-100'
        },
        {
          title: 'Impressions',
          value: formatNumber(activeData.metrics.impressions),
          icon: Eye,
          color: 'text-orange-600',
          bg: 'bg-orange-50',
          border: 'border-orange-100'
        },
        {
          title: 'Reels Uploaded',
          value: formatNumber(activeData.metrics.reelsUploaded),
          icon: Video,
          color: 'text-sky-600',
          bg: 'bg-sky-50',
          border: 'border-sky-100'
        }
      ];
    }

    return [
      {
        title: 'Subscribers',
        value: formatNumber(activeData.metrics.subscribersCount),
        icon: Users,
        color: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-red-100'
      },
      {
        title: 'Estimated Reach',
        value: formatNumber(activeData.metrics.estimatedReach),
        icon: Activity,
        color: 'text-cyan-600',
        bg: 'bg-cyan-50',
        border: 'border-cyan-100'
      },
      {
        title: 'Estimated Impressions',
        value: formatNumber(activeData.metrics.estimatedImpressions),
        icon: Eye,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-amber-100'
      },
      {
        title: 'Videos Uploaded',
        value: formatNumber(activeData.metrics.videosUploaded),
        icon: Video,
        color: 'text-violet-600',
        bg: 'bg-violet-50',
        border: 'border-violet-100'
      }
    ];
  }, [activeData, activePlatform]);

  const onFilterChange = (platform, key, value) => {
    setFilters((prev) => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [key]: value
      }
    }));
  };

  const onFetchSubmit = (event) => {
    event.preventDefault();
    loadPlatformData(activePlatform);
  };

  return (
    <div className="space-y-6">
      <div className="p-2 rounded-2xl bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] inline-flex gap-2">
        {[
          { id: 'instagram', label: 'Instagram', icon: Camera },
          { id: 'youtube', label: 'YouTube', icon: Video }
        ].map((platform) => {
          const Icon = platform.icon;
          const isActive = activePlatform === platform.id;
          return (
            <button
              key={platform.id}
              onClick={() => setActivePlatform(platform.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-[0_10px_24px_rgba(15,23,42,0.15)]'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon size={17} />
              <span>{platform.label}</span>
            </button>
          );
        })}
      </div>

      <form
        onSubmit={onFetchSubmit}
        className="p-5 rounded-3xl bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
      >
        {activePlatform === 'instagram' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Instagram User ID</span>
              <input
                type="text"
                value={filters.instagram.igUserId}
                onChange={(event) => onFilterChange('instagram', 'igUserId', event.target.value)}
                placeholder="Optional if set in backend .env"
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-200"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Media Limit</span>
              <input
                type="number"
                min="1"
                max="25"
                value={filters.instagram.mediaLimit}
                onChange={(event) => onFilterChange('instagram', 'mediaLimit', event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-200"
              />
            </label>
            <button
              type="submit"
              disabled={isLoading}
              className="h-[42px] rounded-xl bg-fuchsia-600 text-white font-medium hover:bg-fuchsia-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Fetching...' : 'Fetch Instagram Data'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">YouTube Channel ID</span>
              <input
                type="text"
                value={filters.youtube.channelId}
                onChange={(event) => onFilterChange('youtube', 'channelId', event.target.value)}
                placeholder="Optional if set in backend .env"
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recent Videos Count</span>
              <input
                type="number"
                min="1"
                max="20"
                value={filters.youtube.maxResults}
                onChange={(event) => onFilterChange('youtube', 'maxResults', event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
              />
            </label>
            <button
              type="submit"
              disabled={isLoading}
              className="h-[42px] rounded-xl bg-red-600 text-white font-medium hover:bg-red-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Fetching...' : 'Fetch YouTube Data'}
            </button>
          </div>
        )}
      </form>

      {activeError && (
        <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 flex items-start gap-3">
          <AlertCircle size={18} className="mt-0.5" />
          <p className="text-sm">{activeError}</p>
        </div>
      )}

      {isLoading ? (
        <div className="p-8 rounded-3xl bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-center gap-3 text-slate-600">
          <RefreshCw size={18} className="animate-spin" />
          <span>Pulling latest {activePlatform} analytics...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {stats.map((stat) => (
              <div
                key={stat.title}
                className="p-6 rounded-3xl bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]"
              >
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

          <div className="p-6 md:p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 blur-[100px] rounded-full" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-50 blur-[100px] rounded-full" />

            <div className="relative z-10 space-y-5">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h3 className="text-2xl text-slate-800 font-bold">
                    {activePlatform === 'instagram' ? 'Instagram' : 'YouTube'} Feed Snapshot
                  </h3>
                  <p className="text-slate-500 mt-1 text-sm">
                    Showing latest {activeData?.items?.length || 0} records from your connected account.
                  </p>
                </div>
                <div className="text-sm text-slate-600 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg">
                  Account: {activeData?.account?.username || activeData?.account?.title || '-'}
                </div>
              </div>

              {activePlatform === 'youtube' && Array.isArray(activeData?.notes) && activeData.notes.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
                  {activeData.notes.map((note) => (
                    <p key={note} className="text-sm">{note}</p>
                  ))}
                </div>
              )}

              <div className="space-y-3">
                {(activeData?.items || []).length > 0 ? (
                  (activeData?.items || []).map((item) => (
                    <article
                      key={item.id || item.videoId}
                      className="p-4 rounded-2xl bg-white/80 border border-slate-200/60 shadow-sm flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 truncate">
                          {item.title || item.caption || 'Untitled'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {item.media_type || 'VIDEO'}
                          {item.publishedAt || item.timestamp
                            ? ` • ${new Date(item.publishedAt || item.timestamp).toLocaleDateString()}`
                            : ''}
                        </p>
                      </div>
                      <div className="shrink-0">
                        {item.thumbnail || item.thumbnail_url || item.media_url ? (
                          <img
                            src={item.thumbnail || item.thumbnail_url || item.media_url}
                            alt="media preview"
                            className="w-16 h-16 rounded-xl object-cover border border-slate-100"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                            <Video size={18} />
                          </div>
                        )}
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="p-8 rounded-2xl border border-slate-200 bg-white/70 text-center text-slate-500">
                    No items available yet. Fetch analytics to load media details.
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
