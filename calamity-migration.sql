-- ============================================================
-- Calamity and Emergency Response Module Migration
-- Run AFTER supabase-schema.sql
-- ============================================================

-- Incidents
create table if not exists cal_incidents (
  id uuid primary key default uuid_generate_v4(),
  incident_type text not null, -- Flood | Fire | Earthquake | Landslide | Typhoon | Medical Emergency | Other
  incident_date date not null default current_date,
  incident_time time not null default current_time,
  location text,
  description text,
  reported_by text,
  resident_id uuid references residents(id) on delete set null,
  status text default 'Reported', -- Reported | Responding | Resolved
  severity text default 'Medium', -- Low | Medium | High | Critical
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Emergency Requests
create table if not exists cal_requests (
  id uuid primary key default uuid_generate_v4(),
  incident_id uuid references cal_incidents(id) on delete set null,
  resident_id uuid references residents(id) on delete set null,
  requester_name text,
  request_type text not null, -- Rescue | Medical | Evacuation | Food | Water
  people_affected int default 1,
  priority text default 'Medium', -- Low | Medium | High
  status text default 'Pending', -- Pending | Responding | Completed
  assigned_responder text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Evacuation Centers
create table if not exists cal_evacuation_centers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  location text,
  capacity int default 0,
  current_occupants int default 0,
  assigned_staff text,
  contact_person text,
  contact_number text,
  available_supplies text,
  status text default 'Standby', -- Standby | Active | Full | Closed
  created_at timestamptz default now()
);

-- Evacuees (linked to residents)
create table if not exists cal_evacuees (
  id uuid primary key default uuid_generate_v4(),
  center_id uuid not null references cal_evacuation_centers(id) on delete cascade,
  resident_id uuid references residents(id) on delete set null,
  name text,
  people_count int default 1,
  check_in timestamptz default now(),
  check_out timestamptz,
  notes text,
  created_at timestamptz default now()
);

-- Relief Distribution
create table if not exists cal_relief (
  id uuid primary key default uuid_generate_v4(),
  incident_id uuid references cal_incidents(id) on delete set null,
  item_type text not null, -- Food Pack | Water | Medicine | Clothes | Other
  quantity int not null default 1,
  distribution_date date not null default current_date,
  resident_id uuid references residents(id) on delete set null,
  recipient_name text,
  distribution_location text,
  distributed_by text,
  notes text,
  created_at timestamptz default now()
);

-- Damage Assessment
create table if not exists cal_damage (
  id uuid primary key default uuid_generate_v4(),
  incident_id uuid references cal_incidents(id) on delete set null,
  resident_id uuid references residents(id) on delete set null,
  household_name text,
  damage_level text default 'Minor', -- Minor | Major | Total
  estimated_cost numeric(12,2) default 0,
  description text,
  assessed_by text,
  assessment_date date default current_date,
  created_at timestamptz default now()
);

-- Tanods
create table if not exists cal_tanods (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  contact text,
  assigned_area text,
  shift_schedule text,
  status text default 'Available', -- Available | On Duty | Responding | Off Duty
  created_at timestamptz default now()
);

-- Tanod Dispatch (assigned to incidents)
create table if not exists cal_dispatch (
  id uuid primary key default uuid_generate_v4(),
  incident_id uuid not null references cal_incidents(id) on delete cascade,
  tanod_id uuid not null references cal_tanods(id) on delete cascade,
  dispatched_at timestamptz default now(),
  responded_at timestamptz,
  notes text,
  created_at timestamptz default now()
);

-- Patrol Logs
create table if not exists cal_patrol_logs (
  id uuid primary key default uuid_generate_v4(),
  tanod_id uuid not null references cal_tanods(id) on delete cascade,
  patrol_date date not null default current_date,
  patrol_time time not null default current_time,
  area_covered text,
  incident_observed text,
  remarks text,
  created_at timestamptz default now()
);

-- RLS
alter table cal_incidents enable row level security;
alter table cal_requests enable row level security;
alter table cal_evacuation_centers enable row level security;
alter table cal_evacuees enable row level security;
alter table cal_relief enable row level security;
alter table cal_damage enable row level security;
alter table cal_tanods enable row level security;
alter table cal_dispatch enable row level security;
alter table cal_patrol_logs enable row level security;

create policy "Allow all" on cal_incidents for all using (true) with check (true);
create policy "Allow all" on cal_requests for all using (true) with check (true);
create policy "Allow all" on cal_evacuation_centers for all using (true) with check (true);
create policy "Allow all" on cal_evacuees for all using (true) with check (true);
create policy "Allow all" on cal_relief for all using (true) with check (true);
create policy "Allow all" on cal_damage for all using (true) with check (true);
create policy "Allow all" on cal_tanods for all using (true) with check (true);
create policy "Allow all" on cal_dispatch for all using (true) with check (true);
create policy "Allow all" on cal_patrol_logs for all using (true) with check (true);
