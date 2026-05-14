import { supabase } from './supabase';

/**
 * Helper to hit the Cloudflare Edge Worker API
 */
export async function edgeFetch(path: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };

  const response = await fetch(path, { ...options, headers });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Edge fetch failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Unified data sync write
 */
export async function edgeUpdate(dataType: string, payload: any) {
  return edgeFetch('/api/data/update', {
    method: 'POST',
    body: JSON.stringify({ data_type: dataType, payload })
  });
}

/**
 * Fetch all edge-cached data
 */
export async function edgeFetchAll() {
  return edgeFetch('/api/data/all');
}
