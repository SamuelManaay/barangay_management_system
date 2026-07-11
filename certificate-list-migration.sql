-- Add price to certificate_types
alter table certificate_types add column if not exists price numeric(10,2) default 0;

-- Update existing types with default prices
update certificate_types set price = 50 where name = 'Barangay Clearance';
update certificate_types set price = 30 where name = 'Certificate of Residency';
update certificate_types set price = 0  where name = 'Certificate of Indigency';
update certificate_types set price = 50 where name = 'Certificate of Good Moral';
update certificate_types set price = 30 where name = 'Authority to Travel';
update certificate_types set price = 30 where name = 'General Certificate';
update certificate_types set price = 30 where name = 'Appointment of Secretary';

-- Print logs for liquidation
create table if not exists certificate_print_logs (
  id uuid primary key default uuid_generate_v4(),
  certificate_issuance_id uuid not null references certificate_issuances(id) on delete cascade,
  certificate_type_id uuid not null references certificate_types(id),
  certificate_type_name text not null,
  price numeric(10,2) not null default 0,
  printed_at timestamptz default now(),
  printed_by uuid references auth.users(id)
);

alter table certificate_print_logs enable row level security;
create policy "Allow all" on certificate_print_logs for all using (true) with check (true);
