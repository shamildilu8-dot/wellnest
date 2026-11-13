-- Wellnest Supabase Database & Private Storage Schema
-- Run this in your Supabase SQL Editor before enabling user accounts.

create extension if not exists "pgcrypto";

-- 1. User Reports Metadata
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text not null check (category in ('lab', 'interpreted_genetic')),
  report_date date not null,
  lab_or_provider_name text not null,
  file_name text not null,
  file_type text not null,
  file_size_bytes integer not null check (file_size_bytes > 0 and file_size_bytes <= 10485760),
  storage_path text,
  uploaded_at timestamptz not null default now()
);

alter table public.reports enable row level security;

create policy "Users can view their own reports"
  on public.reports for select
  using (auth.uid() = user_id);

create policy "Users can insert their own reports"
  on public.reports for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own reports"
  on public.reports for delete
  using (auth.uid() = user_id);

-- 2. Extracted & Confirmed Findings
create table if not exists public.findings (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('lab', 'interpreted_genetic')),
  test_name text not null,
  result text not null,
  unit text not null default '',
  report_date date not null,
  reference_range text not null default '',
  range_status text not null check (range_status in ('within_range', 'outside_range', 'needs_review', 'interpreted_finding')),
  uncertain boolean not null default true,
  uncertainty_reason text,
  confirmed_by_user boolean not null default false,
  gene_or_marker text,
  clinical_interpretation text,
  created_at timestamptz not null default now()
);

alter table public.findings enable row level security;

create policy "Users can read own findings"
  on public.findings for select
  using (auth.uid() = user_id);

create policy "Users can insert own findings"
  on public.findings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own findings"
  on public.findings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own findings"
  on public.findings for delete
  using (auth.uid() = user_id);

-- 3. Optional Self-Reported Wellbeing Check-Ins (never photo/face-based)
create table if not exists public.wellbeing_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  checkin_date date not null,
  energy_level smallint not null check (energy_level between 1 and 5),
  sleep_quality smallint not null check (sleep_quality between 1 and 5),
  stress_self_rating smallint not null check (stress_self_rating between 1 and 5),
  sleep_hours numeric(4,1) check (sleep_hours >= 0 and sleep_hours <= 24),
  movement_minutes integer check (movement_minutes >= 0 and movement_minutes <= 600),
  resting_heart_rate_bpm integer check (resting_heart_rate_bpm between 30 and 220),
  systolic_mmhg integer check (systolic_mmhg between 60 and 250),
  diastolic_mmhg integer check (diastolic_mmhg between 40 and 150),
  mood_note text not null default '',
  created_at timestamptz not null default now(),
  constraint wellbeing_bp_pair_check check (
    (systolic_mmhg is null and diastolic_mmhg is null)
    or (
      systolic_mmhg is not null
      and diastolic_mmhg is not null
      and systolic_mmhg > diastolic_mmhg
    )
  )
);

alter table public.wellbeing_checkins enable row level security;

create policy "Users manage own wellbeing check-ins"
  on public.wellbeing_checkins for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 4. User Consent Preferences
create table if not exists public.user_consents (
  user_id uuid primary key references auth.users(id) on delete cascade,
  store_confirmed_reports boolean not null default true,
  allow_wellbeing_checkins boolean not null default true,
  require_per_request_ai_consent boolean not null default true,
  allow_ai_report_extraction boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.user_consents enable row level security;

create policy "Users manage own consent settings"
  on public.user_consents for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 5. Private Storage Bucket & Per-User Access Policies
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'wellnest-reports',
  'wellnest-reports',
  false,
  10485760,
  array['application/pdf', 'image/png', 'image/jpeg', 'text/plain', 'text/csv', 'application/json']
)
on conflict (id) do nothing;

create policy "Users can upload to own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'wellnest-reports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can read own private files"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'wellnest-reports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own private files"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'wellnest-reports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
