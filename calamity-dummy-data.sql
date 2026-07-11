-- ============================================================
-- Calamity & Emergency Dummy Data
-- Run AFTER calamity-migration.sql
-- ============================================================

-- Tanods
insert into cal_tanods (id, name, contact, assigned_area, shift_schedule, status) values
  ('a1000000-0000-0000-0000-000000000001', 'Ramon Dela Cruz',   '09171234501', 'Purok 1 - Riverside',   'Morning (6AM-2PM)',    'On Duty'),
  ('a1000000-0000-0000-0000-000000000002', 'Eduardo Santos',    '09171234502', 'Purok 2 - Hillside',    'Afternoon (2PM-10PM)', 'Responding'),
  ('a1000000-0000-0000-0000-000000000003', 'Nestor Reyes',      '09171234503', 'Purok 3 - Market Area', 'Night (10PM-6AM)',     'Available'),
  ('a1000000-0000-0000-0000-000000000004', 'Alfredo Bautista',  '09171234504', 'Purok 4 - Barangay Hall','Morning (6AM-2PM)',   'Available'),
  ('a1000000-0000-0000-0000-000000000005', 'Rodrigo Villanueva','09171234505', 'Purok 5 - School Zone', 'Afternoon (2PM-10PM)', 'Responding'),
  ('a1000000-0000-0000-0000-000000000006', 'Danilo Mercado',    '09171234506', 'Purok 1 - Riverside',   'Night (10PM-6AM)',     'Off Duty');

-- Incidents
insert into cal_incidents (id, incident_type, incident_date, incident_time, location, description, reported_by, status, severity) values
  ('b1000000-0000-0000-0000-000000000001', 'Flood',             '2025-01-10', '08:30', 'Purok 1 - Riverside Area',       'Rising floodwaters due to heavy rainfall. Several houses submerged up to knee level.',          'Ramon Dela Cruz',    'Resolved',   'High'),
  ('b1000000-0000-0000-0000-000000000002', 'Fire',              '2025-02-14', '14:15', 'Purok 3 - Market Area',          'Fire broke out in a residential house near the market. Cause: faulty electrical wiring.',        'Barangay Hotline',   'Resolved',   'Critical'),
  ('b1000000-0000-0000-0000-000000000003', 'Typhoon',           '2025-03-05', '06:00', 'Entire Barangay',                'Typhoon Amang made landfall. Strong winds and heavy rains caused widespread damage.',            'NDRRMC Advisory',    'Resolved',   'Critical'),
  ('b1000000-0000-0000-0000-000000000004', 'Medical Emergency', '2025-04-20', '11:45', 'Purok 2 - Hillside',             'Elderly resident collapsed. Suspected cardiac arrest. Ambulance dispatched.',                   'Neighbor',           'Resolved',   'High'),
  ('b1000000-0000-0000-0000-000000000005', 'Landslide',         '2025-05-08', '16:30', 'Purok 2 - Hillside Road',        'Minor landslide blocked the road. No casualties but road is impassable.',                      'Eduardo Santos',     'Responding', 'Medium'),
  ('b1000000-0000-0000-0000-000000000006', 'Flood',             '2025-06-01', '07:00', 'Purok 1 & Purok 4 Low Areas',   'Monsoon flooding. Water level rising. Evacuation of low-lying areas initiated.',                 'Barangay Captain',   'Responding', 'High'),
  ('b1000000-0000-0000-0000-000000000007', 'Fire',              '2025-06-10', '22:00', 'Purok 5 - Near School',          'Grass fire near school perimeter. Contained before reaching structures.',                      'Rodrigo Villanueva', 'Resolved',   'Low'),
  ('b1000000-0000-0000-0000-000000000008', 'Medical Emergency', '2025-06-15', '09:20', 'Purok 3 - Sitio Mabini',         'Child with severe allergic reaction. Rushed to health center.',                               'Parent',             'Resolved',   'Medium'),
  ('b1000000-0000-0000-0000-000000000009', 'Earthquake',        '2025-06-20', '03:45', 'Entire Barangay',                'Magnitude 4.8 earthquake. Minor structural damage reported in older buildings.',               'PHIVOLCS Alert',     'Reported',   'Medium'),
  ('b1000000-0000-0000-0000-000000000010', 'Flood',             '2025-06-25', '05:30', 'Purok 1 - Riverside',            'Flash flood warning. Residents near riverbank advised to evacuate immediately.',               'Nestor Reyes',       'Reported',   'Critical');

