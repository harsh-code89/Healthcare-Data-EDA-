/// <reference types="vite/client" />
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "⚠️  ViteLens: Supabase environment variables are missing.\n" +
    "   Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env.local file.\n" +
    "   See: https://supabase.com/docs/guides/getting-started"
  );
}

export const supabase = createClient(
  supabaseUrl ?? "https://placeholder.supabase.co",
  supabaseAnonKey ?? "placeholder",
  {
    auth: {
      autoRefreshToken: true,   // Automatically refresh JWT before it expires
      persistSession: true,     // Keep session in localStorage across page refreshes
      detectSessionInUrl: true, // Handle OAuth & magic-link callbacks in the URL hash
    },
  }
);
