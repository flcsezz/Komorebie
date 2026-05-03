import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Clock, History, CheckCircle2 } from 'lucide-react';
import GlassCard from '../ui/GlassCard';

interface FocusActivityWidgetProps {
  streakDates: Map<string, { qualified: boolean; seconds: number; sessions: number; tasksDone: number }>;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABEL_WIDTH = 0; // px reserved for day labels column
const MIN_CELL = 10;
const MAX_CELL = 22;
const GAP = 3;

const FocusActivityWidget: React.FC<FocusActivityWidgetProps> = ({ streakDates }) => {
  const [heatmapYear, setHeatmapYear] = useState(() => {
    const currentYear = new Date().getFullYear();
    return Math.max(2026, currentYear);
  });

  const [hoveredDay, setHoveredDay] = useState<{
    day: { date: string; seconds: number; sessions: number; tasksDone: number };
    weekIndex: number;
    dayIndex: number;
  } | null>(null);

  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(14);

  // Build full year grid
  const heatmapWeeks = useMemo(() => {
    const weeks: ({ date: string; seconds: number; sessions: number; tasksDone: number } | null)[][] = [];

    const firstDayOfYear = new Date(heatmapYear, 0, 1);
    const dayOfWeek = firstDayOfYear.getDay();
    // Monday-based offset: Mon=0 … Sun=6
    const startOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const startDate = new Date(heatmapYear, 0, 1);
    startDate.setDate(startDate.getDate() - startOffset);

    for (let w = 0; w < 54; w++) {
      const week: typeof weeks[0] = [];
      let hasDayInYear = false;

      for (let d = 0; d < 7; d++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + (w * 7) + d);

        if (currentDate.getFullYear() === heatmapYear) {
          const dateStr = currentDate.toISOString().split('T')[0];
          const entry = streakDates.get(dateStr);
          week.push({
            date: dateStr,
            seconds: entry?.seconds || 0,
            sessions: entry?.sessions || 0,
            tasksDone: entry?.tasksDone || 0,
          });
          hasDayInYear = true;
        } else {
          week.push(null);
        }
      }

      if (hasDayInYear) weeks.push(week);
    }
    return weeks;
  }, [heatmapYear, streakDates]);

  // Compute cell size from container width
  const recalcCellSize = useCallback(() => {
    const el = gridContainerRef.current;
    if (!el) return;
    const containerWidth = el.clientWidth;
    const numWeeks = heatmapWeeks.length || 53;
    // Available width for the grid (minus day labels)
    const available = containerWidth - DAY_LABEL_WIDTH - 8; // 8px breathing room
    const raw = (available - (numWeeks - 1) * GAP) / numWeeks;
    setCellSize(Math.max(MIN_CELL, Math.min(MAX_CELL, Math.floor(raw))));
  }, [heatmapWeeks.length]);

  useEffect(() => {
    recalcCellSize();
    const ro = new ResizeObserver(recalcCellSize);
    if (gridContainerRef.current) ro.observe(gridContainerRef.current);
    return () => ro.disconnect();
  }, [recalcCellSize]);

  // Column width = cellSize + gap
  const colWidth = cellSize + GAP;

  // Month label positions
  const monthLabels = useMemo(() => {
    const labels: { label: string; weekIndex: number }[] = [];
    let lastMonth = -1;

    heatmapWeeks.forEach((week, wi) => {
      for (const day of week) {
        if (day) {
          const date = new Date(day.date + 'T00:00:00');
          const month = date.getMonth();
          if (month !== lastMonth && date.getFullYear() === heatmapYear) {
            labels.push({ label: MONTHS[month], weekIndex: wi });
            lastMonth = month;
            break; // only first match per week
          }
        }
      }
    });
    return labels;
  }, [heatmapWeeks, heatmapYear]);

