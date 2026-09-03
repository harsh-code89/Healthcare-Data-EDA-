-- ============================================================
--  ViteLens/CareOS — Patient Records Schema
-- ============================================================

-- ── 1. Appointments Table ─────────────────────────────────────
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

-- ── 2. Medications Table ──────────────────────────────────────
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

-- ── 3. Health Reports Table ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.health_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  category        TEXT NOT NULL,
  report_date     DATE NOT NULL,
  file_type       TEXT NOT NULL DEFAULT 'pdf',
  file_size       INTEGER,
  file_url        TEXT,
  summary         TEXT,
  is_a_i_explained BOOLEAN DEFAULT false,
  uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 4. Timeline Events Table ──────────────────────────────────
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

-- ── 5. Row-Level Security ─────────────────────────────────────
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;

-- Appointments
CREATE POLICY "Users can view own appointments"
  ON public.appointments FOR SELECT
  USING (auth.uid() = patient_id);

CREATE POLICY "Users can insert own appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Users can update own appointments"
  ON public.appointments FOR UPDATE
  USING (auth.uid() = patient_id);

CREATE POLICY "Users can delete own appointments"
  ON public.appointments FOR DELETE
  USING (auth.uid() = patient_id);

-- Medications
CREATE POLICY "Users can view own medications"
  ON public.medications FOR SELECT
  USING (auth.uid() = patient_id);

CREATE POLICY "Users can insert own medications"
  ON public.medications FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Users can update own medications"
  ON public.medications FOR UPDATE
  USING (auth.uid() = patient_id);

CREATE POLICY "Users can delete own medications"
  ON public.medications FOR DELETE
  USING (auth.uid() = patient_id);

-- Health Reports
CREATE POLICY "Users can view own health reports"
  ON public.health_reports FOR SELECT
  USING (auth.uid() = patient_id);

CREATE POLICY "Users can insert own health reports"
  ON public.health_reports FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Users can update own health reports"
  ON public.health_reports FOR UPDATE
  USING (auth.uid() = patient_id);

CREATE POLICY "Users can delete own health reports"
  ON public.health_reports FOR DELETE
  USING (auth.uid() = patient_id);

-- Timeline Events
CREATE POLICY "Users can view own timeline events"
  ON public.timeline_events FOR SELECT
  USING (auth.uid() = patient_id);

CREATE POLICY "Users can insert own timeline events"
  ON public.timeline_events FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Users can update own timeline events"
  ON public.timeline_events FOR UPDATE
  USING (auth.uid() = patient_id);

CREATE POLICY "Users can delete own timeline events"
  ON public.timeline_events FOR DELETE
  USING (auth.uid() = patient_id);
