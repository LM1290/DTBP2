import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase Project URL and Anon Key
const supabaseUrl = 'https://zhvamtwqhwkhieumpfjs.supabase.co';
const supabaseAnonKey = 'sb_publishable_sGdjJ3oB4S31G52RMqwhKw_J9WnR0Q-';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
