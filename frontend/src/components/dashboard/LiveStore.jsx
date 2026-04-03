import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Image as ImageIcon,
  Link2,
  Mic,
  RefreshCw,
  Radio,
  Sparkles,
  Video
} from 'lucide-react'
import { fetchLiveStoreItems, getLiveStoreWsUrl } from '../../services/liveStoreApi'

const statusStyles = {
  queued: 'bg-white/5 text-gray-300 border-white/10',
  processing: 'bg-[#00F5FF]/10 text-[#00F5FF] border-[#00F5FF]/30',
  complete: 'bg-[#35F08B]/10 text-[#35F08B] border-[#35F08B]/30',
  error: 'bg-[#FF3D6E]/10 text-[#FF3D6E] border-[#FF3D6E]/30'
}

const contentIcons = {
  video: Video,
  audio: Mic,
  image: ImageIcon,
  link: Link2,
  text: Sparkles
}

const formatTimestamp = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString()
}

export default function LiveStore({ initialItemId }) {
  const [items, setItems] = useState([])
  const [selectedId, setSelectedId] = useState(initialItemId || '')
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadItems = useCallback(async () => {
    setIsRefreshing(true)
    setError('')
    try {
      const payload = await fetchLiveStoreItems({ limit: 40 })
      setItems(payload.items || [])
    } catch (err) {
      setError(err.message || 'Failed to load Live Store items.')
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  useEffect(() => {
    if (!initialItemId) return
    setSelectedId(initialItemId)
  }, [initialItemId])

  useEffect(() => {
    const ws = new WebSocket(getLiveStoreWsUrl())
    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)
    ws.onerror = () => setError('Live updates unavailable.')
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        const incoming = message?.payload
        if (!incoming?.id) return
        setItems((prev) => {
          const exists = prev.find((item) => item.id === incoming.id)
          if (!exists) {
            return [incoming, ...prev]
          }
          return prev.map((item) => (item.id === incoming.id ? { ...item, ...incoming } : item))
        })
      } catch (err) {
        setError('Live updates failed to parse.')
      }
    }
    return () => {
      ws.close()
    }
  }, [])

  useEffect(() => {
    if (selectedId || items.length === 0) return
    setSelectedId(items[0].id)
  }, [items, selectedId])

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) || items[0],
    [items, selectedId]
  )

  const statusCounts = useMemo(() => {
    const counts = { total: items.length, queued: 0, processing: 0, complete: 0, error: 0 }
    items.forEach((item) => {
      const status = item.status || 'queued'
      if (counts[status] !== undefined) {
        counts[status] += 1
      }
    })
    return counts
  }, [items])

  const input = selectedItem?.input || {}
  const contentType = input.content_type || (input.link ? 'link' : 'text')
  const ContentIcon = contentIcons[contentType] || Sparkles

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-6">
      <section className="space-y-4">
        <div className="p-4 rounded-3xl bg-white/5 border border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio size={18} className={connected ? 'text-[#35F08B]' : 'text-gray-500'} />
              <span className="text-sm font-semibold">Live Store Queue</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadItems}
                className="text-xs px-2 py-1 rounded-full border border-white/10 text-gray-300 hover:text-white hover:border-white/20 transition-colors inline-flex items-center gap-1"
                disabled={isRefreshing}
              >
                <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
                {isRefreshing ? 'Refreshing' : 'Refresh'}
              </button>
              <span className={`text-xs px-2 py-1 rounded-full border ${connected ? 'border-[#35F08B]/30 text-[#35F08B]' : 'border-white/10 text-gray-400'}`}>
                {connected ? 'Live' : 'Offline'}
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Incoming WhatsApp submissions appear here in real time.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Total', value: statusCounts.total, tone: 'text-white' },
            { label: 'Queued', value: statusCounts.queued, tone: 'text-gray-300' },
            { label: 'Processing', value: statusCounts.processing, tone: 'text-[#00F5FF]' },
            { label: 'Completed', value: statusCounts.complete, tone: 'text-[#35F08B]' },
          ].map((card) => (
            <div key={card.label} className="p-3 rounded-2xl border border-white/10 bg-white/5">
              <div className="text-[11px] uppercase tracking-widest text-gray-500">{card.label}</div>
              <div className={`text-lg font-semibold ${card.tone}`}>{card.value}</div>
            </div>
          ))}
        </div>

        {error && (
          <div className="p-3 rounded-2xl border border-[#FF3D6E]/30 bg-[#FF3D6E]/10 text-[#FF3D6E] text-sm flex items-center gap-2">
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        <div className="space-y-3">
          {items.map((item) => {
            const status = item.status || 'queued'
            const style = statusStyles[status] || statusStyles.queued
            const itemInput = item.input || {}
            const itemType = itemInput.content_type || (itemInput.link ? 'link' : 'text')
            const ItemIcon = contentIcons[itemType] || Sparkles
            return (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={`w-full text-left p-4 rounded-3xl border transition-all ${
                  selectedId === item.id
                    ? 'border-[#FF3D6E]/40 bg-[#FF3D6E]/10 shadow-[0_0_18px_rgba(255,61,110,0.2)]'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <ItemIcon size={18} className="text-[#00F5FF]" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{itemInput.profile_name || 'Creator'}</div>
                      <div className="text-xs text-gray-500">{itemType.toUpperCase()} intake</div>
                    </div>
                  </div>
                  <div className={`text-[11px] px-2 py-1 rounded-full border ${style}`}>
                    {status}
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-400 line-clamp-2">
                  {itemInput.text || itemInput.link || 'Media submission received.'}
                </div>
                <div className="mt-2 text-[11px] text-gray-600">{formatTimestamp(item.created_at)}</div>
              </button>
            )
          })}
        </div>
      </section>

      <section className="space-y-6">
        <div className="p-6 rounded-3xl bg-white/5 border border-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.3)]">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FF3D6E]/15 border border-[#FF3D6E]/30 flex items-center justify-center">
                <ContentIcon size={20} className="text-[#FF3D6E]" />
              </div>
              <div>
                <div className="text-xl font-semibold text-white">Engagement Visualization Dashboard</div>
                <div className="text-xs text-gray-500">Frame-by-frame intelligence and algorithm signals.</div>
              </div>
            </div>
            <div className={`text-xs px-3 py-1 rounded-full border ${statusStyles[selectedItem?.status || 'queued'] || statusStyles.queued}`}>
              {selectedItem?.status || 'queued'}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl border border-white/10 bg-[#0D0D0D]/70">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Activity size={16} /> Virality Score
              </div>
              <div className="mt-3 text-3xl font-semibold text-white">
                {selectedItem?.viral_prediction?.score ?? '--'}
                <span className="text-sm text-gray-500">/100</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#FF3D6E] to-[#00F5FF]"
                  style={{ width: `${Math.min(selectedItem?.viral_prediction?.score || 0, 100)}%` }}
                ></div>
              </div>
              <p className="mt-3 text-xs text-gray-500">
                {selectedItem?.viral_prediction?.reasoning || 'Awaiting prediction summary.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-white/10 bg-[#0D0D0D]/70">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <CheckCircle2 size={16} /> Executive Summary
              </div>
              <p className="mt-3 text-sm text-gray-200 leading-relaxed">
                {selectedItem?.executive_summary || 'Processing multi-agent summary.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-white/10 bg-[#0D0D0D]/70">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Sparkles size={16} /> Algorithm-Aware Insights
              </div>
              <ul className="mt-3 space-y-2 text-sm text-gray-300">
                {(selectedItem?.algorithm_insights || []).slice(0, 4).map((insight, index) => (
                  <li key={`${insight.signal}-${index}`} className="flex items-start gap-2">
                    <span className="mt-1 w-2 h-2 rounded-full bg-[#00F5FF]"></span>
                    <div>
                      <div className="font-semibold text-white">{insight.signal}</div>
                      <div className="text-xs text-gray-500">{insight.why_it_matters}</div>
                    </div>
                  </li>
                ))}
                {(selectedItem?.algorithm_insights || []).length === 0 && (
                  <li className="text-xs text-gray-500">Insights are generating now.</li>
                )}
              </ul>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {(contentType === 'video' && (selectedItem?.frame_analysis?.attention_drop_segments || []).length > 0) && (
            <div className="p-5 rounded-3xl border border-white/10 bg-white/5 shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
              <div className="text-sm text-gray-400">Frame-Level Video Analysis</div>
              <div className="mt-4 space-y-3">
                {(selectedItem?.frame_analysis?.attention_drop_segments || []).map((segment, index) => (
                  <div key={`${segment.start}-${index}`} className="p-3 rounded-2xl border border-white/10 bg-[#0B0B0B]/80">
                    <div className="text-xs text-[#FF3D6E] font-semibold">
                      {segment.start} - {segment.end}
                    </div>
                    <div className="text-sm text-white mt-1">{segment.issue}</div>
                    <div className="text-xs text-gray-500 mt-1">{segment.recommendation}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-5 rounded-3xl border border-white/10 bg-white/5 shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
            <div className="text-sm text-gray-400">Post Optimization (Link Analysis)</div>
            {selectedItem?.platform_data?.scrape_error && (
              <div className="mt-3 text-xs text-[#FF3D6E] bg-[#FF3D6E]/10 border border-[#FF3D6E]/20 rounded-xl px-3 py-2">
                {selectedItem.platform_data.scrape_error}
              </div>
            )}
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="p-3 rounded-2xl border border-white/10 bg-[#0B0B0B]/80">
                <div className="text-xs text-gray-500">Baseline Score</div>
                <div className="text-lg font-semibold text-white">
                  {selectedItem?.link_analysis?.baseline_score ?? '--'}
                </div>
              </div>
              <div className="p-3 rounded-2xl border border-white/10 bg-[#0B0B0B]/80">
                <div className="text-xs text-gray-500">Predicted After</div>
                <div className="text-lg font-semibold text-[#35F08B]">
                  {selectedItem?.link_analysis?.predicted_virality_after?.score ?? '--'}
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-xs text-gray-500">Suggested Improvements</div>
              <ul className="mt-2 space-y-2 text-sm text-gray-300">
                {(selectedItem?.link_analysis?.suggested_improvements || []).map((tip, index) => (
                  <li key={`${tip}-${index}`} className="flex items-start gap-2">
                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#00F5FF]"></span>
                    {tip}
                  </li>
                ))}
                {(selectedItem?.link_analysis?.suggested_improvements || []).length === 0 && (
                  <li className="text-xs text-gray-500">Link insights will appear after scraping.</li>
                )}
              </ul>
            </div>
            {selectedItem?.link_analysis?.enhanced_text && (
              <div className="mt-4">
                <div className="text-xs text-gray-500">Enhanced Text</div>
                <p className="mt-2 text-sm text-white whitespace-pre-line">{selectedItem.link_analysis.enhanced_text}</p>
              </div>
            )}
          </div>


        </div>


      </section>
    </div>
  )
}