-- Evacuation Centers
insert into cal_evacuation_centers (id, name, location, capacity, current_occupants, assigned_staff, contact_person, contact_number, available_supplies, status) values
  ('c1000000-0000-0000-0000-000000000001', 'Barangay Hall Evacuation Center', 'Barangay Hall, Main Road',        150, 87,  'Alfredo Bautista',  'Brgy. Captain Santos',  '09181234501', 'Food, Water, Blankets, Medicine', 'Active'),
  ('c1000000-0000-0000-0000-000000000002', 'Barangay Elementary School',      'Purok 5, School Zone',            300, 142, 'Rodrigo Villanueva','Principal Reyes',        '09181234502', 'Food, Water, Blankets',          'Active'),
  ('c1000000-0000-0000-0000-000000000003', 'Covered Court Evacuation Area',   'Purok 3, Near Basketball Court',  100, 0,   'Danilo Mercado',    'Kagawad Flores',         '09181234503', 'Water, Blankets',                'Standby'),
  ('c1000000-0000-0000-0000-000000000004', 'Sitio Mabini Chapel',             'Purok 2, Sitio Mabini',           80,  80,  'Eduardo Santos',    'Fr. Dela Rosa',          '09181234504', 'Food, Water',                    'Full');

-- Evacuees
insert into cal_evacuees (center_id, name, people_count, check_in, notes) values
  ('c1000000-0000-0000-0000-000000000001', 'Dela Cruz Family',    5, '2025-06-01 08:00:00+08', 'Relocated from Purok 1 riverside'),
  ('c1000000-0000-0000-0000-000000000001', 'Santos Household',    3, '2025-06-01 09:30:00+08', 'Elderly members, needs medical attention'),
  ('c1000000-0000-0000-0000-000000000001', 'Reyes Family',        6, '2025-06-01 10:00:00+08', null),
  ('c1000000-0000-0000-0000-000000000001', 'Bautista Family',     4, '2025-06-01 11:00:00+08', null),
  ('c1000000-0000-0000-0000-000000000002', 'Garcia Household',    7, '2025-06-01 07:45:00+08', 'Has infant, needs formula milk'),
  ('c1000000-0000-0000-0000-000000000002', 'Villanueva Family',   4, '2025-06-01 08:30:00+08', null),
  ('c1000000-0000-0000-0000-000000000002', 'Mercado Household',   3, '2025-06-01 09:00:00+08', null),
  ('c1000000-0000-0000-0000-000000000004', 'Flores Family',       5, '2025-06-01 06:30:00+08', 'From flooded area near creek'),
  ('c1000000-0000-0000-0000-000000000004', 'Cruz Household',      4, '2025-06-01 07:00:00+08', null);

-- Emergency Requests
insert into cal_requests (incident_id, requester_name, request_type, people_affected, priority, status, assigned_responder, notes) values
  ('b1000000-0000-0000-0000-000000000001', 'Maria Santos',       'Evacuation', 6,  'High',   'Completed', 'Ramon Dela Cruz',    'Family with 2 elderly members'),
  ('b1000000-0000-0000-0000-000000000001', 'Jose Reyes',         'Food',       4,  'Medium', 'Completed', 'Alfredo Bautista',   'Stranded for 2 days'),
  ('b1000000-0000-0000-0000-000000000002', 'Barangay Response',  'Rescue',     1,  'High',   'Completed', 'BFP Team',           'Trapped resident rescued safely'),
  ('b1000000-0000-0000-0000-000000000003', 'Purok 1 Residents',  'Evacuation', 25, 'High',   'Completed', 'Barangay Team',      'Mass evacuation during typhoon'),
  ('b1000000-0000-0000-0000-000000000003', 'Lourdes Garcia',     'Medical',    1,  'High',   'Completed', 'BHW Dela Cruz',      'Injured by falling debris'),
  ('b1000000-0000-0000-0000-000000000004', 'Neighbor Report',    'Medical',    1,  'High',   'Completed', 'BHW Santos',         'Cardiac patient stabilized'),
  ('b1000000-0000-0000-0000-000000000005', 'Purok 2 Residents',  'Rescue',     3,  'Medium', 'Responding','Eduardo Santos',     'Vehicles stuck on blocked road'),
  ('b1000000-0000-0000-0000-000000000006', 'Ana Villanueva',     'Evacuation', 5,  'High',   'Responding','Rodrigo Villanueva', 'Pregnant woman in household'),
  ('b1000000-0000-0000-0000-000000000006', 'Purok 4 Residents',  'Water',      30, 'Medium', 'Pending',   null,                 'Clean water supply needed'),
  ('b1000000-0000-0000-0000-000000000009', 'Barangay Hall',      'Medical',    2,  'Medium', 'Pending',   null,                 'Minor injuries from earthquake');