  const getHeatColor = (seconds: number) => {
    if (seconds === 0) return 'bg-white/[0.04] border-transparent';
    if (seconds < 1800) return 'bg-sage-200/20 border-sage-200/10';
    if (seconds < 3600) return 'bg-sage-200/40 border-sage-200/20';
    if (seconds < 7200) return 'bg-sage-200/60 border-sage-200/30';
    return 'bg-sage-200/85 border-sage-200/40';
  };

  const activeDays = useMemo(() => {
    let count = 0;
    streakDates.forEach((val, key) => {
      if (key.startsWith(heatmapYear.toString()) && val.seconds > 0) count++;
    });
    return count;
  }, [streakDates, heatmapYear]);

  // Tooltip position helpers
  const getTooltipStyle = (): React.CSSProperties => {
    if (!hoveredDay) return {};
    const totalWeeks = heatmapWeeks.length;
    const wi = hoveredDay.weekIndex;
    const left = DAY_LABEL_WIDTH + wi * colWidth + cellSize / 2;

    const di = hoveredDay.dayIndex;
    const isTopHalf = di < 3;
    
    const style: React.CSSProperties = {
      position: 'absolute',
      zIndex: 100,
    };

    // Horizontal placement
    if (wi < 4) {
      style.left = `${DAY_LABEL_WIDTH}px`;
    } else if (wi > totalWeeks - 4) {
      style.right = '0px';
    } else {
      style.left = `${left}px`;
      style.transform = 'translateX(-50%)';
    }

    // Vertical placement
    if (isTopHalf) {
      // Show below the grid
      style.top = '100%';
      style.marginTop = '12px';
    } else {
      // Show above the grid
      style.bottom = '100%';
      style.marginBottom = '12px';
    }

    return style;
  };

  const getArrowStyle = (): React.CSSProperties => {
    if (!hoveredDay) return {};
    const totalWeeks = heatmapWeeks.length;
    const wi = hoveredDay.weekIndex;
    const di = hoveredDay.dayIndex;
    const isTopHalf = di < 3;
    const cellCenter = DAY_LABEL_WIDTH + wi * colWidth + cellSize / 2;

    const style: React.CSSProperties = {};

    // Horizontal
    if (wi < 4) {
      style.left = `${cellCenter - DAY_LABEL_WIDTH}px`;
      style.transform = 'translateX(-50%)';
    } else if (wi > totalWeeks - 4) {
      const rightEdge = DAY_LABEL_WIDTH + totalWeeks * colWidth;
      const fromRight = rightEdge - cellCenter;
      style.right = `${fromRight}px`;
      style.transform = 'translateX(50%)';
    } else {
      style.left = '50%';
      style.transform = 'translateX(-50%)';
    }

    // Vertical arrow placement
    if (isTopHalf) {
      style.bottom = '100%';
      style.borderBottomColor = 'rgba(2, 6, 23, 0.95)'; // slate-950
      style.borderTopColor = 'transparent';
    } else {
      style.top = '100%';
      style.borderTopColor = 'rgba(2, 6, 23, 0.95)';
      style.borderBottomColor = 'transparent';
    }

    return style;
  };

  return (
    <GlassCard variant="frosted" className="p-6 sm:p-8 relative">
      <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-sage-200/5 rounded-full blur-[60px]" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div>
          <h3 className="text-xl font-display font-light text-white tracking-tight">Focus Activity</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sage-200/40 animate-pulse" />
            <p className="text-[10px] text-white/25 uppercase tracking-[0.2em] font-bold">
              {activeDays} active days in {heatmapYear}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white/5 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setHeatmapYear(y => Math.max(2026, y - 1))}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white transition-all cursor-pointer disabled:opacity-20"
            disabled={heatmapYear <= 2026}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-white/60 font-bold min-w-[3rem] text-center tracking-widest">{heatmapYear}</span>
          <button
            onClick={() => setHeatmapYear(y => y + 1)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white transition-all cursor-pointer disabled:opacity-20"
            disabled={heatmapYear >= new Date().getFullYear()}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Heatmap grid */}
      <div ref={gridContainerRef} className="relative w-full overflow-x-auto lg:overflow-visible">
        {/* Month labels row */}
        <div className="flex relative h-5 mb-2">
          {monthLabels.map((ml) => (
            <div
              key={`${ml.label}-${ml.weekIndex}`}
              className="text-[10px] text-white/40 font-bold uppercase tracking-[0.15em] absolute whitespace-nowrap"
              style={{ left: `${DAY_LABEL_WIDTH + ml.weekIndex * colWidth}px` }}
            >
              {ml.label}
            </div>
          ))}
        </div>

