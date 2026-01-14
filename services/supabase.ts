import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase Project URL and Anon Key
const supabaseUrl = 'https://your-project-id.supabase.co';
const supabaseAnonKey = 'your-public-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
