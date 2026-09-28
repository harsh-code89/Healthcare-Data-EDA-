-- =============================================================
-- CareOS — Complete Database Setup Script
-- Run this ENTIRE script in Supabase Dashboard → SQL Editor
-- It is safe to run multiple times (uses IF NOT EXISTS + OR REPLACE)
-- =============================================================

-- ── 001: Profiles Table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id                     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name                   TEXT NOT NULL DEFAULT '',
  email                  TEXT,
  blood_group            TEXT,
  allergies              TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 002: Patient Records Tables ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.appointments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_name   TEXT NOT NULL,
  specialty       TEXT,
  hospital        TEXT,
  date            DATE NOT NULL,
  time            TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'upcoming',
  type            TEXT NOT NULL DEFAULT 'in_person',
  chief_complaint TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.medications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  dosage          TEXT NOT NULL,
  frequency       TEXT NOT NULL,
  route           TEXT,
  start_date      DATE NOT NULL,
  end_date        DATE,
  prescribed_by   TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  instructions    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.health_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  category        TEXT NOT NULL,
  report_date     DATE NOT NULL,
  file_type       TEXT NOT NULL DEFAULT 'pdf',
  file_size       INTEGER,
  file_url        TEXT,
  lab_name        TEXT,
  summary         TEXT,
  is_a_i_explained BOOLEAN DEFAULT false,
  uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.timeline_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  type            TEXT NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  provider        TEXT,
  hospital        TEXT,
  is_important    BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 003: Additional Features Tables ──────────────────────────
