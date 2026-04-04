-- ============================================================
-- DUMMY DATA for Barangay Management System
-- Run this AFTER supabase-schema.sql
-- ============================================================

-- ============================================================
-- RESIDENTS (20 records)
-- ============================================================
insert into residents (first_name, middle_name, last_name, alias, gender, birth_date, birth_place, civil_status, voter_status, purok, religion, primary_contact, secondary_contact, primary_email, resident_type) values
('Juan',       'Santos',    'Dela Cruz',  'Juancho',  'Male',   '1985-03-12', 'Bacolod City', 'Married',  true,  'Purok 1', 'Catholic',    '09171234501', '09281234501', 'juan.delacruz@email.com',    'Permanent'),
('Maria',      'Reyes',     'Garcia',     'Maring',   'Female', '1990-07-22', 'Bacolod City', 'Single',   true,  'Purok 1', 'Catholic',    '09171234502', '',            'maria.garcia@email.com',     'Permanent'),
('Pedro',      'Lim',       'Bautista',   'Pete',     'Male',   '1978-11-05', 'Talisay City', 'Married',  true,  'Purok 2', 'Catholic',    '09171234503', '09281234503', 'pedro.bautista@email.com',   'Permanent'),
('Ana',        'Cruz',      'Villanueva', 'Anita',    'Female', '1995-01-30', 'Bacolod City', 'Single',   false, 'Purok 2', 'Born Again',  '09171234504', '',            'ana.villanueva@email.com',   'Permanent'),
('Roberto',    'Mendoza',   'Santos',     'Bobby',    'Male',   '1982-06-18', 'Silay City',   'Married',  true,  'Purok 3', 'Catholic',    '09171234505', '09281234505', 'roberto.santos@email.com',   'Permanent'),
('Liza',       'Torres',    'Reyes',      'Lizzie',   'Female', '1988-09-14', 'Bacolod City', 'Married',  true,  'Purok 3', 'Catholic',    '09171234506', '',            'liza.reyes@email.com',       'Permanent'),
('Carlos',     'Aquino',    'Fernandez',  'Carl',     'Male',   '1975-04-25', 'Bacolod City', 'Widowed',  true,  'Purok 4', 'Iglesia',     '09171234507', '09281234507', 'carlos.fernandez@email.com', 'Permanent'),
('Rosa',       'Gomez',     'Lopez',      'Rosie',    'Female', '1993-12-08', 'Bacolod City', 'Single',   true,  'Purok 4', 'Catholic',    '09171234508', '',            'rosa.lopez@email.com',       'Permanent'),
('Eduardo',    'Ramos',     'Martinez',   'Eddie',    'Male',   '1980-08-17', 'Murcia',       'Married',  true,  'Purok 5', 'Catholic',    '09171234509', '09281234509', 'eduardo.martinez@email.com', 'Permanent'),
('Carmen',     'Flores',    'Gonzales',   'Carmi',    'Female', '1997-02-28', 'Bacolod City', 'Single',   false, 'Purok 5', 'Born Again',  '09171234510', '',            'carmen.gonzales@email.com',  'Permanent'),
('Antonio',    'Rivera',    'Hernandez',  'Tony',     'Male',   '1970-05-10', 'Bacolod City', 'Married',  true,  'Purok 6', 'Catholic',    '09171234511', '09281234511', 'antonio.hernandez@email.com','Permanent'),
('Josefa',     'Castro',    'Perez',      'Josie',    'Female', '1986-10-03', 'Bacolod City', 'Married',  true,  'Purok 6', 'Catholic',    '09171234512', '',            'josefa.perez@email.com',     'Permanent'),
('Miguel',     'Ortiz',     'Morales',    'Mike',     'Male',   '1992-07-19', 'Talisay City', 'Single',   true,  'Purok 1', 'Catholic',    '09171234513', '',            'miguel.morales@email.com',   'Transient'),
('Teresita',   'Navarro',   'Jimenez',    'Tess',     'Female', '1983-03-27', 'Bacolod City', 'Separated','true', 'Purok 2', 'Catholic',   '09171234514', '09281234514', 'teresita.jimenez@email.com', 'Permanent'),
('Francisco',  'Ruiz',      'Alvarez',    'Paco',     'Male',   '1968-12-15', 'Bacolod City', 'Married',  true,  'Purok 3', 'Iglesia',     '09171234515', '09281234515', 'francisco.alvarez@email.com','Permanent'),
('Marilou',    'Romero',    'Torres',     'Lou',      'Female', '1999-06-11', 'Bacolod City', 'Single',   false, 'Purok 4', 'Catholic',    '09171234516', '',            'marilou.torres@email.com',   'Permanent'),
('Renato',     'Vargas',    'Ramirez',    'Nato',     'Male',   '1977-09-22', 'Silay City',   'Married',  true,  'Purok 5', 'Catholic',    '09171234517', '09281234517', 'renato.ramirez@email.com',   'Permanent'),
('Corazon',    'Medina',    'Diaz',       'Cora',     'Female', '1991-04-16', 'Bacolod City', 'Single',   true,  'Purok 6', 'Born Again',  '09171234518', '',            'corazon.diaz@email.com',     'Permanent'),
('Domingo',    'Guerrero',  'Castillo',   'Doms',     'Male',   '1984-01-07', 'Bacolod City', 'Married',  true,  'Purok 1', 'Catholic',    '09171234519', '09281234519', 'domingo.castillo@email.com', 'Permanent'),
('Erlinda',    'Aguilar',   'Ramos',      'Linda',    'Female', '1974-08-30', 'Bacolod City', 'Widowed',  true,  'Purok 2', 'Catholic',    '09171234520', '',            'erlinda.ramos@email.com',    'Permanent');

