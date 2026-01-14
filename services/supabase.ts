import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zhvamtwqhwkhieumpfjs.supabase.co';
const supabaseAnonKey = 'sb_publishable_sGdjJ3oB4S31G52RMqwhKw_J9WnR0Q-';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
