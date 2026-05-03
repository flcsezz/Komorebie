import path from 'path';
import fs from 'fs';

// Read .env manually
const envPath = path.resolve('/home/flcsezz/web-cram/.env');
const envContent = fs.readFileSync(envPath, 'utf8');
let supabaseUrl = '';
let supabaseKey = '';

for (const line of envContent.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
}

const headers = {
  'apikey': supabaseKey,
  'Authorization': `Bearer ${supabaseKey}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

const userId = 'fbf5b082-20b1-474c-a99b-5b1eb35c0072';

async function testUpdateStreak() {
  const today = new Date().toISOString().split('T')[0];
  const seconds = 1500;
  
  console.log('Fetching existing streak...');
  const res1 = await fetch(`${supabaseUrl}/rest/v1/streaks?user_id=eq.${userId}&focus_date=eq.${today}&select=*`, { headers });
  const data1 = await res1.json();
  console.log('Existing:', data1);

  if (data1.length > 0) {
    const existing = data1[0];
    console.log('Updating...');
    const res2 = await fetch(`${supabaseUrl}/rest/v1/streaks?id=eq.${existing.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        total_focus_seconds: (existing.total_focus_seconds || 0) + seconds,
        sessions_count: (existing.sessions_count || 0) + 1,
        streak_qualified: true
      })
    });
    console.log('Update res:', await res2.json());
  } else {
    console.log('Inserting...');
    const res2 = await fetch(`${supabaseUrl}/rest/v1/streaks`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        user_id: userId,
        focus_date: today,
        total_focus_seconds: seconds,
        sessions_count: 1,
        streak_qualified: true
      })
    });
    console.log('Insert res:', await res2.json());
  }
}

testUpdateStreak().catch(console.error);
