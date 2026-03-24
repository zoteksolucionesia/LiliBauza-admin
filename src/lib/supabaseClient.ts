import { createClient } from '@supabase/supabase-js';

// Usamos valores vacíos durante el build si las variables no están disponibles.
// En producción, estas variables deben estar definidas en .env.local.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
