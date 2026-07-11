-- ============================================================
-- Electricity Issues Module Migration
-- Run AFTER calamity-migration.sql
-- ============================================================

-- Electricity Issues/Reports
create table if not exists cal_electricity_issues (
  id uuid primary key default uuid_generate_v4(),
  issue_type text not null default 'Power Outage', -- Power Outage | Damaged Lines | Transformer Issue | Street Light | Other
  location text not null,
  coordinates text, -- For future mobile GPS integration
  description text,
  reported_by text,
  resident_id uuid references residents(id) on delete set null,
  contact_number text,
  priority text default 'Medium', -- Low | Medium | High | Critical
  status text default 'Reported', -- Reported | Investigating | In Progress | Resolved
  affected_households int default 1,
  estimated_duration text, -- e.g., "2-4 hours", "Unknown"
  utility_company_notified boolean default false,
  utility_reference_number text,
  assigned_staff text,
  resolution_notes text,
  reported_at timestamptz default now(),
  resolved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Electricity Service Areas (for better tracking)
create table if not exists cal_electricity_areas (
  id uuid primary key default uuid_generate_v4(),
  area_name text not null,
  description text,
  utility_company text default 'Local Electric Cooperative',
  emergency_contact text,
  typical_households int default 0,
  created_at timestamptz default now()
);

-- RLS
alter table cal_electricity_issues enable row level security;
alter table cal_electricity_areas enable row level security;

create policy "Allow all" on cal_electricity_issues for all using (true) with check (true);
create policy "Allow all" on cal_electricity_areas for all using (true) with check (true);

-- Insert some default service areas (can be customized)
insert into cal_electricity_areas (area_name, description, typical_households) values
('Zone 1', 'Main residential area', 150),
('Zone 2', 'Commercial district', 80),
('Zone 3', 'Rural area', 120),
('Zone 4', 'Industrial area', 45);