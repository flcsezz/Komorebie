import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type TagAnalyticData } from '../../lib/analytics';

interface TagDonutChartProps {
  data: TagAnalyticData[];
  totalSeconds: number;
  hoveredTag: string | null;
  onHover: (tag: string | null) => void;
  getTagColor: (tag: string) => string;
  onSelectSegment?: (tag: string) => void;
}

const formatDuration = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = (seconds / 3600).toFixed(1);
  return `${hrs}h`;
};

export const TagDonutChart: React.FC<TagDonutChartProps> = ({ 
  data, 
  totalSeconds, 
  hoveredTag, 
  onHover, 
  getTagColor,
  onSelectSegment
}) => {
  const size = 200;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const chartSegments = useMemo(() => {
    let currentOffset = 0;
    return data.map((item) => {
      const percentage = totalSeconds > 0 ? (item.total_seconds / totalSeconds) : 0;
      const segmentOffset = currentOffset;
      currentOffset += percentage;
      
      return {
        ...item,
        percentage,
        offset: segmentOffset * circumference,
        length: percentage * circumference,
        color: getTagColor(item.tag)
      };
    });
  }, [data, totalSeconds, circumference, getTagColor]);

  const activeData = useMemo(() => 
    chartSegments.find(s => s.tag === hoveredTag) || null,
  [chartSegments, hoveredTag]);

  return (
    <div className="relative flex items-center justify-center">
      <svg 
        width={size} 
        height={size} 
        viewBox={`0 0 ${size} ${size}`} 
        className="transform -rotate-90 filter drop-shadow-[0_0_8px_rgba(0,0,0,0.3)]"
      >
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="rgba(255, 255, 255, 0.03)"
          strokeWidth={strokeWidth}
        />

        {chartSegments.map((segment, idx) => (
          <motion.circle
            key={segment.tag}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={segment.color}
            strokeWidth={hoveredTag === segment.tag ? strokeWidth + 4 : strokeWidth}
            strokeDasharray={`${segment.length} ${circumference}`}
            strokeDashoffset={-segment.offset}
            strokeLinecap="round"
            initial={{ strokeDasharray: `0 ${circumference}` }}
            animate={{ 
              strokeDasharray: `${segment.length} ${circumference}`,
              opacity: hoveredTag && hoveredTag !== segment.tag ? 0.3 : 1,
              transition: { duration: 1, ease: "easeOut", delay: idx * 0.1 }
            }}
            onMouseEnter={() => onHover(segment.tag)}
            onMouseLeave={() => onHover(null)}
            onClick={() => onSelectSegment && onSelectSegment(segment.tag)}
            className="cursor-pointer transition-all duration-300 focus-visible:outline-none"
            style={{ filter: hoveredTag === segment.tag ? `drop-shadow(0 0 8px ${segment.color})` : 'none' }}
          />
        ))}
      </svg>

      {/* Center Label Hub */}
      <div className="absolute inset-0 flex flex-center flex-col items-center justify-center pointer-events-none">
        <AnimatePresence mode="wait">
          {activeData ? (
            <motion.div
              key="active"
              initial={{ opacity: 0, y: 5, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -5, scale: 0.9 }}
              className="text-center px-4"
            >
              <div 
                className="text-[10px] font-mono uppercase tracking-widest mb-0.5 opacity-60"
                style={{ color: activeData.color }}
              >
                {activeData.tag}
              </div>
              <div className="text-2xl font-display font-light text-white leading-none">
                {formatDuration(activeData.total_seconds)}
              </div>
              <div className="text-[10px] font-mono text-white/40 mt-1 uppercase tracking-tighter">
                {Math.round(activeData.percentage * 100)}% of focus
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="total"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
            >
              <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/30 mb-1">
                Total Focus
              </div>
              <div className="text-3xl font-display font-light text-white leading-none tracking-tight">
                {formatDuration(totalSeconds)}
              </div>
              <div className="text-[10px] font-mono text-sage-200/50 mt-1 uppercase tracking-widest">
                Analytics
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
