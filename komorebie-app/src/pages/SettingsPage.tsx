import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Volume2, 
  Database, 
  LogOut, 
  Check, 
  ShieldCheck, 
  Download,
  Sparkles,
  Timer,
  User,
  Palette,
  VolumeX,
  Volume1,
  Tag,
  X,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDataSync } from '../context/DataSyncContext';
import { useBackground } from '../context/BackgroundContext';
import { supabase } from '../lib/supabase';
import GlassCard from '../components/ui/GlassCard';
import ZenSelect from '../components/ui/ZenSelect';
import { useZenClock } from '../hooks/useZenClock';
import { fetchTagAnalytics } from '../lib/analytics';

const THEME_PRESETS = [
  { 
    id: 'sage', 
    name: 'Digital Zen Garden', 
    color: '#B7C9B0', 
    bgClass: 'bg-emerald-800/20',
    bg: 'https://assets.komorebie.flcsezz.sbs/backgrounds/eye1.webp',
    desc: 'The default restorative sage-green experience.'
  },
  { 
    id: 'forest', 
    name: 'Bonsai Moss', 
    color: '#829b74', 
    bgClass: 'bg-green-950/20',
    bg: 'https://assets.komorebie.flcsezz.sbs/backgrounds/nature1.webp',
    desc: 'Deep cedarwood green for absolute focus.'
  },
  { 
    id: 'sakura', 
    name: 'Cherry Blossom', 
    color: '#EFC7C8', 
    bgClass: 'bg-rose-950/20',
    bg: 'https://assets.komorebie.flcsezz.sbs/backgrounds/nature2.webp',
    desc: 'Soft, calming pink and dark sakura tones.'
  },
  { 
    id: 'sunset', 
    name: 'Jasmine Gold', 
    color: '#D4AF37', 
    bgClass: 'bg-amber-950/20',
    bg: 'https://assets.komorebie.flcsezz.sbs/backgrounds/eye2.webp',
    desc: 'Golden warm twilight for winding down.'
  }
];

/**
 * SettingsPage (FE-11)
 * A premium, minimalist control center for the Zen Sanctuary.
 */
const SettingsPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const { profile, refresh, tagColors, setTagColor } = useDataSync();
  const { setDuration } = useZenClock();
  const { setBackground } = useBackground();
  
  const [activeTab, setActiveTab] = useState<'focus' | 'audio' | 'account' | 'theme' | 'data'>('focus');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Tag Color Customizer State
  const [uniqueTags, setUniqueTags] = useState<string[]>([]);
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [selectedTagColor, setSelectedTagColor] = useState<string>('#B7C9B0');

  const getDefaultTagColor = (tag: string) => {
    if (tag === 'Untagged') return 'rgba(148, 163, 184, 0.5)';
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
      hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 65%)`;
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

  useEffect(() => {
    if (!user) return;
    let active = true;
    const loadTags = async () => {
      try {
        const data = await fetchTagAnalytics(user.id, 'all');
        if (active) {
          const tags = data
            .map((item) => item.tag)
            .filter((tag): tag is string => !!tag);
          // Always ensure 'Untagged' is included if user has any sessions to let them customize Untagged
          if (tags.length > 0 && !tags.includes('Untagged')) {
            tags.push('Untagged');
          }
          setUniqueTags(tags);
        }
      } catch (err) {
        console.error('Failed to load tags for customization:', err);
      }
    };
    loadTags();
    return () => {
      active = false;
    };
  }, [user]);

  const handleEditTagColor = (tag: string) => {
    setEditingTag(tag);
    setSelectedTagColor(tagColors[tag] || getDefaultTagColor(tag));
  };

  const handleSaveTagColor = async () => {
    if (editingTag) {
      await setTagColor(editingTag, selectedTagColor);
      setEditingTag(null);
    }
  };

  const handleResetTagColor = async () => {
    if (editingTag && user) {
      const { error } = await supabase
        .from('tag_colors')
        .delete()
        .eq('user_id', user.id)
        .eq('tag', editingTag);
      
      if (!error) {
        refresh();
      }
      setEditingTag(null);
    }
  };

  // Focus Settings State
  const [workDur, setWorkDur] = useState('25');
  const [shortBreak, setShortBreak] = useState('5');
  const [autoStart, setAutoStart] = useState(false);
  const [overtime, setOvertime] = useState(true);

  // Audio Settings State
  const [alarmSound, setAlarmSound] = useState('Zen Bell');
  const [volume, setVolume] = useState(50);
  const [ticks, setTicks] = useState(false);

  // Account Management State
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [dailyGoalHours, setDailyGoalHours] = useState('2');

  // Aesthetic State
  const [selectedBg, setSelectedBg] = useState('');

  // Notification / Alert state
  const [showNotifications, setShowNotifications] = useState(true);
  const [screenFlash, setScreenFlash] = useState(true);

  // Load initial settings from profile/localStorage
  useEffect(() => {
    if (profile) {
      setWorkDur((profile.preferred_duration || 25).toString());
      setDisplayName(profile.display_name || '');
      setUsername(profile.username || '');
      setBio(profile.bio || '');
      setDailyGoalHours((Math.round(((profile.daily_goal_seconds || 7200) / 3600) * 10) / 10).toString());
      setSelectedBg(profile.preferred_bg || '');
    }
    
    // Load other settings from localStorage
    const savedAutoStart = localStorage.getItem('komorebie-auto-start') === 'true';
    const savedOvertime = localStorage.getItem('komorebie-overtime') !== 'false';
    const savedVolume = parseInt(localStorage.getItem('komorebie-volume') || '50', 10);
    const savedTicks = localStorage.getItem('komorebie-ticks') === 'true';
    const savedAlarm = localStorage.getItem('komorebie-alarm') || 'Zen Bell';
    const savedNotifications = localStorage.getItem('komorebie-notifications') !== 'false';
    const savedScreenFlash = localStorage.getItem('komorebie-screen-flash') !== 'false';

    setAutoStart(savedAutoStart);
    setOvertime(savedOvertime);
    setVolume(savedVolume);
    setTicks(savedTicks);
    setAlarmSound(savedAlarm);
    setShowNotifications(savedNotifications);
    setScreenFlash(savedScreenFlash);
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    
    try {
      // 1. Update Supabase Profile
      const { error } = await supabase
        .from('profiles')
        .update({ 
          preferred_duration: parseInt(workDur, 10),
          display_name: displayName.trim(),
          username: username.trim(),
          bio: bio.trim(),
          daily_goal_seconds: parseFloat(dailyGoalHours) * 3600,
          preferred_bg: selectedBg,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      // 2. Update Contexts & Global Background
      setDuration(parseInt(workDur, 10));
      if (selectedBg) {
        setBackground(selectedBg, 'image');
        localStorage.setItem('komorebie-bg', selectedBg);
      }

      // 3. Save to localStorage for client-side settings
      localStorage.setItem('komorebie-auto-start', autoStart.toString());
      localStorage.setItem('komorebie-overtime', overtime.toString());
      localStorage.setItem('komorebie-volume', volume.toString());
      localStorage.setItem('komorebie-ticks', ticks.toString());
      localStorage.setItem('komorebie-alarm', alarmSound);
      localStorage.setItem('komorebie-notifications', showNotifications.toString());
      localStorage.setItem('komorebie-screen-flash', screenFlash.toString());

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      await refresh();
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = () => {
    const data = {
      profile,
      exported_at: new Date().toISOString(),
      app: 'Komorebie'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `komorebie-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto pb-20 pt-4"
    >
      <header className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display tracking-tight text-white/90">Settings</h1>
          <p className="text-white/40 text-sm mt-1">Calibrate your sanctuary for maximum depth.</p>
        </div>
        
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl font-bold text-sm transition-all duration-500 cursor-pointer ${
            saveSuccess 
              ? 'bg-sage-200 text-slate-950 scale-95' 
              : 'bg-white/10 text-white hover:bg-white/20 active:scale-95'
          }`}
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : saveSuccess ? (
            <Check className="w-4 h-4" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-sage-200" />
          )}
          {saveSuccess ? 'Saved' : 'Save Changes'}
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Navigation Sidebar */}
        <div className="md:col-span-4 space-y-2">
          <SettingsNav 
            icon={Clock} 
            label="Focus Control" 
            active={activeTab === 'focus'} 
            onClick={() => setActiveTab('focus')} 
          />
          <SettingsNav 
            icon={Volume2} 
            label="Audio & Atmosphere" 
            active={activeTab === 'audio'} 
            onClick={() => setActiveTab('audio')} 
          />
          <SettingsNav 
            icon={User} 
            label="Sanctuary Profile" 
            active={activeTab === 'account'} 
            onClick={() => setActiveTab('account')} 
          />
          <SettingsNav 
            icon={Palette} 
            label="Theme & Aesthetics" 
            active={activeTab === 'theme'} 
            onClick={() => setActiveTab('theme')} 
          />
          <SettingsNav 
            icon={Database} 
            label="Data & Privacy" 
            active={activeTab === 'data'} 
            onClick={() => setActiveTab('data')} 
          />
        </div>

        {/* Settings Content Panels */}
        <div className="md:col-span-8 space-y-8">
          <AnimatePresence mode="wait">
            
            {/* Focus Control Tab */}
            {activeTab === 'focus' && (
              <motion.div
                key="focus"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <GlassCard className="p-6">
                  <h2 className="text-lg font-bold text-white/80 mb-6 flex items-center gap-3">
                    <Timer className="w-5 h-5 text-sage-200" />
                    Focus Configuration
                  </h2>
                  
                  <div className="space-y-6">
                    <SettingItem 
                      label="Work Duration" 
                      description="Default time for deep focus periods."
                    >
                      <div className="w-24">
                        <ZenSelect 
                          value={workDur} 
                          onChange={setWorkDur} 
                          options={['15', '25', '45', '50', '60', '90']} 
                        />
                      </div>
                    </SettingItem>

                    <SettingItem 
                      label="Short Break" 
                      description="Time for quick recovery."
                    >
                      <div className="w-24">
                        <ZenSelect 
                          value={shortBreak} 
                          onChange={setShortBreak} 
                          options={['5', '10', '15']} 
                        />
                      </div>
                    </SettingItem>

                    <SettingItem 
                      label="Auto-Start Breaks" 
                      description="Automatically begin break after work session."
                    >
                      <Toggle active={autoStart} onToggle={() => setAutoStart(!autoStart)} />
                    </SettingItem>

                    <SettingItem 
                      label="Allow Overtime" 
                      description="Keep counting up after the timer hits zero."
                    >
                      <Toggle active={overtime} onToggle={() => setOvertime(!overtime)} />
                    </SettingItem>
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {/* Audio & Atmosphere Tab */}
            {activeTab === 'audio' && (
              <motion.div
                key="audio"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <GlassCard className="p-6">
                  <h2 className="text-lg font-bold text-white/80 mb-6 flex items-center gap-3">
                    <Volume2 className="w-5 h-5 text-sage-200" />
                    Audio & Atmosphere
                  </h2>
                  
                  <div className="space-y-6">
                    <SettingItem 
                      label="Alarm Sound" 
                      description="The sound played when a session completes."
                    >
                      <div className="w-40">
                        <ZenSelect 
                          value={alarmSound} 
                          onChange={setAlarmSound} 
                          options={['Zen Bell', 'Digital Beep', 'Forest Bird', 'None']} 
                        />
                      </div>
                    </SettingItem>

                    <SettingItem 
                      label="Master Volume" 
                      description="Control all ambient and notification sounds."
                    >
                      <div className="flex items-center gap-4 w-full max-w-[200px]">
                        {volume === 0 ? (
                          <VolumeX className="w-4 h-4 text-white/30" />
                        ) : volume < 50 ? (
                          <Volume1 className="w-4 h-4 text-white/60" />
                        ) : (
                          <Volume2 className="w-4 h-4 text-sage-200" />
                        )}
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={volume} 
                          onChange={(e) => setVolume(parseInt(e.target.value, 10))}
                          className="w-full accent-sage-200 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                        />
                        <span className="text-xs text-white/40 min-w-[24px] text-right">{volume}%</span>
                      </div>
                    </SettingItem>

                    <SettingItem 
                      label="Tick Sound" 
                      description="Subtle mechanical ticking during focus."
                    >
                      <Toggle active={ticks} onToggle={() => setTicks(!ticks)} />
                    </SettingItem>

                    <SettingItem 
                      label="Focus Flow Notifications" 
                      description="Display browser notifications for timers."
                    >
                      <Toggle active={showNotifications} onToggle={() => setShowNotifications(!showNotifications)} />
                    </SettingItem>

                    <SettingItem 
                      label="Atmospheric Screen Flash" 
                      description="Glow screen edge when timer completes."
                    >
                      <Toggle active={screenFlash} onToggle={() => setScreenFlash(!screenFlash)} />
                    </SettingItem>
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {/* Sanctuary Profile Tab */}
            {activeTab === 'account' && (
              <motion.div
                key="account"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <GlassCard className="p-6">
                  <h2 className="text-lg font-bold text-white/80 mb-6 flex items-center gap-3">
                    <User className="w-5 h-5 text-sage-200" />
                    Sanctuary Profile
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-white/40">Display Name</label>
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="e.g. Albert"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-sage-200/50 transition-colors"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-white/40">Username</label>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                          placeholder="e.g. albert"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-sage-200/50 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-white/40">Sanctuary Bio</label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Write a little about your focus philosophy..."
                        rows={3}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-sage-200/50 transition-colors resize-none leading-relaxed"
                      />
                    </div>

                    <SettingItem 
                      label="Daily Flow Goal" 
                      description="Your personal daily goal in focus hours."
                    >
                      <div className="w-24">
                        <ZenSelect 
                          value={dailyGoalHours} 
                          onChange={setDailyGoalHours} 
                          options={['1', '2', '3', '4', '6', '8']} 
                        />
                      </div>
                    </SettingItem>
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {/* Theme & Aesthetics Tab */}
            {activeTab === 'theme' && (
              <motion.div
                key="theme"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <GlassCard className="p-6">
                  <h2 className="text-lg font-bold text-white/80 mb-6 flex items-center gap-3">
                    <Palette className="w-5 h-5 text-sage-200" />
                    Theme & Aesthetics
                  </h2>
                  
                  <div className="space-y-6">
                    <p className="text-xs text-white/40 leading-relaxed">
                      Transform the entire ambiance of your deep-work space with our premium themed sanctuaries.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {THEME_PRESETS.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setSelectedBg(t.bg)}
                          className={`flex flex-col p-4 rounded-2xl border text-left transition-all duration-300 relative group overflow-hidden ${
                            selectedBg === t.bg 
                              ? 'border-sage-200/50 bg-white/5 shadow-[0_0_20px_rgba(183,201,176,0.1)]' 
                              : 'border-white/5 bg-white/2 hover:bg-white/5 hover:border-white/15'
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <span 
                              className="w-3.5 h-3.5 rounded-full border border-white/25 shadow-inner"
                              style={{ backgroundColor: t.color }}
                            />
                            <h3 className="text-sm font-semibold text-white/80">{t.name}</h3>
                          </div>
                          
                          <p className="text-xs text-white/30 leading-relaxed font-light z-10">{t.desc}</p>
                          
                          {/* Indicator Glow */}
                          <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-[40px] -mr-8 -mt-8 opacity-20 transition-all group-hover:scale-110 ${t.bgClass}`} />
                          
                          {selectedBg === t.bg && (
                            <div className="absolute bottom-3 right-3 text-sage-200 z-10">
                              <Check className="w-4 h-4" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </GlassCard>

                {/* Tag Color Settings Card */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6"
                >
                  <GlassCard className="p-6">
                    <h2 className="text-lg font-bold text-white/80 mb-4 flex items-center gap-3">
                      <Tag className="w-5 h-5 text-sage-200" />
                      Tag Colors
                    </h2>
                    <p className="text-xs text-white/40 leading-relaxed mb-6">
                      Assign premium, custom colors to your focus tags. These colors sync across all devices and update your analytics charts automatically.
                    </p>

                    {uniqueTags.length === 0 ? (
                      <div className="text-center py-8 text-xs text-white/25 font-mono uppercase tracking-widest border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                        No tags found. Start focusing to create tags!
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {uniqueTags.map((tag) => {
                          const customColor = tagColors[tag];
                          const displayColor = customColor || getDefaultTagColor(tag);
                          
                          return (
                            <div 
                              key={tag}
                              className="flex items-center justify-between p-3 rounded-2xl bg-white/2 border border-white/5 hover:border-white/10 transition-all group"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <button
                                  onClick={() => handleEditTagColor(tag)}
                                  className="w-5 h-5 rounded-full relative cursor-pointer border border-white/10 flex-shrink-0 transition-transform hover:scale-115 active:scale-95"
                                  style={{ 
                                    backgroundColor: displayColor, 
                                    boxShadow: `0 0 12px ${displayColor}40` 
                                  }}
                                  title="Change Tag Color"
                                >
                                  {customColor && (
                                    <div className="absolute inset-1 rounded-full border border-white/40" />
                                  )}
                                </button>
                                <span className="text-sm text-white/85 capitalize font-medium truncate">
                                  {tag}
                                </span>
                              </div>

                              <button
                                onClick={() => handleEditTagColor(tag)}
                                className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/15 text-[10px] font-bold uppercase tracking-wider text-white/60 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
                              >
                                <Palette className="w-3.5 h-3.5 text-sage-200" />
                                Color
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </GlassCard>
                </motion.div>
              </motion.div>
            )}

            {/* Data & Privacy Tab */}
            {activeTab === 'data' && (
              <motion.div
                key="data"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <GlassCard className="p-6">
                  <h2 className="text-lg font-bold text-white/80 mb-6 flex items-center gap-3">
                    <Database className="w-5 h-5 text-sage-200" />
                    Data & Privacy
                  </h2>
                  
                  <div className="space-y-4">
                    <button 
                      onClick={handleExportData}
                      className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Download className="w-5 h-5 text-white/40 group-hover:text-sage-200" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-white/80">Export My Data</p>
                          <p className="text-[10px] text-white/30 uppercase tracking-wider font-bold">JSON FORMAT</p>
                        </div>
                      </div>
                    </button>

                    <button 
                      onClick={signOut}
                      className="w-full flex items-center justify-between p-4 rounded-2xl bg-red-400/5 border border-red-400/10 hover:bg-red-400/10 transition-all group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <LogOut className="w-5 h-5 text-red-400/40 group-hover:text-red-400" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-red-400/80">Log Out</p>
                          <p className="text-[10px] text-red-400/30 uppercase tracking-wider font-bold">TERMINATE SESSION</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </GlassCard>
              </motion.div>
            )}

          </AnimatePresence>

          <footer className="pt-10 flex flex-col items-center">
            <div className="flex items-center gap-2 text-white/20">
              <Sparkles className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase tracking-[0.3em]">Komorebie v1.2.0</span>
            </div>
          </footer>
        </div>
      </div>

      {/* Zen Tag Color Picker Modal */}
      <AnimatePresence>
        {editingTag && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingTag(null)}
              className="absolute inset-0 bg-slate-950/30 backdrop-blur-md"
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
              <div className="mb-6 p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full transition-all duration-500 shadow-lg"
                  style={{ backgroundColor: selectedTagColor, boxShadow: `0 0 15px ${selectedTagColor}80` }}
                />
                <span className="text-xs font-semibold text-white/80 capitalize">
                  {editingTag}
                </span>
                <span className="text-[10px] font-mono text-white/30 lowercase">
                  ({selectedTagColor})
                </span>
              </div>

              {/* Color Selection Grid */}
              <div className="grid grid-cols-5 gap-3.5 mb-6">
                {PRESET_COLORS.map((preset) => {
                  const isSelected = selectedTagColor.toLowerCase() === preset.value.toLowerCase();
                  return (
                    <button
                      key={preset.name}
                      onClick={() => setSelectedTagColor(preset.value)}
                      className={`
                        w-8 h-8 rounded-full relative cursor-pointer transition-all duration-300 hover:scale-110
                        ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-950 scale-110 shadow-lg' : 'opacity-80 hover:opacity-100'}
                      `}
                      style={{ backgroundColor: preset.value }}
                      title={preset.name}
                    >
                      {isSelected && (
                        <div className="absolute inset-0 rounded-full border border-white/40 scale-120 animate-pulse" />
                      )}
                    </button>
                  );
                })}
                
                {/* Custom Color Input Wrapper */}
                <div className="relative w-8 h-8 rounded-full border border-white/10 overflow-hidden flex items-center justify-center bg-gradient-to-tr from-pink-500 via-purple-500 to-blue-500 hover:scale-110 transition-all cursor-pointer">
                  <input
                    type="color"
                    value={selectedTagColor.startsWith('#') ? selectedTagColor : '#B7C9B0'}
                    onChange={(e) => setSelectedTagColor(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    title="Custom Color"
                  />
                  <span className="text-[10px] font-bold text-white pointer-events-none">+</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleResetTagColor}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-white/5 bg-white/5 text-[10px] font-mono uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Reset to automatically generated color"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
                <button
                  onClick={handleSaveTagColor}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-sage-200 text-slate-950 text-[10px] font-bold uppercase tracking-widest hover:bg-sage-100 active:scale-98 transition-all shadow-[0_0_20px_rgba(183,201,176,0.2)] flex items-center justify-center cursor-pointer"
                >
                  Save Color
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* --- Sub-components --- */

const SettingsNav = ({ 
  icon: Icon, 
  label, 
  active, 
  disabled, 
  onClick 
}: { 
  icon: any; 
  label: string; 
  active?: boolean; 
  disabled?: boolean; 
  onClick?: () => void;
}) => (
  <button 
    disabled={disabled}
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all duration-300 text-sm cursor-pointer ${
      active 
        ? 'bg-sage-200/15 border-sage-200/30 text-white font-medium shadow-[0_0_15px_rgba(183,201,176,0.05)]' 
        : disabled 
          ? 'opacity-30 cursor-not-allowed border-transparent text-white/20' 
          : 'border-transparent text-white/40 hover:bg-white/5 hover:text-white'
    }`}
  >
    <Icon className={`w-4 h-4 ${active ? 'text-sage-200' : ''}`} />
    {label}
  </button>
);

const SettingItem = ({ label, description, children }: { label: string, description: string, children: React.ReactNode }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div className="max-w-[280px] sm:max-w-md">
      <h3 className="text-sm font-medium text-white/80">{label}</h3>
      <p className="text-xs text-white/30 leading-relaxed mt-0.5">{description}</p>
    </div>
    {children}
  </div>
);

const Toggle = ({ active, onToggle }: { active: boolean, onToggle: () => void }) => (
  <button 
    onClick={onToggle}
    className={`w-12 h-6 rounded-full relative transition-all duration-500 cursor-pointer border ${
      active ? 'bg-sage-200 border-sage-200 shadow-[0_0_15px_rgba(183,201,176,0.3)]' : 'bg-white/10 border-white/5'
    }`}
  >
    <motion.div 
      animate={{ x: active ? 26 : 2 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={`absolute top-[3px] left-0 w-4 h-4 rounded-full ${
        active ? 'bg-slate-950' : 'bg-white/40'
      }`}
    />
  </button>
);

export default SettingsPage;
