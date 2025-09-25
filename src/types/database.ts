export type UserRole = 'admin' | 'staff' | 'client'
export type SMSStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'undelivered'
export type CaseStatus = 'active' | 'closed' | 'pending'

export interface StaffUser {
  id: string
  email: string
  name: string
  role: UserRole
  created_at: string
  updated_at: string
  last_login?: string
}

export interface Client {
  id: string
  name: string
  phone: string
  email?: string
  case_number?: string
  attorney_id?: string
  case_status: CaseStatus
  created_at: string
  updated_at: string
  notes?: string
}

export interface CourtDate {
  id: string
  client_id: string
  case_number?: string
  court_date: string
  court_location?: string
  case_type?: string
  status: CaseStatus
  created_at: string
  updated_at: string
}

export interface SMSTemplate {
  id: string
  name: string
  message_text: string
  days_before: number
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

export interface SMSMessage {
  id: string
  client_id: string
  template_id?: string
  court_date_id?: string
  scheduled_for: string
  sent_at?: string
  delivery_status: SMSStatus
  twilio_message_sid?: string
  confirmation_received: boolean
  confirmation_received_at?: string
  created_at: string
  updated_at: string
}

export interface DeliveryLog {
  id: string
  sms_id: string
  status: SMSStatus
  timestamp: string
  error_message?: string
  twilio_response?: Record<string, unknown>
}

// Extended types with relationships
export interface ClientWithAttorney extends Client {
  attorney?: StaffUser
}

export interface CourtDateWithClient extends CourtDate {
  client?: Client
}

export interface SMSMessageWithDetails extends SMSMessage {
  client?: Client
  template?: SMSTemplate
  court_date?: CourtDate
}

// Form types for creating/updating
export interface CreateClientData {
  name: string
  phone: string
  email?: string
  case_number?: string
  attorney_id?: string
  notes?: string
}

export interface CreateCourtDateData {
  client_id: string
  case_number?: string
  court_date: string
  court_location?: string
  case_type?: string
}

export interface CreateSMSTemplateData {
  name: string
  message_text: string
  days_before: number
}

export interface ScheduleSMSData {
  client_id: string
  court_date_id: string
  template_id?: string
  custom_message?: string
  scheduled_for: string
}