-- Relief Distribution
insert into cal_relief (incident_id, item_type, quantity, distribution_date, recipient_name, distribution_location, distributed_by, notes) values
  ('b1000000-0000-0000-0000-000000000001', 'Food Pack',    50,  '2025-01-11', 'Flood Victims - Purok 1',     'Barangay Hall',          'Kagawad Reyes',     'DSWD relief goods'),
  ('b1000000-0000-0000-0000-000000000001', 'Water',        100, '2025-01-11', 'Flood Victims - Purok 1',     'Barangay Hall',          'Kagawad Reyes',     '1L bottled water per person'),
  ('b1000000-0000-0000-0000-000000000001', 'Blanket',      30,  '2025-01-12', 'Flood Victims - Purok 1',     'Evacuation Center',      'BHW Santos',        null),
  ('b1000000-0000-0000-0000-000000000002', 'Food Pack',    20,  '2025-02-15', 'Fire Victims - Purok 3',      'Covered Court',          'Brgy. Captain',     'Emergency relief'),
  ('b1000000-0000-0000-0000-000000000002', 'Clothes',      15,  '2025-02-15', 'Fire Victims - Purok 3',      'Covered Court',          'Brgy. Captain',     'Donated by local church'),
  ('b1000000-0000-0000-0000-000000000003', 'Food Pack',    120, '2025-03-06', 'Typhoon Victims',             'Barangay Elementary',    'DSWD Team',         'Day 1 distribution'),
  ('b1000000-0000-0000-0000-000000000003', 'Food Pack',    120, '2025-03-07', 'Typhoon Victims',             'Barangay Elementary',    'DSWD Team',         'Day 2 distribution'),
  ('b1000000-0000-0000-0000-000000000003', 'Medicine',     50,  '2025-03-06', 'Typhoon Victims',             'Health Center',          'BHW Dela Cruz',     'Basic medicines and first aid'),
  ('b1000000-0000-0000-0000-000000000003', 'Hygiene Kit',  80,  '2025-03-07', 'Typhoon Victims',             'Barangay Elementary',    'BHW Santos',        null),
  ('b1000000-0000-0000-0000-000000000006', 'Food Pack',    60,  '2025-06-02', 'Flood Victims - Purok 1 & 4', 'Barangay Hall',          'Kagawad Flores',    'Ongoing flood relief'),
  ('b1000000-0000-0000-0000-000000000006', 'Water',        200, '2025-06-02', 'Flood Victims - Purok 1 & 4', 'Barangay Hall',          'Kagawad Flores',    null),
  (null,                                   'Blanket',      25,  '2025-06-03', 'Evacuation Center Residents', 'Barangay Elementary',    'Brgy. Captain',     'Donated by NGO');

