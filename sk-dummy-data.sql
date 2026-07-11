-- ============================================================
-- SK MODULE DUMMY DATA
-- Run this AFTER dummy-data.sql
-- ============================================================

-- ============================================================
-- YOUTH RESIDENTS (aged 15–30 as of 2025)
-- birth years: 1995–2010
-- ============================================================
insert into residents (first_name, middle_name, last_name, alias, gender, birth_date, birth_place, civil_status, voter_status, purok, religion, primary_contact, resident_type) values
('Kristine',   'Dela Cruz',  'Aquino',    'Kris',    'Female', '2000-03-14', 'Bacolod City', 'Single', true,  'Purok 1', 'Catholic',   '09171230001', 'Permanent'),
('Jayson',     'Reyes',      'Buenaventura','Jay',   'Male',   '1998-07-08', 'Bacolod City', 'Single', true,  'Purok 1', 'Catholic',   '09171230002', 'Permanent'),
('Angelica',   'Santos',     'Castillo',  'Angel',   'Female', '2002-11-22', 'Talisay City', 'Single', false, 'Purok 2', 'Born Again', '09171230003', 'Permanent'),
('Mark',       'Lim',        'Domingo',   'Marky',   'Male',   '2001-05-30', 'Bacolod City', 'Single', true,  'Purok 2', 'Catholic',   '09171230004', 'Permanent'),
('Sheena',     'Cruz',       'Espiritu',  'Sheen',   'Female', '1999-09-17', 'Bacolod City', 'Single', true,  'Purok 3', 'Catholic',   '09171230005', 'Permanent'),
('Renz',       'Mendoza',    'Flores',    'Renzo',   'Male',   '2003-01-25', 'Silay City',   'Single', false, 'Purok 3', 'Catholic',   '09171230006', 'Permanent'),
('Patricia',   'Torres',     'Gomez',     'Pat',     'Female', '1997-06-12', 'Bacolod City', 'Single', true,  'Purok 4', 'Iglesia',    '09171230007', 'Permanent'),
('Aldrin',     'Aquino',     'Hernandez', 'Al',      'Male',   '2004-08-03', 'Bacolod City', 'Single', false, 'Purok 4', 'Catholic',   '09171230008', 'Permanent'),
('Lovely',     'Ramos',      'Ignacio',   'Love',    'Female', '2000-12-19', 'Murcia',       'Single', true,  'Purok 5', 'Catholic',   '09171230009', 'Permanent'),
('Jhon',       'Flores',     'Jacinto',   'JJ',      'Male',   '1996-04-07', 'Bacolod City', 'Single', true,  'Purok 5', 'Born Again', '09171230010', 'Permanent'),
('Maricel',    'Rivera',     'Labrador',  'Cel',     'Female', '2005-02-14', 'Bacolod City', 'Single', false, 'Purok 6', 'Catholic',   '09171230011', 'Permanent'),
('Noel',       'Castro',     'Macapagal', 'Noel',    'Male',   '1999-10-28', 'Bacolod City', 'Single', true,  'Purok 6', 'Catholic',   '09171230012', 'Permanent'),
('Trisha',     'Ortiz',      'Navarro',   'Trish',   'Female', '2002-07-05', 'Talisay City', 'Single', false, 'Purok 1', 'Catholic',   '09171230013', 'Permanent'),
('Gio',        'Navarro',    'Ocampo',    'Gio',     'Male',   '1998-03-21', 'Bacolod City', 'Single', true,  'Purok 2', 'Catholic',   '09171230014', 'Permanent'),
('Hazel',      'Ruiz',       'Padilla',   'Haze',    'Female', '2001-11-09', 'Bacolod City', 'Single', true,  'Purok 3', 'Iglesia',    '09171230015', 'Permanent'),
('Vince',      'Romero',     'Quizon',    'Vinz',    'Male',   '2003-06-16', 'Bacolod City', 'Single', false, 'Purok 4', 'Catholic',   '09171230016', 'Permanent'),
('Jessa',      'Vargas',     'Reyes',     'Jess',    'Female', '1997-09-30', 'Silay City',   'Single', true,  'Purok 5', 'Catholic',   '09171230017', 'Permanent'),
('Arvin',      'Medina',     'Santos',    'Arv',     'Male',   '2000-01-18', 'Bacolod City', 'Single', true,  'Purok 6', 'Born Again', '09171230018', 'Permanent'),
('Camille',    'Guerrero',   'Tan',       'Cam',     'Female', '2004-04-24', 'Bacolod City', 'Single', false, 'Purok 1', 'Catholic',   '09171230019', 'Permanent'),
('Louie',      'Aguilar',    'Umali',     'Lou',     'Male',   '1995-08-11', 'Bacolod City', 'Single', true,  'Purok 2', 'Catholic',   '09171230020', 'Permanent');

