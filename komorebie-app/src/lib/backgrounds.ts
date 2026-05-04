import { getR2PublicUrl } from './r2';

export interface Background {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video';
  isSpecial?: boolean;
  ambientAudio?: string; // Optional R2 URL for profile-specific music
  unmutedAudio?: string; // High-priority admin/premium music
}

export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'gauravbaghel7193@gmail.com';
export const ADMIN_USERNAME = '@albertwesker';

export const ADMIN_MUSIC = [
  { id: 'wesker-theme', name: 'Wesker Theme', url: getR2PublicUrl('audio/wesker-theme.mp3') },
];

export const PUBLIC_BACKGROUNDS: Background[] = [
  { id: 'zen-morning', name: 'Zen Morning', url: getR2PublicUrl('backgrounds/left1.webp'), type: 'image' },
  { id: 'quiet-afternoon', name: 'Quiet Afternoon', url: getR2PublicUrl('backgrounds/left2.webp'), type: 'image' },
  { id: 'starlight-sanctuary', name: 'Starlight Sanctuary', url: getR2PublicUrl('backgrounds/left3.webp'), type: 'image' },
  { id: 'misty-forest', name: 'Misty Forest', url: getR2PublicUrl('backgrounds/forest.webp'), type: 'image' },
  { id: 'eye-blue', name: 'Blue Eye', url: getR2PublicUrl('backgrounds/eye1.webp'), type: 'image' },
  { id: 'snow-mountain', name: 'Snow Mountain', url: getR2PublicUrl('backgrounds/snowmountain.webp'), type: 'image' },
  { id: 'cosmic-nebula', name: 'Cosmic Nebula', url: getR2PublicUrl('backgrounds/space.webp'), type: 'image' },
  { id: 'deep-space', name: 'Deep Space', url: getR2PublicUrl('backgrounds/space2.webp'), type: 'image' },
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
    unmutedAudio: getR2PublicUrl('audio/wesker-theme.mp3') 
  },
];

export const ALL_BACKGROUNDS = [
  ...PUBLIC_BACKGROUNDS, 
  ...LIVE_BACKGROUNDS, 
  ...SPECIAL_BACKGROUNDS, 
  ...SPECIAL_LIVE_BACKGROUNDS
];

export const getVisibleBackgrounds = (userEmail?: string | null) => {
  if (userEmail === ADMIN_EMAIL) return ALL_BACKGROUNDS;
  return [...PUBLIC_BACKGROUNDS, ...LIVE_BACKGROUNDS];
};
