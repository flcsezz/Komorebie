import { ALL_BACKGROUNDS } from './backgrounds';
import { getR2PublicUrl } from './r2';

export const DECORATION_UNLOCK_HOURS = 35;
export const DEFAULT_PROFILE_BG = getR2PublicUrl('backgrounds/forest.webp');

export interface ProfileResolution {
  url: string;
  type: 'image' | 'video';
  audioUrl: string | null;
}

/**
 * Resolves the final background and audio to be displayed on a profile page
 * based on user eligibility and asset types.
 */
export const resolveProfileDecoration = (
  profile: any,
  totalHours: number,
  isAdmin: boolean,
  isPremium: boolean = false
): ProfileResolution => {
  const isEligible = isAdmin || isPremium || totalHours >= DECORATION_UNLOCK_HOURS;
  const hasPremiumAccess = isAdmin || isPremium;

  // 1. Determine the raw background URL and audio
  // If profile_bg is null/empty, we sync with the dashboard (preferred_bg)
  const rawBgUrl = profile?.profile_bg || profile?.preferred_bg || DEFAULT_PROFILE_BG;
  const rawAudioUrl = profile?.unmuted_audio;

  // 2. Resolve Background
  let resolvedUrl = DEFAULT_PROFILE_BG;
  let resolvedType: 'image' | 'video' = 'image';

  if (isEligible) {
    const bgInfo = ALL_BACKGROUNDS.find(b => b.url === rawBgUrl);
    const isVideoByExtension = /\.(mp4|webm|mov|ogg)($|\?)/i.test(rawBgUrl);
    const isVideo = bgInfo?.type === 'video' || isVideoByExtension;

    if (isVideo) {
      if (hasPremiumAccess) {
        resolvedUrl = rawBgUrl;
        resolvedType = 'video';
      } else {
        // Fallback for non-premium users trying to use video
        resolvedUrl = DEFAULT_PROFILE_BG;
        resolvedType = 'image';
      }
    } else {
      // It's a static image
      resolvedUrl = rawBgUrl;
      resolvedType = 'image';
    }
  } else {
    // Under 35h - Force default
    resolvedUrl = DEFAULT_PROFILE_BG;
    resolvedType = 'image';
  }

  // 3. Resolve Audio (Admin/Premium only)
  let resolvedAudio = null;
  if (hasPremiumAccess && rawAudioUrl) {
    resolvedAudio = rawAudioUrl;
  }

  return {
    url: resolvedUrl,
    type: resolvedType,
    audioUrl: resolvedAudio
  };
};
