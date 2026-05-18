import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Tag } from 'lucide-react';
import { fetchTagAnalytics, type TagAnalyticData } from '../../lib/analytics';

interface TagAnalyticsWidgetProps {
  userId: string;
}

const getTagColor = (tag: string) => {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 60%, 65%)`;
};

const formatDuration = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = (seconds / 3600).toFixed(1);
  return `${hrs}h`;
};

export const TagAnalyticsWidget: React.FC<TagAnalyticsWidgetProps> = ({ userId }) => {
  const [tagData, setTagData] = useState<TagAnalyticData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      const data = await fetchTagAnalytics(userId);
      if (active) {
        setTagData(data);
        setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-slate-900/20 border border-white/5 backdrop-blur-md rounded-2xl p-6 min-h-[220px] flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-white/10 border-t-white/50 animate-spin" />
      </div>
    );
  }

  if (tagData.length === 0) {
    return (
      <div className="bg-slate-900/20 border border-white/5 backdrop-blur-md rounded-2xl p-6 text-center">
        <div className="flex justify-center mb-3">
          <div className="p-3 bg-white/5 rounded-full border border-white/5">
            <Tag className="w-5 h-5 text-white/30" />
          </div>
        </div>
        <h3 className="text-sm font-sans font-medium text-white/70">No tag data yet</h3>
        <p className="text-xs text-white/40 mt-1 max-w-[200px] mx-auto">
          Add tags to your sessions on the dashboard to start tracking!
        </p>
      </div>
    );
  }

  const totalSeconds = tagData.reduce((acc, curr) => acc + curr.total_seconds, 0);

  return (
    <div className="bg-slate-900/40 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-sage-200/5 rounded-full blur-2xl pointer-events-none" />
      
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-sage-200" />
          <h3 className="text-[14px] font-sans font-semibold text-white tracking-wide uppercase">
            Focus Tags
          </h3>
        </div>
        <span className="text-[10px] font-mono bg-white/5 border border-white/5 px-2 py-0.5 rounded-full text-white/50">
          {tagData.length} active
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {tagData.map((item, idx) => {
          const pct = totalSeconds > 0 ? (item.total_seconds / totalSeconds) * 100 : 0;
          const color = getTagColor(item.tag);
          
          return (
            <div key={item.tag} className="group">
              <div className="flex items-center justify-between mb-1.5 text-xs font-sans">
                <span className="font-medium text-white/80 group-hover:text-white transition-colors capitalize flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                  {item.tag}
                </span>
                <div className="flex items-center gap-2 text-white/40 font-mono text-[11px]">
                  <span>{item.session_count} {item.session_count === 1 ? 'session' : 'sessions'}</span>
                  <span>•</span>
                  <span className="font-semibold text-white/70">{formatDuration(item.total_seconds)}</span>
                </div>
              </div>
              
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: idx * 0.1 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
