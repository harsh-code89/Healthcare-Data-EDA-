// ============================================================
// CareOS — Core Type Definitions
// ============================================================

// ── Role & Enum Types ─────────────────────────────────────────
export type UserRole = 'patient' | 'provider' | 'admin';
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Unknown';
export type AppointmentStatus = 'upcoming' | 'completed' | 'cancelled' | 'missed';
export type AppointmentType = 'in_person' | 'teleconsultation';
export type ReportCategory = 'blood_test' | 'imaging' | 'ecg' | 'pathology' | 'urine_test' | 'other';
export type TimelineEventType =
  | 'consultation'
  | 'diagnosis'
  | 'prescription'
  | 'lab_report'
  | 'imaging'
  | 'vaccination'
  | 'procedure'
  | 'medication_change'
  | 'follow_up'
  | 'symptom';
export type MedicationFrequency =
  | 'once_daily'
  | 'twice_daily'
  | 'thrice_daily'
  | 'four_times_daily'
  | 'as_needed'
  | 'weekly'
  | 'monthly';
export type ConsentStatus = 'active' | 'revoked' | 'expired';
export type AllergySeverity = 'mild' | 'moderate' | 'severe' | 'life_threatening';
/** @alias AllergySeverity — lowercase 's' variant kept for spec compatibility */
export type Allergyseverity = AllergySeverity;
export type DiagnosisStatus = 'active' | 'resolved' | 'chronic';

// ── PageId ────────────────────────────────────────────────────
export type PageId =
  | 'dashboard'
  | 'appointments'
  | 'medications'
  | 'reports'
  | 'timeline'
  | 'ai-assistant'
  | 'emergency'
  | 'family'
  | 'consent'
  | 'profile'
  | 'provider-dashboard'
  | 'provider-patients'
  | 'provider-schedule'
  | 'admin-dashboard'
  | 'admin-users'
  | 'admin-providers'
  | 'settings';

// ── AppState (used by AppContext reducer) ─────────────────────
export interface AppState {
  currentPage: PageId;
  sidebarOpen: boolean;
  darkMode: boolean;
  role: UserRole;
  notifications: Notification[];
  demoBannerDismissed: boolean;
}

// ── Patient ───────────────────────────────────────────────────
export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string; // ISO date
  gender: Gender;
  bloodGroup: BloodGroup;
  abhaId?: string;
  address?: string;
  city?: string;
  state?: string;
  emergencyContacts: EmergencyContact[];
  allergies: Allergy[];
  chronicConditions: string[];
  height?: number; // cm
  weight?: number; // kg
  createdAt: string;
  updatedAt: string;
}

// ── Provider ──────────────────────────────────────────────────
export interface Provider {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialties: string[];
  qualifications: string[];
  hospital: string;
  city: string;
  state: string;
  registrationNumber: string;
  isVerified: boolean;
  consultationFee: number;
  availableDays: string[];
  availableSlots?: string[];
  profileImageUrl?: string;
  yearsExperience: number;
  languages: string[];
}

// ── Appointment ───────────────────────────────────────────────
export interface Appointment {
  id: string;
  patientId: string;
  patientName?: string;
  providerId: string;
  providerName: string;
  specialty: string;
  hospital: string;
  date: string; // ISO date
  time: string;
  status: AppointmentStatus;
  type: AppointmentType;
  chiefComplaint?: string;
  notes?: string;
  followUpDate?: string;
  consultationFee?: number;
  createdAt: string;
}

// ── Medication ────────────────────────────────────────────────
export interface Medication {
  id: string;
  name: string;
  genericName?: string;
  dosage: string;
  frequency: MedicationFrequency;
  route: string; // oral, topical, injection, inhaler, etc.
  startDate: string;
  endDate?: string;
  prescribedBy: string;
  prescriberId: string;
  isActive: boolean;
  instructions?: string;
  reminderEnabled: boolean;
  reminderTimes?: string[];
  dispensingUnit?: string;
}

