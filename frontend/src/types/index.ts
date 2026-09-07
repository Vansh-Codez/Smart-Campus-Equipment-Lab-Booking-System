export type UserRole = 'student' | 'lab_assistant' | 'admin';

export const ACADEMIC_DEPARTMENTS = [
  'CSE-1',
  'CSE-2',
  'CSE-AIML',
  'CSE-IT',
  'CSE-DS',
  'ECE',
] as const;

export type AcademicDepartment = (typeof ACADEMIC_DEPARTMENTS)[number];

export const EQUIPMENT_CATEGORIES = [
  'All',
  'AI & GPU Systems',
  'Software & Dev Workstations',
  'Networking & Cyber Security',
  'Digital Logic & Electronics',
  'Physics & Optics Labware',
  'Chemistry & Analytical Tools',
  'CAD & Design Terminals',
  'Workshop Tools & Machinery',
  'Smart Classroom & AV Tech',
] as const;

export type EquipmentCategory = (typeof EQUIPMENT_CATEGORIES)[number];

export interface RecordVerification {
  matched: boolean;
  record_id?: number;
  official_name?: string;
  official_department?: string;
  batch_year?: string;
  status?: string;
  name_matches?: boolean;
  department_matches?: boolean;
  message?: string;
}

export interface StudentRecord {
  id: number;
  enrollment_no: string;
  name: string;
  department: string;
  batch_year: string;
  status: string;
  created_at: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  enrollment_no?: string;
  is_approved?: boolean;
  created_at: string;
  record_verification?: RecordVerification;
}

export interface AuthResponse {
  access_token?: string;
  token_type?: string;
  user: User;
  is_approved?: boolean;
  message?: string;
}

export interface Lab {
  id: number;
  name: string;
  location: string;
  capacity: number;
  description?: string;
  department?: string;
  created_at: string;
}

export type EquipmentStatus = 'available' | 'booked' | 'issued' | 'under_maintenance' | 'overdue';

export interface Equipment {
  id: number;
  name: string;
  category: string;
  description?: string;
  status: EquipmentStatus;
  lab_id: number;
  image_url?: string;
  serial_number?: string;
  specs?: string;
  created_at: string;
  lab?: Lab;
}

export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'checked_out' | 'returned' | 'overdue';

export interface Booking {
  id: number;
  user_id: number;
  equipment_id: number;
  start_time: string;
  end_time: string;
  justification: string;
  status: BookingStatus;
  assistant_notes?: string;
  check_out_condition?: string;
  check_out_photo?: string;
  check_in_condition?: string;
  reminder_sent: number;
  created_at: string;
  updated_at: string;
  user?: User;
  equipment?: Equipment;
}

export interface Lifecycle {
  id: number;
  equipment_id: number;
  state: EquipmentStatus;
  timestamp: string;
  updated_by: string;
  notes?: string;
}

export interface MaintenanceLog {
  id: number;
  equipment_id: number;
  issue_description: string;
  reported_by: string;
  resolved_status: 'open' | 'in_progress' | 'resolved';
  cost?: number;
  resolution_notes?: string;
  created_at: string;
  resolved_at?: string;
  equipment?: Equipment;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'reminder_24h' | 'overdue_alert' | 'booking_status' | 'maintenance' | 'info';
  is_read: boolean;
  created_at: string;
}

export interface KPISummary {
  total_equipment: number;
  active_bookings: number;
  pending_requisitions: number;
  overdue_count: number;
  utilization_rate: number;
  overdue_rate: number;
  maintenance_count: number;
  total_labs: number;
  total_users: number;
}

export interface MostBookedItem {
  equipment_id: number;
  equipment_name: string;
  category: string;
  booking_count: number;
}

export interface PeakHourSlot {
  hour: string;
  count: number;
}

export interface OverdueTrendItem {
  period: string;
  overdue: number;
  returned_on_time: number;
}

export interface CategoryUtilization {
  category: string;
  total: number;
  in_use: number;
  utilization: number;
}

export interface AnalyticsDashboard {
  kpis: KPISummary;
  most_booked: MostBookedItem[];
  peak_hours: PeakHourSlot[];
  overdue_trends: OverdueTrendItem[];
  category_utilization: CategoryUtilization[];
}
