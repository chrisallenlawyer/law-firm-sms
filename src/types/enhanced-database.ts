export type UserRole = 'admin' | 'staff' | 'client'
export type SMSStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'undelivered'
export type CaseStatus = 'active' | 'closed' | 'pending'
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed'

export interface StaffUser {
  id: string
  email: string
  name: string
  role: UserRole
  created_at: string
  updated_at: string
  last_login?: string
}

export interface Court {
  id: string
  name: string
  address_street?: string
  address_city?: string
  address_state?: string
  address_zip?: string
  phone?: string
  email?: string
  website?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Docket {
  id: string
  court_id: string
  docket_date: string
  docket_time?: string
  judge_name?: string
  docket_type?: string
  description?: string
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  first_name: string
  last_name: string
  phone: string
  email?: string
  address_street?: string
  address_city?: string
  address_state?: string
  address_zip?: string
  case_number?: string
  attorney_id?: string
  case_status: CaseStatus
  notes?: string
  created_at: string
  updated_at: string
}

export interface ClientDocketAssignment {
  id: string
  client_id: string
  docket_id: string
  assigned_by?: string
  assigned_at: string
  notes?: string
}

export interface CourtDate {
  id: string
  client_id: string
  docket_id?: string
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
  court_id?: string
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

export interface SMSMessage {
  id: string
  client_id: string
  docket_id?: string
  template_id?: string
  scheduled_for: string
  sent_at?: string
  delivery_status: SMSStatus
  twilio_message_sid?: string
  confirmation_received: boolean
  confirmation_received_at?: string
  message_text?: string
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

export interface SMSCampaign {
  id: string
  name: string
  docket_id?: string
  template_id?: string
  custom_message?: string
  scheduled_for?: string
  sent_at?: string
  status: CampaignStatus
  total_recipients: number
  successful_sends: number
  failed_sends: number
  created_by?: string
  created_at: string
  updated_at: string
}

// Extended types with relationships
export interface ClientWithAttorney extends Client {
  attorney?: StaffUser
}

export interface ClientWithAssignments extends Client {
  docket_assignments?: ClientDocketAssignment[]
}

export interface DocketWithCourt extends Docket {
  court?: Court
}

export interface DocketWithClients extends Docket {
  court?: Court
  client_assignments?: ClientDocketAssignment[]
  clients?: Client[]
}

export interface CourtDateWithClient extends CourtDate {
  client?: Client
  docket?: Docket
}

export interface SMSMessageWithDetails extends SMSMessage {
  client?: Client
  template?: SMSTemplate
  docket?: Docket
}

export interface SMSCampaignWithDetails extends SMSCampaign {
  docket?: Docket
  template?: SMSTemplate
  created_by_user?: StaffUser
}

// Form types for creating/updating
export interface CreateCourtData {
  name: string
  address_street?: string
  address_city?: string
  address_state?: string
  address_zip?: string
  phone?: string
  email?: string
  website?: string
}

export interface CreateDocketData {
  court_id: string
  docket_date: string
  docket_time?: string
  judge_name?: string
  docket_type?: string
  description?: string
}

export interface CreateClientData {
  first_name: string
  last_name: string
  phone: string
  email?: string
  address_street?: string
  address_city?: string
  address_state?: string
  address_zip?: string
  case_number?: string
  attorney_id?: string
  notes?: string
}

export interface CreateSMSTemplateData {
  name: string
  message_text: string
  days_before: number
  court_id?: string
}

export interface CreateSMSCampaignData {
  name: string
  docket_id?: string
  template_id?: string
  custom_message?: string
  scheduled_for?: string
}

export interface AssignClientToDocketData {
  client_id: string
  docket_id: string
  notes?: string
}

// Dashboard statistics types
export interface DashboardStats {
  totalClients: number
  totalCourts: number
  totalDockets: number
  upcomingDockets: number
  pendingSMS: number
  sentSMS: number
  deliveredSMS: number
  activeCampaigns: number
}

// Filter types for UI
export interface ClientFilters {
  search?: string
  case_status?: CaseStatus
  attorney_id?: string
  court_id?: string
  docket_id?: string
}

export interface DocketFilters {
  court_id?: string
  date_from?: string
  date_to?: string
  judge_name?: string
  docket_type?: string
}

export interface MessageFilters {
  client_id?: string
  docket_id?: string
  delivery_status?: SMSStatus
  date_from?: string
  date_to?: string
}