CREATE TABLE IF NOT EXISTS public.care_team (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  specialty       TEXT NOT NULL,
  hospital        TEXT,
  phone           TEXT,
  email           TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.family_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  relation        TEXT NOT NULL,
  date_of_birth   DATE,
  blood_group     TEXT,
  is_dependent    BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.consents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_name   TEXT NOT NULL,
  purpose         TEXT NOT NULL,
  granted_date    DATE NOT NULL,
  expiry_date     DATE,
  status          TEXT NOT NULL DEFAULT 'active',
  data_types      TEXT[] NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 004: Safe column additions (idempotent) ───────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blood_group TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS allergies TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;

ALTER TABLE public.health_reports ADD COLUMN IF NOT EXISTS lab_name TEXT;

-- ── 005: Row-Level Security ───────────────────────────────────
ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_reports   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_events  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_team        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consents         ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile"   ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"   ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Appointments policies
DROP POLICY IF EXISTS "Users can view own appointments"   ON public.appointments;
DROP POLICY IF EXISTS "Users can insert own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can update own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can delete own appointments" ON public.appointments;

CREATE POLICY "Users can view own appointments"   ON public.appointments FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Users can insert own appointments" ON public.appointments FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Users can update own appointments" ON public.appointments FOR UPDATE USING (auth.uid() = patient_id);
CREATE POLICY "Users can delete own appointments" ON public.appointments FOR DELETE USING (auth.uid() = patient_id);

-- Medications policies
DROP POLICY IF EXISTS "Users can view own medications"   ON public.medications;
DROP POLICY IF EXISTS "Users can insert own medications" ON public.medications;
DROP POLICY IF EXISTS "Users can update own medications" ON public.medications;
DROP POLICY IF EXISTS "Users can delete own medications" ON public.medications;

CREATE POLICY "Users can view own medications"   ON public.medications FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Users can insert own medications" ON public.medications FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Users can update own medications" ON public.medications FOR UPDATE USING (auth.uid() = patient_id);
CREATE POLICY "Users can delete own medications" ON public.medications FOR DELETE USING (auth.uid() = patient_id);

-- Health Reports policies
DROP POLICY IF EXISTS "Users can view own health reports"   ON public.health_reports;
DROP POLICY IF EXISTS "Users can insert own health reports" ON public.health_reports;
DROP POLICY IF EXISTS "Users can update own health reports" ON public.health_reports;
DROP POLICY IF EXISTS "Users can delete own health reports" ON public.health_reports;

CREATE POLICY "Users can view own health reports"   ON public.health_reports FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Users can insert own health reports" ON public.health_reports FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Users can update own health reports" ON public.health_reports FOR UPDATE USING (auth.uid() = patient_id);
CREATE POLICY "Users can delete own health reports" ON public.health_reports FOR DELETE USING (auth.uid() = patient_id);

-- Timeline Events policies
DROP POLICY IF EXISTS "Users can view own timeline events"   ON public.timeline_events;
DROP POLICY IF EXISTS "Users can insert own timeline events" ON public.timeline_events;
DROP POLICY IF EXISTS "Users can update own timeline events" ON public.timeline_events;
DROP POLICY IF EXISTS "Users can delete own timeline events" ON public.timeline_events;

CREATE POLICY "Users can view own timeline events"   ON public.timeline_events FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Users can insert own timeline events" ON public.timeline_events FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Users can update own timeline events" ON public.timeline_events FOR UPDATE USING (auth.uid() = patient_id);
CREATE POLICY "Users can delete own timeline events" ON public.timeline_events FOR DELETE USING (auth.uid() = patient_id);

-- Care Team policies
DROP POLICY IF EXISTS "Users can view own care team"   ON public.care_team;
DROP POLICY IF EXISTS "Users can insert own care team" ON public.care_team;
DROP POLICY IF EXISTS "Users can update own care team" ON public.care_team;
DROP POLICY IF EXISTS "Users can delete own care team" ON public.care_team;

CREATE POLICY "Users can view own care team"   ON public.care_team FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Users can insert own care team" ON public.care_team FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Users can update own care team" ON public.care_team FOR UPDATE USING (auth.uid() = patient_id);
CREATE POLICY "Users can delete own care team" ON public.care_team FOR DELETE USING (auth.uid() = patient_id);

-- Family Members policies
DROP POLICY IF EXISTS "Users can view own family"   ON public.family_members;
DROP POLICY IF EXISTS "Users can insert own family" ON public.family_members;
DROP POLICY IF EXISTS "Users can update own family" ON public.family_members;
DROP POLICY IF EXISTS "Users can delete own family" ON public.family_members;

CREATE POLICY "Users can view own family"   ON public.family_members FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Users can insert own family" ON public.family_members FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Users can update own family" ON public.family_members FOR UPDATE USING (auth.uid() = patient_id);
CREATE POLICY "Users can delete own family" ON public.family_members FOR DELETE USING (auth.uid() = patient_id);

-- Consents policies
DROP POLICY IF EXISTS "Users can view own consents"   ON public.consents;
DROP POLICY IF EXISTS "Users can insert own consents" ON public.consents;
DROP POLICY IF EXISTS "Users can update own consents" ON public.consents;
DROP POLICY IF EXISTS "Users can delete own consents" ON public.consents;

CREATE POLICY "Users can view own consents"   ON public.consents FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Users can insert own consents" ON public.consents FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Users can update own consents" ON public.consents FOR UPDATE USING (auth.uid() = patient_id);
CREATE POLICY "Users can delete own consents" ON public.consents FOR DELETE USING (auth.uid() = patient_id);

-- ── 006: Auto-create profile on sign up ──────────────────────
-- This trigger fires whenever a new row is inserted into auth.users
-- (i.e., every time someone registers, including OAuth).
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
      NEW.raw_user_meta_data->>'name',       -- From sign-up form (our app)
      NEW.raw_user_meta_data->>'full_name',  -- Some OAuth providers use full_name
      split_part(NEW.email, '@', 1)          -- Fallback: username from email
    ),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;              -- Safe for repeated calls
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 007: Grants ───────────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles        TO authenticated;
GRANT ALL ON public.appointments    TO authenticated;
GRANT ALL ON public.medications     TO authenticated;
GRANT ALL ON public.health_reports  TO authenticated;
GRANT ALL ON public.timeline_events TO authenticated;
GRANT ALL ON public.care_team       TO authenticated;
GRANT ALL ON public.family_members  TO authenticated;
GRANT ALL ON public.consents        TO authenticated;
GRANT SELECT ON public.profiles     TO anon;

-- ── 008: Backfill profiles for any existing auth users ────────
-- This inserts profiles for any users created before the trigger existed.
INSERT INTO public.profiles (id, name, email)
SELECT
  id,
  COALESCE(raw_user_meta_data->>'name', raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
  email
FROM auth.users
ON CONFLICT (id) DO NOTHING;
