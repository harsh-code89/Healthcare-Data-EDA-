// TypeScript types for ViteLens Supabase schema.
// Regenerate with: npx supabase gen types typescript --project-id <your-project-id> > src/lib/database.types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          email: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          name?: string;
          email?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          email?: string | null;
        };
      };
      datasets: {
        Row: {
          id: string;
          user_id: string;
          file_name: string;
          row_count: number | null;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          file_name: string;
          row_count?: number | null;
          uploaded_at?: string;
        };
        Update: {
          file_name?: string;
          row_count?: number | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
