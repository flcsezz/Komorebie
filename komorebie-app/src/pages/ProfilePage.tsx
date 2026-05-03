import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Camera, Trophy, Flame, Clock, Target, X, Check, Loader2, AlertTriangle, Trash2, ShieldCheck } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import FocusActivityWidget from '../components/analytics/FocusActivityWidget';
import { useAnalytics } from '../hooks/useAnalytics';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { resizeImage } from '../lib/image-utils';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { stats, streakDates, profile, refresh } = useAnalytics();
  const [showSettings, setShowSettings] = useState(false);
  const [settingsUsername, setSettingsUsername] = useState('');
  const [settingsFullName, setSettingsFullName] = useState('');
  const [settingsBio, setSettingsBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [now] = useState(() => Date.now());


  const displayName = profile?.display_name || profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Explorer';
  const username = profile?.username || user?.email?.split('@')[0] || 'explorer';
  const avatarUrl = profile?.avatar_url || '';

  const openSettings = () => {
    setSettingsUsername(profile?.username || '');
    setSettingsFullName(profile?.display_name || profile?.full_name || '');
    setSettingsBio(profile?.bio || '');
    setShowSettings(true);
  };

  const handleSaveSettings = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const updates: { 
        updated_at: string; 
        username?: string; 
        display_name?: string; 
        full_name?: string; 
        display_name_updated_at?: string;
        bio?: string;
      } = { updated_at: new Date().toISOString() };
      if (settingsUsername.length >= 3) updates.username = settingsUsername;
      if (settingsFullName) {
        updates.display_name = settingsFullName;
        updates.full_name = settingsFullName;
      }
      updates.bio = settingsBio;

      await supabase.from('profiles').update({
        ...updates,
        display_name_updated_at: new Date().toISOString()
      }).eq('id', user.id);
      await refresh();
      setShowSettings(false);
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    try {
      // 1. Resize the image to 256px
      const resizedBlob = await resizeImage(file, 256);
      
      const filePath = `${user.id}/avatar.jpg`; // Force JPG for consistency
      
      // 2. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, resizedBlob, { 
          upsert: true,
          contentType: 'image/jpeg'
        });
        
      if (uploadError) throw uploadError;

      // 3. Get the public URL
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      // 4. Update the profiles table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: `${urlData.publicUrl}?t=${now}`, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', user.id);
        
      if (updateError) throw updateError;
      
      await refresh();
    } catch (err) {
      console.error('Avatar upload error:', err);
    } finally {
      setUploadingAvatar(false);
    }
  };
  
  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      // 1. Call the custom RPC function to delete user data and auth user
      const { error } = await supabase.rpc('delete_user');
      if (error) throw error;

      // 2. Clear local storage and sign out
      await supabase.auth.signOut();
      localStorage.clear();
      window.location.href = '/';
    } catch (err) {
      console.error('Error deleting account:', err);
      alert('Failed to delete account. Please try again.');
    } finally {
      setDeleting(false);
    }
  };


  const totalHoursFormatted = stats.totalHours >= 1 ? `${stats.totalHours}h` : `${Math.floor(stats.totalHours * 60)}m`;

  const settingsModal = showSettings && createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setShowSettings(false)} />
        <motion.div initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 30 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="relative w-full max-w-md z-10">
          <GlassCard variant="frosted" className="p-7 shadow-2xl border-white/15">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-display font-light text-white">Settings</h2>
                <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1">Manage your sanctuary identity</p>
              </div>
              <button onClick={() => setShowSettings(false)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-5">
              {/* Display Name Section */}
              <div>
                <div className="flex justify-between items-end mb-1.5">
                  <label className="block text-[10px] text-white/40 uppercase tracking-wider font-bold">Display Name</label>
                  {profile?.display_name_updated_at && (
                    (() => {
                      const lastUpdate = new Date(profile.display_name_updated_at).getTime();
                      const sevenDays = 7 * 24 * 60 * 60 * 1000;
                      const remaining = lastUpdate + sevenDays - now;
                      
                      if (remaining > 0) {
                        const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
                        const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
                        return <span className="text-[9px] text-amber-500/60 font-medium italic">Available in {days}d {hours}h</span>;
                      }
                      return null;
                    })()
                  )}
                </div>
                <input 
                  type="text" 
                  value={settingsFullName} 
                  onChange={e => setSettingsFullName(e.target.value)} 
                  disabled={(() => {
                    if (!profile?.display_name_updated_at) return false;
                    const lastUpdate = new Date(profile.display_name_updated_at).getTime();
                    return (lastUpdate + (7 * 24 * 60 * 60 * 1000)) > now;
                  })()}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-sage-200/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed" 
                  placeholder="Your display name" 
                />
              </div>

              {/* Bio Section */}
              <div>
                <label className="block text-[10px] text-white/40 uppercase tracking-wider mb-1.5 font-bold">Bio</label>
                <textarea 
                  defaultValue={profile?.bio || ''}
                  onChange={e => setSettingsBio(e.target.value)} 
                  maxLength={160}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-sage-200/40 transition-colors min-h-[80px] resize-none" 
                  placeholder="Tell the world your story..." 
                />
                <p className="text-[8px] text-white/10 mt-1.5 ml-1 uppercase tracking-widest font-bold text-right">Up to 160 characters</p>
              </div>

              {/* Username Section (Locked) */}
              <div>
                <label className="block text-[10px] text-white/40 uppercase tracking-wider mb-1.5 font-bold">Username</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20">@</div>
                  <input 
                    type="text" 
                    value={profile?.username || ''} 
                    disabled
                    className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-9 py-3 text-white/30 text-sm cursor-not-allowed" 
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <ShieldCheck className="w-3.5 h-3.5 text-white/10" />
                  </div>
                </div>
                <p className="text-[8px] text-white/10 mt-1.5 ml-1 uppercase tracking-widest font-bold">Username is permanent</p>
              </div>

              {/* Email Section (Locked) */}
              <div>
                <label className="block text-[10px] text-white/40 uppercase tracking-wider mb-1.5 font-bold">Email Address</label>
                <div className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 text-white/30 text-sm cursor-not-allowed flex items-center justify-between">
                  {user?.email || ''}
                  <ShieldCheck className="w-3.5 h-3.5 text-white/10" />
                </div>
              </div>

              {/* Danger Zone */}
              <div className="pt-6 border-t border-white/5 mt-4">
                <h3 className="text-[10px] text-red-400 uppercase tracking-[0.3em] mb-4 font-black flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3" />
                  Danger Zone
                </h3>
                
                {!showDeleteConfirm ? (
                  <button 
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-red-500/5 border border-red-500/10 text-red-400 hover:bg-red-500/10 transition-all group"
                  >
                    <span className="text-xs font-medium">Delete Account</span>
                    <Trash2 className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
                  </button>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 rounded-xl bg-red-500/10 border border-red-500/20"
                  >
                    <p className="text-[10px] text-red-200 mb-3 leading-relaxed">
                      This action is permanent. All your focus history, tasks, and sanctuary progress will be deleted forever.
                    </p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 px-3 py-2 rounded-lg bg-white/5 text-white/60 text-[10px] font-bold hover:bg-white/10 transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleDeleteAccount}
                        disabled={deleting}
                        className="flex-1 px-3 py-2 rounded-lg bg-red-500 text-white text-[10px] font-bold hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                      >
                        {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        Delete
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="flex gap-3 pt-3 border-t border-white/5">
                <button onClick={() => setShowSettings(false)} className="flex-1 px-4 py-2.5 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all font-medium text-sm cursor-pointer">Cancel</button>
                <button onClick={handleSaveSettings} disabled={saving} className="flex-1 bg-sage-200 hover:bg-sage-300 disabled:opacity-40 text-slate-950 px-6 py-2.5 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(183,201,176,0.3)] text-sm cursor-pointer flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );

  return (
    <>
    <div className="min-h-full max-w-5xl mx-auto pt-8 pb-20 px-4 flex flex-col items-center">
      <div className="w-full max-w-5xl">
      {/* Profile Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <GlassCard variant="frosted" className="p-8 relative overflow-hidden mb-8">
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-sage-200/5 rounded-full blur-[80px] pointer-events-none" />
          
          {/* Settings Button */}
          <button onClick={openSettings} className="absolute top-5 right-5 p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all cursor-pointer z-10" title="Profile Settings">
            <Settings className="w-4 h-4" />
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-6 relative z-5">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-32 h-32 rounded-[2rem] bg-slate-800 border-2 border-white/10 overflow-hidden flex items-center justify-center group-hover:border-sage-200/30 transition-all shadow-2xl">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-display font-light text-white/40">{displayName.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-1 -right-1 w-10 h-10 rounded-2xl bg-sage-200 text-slate-950 flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer">
                {uploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>

            {/* Info */}
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-3xl font-display font-light text-white mb-1 tracking-tight">{displayName}</h1>
              <p className="text-sm text-white/30 mb-4 font-medium">@{username}</p>
              
              <div className="max-w-md">
                <p className="text-xs text-white/60 leading-relaxed italic">
                  {profile?.bio ? (
                    <span className="font-bold text-white/80 not-italic">"{profile.bio}"</span>
                  ) : (
                    <span className="text-white/20">No bio yet. Tell the world your story...</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Stats Grid */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Flame, label: 'Current Streak', value: `${stats.currentStreak}`, sub: 'days', color: 'text-amber-300 bg-amber-500/10 border-amber-500/20' },
          { icon: Trophy, label: 'Best Streak', value: `${stats.bestStreak}`, sub: 'days', color: 'text-purple-300 bg-purple-500/10 border-purple-500/20' },
          { icon: Target, label: 'Sessions', value: `${stats.totalSessions}`, sub: 'completed', color: 'text-blue-300 bg-blue-500/10 border-blue-500/20' },
          { icon: Clock, label: 'Focus Time', value: totalHoursFormatted, sub: 'total', color: 'text-sage-200 bg-sage-200/10 border-sage-200/20' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 + i * 0.05 }}>
            <GlassCard variant="icy" className="p-4 text-center group hover:border-white/20 transition-all">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2.5 border ${stat.color}`}>
                <stat.icon className="w-4.5 h-4.5" />
              </div>
              <div className="text-xl font-display font-light text-white mb-0.5">{stat.value}</div>
              <div className="text-[8px] uppercase tracking-[0.2em] text-white/25 font-bold">{stat.label}</div>
              <div className="text-[7px] text-white/15 uppercase tracking-widest mt-0.5">{stat.sub}</div>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>
      </div>

      {/* Yearly Heatmap Calendar - Full Width */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.6, delay: 0.2 }}
        className="w-full"
      >
        <FocusActivityWidget streakDates={streakDates} />
      </motion.div>
    </div>

    {settingsModal}
    </>
  );
};

export default ProfilePage;
