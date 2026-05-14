import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const userId = '80768f65-6519-4c27-8754-c2e656677888';
  const res = await supabase.from('profiles').select('*').eq('id', userId).single();
  console.log('Profile:', res.data);
  console.log('Error:', res.error);
}
test();