        {/* Grid body (labels removed) */}
        <div className="flex relative" style={{ gap: `${GAP}px` }}>

          {/* Week columns */}
          <div className="flex relative" style={{ gap: `${GAP}px` }}>
            {heatmapWeeks.map((week, wi) => (
              <div key={wi} className="flex flex-col" style={{ gap: `${GAP}px` }}>
                {week.map((day, di) => (
                  <div
                    key={di}
                    onMouseEnter={() => day && setHoveredDay({ day, weekIndex: wi, dayIndex: di })}
                    onMouseLeave={() => setHoveredDay(null)}
                    className={`
                      rounded-[3px] border transition-all duration-200 relative
                      ${day ? getHeatColor(day.seconds) : 'bg-white/[0.015] border-transparent'}
                      ${day && day.seconds > 0 ? 'hover:scale-[1.6] hover:z-50 hover:shadow-xl hover:shadow-sage-200/30 cursor-help' : ''}
                    `}
                    style={{ width: `${cellSize}px`, height: `${cellSize}px` }}
                  />
                ))}
              </div>
            ))}

            {/* Tooltip */}
            {hoveredDay && (
              <div
                className="absolute px-4 py-3 bg-slate-950/95 backdrop-blur-2xl border border-white/10 rounded-2xl text-[11px] text-white whitespace-nowrap pointer-events-none z-[100] shadow-[0_16px_40px_rgba(0,0,0,0.6)]"
                style={getTooltipStyle()}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-6 border-b border-white/10 pb-2 mb-0.5">
                    <span className="font-bold text-white tracking-wide">
                      {new Date(hoveredDay.day.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 text-white/80">
                    <div className="w-6 h-6 rounded-lg bg-sage-200/10 flex items-center justify-center">
                      <Clock className="w-3.5 h-3.5 text-sage-200" />
                    </div>
                    <span className="font-medium">
                      {hoveredDay.day.seconds ? `${Math.round(hoveredDay.day.seconds / 60)}m focused` : 'No activity'}
                    </span>
                  </div>

                  {hoveredDay.day.sessions > 0 && (
                    <div className="flex items-center gap-2.5 text-white/70">
                      <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center">
                        <History className="w-3.5 h-3.5 text-white/40" />
                      </div>
                      <span>{hoveredDay.day.sessions} focus sessions</span>
                    </div>
                  )}

                  {hoveredDay.day.tasksDone > 0 && (
                    <div className="flex items-center gap-2.5 text-white/70">
                      <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5 text-white/40" />
                      </div>
                      <span>{hoveredDay.day.tasksDone} tasks completed</span>
                    </div>
                  )}
                </div>
                {/* Arrow */}
                <div
                  className="absolute border-[6px] border-transparent"
                  style={getArrowStyle()}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5 relative z-10">
        <div className="text-[9px] text-white/15 uppercase tracking-[0.2em] font-black italic">
          Consistency is the path
        </div>
        <div className="flex items-center gap-2.5 text-[9px] text-white/25 font-bold uppercase tracking-widest">
          <span>Less</span>
          <div className="flex gap-[2px]">
            {[0, 1500, 3500, 7000, 14000].map((s) => (
              <div key={s} className={`w-[11px] h-[11px] rounded-[2px] border ${getHeatColor(s)}`} />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>
    </GlassCard>
  );
};

export default FocusActivityWidget;
