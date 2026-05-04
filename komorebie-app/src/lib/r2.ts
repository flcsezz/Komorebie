/**
 * Cloudflare R2 Configuration & Utilities
 * 
 * This utility provides the configuration for interacting with the komorebie-assets bucket.
 * For secure uploads, it is recommended to use Cloudflare Workers or pre-signed URLs
 * generated on the server-side to avoid exposing secret keys.
 */

export const R2_CONFIG = {
  accountId: import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID || '96aa2c67194083a6ef79367d4b7703d8',
  bucketName: import.meta.env.VITE_R2_BUCKET_NAME || 'komorebie-assets',
  publicDomain: import.meta.env.VITE_R2_PUBLIC_DOMAIN || 'assets.komorebie.flcsezz.sbs',
  endpoint: import.meta.env.VITE_R2_ENDPOINT || 'https://96aa2c67194083a6ef79367d4b7703d8.r2.cloudflarestorage.com',
};

/**
 * Generates a public URL for an asset stored in the R2 bucket.
 * @param path The path to the asset within the bucket (e.g., 'backgrounds/forest.jpg')
 * @returns The full public URL
 */
export function getR2PublicUrl(path: string): string {
  if (!R2_CONFIG.publicDomain) return '';
  // Clean domain just in case it has https:// or trailing slashes in env vars
  const cleanDomain = R2_CONFIG.publicDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  // Ensure path doesn't start with a slash
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `https://${cleanDomain}/${cleanPath}`;
}

/**
 * NOTE: For uploads, you will need:
 * 1. R2_ACCESS_KEY_ID
 * 2. R2_SECRET_ACCESS_KEY
 * 
 * These should NOT be exposed in the frontend. If you need to perform client-side uploads,
 * consider implementing a Cloudflare Worker that provides temporary pre-signed URLs
 * or handles the upload directly with proper authentication.
 */