-- ============================================================
-- BARANGAY OFFICIALS
-- ============================================================
insert into barangay_officials (resident_id, position, committee, term_of_service, status, rank)
select id, 'Barangay Captain',    'Executive',              '2023–2026', 'Active', 1 from residents where last_name = 'Dela Cruz'   and first_name = 'Juan'      limit 1;
insert into barangay_officials (resident_id, position, committee, term_of_service, status, rank)
select id, 'Barangay Kagawad',    'Peace and Order',        '2023–2026', 'Active', 2 from residents where last_name = 'Bautista'    and first_name = 'Pedro'     limit 1;
insert into barangay_officials (resident_id, position, committee, term_of_service, status, rank)
select id, 'Barangay Kagawad',    'Health and Sanitation',  '2023–2026', 'Active', 3 from residents where last_name = 'Santos'      and first_name = 'Roberto'   limit 1;
insert into barangay_officials (resident_id, position, committee, term_of_service, status, rank)
select id, 'Barangay Kagawad',    'Education',              '2023–2026', 'Active', 4 from residents where last_name = 'Fernandez'   and first_name = 'Carlos'    limit 1;
insert into barangay_officials (resident_id, position, committee, term_of_service, status, rank)
select id, 'Barangay Kagawad',    'Infrastructure',         '2023–2026', 'Active', 5 from residents where last_name = 'Martinez'    and first_name = 'Eduardo'   limit 1;
insert into barangay_officials (resident_id, position, committee, term_of_service, status, rank)
select id, 'Barangay Secretary',  'Administration',         '2023–2026', 'Active', 6 from residents where last_name = 'Garcia'      and first_name = 'Maria'     limit 1;
insert into barangay_officials (resident_id, position, committee, term_of_service, status, rank)
select id, 'Barangay Treasurer',  'Finance',                '2023–2026', 'Active', 7 from residents where last_name = 'Reyes'       and first_name = 'Liza'      limit 1;
insert into barangay_officials (resident_id, position, committee, term_of_service, status, rank)
select id, 'SK Chairman',         'Youth Affairs',          '2023–2026', 'Active', 8 from residents where last_name = 'Gonzales'    and first_name = 'Carmen'    limit 1;

