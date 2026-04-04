-- ============================================================
-- Barangay Staff Table Migration
-- Run this in Supabase SQL editor
-- ============================================================

create table if not exists barangay_staff (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  position text,
  contact text,
  email text,
  status text default 'Active',
  created_at timestamptz default now()
);

alter table barangay_staff enable row level security;
drop policy if exists "Allow all" on barangay_staff;
create policy "Allow all" on barangay_staff for all using (true) with check (true);
