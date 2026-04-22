export interface HealthData {
  // Demographics
  age: number;
  gender: string;
  heightCm: number;
  weightKg: number;

  // Medical History
  pastMedicalHistory: string;
  familyMedicalHistory: string;

  // Lab Reports
  totalCholesterol: string;
  ldl: string;
  hdl: string;
  triglycerides: string;
  fastingGlucose: string;
  hba1c: string;
  hemoglobin: string;
  vitaminD: string;
  vitaminB12: string;
  tsh: string;
  creatinine: string;
  alt: string;
  ast: string;

  // Vitals
  systolicBP: string;
  diastolicBP: string;
  restingHeartRate: string;

  // Lifestyle
  currentMedications: string;
  dietPattern: string;
  exerciseRoutine: string;
  exerciseFrequency: string;
  sleepDuration: string;
  sleepQuality: string;
  stressLevel: string;
  smokingStatus: string;
  alcoholUse: string;

  // Goals & Concerns
  primaryGoals: string[];
  symptoms: string;
}

export type UrgencyLevel = 'low' | 'moderate' | 'high';

export interface Recommendation {
  title: string;
  category: 'lifestyle' | 'diet' | 'exercise' | 'supplement' | 'preventive';
  description: string;
  advantages: string[];
  disadvantages: string[];
  alternatives: string[];
  urgency: UrgencyLevel;
  requiresDoctor: boolean;
  doctorNote?: string;
}

export interface RiskFactor {
  name: string;
  description: string;
  severity: UrgencyLevel;
  relatedValues?: string;
}

export interface HealthReport {
  summary: string;
  bmi: number;
  bmiCategory: string;
  riskFactors: RiskFactor[];
  recommendations: Recommendation[];
  overallUrgency: UrgencyLevel;
  doctorAdvisory: string[];
  positiveFindings: string[];
}