-- ============================================================
-- BLOTTER RECORDS (6 records)
-- ============================================================
insert into blotter_records (incident_type, date_recorded, time_recorded, incident_date, incident_time, incident_location, incident_narrative, blotter_status) values
('Physical Injury',    '2024-11-10', '09:30:00', '2024-11-09', '22:00:00', 'Purok 3, Near Basketball Court',  'Complainant reported being punched by respondent during a basketball game dispute. Complainant sustained bruises on the left cheek.',                                          'Pending'),
('Noise Complaint',    '2024-11-15', '14:00:00', '2024-11-15', '01:30:00', 'Purok 1, Sitio Maligaya',         'Residents complained about loud music and videoke from respondent''s house past midnight causing disturbance to neighbors.',                                              'Settled'),
('Theft',              '2024-11-20', '10:15:00', '2024-11-19', '20:00:00', 'Purok 5, Near Sari-sari Store',   'Complainant reported that a motorcycle helmet worth PHP 1,500 was stolen from outside their house.',                                                                     'Pending'),
('Domestic Violence',  '2024-12-01', '08:45:00', '2024-11-30', '23:00:00', 'Purok 2, Residence of Respondent','Complainant reported being physically harmed by spouse. Visible injuries noted on arms and neck. Referred to DSWD.',                                                     'For Filing'),
('Verbal Abuse',       '2024-12-05', '11:00:00', '2024-12-05', '10:00:00', 'Purok 4, Public Market Area',     'Complainant reported being publicly humiliated and verbally abused by respondent over a land boundary dispute.',                                                         'Settled'),
('Property Damage',    '2024-12-10', '15:30:00', '2024-12-10', '14:00:00', 'Purok 6, Sitio Bagong Silang',    'Complainant reported that respondent deliberately destroyed the fence of their property valued at approximately PHP 3,000.',                                             'Pending');

-- ============================================================
-- BLOTTER PEOPLE INVOLVED
-- ============================================================
-- Blotter 1 - Physical Injury
insert into blotter_people_involved (blotter_id, involvement_type, first_name, middle_name, last_name, gender, address, primary_contact)
select id, 'Complainant', 'Roberto', 'Mendoza', 'Santos', 'Male', 'Purok 3, Barangay', '09171234505'
from blotter_records where incident_type = 'Physical Injury' limit 1;

insert into blotter_people_involved (blotter_id, involvement_type, first_name, middle_name, last_name, gender, address, primary_contact)
select id, 'Respondent', 'Miguel', 'Ortiz', 'Morales', 'Male', 'Purok 1, Barangay', '09171234513'
from blotter_records where incident_type = 'Physical Injury' limit 1;

-- Blotter 2 - Noise Complaint
insert into blotter_people_involved (blotter_id, involvement_type, first_name, middle_name, last_name, gender, address, primary_contact)
select id, 'Complainant', 'Juan', 'Santos', 'Dela Cruz', 'Male', 'Purok 1, Barangay', '09171234501'
from blotter_records where incident_type = 'Noise Complaint' limit 1;

insert into blotter_people_involved (blotter_id, involvement_type, first_name, middle_name, last_name, gender, address, primary_contact)
select id, 'Respondent', 'Domingo', 'Guerrero', 'Castillo', 'Male', 'Purok 1, Barangay', '09171234519'
from blotter_records where incident_type = 'Noise Complaint' limit 1;

-- Blotter 3 - Theft
insert into blotter_people_involved (blotter_id, involvement_type, first_name, middle_name, last_name, gender, address, primary_contact)
select id, 'Complainant', 'Eduardo', 'Ramos', 'Martinez', 'Male', 'Purok 5, Barangay', '09171234509'
from blotter_records where incident_type = 'Theft' limit 1;

-- Blotter 4 - Domestic Violence
insert into blotter_people_involved (blotter_id, involvement_type, first_name, middle_name, last_name, gender, address, primary_contact)
select id, 'Complainant', 'Teresita', 'Navarro', 'Jimenez', 'Female', 'Purok 2, Barangay', '09171234514'
from blotter_records where incident_type = 'Domestic Violence' limit 1;

