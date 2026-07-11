export type Resident = {
  id: string
  first_name: string
  middle_name?: string
  last_name: string
  alias?: string
  gender?: string
  birth_date?: string
  birth_place?: string
  civil_status?: string
  voter_status?: boolean
  purok?: string
  religion?: string
  primary_contact?: string
  secondary_contact?: string
  primary_email?: string
  secondary_email?: string
  resident_type?: string
  photo_url?: string
  created_at?: string
  updated_at?: string
}

export type BlotterRecord = {
  id: string
  incident_type?: string
  date_recorded: string
  time_recorded: string
  incident_date?: string
  incident_time?: string
  incident_location?: string
  incident_narrative?: string
  blotter_status: string
  recorded_by?: string
  created_at?: string
  updated_at?: string
}

export type BlotterPersonInvolved = {
  id: string
  blotter_id: string
  resident_id?: string
  involvement_type: 'Complainant' | 'Victim' | 'Respondent'
  last_name?: string
  first_name?: string
  middle_name?: string
  alias?: string
  gender?: string
  civil_status?: string
  birth_date?: string
  birth_place?: string
  address?: string
  primary_contact?: string
  primary_email?: string
}

export type SummonSchedule = {
  id: string
  blotter_id: string
  summon_date: string
  summon_time: string
  status: string
  created_at?: string
}

export type SettlementReport = {
  id: string
  summon_id: string
  settlement_report: string
  settlement_date?: string
  created_at?: string
}

export type CertificateType = {
  id: string
  name: string
  has_restriction: boolean
  price: number
}

export type CertificatePrintLog = {
  id: string
  certificate_issuance_id: string
  certificate_type_id: string
  certificate_type_name: string
  price: number
  printed_at: string
  printed_by?: string
}

export type CertificateIssuance = {
  id: string
  resident_id: string
  certificate_type_id: string
  purpose?: string
  cedula_number?: string
  or_number?: string
  signed_by_name?: string
  signed_by_position?: string
  issued_by?: string
  issued_at?: string
  residents?: Resident
  certificate_types?: CertificateType
}

export type BarangayOfficial = {
  id: string
  resident_id?: string
  position: string
  committee?: string
  term_of_service?: string
  status: string
  rank?: number
  created_at?: string
  residents?: Resident
}

export type SKOfficial = {
  id: string
  resident_id?: string
  position: string
  term_start?: string
  term_end?: string
  contact?: string
  status: string
  created_at?: string
  residents?: Resident
}

export type SKYouth = {
  id: string
  resident_id: string
  is_sk_member: boolean
  is_volunteer: boolean
  scholarship_status: string
  notes?: string
  created_at?: string
  residents?: Resident
}

export type SKEvent = {
  id: string
  event_name: string
  event_type: string
  event_date?: string
  location?: string
  budget: number
  status: string
  description?: string
  created_at?: string
}

export type SKProject = {
  id: string
  project_name: string
  description?: string
  budget_allocation: number
  amount_spent: number
  status: string
  start_date?: string
  end_date?: string
  created_at?: string
}

export type SKFinance = {
  id: string
  transaction_type: string
  fund_source?: string
  category?: string
  amount: number
  transaction_date: string
  remarks?: string
  created_at?: string
}

export type SKScholarship = {
  id: string
  resident_id: string
  scholarship_name: string
  school?: string
  year_level?: string
  amount: number
  status: string
  start_date?: string
  end_date?: string
  created_at?: string
  residents?: Resident
}

export type CalIncident = {
  id: string
  incident_type: string
  incident_date: string
  incident_time: string
  location?: string
  description?: string
  reported_by?: string
  resident_id?: string
  status: string
  severity: string
  created_at?: string
  updated_at?: string
  residents?: Resident
}

export type CalRequest = {
  id: string
  incident_id?: string
  resident_id?: string
  requester_name?: string
  request_type: string
  sos_type?: string
  people_affected: number
  priority: string
  status: string
  assigned_responder?: string
  notes?: string
  latitude?: number
  longitude?: number
  created_at?: string
  residents?: Resident
}

export type CalEvacuationCenter = {
  id: string
  name: string
  location?: string
  capacity: number
  current_occupants: number
  assigned_staff?: string
  contact_person?: string
  contact_number?: string
  available_supplies?: string
  status: string
  created_at?: string
}

export type CalEvacuee = {
  id: string
  center_id: string
  resident_id?: string
  name?: string
  people_count: number
  check_in?: string
  check_out?: string
  notes?: string
  residents?: Resident
}

export type CalRelief = {
  id: string
  incident_id?: string
  item_type: string
  quantity: number
  distribution_date: string
  resident_id?: string
  recipient_name?: string
  distribution_location?: string
  distributed_by?: string
  notes?: string
  created_at?: string
  residents?: Resident
}

export type CalDamage = {
  id: string
  incident_id?: string
  resident_id?: string
  household_name?: string
  damage_level: string
  estimated_cost: number
  description?: string
  assessed_by?: string
  assessment_date?: string
  created_at?: string
  residents?: Resident
}

export type CalTanod = {
  id: string
  name: string
  contact?: string
  assigned_area?: string
  shift_schedule?: string
  status: string
  created_at?: string
}

export type CalDispatch = {
  id: string
  incident_id: string
  tanod_id: string
  dispatched_at?: string
  responded_at?: string
  notes?: string
  cal_tanods?: CalTanod
  cal_incidents?: CalIncident
}

export type CalPatrolLog = {
  id: string
  tanod_id: string
  patrol_date: string
  patrol_time: string
  area_covered?: string
  incident_observed?: string
  remarks?: string
  created_at?: string
  cal_tanods?: CalTanod
}

export type BusinessPermit = {
  id: string
  business_name: string
  owner_name: string
  owner_resident_id?: string
  business_type?: string
  address?: string
  permit_date?: string
  expiry_date?: string
  status: string
  created_at?: string
}
