import { getR2PublicUrl } from './r2';

export interface Background {
  id: string;
  name: string;
  url: string;
  isSpecial?: boolean;
}

export const ADMIN_EMAIL = 'gauravbaghel7193@gmail.com';
export const ADMIN_USERNAME = '@albertwesker';

export const PUBLIC_BACKGROUNDS: Background[] = [
  { id: 'zen-morning', name: 'Zen Morning', url: getR2PublicUrl('backgrounds/left1.webp') },
  { id: 'quiet-afternoon', name: 'Quiet Afternoon', url: getR2PublicUrl('backgrounds/left2.webp') },
  { id: 'starlight-sanctuary', name: 'Starlight Sanctuary', url: getR2PublicUrl('backgrounds/left3.webp') },
  { id: 'misty-forest', name: 'Misty Forest', url: getR2PublicUrl('backgrounds/forest.webp') },
  { id: 'eye-blue', name: 'Blue Eye', url: getR2PublicUrl('backgrounds/eye1.webp') },
];

export const SPECIAL_BACKGROUNDS: Background[] = [
  { id: 'baddie-vibes', name: 'Baddie Vibes', url: getR2PublicUrl('backgrounds/baddie.webp'), isSpecial: true },
  { id: 'obsidian-wall', name: 'Obsidian Wall', url: getR2PublicUrl('backgrounds/wall.webp'), isSpecial: true },
  { id: 'watching-eye', name: 'The Watching Eye', url: getR2PublicUrl('backgrounds/eye.webp'), isSpecial: true },
];

export const ALL_BACKGROUNDS = [...PUBLIC_BACKGROUNDS, ...SPECIAL_BACKGROUNDS];

export const getVisibleBackgrounds = (userEmail?: string | null) => {
  if (userEmail === ADMIN_EMAIL) return ALL_BACKGROUNDS;
  return PUBLIC_BACKGROUNDS;
};
