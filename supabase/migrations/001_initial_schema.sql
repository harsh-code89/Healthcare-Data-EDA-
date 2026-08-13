-- ============================================================
--  ViteLens — Supabase Initial Schema
--  Run this once in your Supabase project:
--  Dashboard → SQL Editor → New query → Paste → Run
-- ============================================================

-- ── 1. Profiles table (extends Supabase auth.users) ─────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL DEFAULT '',
  email      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2. Datasets table (tracks upload history per user) ───────
CREATE TABLE IF NOT EXISTS public.datasets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name   TEXT NOT NULL,
  row_count   INTEGER,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 3. Row-Level Security ────────────────────────────────────
--  Users can only read/write their OWN rows.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Datasets
CREATE POLICY "Users can view own datasets"
  ON public.datasets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own datasets"
  ON public.datasets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own datasets"
  ON public.datasets FOR DELETE
  USING (auth.uid() = user_id);

-- ── 4. Auto-create profile on sign up ───────────────────────
--  This trigger fires whenever a new row is inserted into auth.users
--  (i.e., every time someone registers, including OAuth).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'name',       -- From OAuth providers (Google, GitHub)
      NEW.raw_user_meta_data->>'full_name',  -- Some providers use full_name
      split_part(NEW.email, '@', 1)          -- Fallback: username from email
    ),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;              -- Safe for repeated calls
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists, then recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 5. Grants ────────────────────────────────────────────────
--  The anon/authenticated roles need SELECT on their own rows.
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.datasets TO authenticated;
GRANT SELECT ON public.profiles TO anon;
