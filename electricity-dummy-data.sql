-- ============================================================
-- Electricity Issues Dummy Data (Updated for Iloilo Area)
-- Run AFTER electricity-migration.sql
-- ============================================================

-- Insert sample electricity issues with various statuses and priorities
INSERT INTO cal_electricity_issues (
  issue_type, location, coordinates, description, reported_by, contact_number, 
  priority, status, affected_households, estimated_duration, 
  utility_company_notified, utility_reference_number, assigned_staff,
  reported_at, resolved_at
) VALUES 
-- Active Issues
(
  'Power Outage', 
  'Purok 1 - Main Street', 
  '10.374854,122.869125',
  'Complete power outage affecting entire street. Transformer appears to be damaged after heavy rain.',
  'Maria Santos',
  '09171234567',
  'High',
  'In Progress',
  45,
  '4-6 hours',
  true,
  'ELEC-2024-001',
  'Juan Dela Cruz',
  NOW() - INTERVAL '3 hours',
  NULL
),
(
  'Damaged Lines', 
  'Purok 2 - Near Elementary School', 
  '10.373254,122.868525',
  'Power lines down due to fallen coconut tree branch. Area is unsafe.',
  'Pedro Reyes',
  '09187654321',
  'Critical',
  'Investigating',
  12,
  'Unknown',
  true,
  'ELEC-2024-002',
  'Ana Garcia',
  NOW() - INTERVAL '1 hour',
  NULL
),
(
  'Street Light', 
  'Purok 3 - Basketball Court Area', 
  NULL,
  'All street lights not working for 3 days. Community feels unsafe at night.',
  'Barangay Tanod Jose',
  '09123456789',
  'Medium',
  'Reported',
  0,
  '1-2 days',
  false,
  NULL,
  NULL,
  NOW() - INTERVAL '30 minutes',
  NULL
),
(
  'Transformer Issue', 
  'Purok 4 - Rice Mill Area', 
  '10.375154,122.867925',
  'Transformer making loud buzzing noise and sparking occasionally.',
  'Rice Mill Operator',
  '09198765432',
  'High',
  'Reported',
  8,
  'Same day',
  true,
  'ELEC-2024-003',
  NULL,
  NOW() - INTERVAL '2 hours',
  NULL
),
(
  'Power Outage', 
  'Purok 1 - Elementary School Area', 
  '10.374454,122.869425',
  'Partial power outage affecting school and nearby houses.',
  'School Principal',
  '09156789012',
  'Medium',
  'In Progress',
  25,
  '2-3 hours',
  true,
  'ELEC-2024-004',
  'Carlos Lopez',
  NOW() - INTERVAL '4 hours',
  NULL
),

-- Recently Resolved Issues
(
  'Power Outage', 
  'Purok 2 - Market Area', 
  '10.373854,122.868725',
  'Power outage affecting market vendors and nearby sari-sari stores.',
  'Market Administrator',
  '09134567890',
  'High',
  'Resolved',
  35,
  '3 hours',
  true,
  'ELEC-2024-005',
  'Juan Dela Cruz',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '18 hours'
),
(
  'Street Light', 
  'Purok 3 - Main Road to Highway', 
  NULL,
  'Several street lights not working along main road to national highway.',
  'Traffic Enforcer',
  '09145678901',
  'Low',
  'Resolved',
  0,
  '1 day',
  false,
  NULL,
  'Ana Garcia',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '1 day'
),
(
  'Other', 
  'Purok 1 - Barangay Hall', 
  '10.374254,122.869025',
  'Electrical panel tripping frequently in barangay hall during meetings.',
  'Barangay Secretary',
  '09167890123',
  'Medium',
  'Resolved',
  1,
  '4 hours',
  false,
  NULL,
  'Carlos Lopez',
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '2 days'
),

-- Older Issues for Testing
(
  'Power Outage', 
  'Purok 4 - Residential Subdivision', 
  '10.375454,122.867625',
  'Brownout affecting entire subdivision near the fishpond area.',
  'Homeowner Association',
  '09178901234',
  'Medium',
  'Resolved',
  60,
  '6 hours',
  true,
  'ELEC-2024-006',
  'Juan Dela Cruz',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '4 days'
),
(
  'Damaged Lines', 
  'Purok 2 - Highway Construction Area', 
  '10.373654,122.868325',
  'Power lines damaged by road widening construction work.',
  'Construction Foreman',
  '09189012345',
  'Critical',
  'Resolved',
  20,
  '8 hours',
  true,
  'ELEC-2024-007',
  'Ana Garcia',
  NOW() - INTERVAL '1 week',
  NOW() - INTERVAL '6 days'
),

-- Walk-in Reports (No contact info)
(
  'Power Outage', 
  'Purok 3 - Senior Citizen Area', 
  NULL,
  'Elderly residents reporting no power for cooking and medication storage.',
  'Walk-in Resident',
  NULL,
  'High',
  'Reported',
  15,
  'Unknown',
  false,
  NULL,
  NULL,
  NOW() - INTERVAL '45 minutes',
  NULL
),
(
  'Street Light', 
  'Purok 1 - Chapel Area', 
  '10.374654,122.869225',
  'Street lights around chapel not working, affecting evening novena and activities.',
  'Chapel Coordinator',
  NULL,
  'Low',
  'Reported',
  0,
  '1-2 days',
  false,
  NULL,
  NULL,
  NOW() - INTERVAL '2 hours',
  NULL
);

-- Update some service areas with more realistic data for your location
UPDATE cal_electricity_areas SET 
  area_name = 'Purok 1',
  description = 'Main residential area near barangay hall',
  utility_company = 'Iloilo Electric Cooperative (ILECO)',
  emergency_contact = '(033) 337-2937',
  typical_households = 180
WHERE area_name = 'Zone 1';

UPDATE cal_electricity_areas SET 
  area_name = 'Purok 2',
  description = 'Market and commercial area',
  utility_company = 'Iloilo Electric Cooperative (ILECO)',
  emergency_contact = '(033) 337-2937',
  typical_households = 95
WHERE area_name = 'Zone 2';

UPDATE cal_electricity_areas SET 
  area_name = 'Purok 3',
  description = 'Residential area near highway',
  utility_company = 'Iloilo Electric Cooperative (ILECO)',
  emergency_contact = '(033) 337-2937',
  typical_households = 140
WHERE area_name = 'Zone 3';

UPDATE cal_electricity_areas SET 
  area_name = 'Purok 4',
  description = 'Agricultural and fishpond area',
  utility_company = 'Iloilo Electric Cooperative (ILECO)',
  emergency_contact = '(033) 337-2937',
  typical_households = 65
WHERE area_name = 'Zone 4';