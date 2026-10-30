import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://your-project-id.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

export const isSupabaseConfigured =
  Boolean(import.meta.env.VITE_SUPABASE_URL) &&
  !supabaseUrl.includes('your-project-id') &&
  Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY) &&
  !supabaseAnonKey.includes('your-supabase-anon-key');

/**
 * Browser Supabase client initialized strictly with the public URL and anon key.
 * All queries execute under the signed-in client's JWT (`auth.uid()`) and are
 * enforced by PostgreSQL Row Level Security (RLS) policies.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