-- ============================================================
-- SK OFFICIALS (using youth residents)
-- ============================================================
insert into sk_officials (resident_id, position, term_start, term_end, contact, status)
select id, 'Chairperson', '2023-01-01', '2025-12-31', '09171230001', 'Active'
from residents where last_name = 'Aquino' and first_name = 'Kristine' limit 1;

insert into sk_officials (resident_id, position, term_start, term_end, contact, status)
select id, 'Secretary', '2023-01-01', '2025-12-31', '09171230005', 'Active'
from residents where last_name = 'Espiritu' and first_name = 'Sheena' limit 1;

insert into sk_officials (resident_id, position, term_start, term_end, contact, status)
select id, 'Treasurer', '2023-01-01', '2025-12-31', '09171230007', 'Active'
from residents where last_name = 'Gomez' and first_name = 'Patricia' limit 1;

insert into sk_officials (resident_id, position, term_start, term_end, contact, status)
select id, 'Kagawad', '2023-01-01', '2025-12-31', '09171230002', 'Active'
from residents where last_name = 'Buenaventura' and first_name = 'Jayson' limit 1;

insert into sk_officials (resident_id, position, term_start, term_end, contact, status)
select id, 'Kagawad', '2023-01-01', '2025-12-31', '09171230004', 'Active'
from residents where last_name = 'Domingo' and first_name = 'Mark' limit 1;

insert into sk_officials (resident_id, position, term_start, term_end, contact, status)
select id, 'Kagawad', '2023-01-01', '2025-12-31', '09171230010', 'Active'
from residents where last_name = 'Jacinto' and first_name = 'Jhon' limit 1;

insert into sk_officials (resident_id, position, term_start, term_end, contact, status)
select id, 'Kagawad', '2023-01-01', '2025-12-31', '09171230012', 'Active'
from residents where last_name = 'Macapagal' and first_name = 'Noel' limit 1;

-- ============================================================
-- SK YOUTH REGISTRY
-- ============================================================
insert into sk_youth (resident_id, is_sk_member, is_volunteer, scholarship_status, notes)
select id, true,  false, 'None',      'SK Chairperson'
from residents where last_name = 'Aquino'       and first_name = 'Kristine' limit 1;

insert into sk_youth (resident_id, is_sk_member, is_volunteer, scholarship_status, notes)
select id, true,  true,  'None',      'SK Kagawad, active volunteer'
from residents where last_name = 'Buenaventura' and first_name = 'Jayson'   limit 1;

insert into sk_youth (resident_id, is_sk_member, is_volunteer, scholarship_status, notes)
select id, false, true,  'Active',    'Scholar — CHED SUC Grant'
from residents where last_name = 'Castillo'     and first_name = 'Angelica' limit 1;

insert into sk_youth (resident_id, is_sk_member, is_volunteer, scholarship_status, notes)
select id, true,  false, 'None',      'SK Kagawad'
from residents where last_name = 'Domingo'      and first_name = 'Mark'     limit 1;

insert into sk_youth (resident_id, is_sk_member, is_volunteer, scholarship_status, notes)
select id, true,  true,  'None',      'SK Secretary'
from residents where last_name = 'Espiritu'     and first_name = 'Sheena'   limit 1;