-- Damage Assessment
insert into cal_damage (incident_id, household_name, damage_level, estimated_cost, description, assessed_by, assessment_date) values
  ('b1000000-0000-0000-0000-000000000001', 'Santos Residence',      'Minor', 15000.00,  'Flooring and furniture damaged by floodwater',                  'Kagawad Reyes',    '2025-01-13'),
  ('b1000000-0000-0000-0000-000000000001', 'Dela Cruz Residence',   'Major', 85000.00,  'Ground floor completely flooded, appliances destroyed',         'Kagawad Reyes',    '2025-01-13'),
  ('b1000000-0000-0000-0000-000000000001', 'Reyes Household',       'Minor', 8500.00,   'Minor water damage to walls and flooring',                      'BHW Santos',       '2025-01-14'),
  ('b1000000-0000-0000-0000-000000000002', 'Garcia Residence',      'Total', 350000.00, 'House completely destroyed by fire',                            'BFP Inspector',    '2025-02-16'),
  ('b1000000-0000-0000-0000-000000000002', 'Villanueva Residence',  'Major', 120000.00, 'Partial fire damage, roof and walls affected',                  'BFP Inspector',    '2025-02-16'),
  ('b1000000-0000-0000-0000-000000000003', 'Mercado Household',     'Major', 95000.00,  'Roof blown off, walls cracked due to typhoon winds',            'PDRRMO Team',      '2025-03-08'),
  ('b1000000-0000-0000-0000-000000000003', 'Bautista Residence',    'Minor', 22000.00,  'Roof damage and broken windows',                               'PDRRMO Team',      '2025-03-08'),
  ('b1000000-0000-0000-0000-000000000003', 'Cruz Household',        'Minor', 18000.00,  'Fence collapsed, minor roof damage',                           'Kagawad Flores',   '2025-03-09'),
  ('b1000000-0000-0000-0000-000000000009', 'Old Barangay Hall',     'Major', 200000.00, 'Structural cracks on walls, deemed unsafe for occupancy',      'DPWH Engineer',    '2025-06-21'),
  ('b1000000-0000-0000-0000-000000000009', 'Flores Residence',      'Minor', 12000.00,  'Ceiling collapsed in one room, minor wall cracks',             'Kagawad Reyes',    '2025-06-21');

-- Tanod Dispatch
insert into cal_dispatch (incident_id, tanod_id, dispatched_at, responded_at, notes) values
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', '2025-01-10 08:35:00+08', '2025-01-10 08:55:00+08', 'Assisted in evacuation of riverside families'),
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000004', '2025-01-10 08:40:00+08', '2025-01-10 09:10:00+08', 'Coordinated relief distribution'),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000003', '2025-02-14 14:20:00+08', '2025-02-14 14:35:00+08', 'Crowd control and perimeter security'),
  ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', '2025-03-05 06:05:00+08', '2025-03-05 06:30:00+08', 'Evacuation assistance'),
  ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002', '2025-03-05 06:05:00+08', '2025-03-05 06:25:00+08', 'Road clearing and rescue'),
  ('b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000002', '2025-05-08 16:35:00+08', null,                     'Currently managing road blockage'),
  ('b1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000005', '2025-06-01 07:05:00+08', null,                     'Ongoing flood response');

-- Patrol Logs
insert into cal_patrol_logs (tanod_id, patrol_date, patrol_time, area_covered, incident_observed, remarks) values
  ('a1000000-0000-0000-0000-000000000001', '2025-06-20', '06:00', 'Purok 1 - Riverside',    'Water level rising near creek',          'Advised residents to prepare for possible evacuation'),
  ('a1000000-0000-0000-0000-000000000002', '2025-06-20', '14:00', 'Purok 2 - Hillside',     'No incidents observed',                  'Road condition good'),
  ('a1000000-0000-0000-0000-000000000003', '2025-06-20', '22:00', 'Purok 3 - Market Area',  'Minor altercation near sari-sari store', 'Resolved peacefully, no injuries'),
  ('a1000000-0000-0000-0000-000000000004', '2025-06-21', '06:00', 'Purok 4 - Barangay Hall','Post-earthquake inspection',             'Minor cracks on old barangay hall wall, reported to captain'),
  ('a1000000-0000-0000-0000-000000000005', '2025-06-21', '14:00', 'Purok 5 - School Zone',  'No incidents observed',                  'School premises secure'),
  ('a1000000-0000-0000-0000-000000000001', '2025-06-22', '06:00', 'Purok 1 - Riverside',    'Flood warning signs posted',             'Residents alerted, evacuation route cleared'),
  ('a1000000-0000-0000-0000-000000000006', '2025-06-22', '22:00', 'Purok 1 - Riverside',    'Floodwater receding',                    'Situation improving, monitoring continues');
