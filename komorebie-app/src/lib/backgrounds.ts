import { getR2PublicUrl } from './r2';

export type Background = {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video';
  isSpecial?: boolean;
  price?: number;
  tier?: string;
  ambientAudio?: string; // Optional R2 URL for profile-specific music
  unmutedAudio?: string; // High-priority admin/premium music
};

export const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || 'gauravbaghel7193@gmail.com').toString();
export const ADMIN_USERNAME = '@albertwesker';

export const ADMIN_MUSIC = [
  { id: 'admin-bgm', name: 'Admin BGM', url: getR2PublicUrl('audio/bgm.mp3') },
];

export const PUBLIC_BACKGROUNDS: Background[] = [
  { id: 'library-sunset', name: 'Library Sunset', url: getR2PublicUrl('backgrounds/left1.webp'), type: 'image' },
  { id: 'quiet-afternoon', name: 'Quiet Afternoon', url: getR2PublicUrl('backgrounds/left2.webp'), type: 'image' },
  { id: 'starlight-sanctuary', name: 'Starlight Sanctuary', url: getR2PublicUrl('backgrounds/left3.webp'), type: 'image' },
  { id: 'misty-forest', name: 'Mist Forest', url: getR2PublicUrl('backgrounds/forest.webp'), type: 'image' },
  { id: 'eye-blue', name: 'Blue Eye', url: getR2PublicUrl('backgrounds/eye1.webp'), type: 'image' },
  { id: 'snow-mountain', name: 'Snow Mountain', url: getR2PublicUrl('backgrounds/snowmountain.webp'), type: 'image' },
  { id: 'cosmic-nebula', name: 'Cosmic Nebula', url: getR2PublicUrl('backgrounds/space.webp'), type: 'image' },
  { id: 'deep-space', name: 'Deep Space', url: getR2PublicUrl('backgrounds/space2.webp'), type: 'image' },
  { id: 'violet-higanbana', name: 'Violet Higanbana', url: getR2PublicUrl('backgrounds/flower.webp'), type: 'image' },
  { id: 'forest-totoro', name: 'Forest Totoro', url: getR2PublicUrl('backgrounds/left.webp'), type: 'image' },
  { id: 'sunset-lake', name: 'Sunset Lake', url: getR2PublicUrl('backgrounds/pexels-jplenio-1642770.webp'), type: 'image' },
  { id: 'crescent-sea', name: 'Crescent Sea', url: getR2PublicUrl('backgrounds/pexels-jplenio-2816056.webp'), type: 'image' },
  { id: 'gothic-rose-castle', name: 'Gothic Rose Castle', url: getR2PublicUrl('backgrounds/roses.webp'), type: 'image' },
];

export const LIVE_BACKGROUNDS: Background[] = [
  { id: 'rainy-window', name: 'Rainy Window', url: getR2PublicUrl('backgrounds/rain.mp4'), type: 'video' },
  { id: 'lofi-cafe', name: 'Lo-Fi Cafe', url: getR2PublicUrl('backgrounds/cafe.mp4'), type: 'video' },
  { id: 'ethereal-waves', name: 'Ethereal Waves', url: getR2PublicUrl('backgrounds/waves.mp4'), type: 'video' },
];

export const SPECIAL_BACKGROUNDS: Background[] = [
  { id: 'baddie-vibes', name: 'Baddie Vibes', url: getR2PublicUrl('backgrounds/baddie.webp'), type: 'image', isSpecial: true },
  { id: 'obsidian-wall', name: 'Obsidian Wall', url: getR2PublicUrl('backgrounds/wall.webp'), type: 'image', isSpecial: true },
  { id: 'watching-eye', name: 'The Watching Eye', url: getR2PublicUrl('backgrounds/eye.webp'), type: 'image', isSpecial: true },
  { id: 'knight-sentinel', name: 'Knight Sentinel', url: getR2PublicUrl('backgrounds/abgknight.webp'), type: 'image', isSpecial: true },
  { id: 'franx-pilot', name: 'Franx Pilot', url: getR2PublicUrl('backgrounds/franx.webp'), type: 'image', isSpecial: true },
  { id: 'gilded-gazebo', name: 'Gilded Gazebo', url: getR2PublicUrl('backgrounds/admin.webp'), type: 'image', isSpecial: true },
  { id: 'noir-cigarette', name: 'Noir Cigarette', url: getR2PublicUrl('backgrounds/admin1.webp'), type: 'image', isSpecial: true },
  { id: 'reze-riverfront', name: 'Reze Riverfront', url: getR2PublicUrl('backgrounds/admin7.webp'), type: 'image', isSpecial: true },
  { id: 'ethereal-gaze', name: 'Ethereal Gaze', url: getR2PublicUrl('backgrounds/adminEYE.webp'), type: 'image', isSpecial: true },
  { id: 'midnight-shoreline', name: 'Midnight Shoreline', url: getR2PublicUrl('backgrounds/adminnico1.webp'), type: 'image', isSpecial: true },
  { id: 'floral-veil', name: 'Floral Veil', url: getR2PublicUrl('backgrounds/adminreze1.webp'), type: 'image', isSpecial: true },
];

export const SPECIAL_LIVE_BACKGROUNDS: Background[] = [
  { id: 'neon-city', name: 'Cyberpunk Neon', url: getR2PublicUrl('backgrounds/neon.mp4'), type: 'video', isSpecial: true },
  { id: 'cosmic-drift', name: 'Cosmic Drift', url: getR2PublicUrl('backgrounds/cosmic.mp4'), type: 'video', isSpecial: true },
  { 
    id: 'admin-live', 
    name: 'Zen Admin', 
    url: getR2PublicUrl('live-backgrounds/adminback.webm'), 
    type: 'video', 
    isSpecial: true,
    unmutedAudio: getR2PublicUrl('audio/bgm.mp3') 
  },
];

export const ALL_BACKGROUNDS = [
  ...PUBLIC_BACKGROUNDS, 
  ...LIVE_BACKGROUNDS, 
  ...SPECIAL_BACKGROUNDS, 
  ...SPECIAL_LIVE_BACKGROUNDS
];

export const getVisibleBackgrounds = (userEmail?: string | null) => {
  const email = (userEmail || '').toLowerCase();
  const admin = (ADMIN_EMAIL || '').toLowerCase();
  if (email === admin && admin !== '') return ALL_BACKGROUNDS;
  return [...PUBLIC_BACKGROUNDS, ...LIVE_BACKGROUNDS];
};