insert into sk_youth (resident_id, is_sk_member, is_volunteer, scholarship_status, notes)
select id, false, true,  'None',      'Sports volunteer — basketball'
from residents where last_name = 'Flores'       and first_name = 'Renz'     limit 1;

insert into sk_youth (resident_id, is_sk_member, is_volunteer, scholarship_status, notes)
select id, true,  false, 'Completed', 'SK Treasurer, completed DOST scholarship'
from residents where last_name = 'Gomez'        and first_name = 'Patricia' limit 1;

insert into sk_youth (resident_id, is_sk_member, is_volunteer, scholarship_status, notes)
select id, false, true,  'None',      'Volunteer — community clean-up'
from residents where last_name = 'Hernandez'    and first_name = 'Aldrin'   limit 1;

insert into sk_youth (resident_id, is_sk_member, is_volunteer, scholarship_status, notes)
select id, false, false, 'Active',    'Scholar — LGU Scholarship Program'
from residents where last_name = 'Ignacio'      and first_name = 'Lovely'   limit 1;

insert into sk_youth (resident_id, is_sk_member, is_volunteer, scholarship_status, notes)
select id, true,  true,  'None',      'SK Kagawad, sports coordinator'
from residents where last_name = 'Jacinto'      and first_name = 'Jhon'     limit 1;

insert into sk_youth (resident_id, is_sk_member, is_volunteer, scholarship_status, notes)
select id, false, true,  'None',      'Volunteer — feeding program'
from residents where last_name = 'Labrador'     and first_name = 'Maricel'  limit 1;

insert into sk_youth (resident_id, is_sk_member, is_volunteer, scholarship_status, notes)
select id, true,  false, 'None',      'SK Kagawad'
from residents where last_name = 'Macapagal'    and first_name = 'Noel'     limit 1;

insert into sk_youth (resident_id, is_sk_member, is_volunteer, scholarship_status, notes)
select id, false, true,  'Active',    'Scholar — Private Scholarship, volunteer'
from residents where last_name = 'Navarro'      and first_name = 'Trisha'   limit 1;

insert into sk_youth (resident_id, is_sk_member, is_volunteer, scholarship_status, notes)
select id, false, false, 'None',      null
from residents where last_name = 'Ocampo'       and first_name = 'Gio'      limit 1;

insert into sk_youth (resident_id, is_sk_member, is_volunteer, scholarship_status, notes)
select id, false, true,  'None',      'Volunteer — livelihood program'
from residents where last_name = 'Padilla'      and first_name = 'Hazel'    limit 1;

insert into sk_youth (resident_id, is_sk_member, is_volunteer, scholarship_status, notes)
select id, false, false, 'None',      null
from residents where last_name = 'Quizon'       and first_name = 'Vince'    limit 1;

insert into sk_youth (resident_id, is_sk_member, is_volunteer, scholarship_status, notes)
select id, false, true,  'None',      'Volunteer — sports tournament'
from residents where last_name = 'Reyes'        and first_name = 'Jessa'    limit 1;

insert into sk_youth (resident_id, is_sk_member, is_volunteer, scholarship_status, notes)
select id, false, false, 'None',      null
from residents where last_name = 'Santos'       and first_name = 'Arvin'    limit 1;

insert into sk_youth (resident_id, is_sk_member, is_volunteer, scholarship_status, notes)
select id, false, true,  'None',      'Volunteer — tree planting'
from residents where last_name = 'Tan'          and first_name = 'Camille'  limit 1;

insert into sk_youth (resident_id, is_sk_member, is_volunteer, scholarship_status, notes)
select id, false, false, 'None',      null
from residents where last_name = 'Umali'        and first_name = 'Louie'    limit 1;

