/// <reference types="vite/client" />
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Expose a flag so other parts of the app can detect misconfiguration early
export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;

if (!isSupabaseConfigured) {
  console.error(
    "❌ CareOS: Supabase environment variables are NOT configured.\n" +
    "   VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set.\n\n" +
    "   • Local dev: add them to .env.local\n" +
    "   • Netlify: Site Settings → Environment Variables → add both variables → Redeploy"
  );
}

export const supabase = createClient(
  supabaseUrl ?? "https://placeholder.supabase.co",
  supabaseAnonKey ?? "placeholder-key",
  {
    auth: {
      autoRefreshToken: true,   // Automatically refresh JWT before it expires
      persistSession: true,     // Keep session in localStorage across page refreshes
      detectSessionInUrl: true, // Handle OAuth & magic-link callbacks in the URL hash
    },
  }
);