insert into blotter_people_involved (blotter_id, involvement_type, first_name, middle_name, last_name, gender, address, primary_contact)
select id, 'Respondent', 'Francisco', 'Ruiz', 'Alvarez', 'Male', 'Purok 3, Barangay', '09171234515'
from blotter_records where incident_type = 'Domestic Violence' limit 1;

-- Blotter 5 - Verbal Abuse
insert into blotter_people_involved (blotter_id, involvement_type, first_name, middle_name, last_name, gender, address, primary_contact)
select id, 'Complainant', 'Rosa', 'Gomez', 'Lopez', 'Female', 'Purok 4, Barangay', '09171234508'
from blotter_records where incident_type = 'Verbal Abuse' limit 1;

insert into blotter_people_involved (blotter_id, involvement_type, first_name, middle_name, last_name, gender, address, primary_contact)
select id, 'Respondent', 'Carlos', 'Aquino', 'Fernandez', 'Male', 'Purok 4, Barangay', '09171234507'
from blotter_records where incident_type = 'Verbal Abuse' limit 1;

-- Blotter 6 - Property Damage
insert into blotter_people_involved (blotter_id, involvement_type, first_name, middle_name, last_name, gender, address, primary_contact)
select id, 'Complainant', 'Corazon', 'Medina', 'Diaz', 'Female', 'Purok 6, Barangay', '09171234518'
from blotter_records where incident_type = 'Property Damage' limit 1;

insert into blotter_people_involved (blotter_id, involvement_type, first_name, middle_name, last_name, gender, address, primary_contact)
select id, 'Respondent', 'Renato', 'Vargas', 'Ramirez', 'Male', 'Purok 5, Barangay', '09171234517'
from blotter_records where incident_type = 'Property Damage' limit 1;

-- ============================================================
-- SUMMON SCHEDULES
-- ============================================================
insert into summon_schedules (blotter_id, summon_date, summon_time, status)
select id, '2024-11-18', '09:00:00', 'Completed'  from blotter_records where incident_type = 'Physical Injury'   limit 1;
insert into summon_schedules (blotter_id, summon_date, summon_time, status)
select id, '2024-11-20', '10:00:00', 'Completed'  from blotter_records where incident_type = 'Noise Complaint'   limit 1;
insert into summon_schedules (blotter_id, summon_date, summon_time, status)
select id, '2024-12-05', '09:00:00', 'Scheduled'  from blotter_records where incident_type = 'Theft'             limit 1;
insert into summon_schedules (blotter_id, summon_date, summon_time, status)
select id, '2024-12-15', '14:00:00', 'Scheduled'  from blotter_records where incident_type = 'Property Damage'   limit 1;

-- ============================================================
-- SETTLEMENT REPORTS
-- ============================================================
insert into settlement_reports (summon_id, settlement_report, settlement_date)
select id, 'Both parties agreed to settle amicably. Respondent apologized and agreed to pay for medical expenses of complainant amounting to PHP 500. Case closed.', '2024-11-18'
from summon_schedules where status = 'Completed' and summon_date = '2024-11-18' limit 1;

insert into settlement_reports (summon_id, settlement_report, settlement_date)
select id, 'Respondent agreed to stop playing loud music past 10PM. Both parties shook hands and the complaint was withdrawn. Case settled.', '2024-11-20'
from summon_schedules where status = 'Completed' and summon_date = '2024-11-20' limit 1;

-- ============================================================
-- CERTIFICATE ISSUANCES
-- ============================================================
insert into certificate_issuances (resident_id, certificate_type_id, purpose, cedula_number, or_number, signed_by_name, signed_by_position)
select r.id, ct.id, 'Employment', '2024-00001', 'OR-0001', 'Juan Dela Cruz', 'Barangay Captain'
from residents r, certificate_types ct where r.last_name = 'Garcia' and r.first_name = 'Maria' and ct.name = 'Barangay Clearance' limit 1;

