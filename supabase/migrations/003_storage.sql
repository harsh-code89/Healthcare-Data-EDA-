-- 003_storage.sql
-- Create a secure storage bucket for medical reports

insert into storage.buckets (id, name, public)
values ('medical_reports', 'medical_reports', false)
on conflict (id) do nothing;

-- Enable Row Level Security
alter table storage.objects enable row level security;

-- Policy: Patients can insert their own reports
-- The folder structure should be {patient_id}/{filename}
create policy "Patients can upload their own reports"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'medical_reports' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Patients can view their own reports
create policy "Patients can view their own reports"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'medical_reports' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Patients can delete their own reports
create policy "Patients can delete their own reports"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'medical_reports' and
    (storage.foldername(name))[1] = auth.uid()::text
  );