// ── Health Report ─────────────────────────────────────────────
export interface HealthReport {
  id: string;
  name: string;
  category: ReportCategory;
  reportDate: string;
  uploadedAt: string;
  labName?: string;
  orderedBy?: string;
  orderedById?: string;
  fileType: 'pdf' | 'image';
  fileSize: number; // bytes
  fileUrl?: string; // null in demo
  summary?: string;
  isAIExplained: boolean;
  tags?: string[];
}

// ── Timeline Event ────────────────────────────────────────────
export interface TimelineEvent {
  id: string;
  date: string;
  type: TimelineEventType;
  title: string;
  description: string;
  provider?: string;
  providerId?: string;
  hospital?: string;
  documents?: string[];
  tags?: string[];
  isImportant: boolean;
  linkedReportId?: string;
  linkedAppointmentId?: string;
}

// ── Diagnosis ─────────────────────────────────────────────────
export interface Diagnosis {
  id: string;
  condition: string;
  icdCode?: string;
  diagnosedDate: string;
  diagnosedBy: string;
  status: DiagnosisStatus;
  notes?: string;
}

// ── Prescription ──────────────────────────────────────────────
export interface Prescription {
  id: string;
  prescriptionDate: string;
  prescribedBy: string;
  prescriberId: string;
  hospital?: string;
  medications: Medication[];
  diagnosis?: string;
  instructions: string;
  validUntil?: string;
  isRefillAllowed: boolean;
}

// ── Allergy ───────────────────────────────────────────────────
export interface Allergy {
  id: string;
  allergen: string;
  allergyType: 'drug' | 'food' | 'environmental' | 'other';
  severity: AllergySeverity;
  reaction: string;
  diagnosedDate?: string;
  notes?: string;
}

// ── Emergency Contact ─────────────────────────────────────────
export interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  alternatePhone?: string;
  isEmergencyContact: boolean;
}

// ── Vaccination ───────────────────────────────────────────────
export interface VaccinationRecord {
  id: string;
  vaccineName: string;
  date: string;
  nextDueDate?: string;
  administeredAt?: string;
  administeredBy?: string;
  batchNumber?: string;
  notes?: string;
}

// ── Consent ───────────────────────────────────────────────────
export interface ConsentRecord {
  id: string;
  providerName: string;
  providerId: string;
  purpose: string;
  grantedDate: string;
  expiryDate?: string;
  status: ConsentStatus;
  dataTypes: string[];
  revokedDate?: string;
}

// ── Family Member ─────────────────────────────────────────────
export interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  dateOfBirth: string;
  gender: Gender;
  bloodGroup: BloodGroup;
  isDependent: boolean;
  linkedPatientId?: string;
  allergies?: Allergy[];
  chronicConditions?: string[];
}

// ── AI ────────────────────────────────────────────────────────
export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isDemo: boolean;
  attachedReportName?: string;
  suggestedQuestions?: string[];
}

// ── Emergency Profile ─────────────────────────────────────────
export interface EmergencyProfile {
  patientId: string;
  bloodGroup: BloodGroup;
  criticalAllergies: Allergy[];
  currentMedications: Medication[];
  emergencyContacts: EmergencyContact[];
  chronicConditions: string[];
  importantNotes?: string;
  doNotResuscitate?: boolean;
  organDonor?: boolean;
  lastUpdated: string;
}

// ── Stats ─────────────────────────────────────────────────────
export interface ProviderStats {
  totalPatients: number;
  todayAppointments: number;
  completedToday: number;
  pendingFollowUps: number;
  totalConsultations: number;
  newPatientsThisMonth: number;
}

export interface AdminStats {
  totalUsers: number;
  totalProviders: number;
  totalAppointments: number;
  activeToday: number;
  pendingVerifications: number;
  reportsUploaded: number;
  newUsersThisWeek: number;
}

// ── Navigation ────────────────────────────────────────────────
export interface NavItem {
  id: string;
  label: string;
  /** Lucide icon name, e.g. "LayoutDashboard" */
  icon: string;
  badge?: number;
}

// ── Notification ──────────────────────────────────────────────
export interface Notification {
  id: string;
  type: 'appointment' | 'medication' | 'report' | 'system';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
}