insert into certificate_issuances (resident_id, certificate_type_id, purpose, cedula_number, or_number, signed_by_name, signed_by_position)
select r.id, ct.id, 'Scholarship Application', '2024-00002', 'OR-0002', 'Juan Dela Cruz', 'Barangay Captain'
from residents r, certificate_types ct where r.last_name = 'Villanueva' and r.first_name = 'Ana' and ct.name = 'Certificate of Indigency' limit 1;

insert into certificate_issuances (resident_id, certificate_type_id, purpose, cedula_number, or_number, signed_by_name, signed_by_position)
select r.id, ct.id, 'Bank Loan', '2024-00003', 'OR-0003', 'Juan Dela Cruz', 'Barangay Captain'
from residents r, certificate_types ct where r.last_name = 'Santos' and r.first_name = 'Roberto' and ct.name = 'Certificate of Residency' limit 1;

insert into certificate_issuances (resident_id, certificate_type_id, purpose, cedula_number, or_number, signed_by_name, signed_by_position)
select r.id, ct.id, 'Travel Abroad', '2024-00004', 'OR-0004', 'Juan Dela Cruz', 'Barangay Captain'
from residents r, certificate_types ct where r.last_name = 'Lopez' and r.first_name = 'Rosa' and ct.name = 'Authority to Travel' limit 1;

insert into certificate_issuances (resident_id, certificate_type_id, purpose, cedula_number, or_number, signed_by_name, signed_by_position)
select r.id, ct.id, 'Job Application', '2024-00005', 'OR-0005', 'Juan Dela Cruz', 'Barangay Captain'
from residents r, certificate_types ct where r.last_name = 'Hernandez' and r.first_name = 'Antonio' and ct.name = 'Certificate of Good Moral' limit 1;

-- ============================================================
-- BUSINESS PERMITS
-- ============================================================
insert into business_permits (business_name, owner_name, owner_resident_id, business_type, address, permit_date, expiry_date, status)
select 'Dela Cruz Sari-sari Store', 'Juan Dela Cruz', r.id, 'Retail', 'Purok 1, Barangay', '2024-01-10', '2024-12-31', 'Active'
from residents r where r.last_name = 'Dela Cruz' and r.first_name = 'Juan' limit 1;

insert into business_permits (business_name, owner_name, owner_resident_id, business_type, address, permit_date, expiry_date, status)
select 'Bautista Vulcanizing Shop', 'Pedro Bautista', r.id, 'Services', 'Purok 2, Barangay', '2024-02-15', '2024-12-31', 'Active'
from residents r where r.last_name = 'Bautista' and r.first_name = 'Pedro' limit 1;

insert into business_permits (business_name, owner_name, owner_resident_id, business_type, address, permit_date, expiry_date, status)
select 'Santos Carinderia', 'Roberto Santos', r.id, 'Food & Beverage', 'Purok 3, Barangay', '2024-01-20', '2024-12-31', 'Active'
from residents r where r.last_name = 'Santos' and r.first_name = 'Roberto' limit 1;

insert into business_permits (business_name, owner_name, owner_resident_id, business_type, address, permit_date, expiry_date, status)
select 'Fernandez Hardware', 'Carlos Fernandez', r.id, 'Retail', 'Purok 4, Barangay', '2023-03-01', '2023-12-31', 'Expired'
from residents r where r.last_name = 'Fernandez' and r.first_name = 'Carlos' limit 1;

insert into business_permits (business_name, owner_name, owner_resident_id, business_type, address, permit_date, expiry_date, status)
select 'Martinez Barbershop', 'Eduardo Martinez', r.id, 'Services', 'Purok 5, Barangay', '2024-03-10', '2024-12-31', 'Active'
from residents r where r.last_name = 'Martinez' and r.first_name = 'Eduardo' limit 1;

insert into business_permits (business_name, owner_name, owner_resident_id, business_type, address, permit_date, expiry_date, status)
select 'Ramirez Bakery', 'Renato Ramirez', r.id, 'Food & Beverage', 'Purok 5, Barangay', '2024-04-05', '2024-12-31', 'Active'
from residents r where r.last_name = 'Ramirez' and r.first_name = 'Renato' limit 1;
