import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseAnonKey === 'TU_PUBLISHABLE_ANON_KEY_AQUI') {
  console.warn('⚠️ Supabase URL or Anon Key is missing or invalid. Check your .env.local file.');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);