-- ============================================================
-- SK EVENTS
-- ============================================================
insert into sk_events (event_name, event_type, event_date, location, budget, status, description) values
('Barangay Youth Leadership Summit',   'Program',   '2025-02-15', 'Barangay Hall',              5000.00,  'Completed', 'Annual leadership training for SK members and youth volunteers.'),
('3x3 Basketball Tournament',          'Sports',    '2025-03-22', 'Barangay Basketball Court',  8000.00,  'Completed', 'Inter-purok basketball tournament open to youth aged 15–30.'),
('Brigada Eskwela Volunteer Drive',    'Community', '2025-06-05', 'Barangay Elementary School', 3000.00,  'Completed', 'Youth volunteers assist in school clean-up and repair before opening of classes.'),
('SK General Assembly',                'Program',   '2025-07-10', 'Barangay Hall',              2000.00,  'Upcoming',  'Quarterly assembly for all registered SK youth members.'),
('Youth Livelihood Training',          'Program',   '2025-07-25', 'Barangay Multi-Purpose Hall',12000.00, 'Upcoming',  'Livelihood skills training on basic food processing and handicrafts.'),
('Volleyball Tournament',              'Sports',    '2025-08-10', 'Barangay Basketball Court',  6000.00,  'Upcoming',  'Mixed volleyball tournament for youth aged 15–25.'),
('Community Clean-Up Drive',           'Community', '2025-04-22', 'Purok 1 to Purok 6',         1500.00,  'Completed', 'Earth Day clean-up drive participated by SK volunteers across all puroks.'),
('Feeding Program for Out-of-School Youth', 'Community', '2025-05-30', 'Purok 3 Covered Court', 7500.00, 'Completed', 'Monthly feeding program targeting out-of-school youth and their families.');

-- ============================================================
-- SK EVENT PARTICIPANTS
-- ============================================================
-- Leadership Summit participants
insert into sk_event_participants (event_id, name, attended)
select e.id, r.first_name || ' ' || r.last_name, true
from sk_events e, residents r
where e.event_name = 'Barangay Youth Leadership Summit'
  and r.last_name in ('Aquino','Buenaventura','Espiritu','Domingo','Gomez','Jacinto','Macapagal','Castillo','Flores','Hernandez')
  and r.first_name in ('Kristine','Jayson','Sheena','Mark','Patricia','Jhon','Noel','Angelica','Renz','Aldrin');

-- Basketball Tournament participants
insert into sk_event_participants (event_id, name, attended)
select e.id, r.first_name || ' ' || r.last_name, true
from sk_events e, residents r
where e.event_name = '3x3 Basketball Tournament'
  and r.last_name in ('Buenaventura','Domingo','Jacinto','Macapagal','Ocampo','Quizon','Santos','Umali')
  and r.first_name in ('Jayson','Mark','Jhon','Noel','Gio','Vince','Arvin','Louie');

-- Community Clean-Up participants
insert into sk_event_participants (event_id, name, attended)
select e.id, r.first_name || ' ' || r.last_name, true
from sk_events e, residents r
where e.event_name = 'Community Clean-Up Drive'
  and r.last_name in ('Flores','Hernandez','Ignacio','Labrador','Padilla','Reyes','Tan','Castillo')
  and r.first_name in ('Renz','Aldrin','Lovely','Maricel','Hazel','Jessa','Camille','Angelica');

-- ============================================================
-- SK PROJECTS
-- ============================================================
insert into sk_projects (project_name, description, budget_allocation, amount_spent, status, start_date, end_date) values
('Youth Skills Development Center',    'Establishment of a dedicated space for livelihood and skills training for out-of-school youth.',                          50000.00, 47500.00, 'Completed', '2024-06-01', '2024-11-30'),
('SK Basketball Court Renovation',     'Repair and repainting of the barangay basketball court used for SK sports events.',                                       35000.00, 35000.00, 'Completed', '2024-08-01', '2024-09-30'),
('Youth Health and Wellness Program',  'Series of free medical check-ups, dental missions, and mental health awareness sessions for youth aged 15–30.',           25000.00, 12000.00, 'Ongoing',   '2025-01-15', '2025-12-31'),
('Scholarship Assistance Program',     'Financial assistance for qualified youth scholars enrolled in college or vocational courses.',                             60000.00, 22500.00, 'Ongoing',   '2025-01-01', '2025-12-31'),
('Livelihood Starter Kits Distribution','Distribution of starter kits (tools and materials) to youth who completed the livelihood training program.',             20000.00,  0.00,    'Planned',   '2025-08-01', '2025-09-30'),
('Tree Planting and Greening Project', 'Planting of 500 trees in identified areas within the barangay as part of the environmental advocacy program.',             8000.00,  3200.00, 'Ongoing',   '2025-04-01', '2025-07-31');

