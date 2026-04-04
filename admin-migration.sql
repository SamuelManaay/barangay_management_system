-- ============================================================
-- Admin Tables Migration
-- Run this AFTER supabase-schema.sql
-- ============================================================

-- ============================================================
-- BARANGAY SETTINGS (single row config)
-- ============================================================
create table if not exists barangay_settings (
  id uuid primary key default uuid_generate_v4(),
  barangay_name text not null default 'Barangay [Name]',
  municipality text not null default 'Bacolod City',
  province text not null default 'Negros Occidental',
  region text not null default 'Region VI',
  captain_name text,
  captain_position text default 'Barangay Captain',
  logo_url text,
  seal_url text,
  contact_number text,
  email text,
  address text,
  updated_at timestamptz default now()
);

-- Insert default row
insert into barangay_settings (barangay_name) values ('Barangay [Name]')
on conflict do nothing;

-- ============================================================
-- APP USERS (local login accounts with roles)
-- ============================================================
create table if not exists app_users (
  id uuid primary key default uuid_generate_v4(),
  username text not null unique,
  password_hash text not null,
  full_name text not null,
  role text not null default 'Staff',
  -- roles: 'Admin' | 'Staff' | 'Readonly'
  is_active boolean default true,
  created_at timestamptz default now(),
  last_login timestamptz
);

-- RLS
alter table barangay_settings enable row level security;
alter table app_users enable row level security;
create policy "Allow all" on barangay_settings for all using (true) with check (true);
create policy "Allow all" on app_users for all using (true) with check (true);

-- ============================================================
-- DEFAULT ADMIN USER
-- password: admin123 (bcrypt hash)
-- ============================================================
insert into app_users (username, password_hash, full_name, role) values
('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Administrator', 'Admin')
on conflict (username) do nothing;
