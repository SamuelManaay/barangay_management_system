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