-- ============================================================
-- SK FINANCIAL RECORDS
-- ============================================================
insert into sk_finances (transaction_type, fund_source, category, amount, transaction_date, remarks) values
-- Income
('Income',  'LGU Annual Allocation',     'BSYF',              80000.00, '2025-01-05',  'Annual SK fund release from LGU for FY 2025'),
('Income',  'DILG Special Grant',        'BSEF',              30000.00, '2025-01-20',  'Barangay SK Education Fund grant from DILG'),
('Income',  'Barangay Subsidy',          'LGU Allocation',    15000.00, '2025-02-10',  'Supplemental allocation from barangay for youth programs'),
('Income',  'Donation — Purok Leaders', 'Donation',           5000.00, '2025-03-01',  'Voluntary donation from purok leaders for sports tournament'),
('Income',  'Fundraising Activity',      'Donation',           3500.00, '2025-04-15',  'Proceeds from SK car wash fundraising event'),
-- Expenses
('Expense', 'LGU Annual Allocation',     'Sports',             8000.00, '2025-03-22',  '3x3 Basketball Tournament — prizes and equipment'),
('Expense', 'LGU Annual Allocation',     'Community Program',  7500.00, '2025-05-30',  'Feeding Program — food and supplies'),
('Expense', 'LGU Annual Allocation',     'Community Program',  1500.00, '2025-04-22',  'Community Clean-Up Drive — materials and snacks'),
('Expense', 'LGU Annual Allocation',     'Administrative',     2000.00, '2025-02-15',  'Leadership Summit — venue, materials, and meals'),
('Expense', 'DILG Special Grant',        'Scholarship',       22500.00, '2025-02-01',  'Scholarship releases — 3 scholars Q1 2025'),
('Expense', 'LGU Annual Allocation',     'Community Program',  3000.00, '2025-06-05',  'Brigada Eskwela — supplies and snacks for volunteers'),
('Expense', 'LGU Annual Allocation',     'Community Program', 12000.00, '2025-07-01',  'Youth Livelihood Training — materials and trainer fee'),
('Expense', 'Barangay Subsidy',          'Administrative',     1200.00, '2025-01-15',  'Office supplies and printing for SK office');

-- ============================================================
-- SK SCHOLARSHIPS
-- ============================================================
insert into sk_scholarships (resident_id, scholarship_name, school, year_level, amount, status, start_date, end_date)
select id, 'CHED SUC Grant', 'Carlos Hilado Memorial State University', '2nd Year College', 7500.00, 'Active', '2025-01-01', '2025-12-31'
from residents where last_name = 'Castillo' and first_name = 'Angelica' limit 1;

insert into sk_scholarships (resident_id, scholarship_name, school, year_level, amount, status, start_date, end_date)
select id, 'LGU Scholarship Program', 'University of St. La Salle', '3rd Year College', 7500.00, 'Active', '2025-01-01', '2025-12-31'
from residents where last_name = 'Ignacio' and first_name = 'Lovely' limit 1;

insert into sk_scholarships (resident_id, scholarship_name, school, year_level, amount, status, start_date, end_date)
select id, 'Private Scholarship — Rotary Club', 'Colegio San Agustin Bacolod', '1st Year College', 7500.00, 'Active', '2025-01-01', '2025-12-31'
from residents where last_name = 'Navarro' and first_name = 'Trisha' limit 1;

insert into sk_scholarships (resident_id, scholarship_name, school, year_level, amount, status, start_date, end_date)
select id, 'DOST-SEI Scholarship', 'University of the Philippines Visayas', '4th Year College', 10000.00, 'Completed', '2021-06-01', '2025-03-31'
from residents where last_name = 'Gomez' and first_name = 'Patricia' limit 1;
