-- ============================================================
-- Barangay Management System - Supabase Schema
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- RESIDENTS
-- ============================================================
create table residents (
  id uuid primary key default uuid_generate_v4(),
  first_name text not null,
  middle_name text,
  last_name text not null,
  alias text,
  gender text,
  birth_date date,
  birth_place text,
  civil_status text,
  voter_status boolean default false,
  purok text,
  religion text,
  primary_contact text,
  secondary_contact text,
  primary_email text,
  secondary_email text,
  resident_type text,
  photo_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- BARANGAY OFFICIALS
-- ============================================================
create table barangay_officials (
  id uuid primary key default uuid_generate_v4(),
  resident_id uuid references residents(id) on delete set null,
  position text not null,
  committee text,
  term_of_service text,
  status text default 'Active',
  rank int,
  created_at timestamptz default now()
);

-- ============================================================
-- BLOTTER RECORDS
-- ============================================================
create table blotter_records (
  id uuid primary key default uuid_generate_v4(),
  incident_type text,
  date_recorded date not null default current_date,
  time_recorded time not null default current_time,
  incident_date date,
  incident_time time,
  incident_location text,
  incident_narrative text,
  blotter_status text default 'Pending',
  recorded_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- BLOTTER PEOPLE INVOLVED
-- ============================================================
create table blotter_people_involved (
  id uuid primary key default uuid_generate_v4(),
  blotter_id uuid not null references blotter_records(id) on delete cascade,
  resident_id uuid references residents(id) on delete set null,
  involvement_type text not null, -- 'Complainant' | 'Victim' | 'Respondent'
  last_name text,
  first_name text,
  middle_name text,
  alias text,
  gender text,
  civil_status text,
  birth_date date,
  birth_place text,
  address text,
  primary_contact text,
  primary_email text,
  created_at timestamptz default now()
);

-- ============================================================
-- SUMMON SCHEDULES
-- ============================================================
create table summon_schedules (
  id uuid primary key default uuid_generate_v4(),
  blotter_id uuid not null references blotter_records(id) on delete cascade,
  summon_date date not null,
  summon_time time not null,
  status text default 'Scheduled',
  created_at timestamptz default now()
);

-- ============================================================
-- SUMMON ATTENDANCE
-- ============================================================
create table summon_attendance (
  id uuid primary key default uuid_generate_v4(),
  summon_id uuid not null references summon_schedules(id) on delete cascade,
  full_name text,
  involvement_type text,
  created_at timestamptz default now()
);

-- ============================================================
-- SETTLEMENT REPORTS
-- ============================================================
create table settlement_reports (
  id uuid primary key default uuid_generate_v4(),
  summon_id uuid not null references summon_schedules(id) on delete cascade,
  settlement_report text not null,
  settlement_date date,
  created_at timestamptz default now()
);

-- ============================================================
-- CERTIFICATES
-- ============================================================
create table certificate_types (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  has_restriction boolean default false
);

create table certificate_issuances (
  id uuid primary key default uuid_generate_v4(),
  resident_id uuid not null references residents(id) on delete cascade,
  certificate_type_id uuid not null references certificate_types(id),
  purpose text,
  cedula_number text,
  or_number text,
  signed_by_name text,
  signed_by_position text,
  issued_by uuid references auth.users(id),
  issued_at timestamptz default now()
);

-- ============================================================
-- BUSINESS PERMITS
-- ============================================================
create table business_permits (
  id uuid primary key default uuid_generate_v4(),
  business_name text not null,
  owner_name text not null,
  owner_resident_id uuid references residents(id) on delete set null,
  business_type text,
  address text,
  permit_date date,
  expiry_date date,
  status text default 'Active',
  created_at timestamptz default now()
);

-- ============================================================
-- ACTIVITY LOG
-- ============================================================
create table activity_log (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id),
  activity_type text not null,
  description text,
  created_at timestamptz default now()
);

-- ============================================================
-- SEED: Certificate Types
-- ============================================================
insert into certificate_types (name, has_restriction) values
  ('Barangay Clearance', true),
  ('Certificate of Residency', false),
  ('Certificate of Indigency', false),
  ('Certificate of Good Moral', true),
  ('Authority to Travel', false),
  ('General Certificate', false),
  ('Appointment of Secretary', false);

-- ============================================================
-- RLS Policies (enable after setting up auth)
-- ============================================================
alter table residents enable row level security;
alter table blotter_records enable row level security;
alter table certificate_issuances enable row level security;
alter table business_permits enable row level security;
alter table barangay_officials enable row level security;

-- Allow anon access (auth handled at app level)
create policy "Allow all" on residents for all using (true) with check (true);
create policy "Allow all" on blotter_records for all using (true) with check (true);
create policy "Allow all" on certificate_issuances for all using (true) with check (true);
create policy "Allow all" on business_permits for all using (true) with check (true);
create policy "Allow all" on barangay_officials for all using (true) with check (true);
