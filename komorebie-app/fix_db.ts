import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) {
    console.error('Error fetching:', error);
    return;
  }
  let count = 0;
  for (const user of data) {
    let updates: any = {};
    if (user.profile_bg && user.profile_bg.includes('adminback.webm')) {
      updates.profile_bg = user.profile_bg.replace('adminback.webm', 'adminback.mp4');
    }
    if (user.preferred_bg && user.preferred_bg.includes('adminback.webm')) {
      updates.preferred_bg = user.preferred_bg.replace('adminback.webm', 'adminback.mp4');
    }
    if (user.unmuted_audio && user.unmuted_audio.includes('wesker-theme-v3.mp3')) {
      updates.unmuted_audio = user.unmuted_audio.replace('wesker-theme-v3.mp3', 'bgm.mp3');
    }
    if (Object.keys(updates).length > 0) {
      console.log(`Updating user ${user.id}...`, updates);
      await supabase.from('profiles').update(updates).eq('id', user.id);
      count++;
    }
  }
  console.log(`Done! Updated ${count} users.`);
}
fix();
