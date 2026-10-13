import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Publishable key aman berada di browser; akses data dijaga oleh Row Level Security di database
const url: string | undefined = import.meta.env.VITE_SUPABASE_URL;
const key: string | undefined = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabaseConfigError =
  !url || !key ? "Supabase belum dikonfigurasi: isi VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY di .env.local" : null;

export const supabase: SupabaseClient | null = supabaseConfigError ? null : createClient(url!, key!);

export function getSupabase(): SupabaseClient {
  if (!supabase) throw new Error(supabaseConfigError!);
  return supabase;
}
