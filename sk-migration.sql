-- ============================================================
-- SK (Sangguniang Kabataan) Module Migration
-- ============================================================

-- SK Officials
create table if not exists sk_officials (
  id uuid primary key default uuid_generate_v4(),
  resident_id uuid references residents(id) on delete set null,
  position text not null, -- 'Chairperson' | 'Kagawad' | 'Secretary' | 'Treasurer'
  term_start date,
  term_end date,
  contact text,
  status text default 'Active',
  created_at timestamptz default now()
);

-- SK Youth Registry (links to residents aged 15-30)
create table if not exists sk_youth (
  id uuid primary key default uuid_generate_v4(),
  resident_id uuid not null references residents(id) on delete cascade,
  is_sk_member boolean default false,
  is_volunteer boolean default false,
  scholarship_status text default 'None', -- 'None' | 'Active' | 'Completed'
  notes text,
  created_at timestamptz default now()
);

-- SK Programs / Events
create table if not exists sk_events (
  id uuid primary key default uuid_generate_v4(),
  event_name text not null,
  event_type text default 'Program', -- 'Program' | 'Sports' | 'Community' | 'Other'
  event_date date,
  location text,
  budget numeric(12,2) default 0,
  status text default 'Upcoming', -- 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled'
  description text,
  created_at timestamptz default now()
);

-- SK Event Participants
create table if not exists sk_event_participants (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid not null references sk_events(id) on delete cascade,
  resident_id uuid references residents(id) on delete set null,
  name text,
  attended boolean default false,
  created_at timestamptz default now()
);

-- SK Projects
create table if not exists sk_projects (
  id uuid primary key default uuid_generate_v4(),
  project_name text not null,
  description text,
  budget_allocation numeric(12,2) default 0,
  amount_spent numeric(12,2) default 0,
  status text default 'Planned', -- 'Planned' | 'Ongoing' | 'Completed'
  start_date date,
  end_date date,
  created_at timestamptz default now()
);

-- SK Financial Records
create table if not exists sk_finances (
  id uuid primary key default uuid_generate_v4(),
  transaction_type text not null, -- 'Income' | 'Expense'
  fund_source text,
  category text,
  amount numeric(12,2) not null,
  transaction_date date not null default current_date,
  remarks text,
  reference_id uuid, -- optional link to project or event
  created_at timestamptz default now()
);

-- SK Scholarships
create table if not exists sk_scholarships (
  id uuid primary key default uuid_generate_v4(),
  resident_id uuid not null references residents(id) on delete cascade,
  scholarship_name text not null,
  school text,
  year_level text,
  amount numeric(12,2) default 0,
  status text default 'Active', -- 'Active' | 'Completed' | 'Revoked'
  start_date date,
  end_date date,
  created_at timestamptz default now()
);

-- RLS
alter table sk_officials enable row level security;
alter table sk_youth enable row level security;
alter table sk_events enable row level security;
alter table sk_event_participants enable row level security;
alter table sk_projects enable row level security;
alter table sk_finances enable row level security;
alter table sk_scholarships enable row level security;

create policy "Allow all" on sk_officials for all using (true) with check (true);
create policy "Allow all" on sk_youth for all using (true) with check (true);
create policy "Allow all" on sk_events for all using (true) with check (true);
create policy "Allow all" on sk_event_participants for all using (true) with check (true);
create policy "Allow all" on sk_projects for all using (true) with check (true);
create policy "Allow all" on sk_finances for all using (true) with check (true);
create policy "Allow all" on sk_scholarships for all using (true) with check (true);
