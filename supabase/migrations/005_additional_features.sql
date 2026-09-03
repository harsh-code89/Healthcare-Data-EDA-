-- 005_additional_features.sql
-- Adds tables for Care Team, Family Members, and Consent/Privacy.

-- 1. Care Team Table (Doctors/Providers associated with the patient)
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

-- 2. Family Members Table
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

-- 3. Consents Table (Privacy & Data Sharing)
CREATE TABLE IF NOT EXISTS public.consents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_name   TEXT NOT NULL,
  purpose         TEXT NOT NULL,
  granted_date    DATE NOT NULL,
  expiry_date     DATE,
  status          TEXT NOT NULL DEFAULT 'active', -- active, revoked, expired
  data_types      TEXT[] NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.care_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;

-- Care Team Policies
CREATE POLICY "Users can view own care team" ON public.care_team FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Users can insert own care team" ON public.care_team FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Users can update own care team" ON public.care_team FOR UPDATE USING (auth.uid() = patient_id);
CREATE POLICY "Users can delete own care team" ON public.care_team FOR DELETE USING (auth.uid() = patient_id);

-- Family Members Policies
CREATE POLICY "Users can view own family" ON public.family_members FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Users can insert own family" ON public.family_members FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Users can update own family" ON public.family_members FOR UPDATE USING (auth.uid() = patient_id);
CREATE POLICY "Users can delete own family" ON public.family_members FOR DELETE USING (auth.uid() = patient_id);

-- Consents Policies
CREATE POLICY "Users can view own consents" ON public.consents FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Users can insert own consents" ON public.consents FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Users can update own consents" ON public.consents FOR UPDATE USING (auth.uid() = patient_id);
CREATE POLICY "Users can delete own consents" ON public.consents FOR DELETE USING (auth.uid() = patient_id);
