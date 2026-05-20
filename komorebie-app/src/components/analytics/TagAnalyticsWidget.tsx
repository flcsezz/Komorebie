import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, PieChart, Activity, Palette, X, RotateCcw } from 'lucide-react';
import { fetchTagAnalytics, type TagAnalyticData } from '../../lib/analytics';
import { TagDonutChart } from './TagDonutChart';
import { useDataSync } from '../../context/DataSyncContext';
import { supabase } from '../../lib/supabase';

interface TagAnalyticsWidgetProps {
  userId: string;
}

const getDefaultTagColor = (tag: string) => {
  if (tag === 'Untagged') return 'rgba(148, 163, 184, 0.5)'; // slate-400/50
  
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 65%)`;
};

const formatDuration = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = (seconds / 3600).toFixed(1);
  return `${hrs}h`;
};

const PRESET_COLORS = [
  { name: 'Sage', value: '#B7C9B0' },
  { name: 'Forest', value: '#829B74' },
  { name: 'Sakura', value: '#EFC7C8' },
  { name: 'Sunset Gold', value: '#D4AF37' },
  { name: 'Lavender', value: '#BDB2FF' },
  { name: 'Ocean Blue', value: '#A0C4FF' },
  { name: 'Teal', value: '#9BF6FF' },
  { name: 'Mint', value: '#CAFFBF' },
  { name: 'Apricot', value: '#FFD6A5' },
  { name: 'Coral', value: '#FFADAD' },
];

export const TagAnalyticsWidget: React.FC<TagAnalyticsWidgetProps> = ({ userId }) => {
  const { tagColors, setTagColor, refresh } = useDataSync();
  const [tagData, setTagData] = useState<TagAnalyticData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'today' | 'all'>('today');
  const [hoveredTag, setHoveredTag] = useState<string | null>(null);
  const [excludeUntagged, setExcludeUntagged] = useState<boolean>(false);

  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('#B7C9B0');

  // Compute filtered tag data for donut chart & legend
  const displayedTagData = tagData.filter(item => !excludeUntagged || item.tag !== 'Untagged');
  const displayedTotalSeconds = displayedTagData.reduce((acc, curr) => acc + curr.total_seconds, 0);

  // Compute unique colors for all active tags to ensure no duplicate colors exist on chart/legend
  const uniqueTagColors = useMemo(() => {
    const resolved: Record<string, string> = {};
    const usedColors = new Set<string>();

    // First pass: assign explicit/saved colors
    displayedTagData.forEach(item => {
      if (item.tag === 'Untagged') {
        resolved[item.tag] = tagColors['Untagged'] || 'rgba(148, 163, 184, 0.5)';
        usedColors.add(resolved[item.tag].toLowerCase());
      } else {
        const savedColor = tagColors[item.tag];
        if (savedColor) {
          resolved[item.tag] = savedColor;
          usedColors.add(savedColor.toLowerCase());
        }
      }
    });

    // Second pass: for tags without saved colors or if there are collisions
    displayedTagData.forEach(item => {
      if (resolved[item.tag]) return;

      // Try default color
      let color = getDefaultTagColor(item.tag);
      let count = 0;
      
      // If color is already used, change the hue slightly until we find a unique one
      while (usedColors.has(color.toLowerCase()) && count < 360) {
        const match = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
        if (match) {
          const newHue = (parseInt(match[1]) + 30) % 360;
          color = `hsl(${newHue}, ${match[2]}%, ${match[3]}%)`;
        } else {
          color = `hsl(${(count * 60) % 360}, 70%, 65%)`;
        }
        count++;
      }
      
      resolved[item.tag] = color;
      usedColors.add(color.toLowerCase());
    });

    // Third pass: resolve any collisions in the explicit user-selected colors as well
    const colorToTags: Record<string, string[]> = {};
    Object.entries(resolved).forEach(([tag, color]) => {
      const c = color.toLowerCase();
      if (!colorToTags[c]) colorToTags[c] = [];
      colorToTags[c].push(tag);
    });

    Object.values(colorToTags).forEach((tags) => {
      if (tags.length > 1) {
        tags.slice(1).forEach((tag, idx) => {
          let shiftCount = 0;
          while (true) {
            const hue = (shiftCount * 45 + idx * 60 + 120) % 360;
            const newColor = `hsl(${hue}, 70%, 65%)`;
            if (!usedColors.has(newColor.toLowerCase())) {
              resolved[tag] = newColor;
              usedColors.add(newColor.toLowerCase());
              break;
            }
            shiftCount++;
            if (shiftCount > 20) break;
          }
        });
      }
    });

    return resolved;
  }, [displayedTagData, tagColors]);

  const getTagColor = (tag: string) => {
    return uniqueTagColors[tag] || tagColors[tag] || (tag === 'Untagged' ? 'rgba(148, 163, 184, 0.5)' : getDefaultTagColor(tag));
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      const data = await fetchTagAnalytics(userId, timeRange);
      if (active) {
        setTagData(data);
        setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [userId, timeRange]);

  const handleEditColor = (tag: string) => {
    setEditingTag(tag);
    setSelectedColor(getTagColor(tag));
  };

  const handleSaveColor = async () => {
    if (editingTag) {
      await setTagColor(editingTag, selectedColor);
      setEditingTag(null);
    }
  };

  const handleResetColor = async () => {
    if (editingTag) {
      const { error } = await supabase
        .from('tag_colors')
        .delete()
        .eq('user_id', userId)
        .eq('tag', editingTag);
      
      if (!error) {
        refresh();
      }
      setEditingTag(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-3xl p-8 min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-sage-200/10 border-t-sage-200 animate-spin" />
          <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Processing Data</span>
        </div>
      </div>
    );
  }

  if (tagData.length === 0) {
    return (
      <div className="bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-3xl p-8 text-center min-h-[400px] flex flex-col items-center justify-center">
        <div className="p-4 bg-white/5 rounded-full border border-white/10 mb-6 group transition-all hover:bg-white/10">
          <Tag className="w-8 h-8 text-white/20 group-hover:text-sage-200/50 transition-colors" />
        </div>
        <p className="text-xs text-white/40 max-w-[200px] leading-relaxed">
          {timeRange === 'today' 
            ? "You haven't recorded any sessions today. Start a timer to see your distribution!" 
            : "No sessions found. Your tag journey starts with your first focused minute."}
        </p>
        <button 
          onClick={() => setTimeRange('all')}
          className="mt-6 text-[10px] font-mono uppercase tracking-[0.2em] text-sage-200/60 hover:text-sage-200 transition-colors cursor-pointer"
        >
          View all time
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col min-h-[520px]">
      <div className="absolute top-0 right-0 w-64 h-64 bg-sage-200/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full blur-[60px] pointer-events-none" />
      
      {/* Header with Range Toggle */}
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sage-200/10 rounded-xl">
            <PieChart className="w-4 h-4 text-sage-200" />
          </div>
          <div>
            <h3 className="text-sm font-display font-medium text-white tracking-wide uppercase">
              Tag Distribution
            </h3>
            <p className="text-[10px] font-mono text-white/30 uppercase tracking-tighter">
              {timeRange === 'today' ? "Daily insights" : "Historical data"}
            </p>
          </div>
        </div>
 
        <div className="flex items-center gap-2">
          {/* Focus mode tag filter */}
          <button
            onClick={() => setExcludeUntagged(!excludeUntagged)}
            className={`
              px-3 py-1.5 rounded-full text-[9px] font-mono uppercase tracking-wider transition-all cursor-pointer border flex items-center gap-1
              ${excludeUntagged 
                ? 'bg-sage-200/10 text-sage-200 border-sage-200/20 shadow-[0_0_15px_rgba(167,199,144,0.1)]' 
                : 'bg-black/40 text-white/40 border-white/5 hover:text-white/60'}
            `}
            title={excludeUntagged ? "Showing only categorized tags" : "Showing all sessions including Untagged"}
          >
            <Tag className="w-2.5 h-2.5" />
            {excludeUntagged ? "Categorized" : "All Focus"}
          </button>

          {/* Time range switcher */}
          <div className="flex bg-black/40 p-1 rounded-full border border-white/5">
            {(['today', 'all'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`
                  px-3.5 py-1 rounded-full text-[9px] font-mono uppercase tracking-widest transition-all cursor-pointer
                  ${timeRange === r 
                    ? 'bg-sage-200/10 text-sage-200 border border-sage-200/20' 
                    : 'text-white/30 hover:text-white/60'}
                `}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>
 
      {/* Main Chart Section */}
      <div className="flex-1 flex flex-col items-center justify-center mb-10">
        <TagDonutChart 
          data={displayedTagData} 
          totalSeconds={displayedTotalSeconds} 
          hoveredTag={hoveredTag}
          onHover={setHoveredTag}
          getTagColor={getTagColor}
          onSelectSegment={handleEditColor}
          tagColors={tagColors}
        />
      </div>

      {/* Interactive Legend Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
        {displayedTagData.slice(0, 6).map((item) => {
          const isHovered = hoveredTag === item.tag;
          const color = getTagColor(item.tag);
          const pct = displayedTotalSeconds > 0 ? Math.round((item.total_seconds / displayedTotalSeconds) * 100) : 0;
 
          return (
            <motion.div
              key={item.tag}
              onMouseEnter={() => setHoveredTag(item.tag)}
              onMouseLeave={() => setHoveredTag(null)}
              animate={{ 
                backgroundColor: isHovered ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                borderColor: isHovered ? color : 'rgba(255,255,255,0.05)'
              }}
              className="group p-3 rounded-2xl border transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div 
                  className="w-1.5 h-6 rounded-full transition-all group-hover:scale-y-110 cursor-pointer" 
                  style={{ backgroundColor: color, boxShadow: isHovered ? `0 0 10px ${color}` : 'none' }}
                  onClick={() => handleEditColor(item.tag)}
                  title="Assign custom color"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <div className="text-[11px] font-medium text-white/80 group-hover:text-white capitalize truncate">
                      {item.tag}
                    </div>
                    <button
                      onClick={() => handleEditColor(item.tag)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-white/40 hover:text-sage-200 hover:scale-110 active:scale-90 cursor-pointer"
                      title="Edit color"
                    >
                      <Palette className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-[9px] font-mono text-white/30">
                    {item.session_count} {item.session_count === 1 ? 'session' : 'sessions'}
                  </div>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-[11px] font-bold text-white/90">
                  {formatDuration(item.total_seconds)}
                </div>
                <div className="text-[9px] font-mono text-sage-200/40">
                  {pct}%
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="mt-6 flex items-center justify-center gap-2 text-[9px] font-mono text-white/20 uppercase tracking-[0.2em]">
        <Activity className="w-3 h-3" />
        Live distribution tracking
      </div>

      {/* Zen Color Picker Modal */}
      <AnimatePresence>
        {editingTag && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingTag(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            
            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-sm bg-slate-900/90 border border-white/10 p-6 rounded-3xl shadow-2xl backdrop-blur-2xl z-10"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                  <Palette className="w-5 h-5 text-sage-200" />
                  <div>
                    <h4 className="text-sm font-display font-medium text-white uppercase tracking-wider">
                      Assign Tag Color
                    </h4>
                    <p className="text-[10px] font-mono text-white/40 uppercase">
                      Customizing tag: {editingTag}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingTag(null)}
                  className="p-1 rounded-xl bg-white/5 border border-white/5 text-white/50 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
 
              {/* Preview */}
              <div className="mb-6 p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center gap-1">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full transition-all duration-500 shadow-lg"
                    style={{ backgroundColor: selectedColor, boxShadow: `0 0 15px ${selectedColor}80` }}
                  />
                  <span className="text-xs font-semibold text-white/80 capitalize">
                    {editingTag}
                  </span>
                  <span className="text-[10px] font-mono text-white/30 lowercase">
                    ({selectedColor})
                  </span>
                </div>
                {Object.entries(tagColors).some(([t, color]) => t !== editingTag && color.toLowerCase() === selectedColor.toLowerCase()) && (
                  <p className="text-red-400 text-[10px] font-mono uppercase mt-1 text-center">Color is already assigned to another tag</p>
                )}
              </div>

              {/* Color Selection Grid */}
              <div className="grid grid-cols-5 gap-3.5 mb-6">
                {PRESET_COLORS.map((preset) => {
                  const isSelected = selectedColor.toLowerCase() === preset.value.toLowerCase();
                  const isUsed = Object.entries(tagColors).some(([t, color]) => 
                    t !== editingTag && color.toLowerCase() === preset.value.toLowerCase()
                  );
                  return (
                    <button
                      key={preset.name}
                      disabled={isUsed}
                      onClick={() => setSelectedColor(preset.value)}
                      className={`
                        w-8 h-8 rounded-full relative cursor-pointer transition-all duration-300 hover:scale-110
                        ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-950 scale-110 shadow-lg' : 'opacity-80 hover:opacity-100'}
                        ${isUsed ? 'opacity-20 cursor-not-allowed line-through' : ''}
                      `}
                      style={{ backgroundColor: preset.value }}
                      title={isUsed ? `${preset.name} (Used by another tag)` : preset.name}
                    >
                      {isSelected && (
                        <div className="absolute inset-0 rounded-full border border-white/40 scale-120 animate-pulse" />
                      )}
                      {isUsed && (
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-bold opacity-60">✕</div>
                      )}
                    </button>
                  );
                })}
                
                {/* Custom Color Input Wrapper */}
                <div className="relative w-8 h-8 rounded-full border border-white/10 overflow-hidden flex items-center justify-center bg-gradient-to-tr from-pink-500 via-purple-500 to-blue-500 hover:scale-110 transition-all cursor-pointer">
                  <input
                    type="color"
                    value={selectedColor.startsWith('#') ? selectedColor : '#B7C9B0'}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    title="Custom Color"
                  />
                  <span className="text-[10px] font-bold text-white pointer-events-none">+</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleResetColor}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-white/5 bg-white/5 text-[10px] font-mono uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Reset to automatically generated color"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
                <button
                  disabled={Object.entries(tagColors).some(([t, color]) => t !== editingTag && color.toLowerCase() === selectedColor.toLowerCase())}
                  onClick={handleSaveColor}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-sage-200 text-slate-950 text-[10px] font-bold uppercase tracking-widest hover:bg-sage-100 active:scale-98 transition-all shadow-[0_0_20px_rgba(183,201,176,0.2)] flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Save Color
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
