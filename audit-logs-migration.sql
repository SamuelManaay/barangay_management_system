-- ============================================================
-- Audit Logs Migration
-- Run this in Supabase SQL editor
-- ============================================================

create table if not exists audit_logs (
  id uuid primary key default uuid_generate_v4(),
  performed_by text not null,        -- full_name of the user who did the action
  action text not null,              -- 'Created' | 'Updated' | 'Deleted' | 'Activated' | 'Deactivated'
  module text not null,              -- e.g. 'Staff', 'User Management'
  target text not null,              -- name/label of the record affected
  changes jsonb,                     -- { field: { from: x, to: y } }
  created_at timestamptz default now()
);

alter table audit_logs enable row level security;
drop policy if exists "Allow all" on audit_logs;
create policy "Allow all" on audit_logs for all using (true) with check (true);
