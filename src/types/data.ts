export interface RawCsvRow {
  [key: string]: string;
}

export interface PatientRow {
  patientId: string;
  age: number | null;
  gender: string;
  heightCm: number | null;
  weightKg: number | null;
  systolicBP: number | null;
  diastolicBP: number | null;
  fastingGlucose: number | null;
  hba1c: number | null;
  totalCholesterol: number | null;
  ldl: number | null;
  hdl: number | null;
  triglycerides: number | null;
  vitaminD: number | null;
  smokingStatus: string;
  alcoholUse: string;
  exerciseFrequency: string;
  sleepDuration: number | null;
  familyHistory: string;
  diseaseLabel: string;
  notes: string;
  sourceRow: number;
}

export interface CleanedPatientRow extends PatientRow {
  ageGroup: string;
  bmi: number | null;
  bmiCategory: string;
  bpCategory: string;
  glucoseCategory: string;
  cholesterolCategory: string;
  riskFactorCount: number;
  riskFlags: string[];
  dataCompleteness: number;
}

export interface ColumnIssueSummary {
  key: string;
  label: string;
  count: number;
  percentage: number;
}

export interface CleaningReport {
  totalRows: number;
  retainedRows: number;
  removedEmptyRows: number;
  duplicateRowsRemoved: number;
  invalidValueCount: number;
  outlierCount: number;
  averageCompleteness: number;
  recognizedColumns: string[];
  missingByColumn: ColumnIssueSummary[];
  invalidByColumn: ColumnIssueSummary[];
  outlierByColumn: ColumnIssueSummary[];
}

export interface DatasetBundle {
  fileName: string;
  importedAt: string;
  rawRows: RawCsvRow[];
  cleanedRows: CleanedPatientRow[];
  cleaningReport: CleaningReport;
}

export interface FilterState {
  search: string;
  gender: string;
  diseaseLabel: string;
  smokingStatus: string;
  bmiCategory: string;
  ageGroup: string;
  glucoseCategory: string;
  minAge: string;
  maxAge: string;
}

export interface DashboardMetric {
  label: string;
  value: string;
  helper: string;
}

export interface NumericSummary {
  key: string;
  label: string;
  count: number;
  missing: number;
  mean: number | null;
  median: number | null;
  min: number | null;
  max: number | null;
}

export interface HistogramBin {
  label: string;
  count: number;
}

export interface CategoryCount {
  label: string;
  count: number;
  percentage: number;
}

export interface ScatterPoint {
  x: number;
  y: number;
  label: string;
  group: string;
}

export interface CorrelationCell {
  key: string;
  label: string;
  value: number;
  sampleSize: number;
}

export interface CorrelationRow {
  key: string;
  label: string;
  cells: CorrelationCell[];
}

export interface CorrelationPair {
  leftKey: string;
  leftLabel: string;
  rightKey: string;
  rightLabel: string;
  value: number;
  sampleSize: number;
}

export interface CorrelationMatrix {
  keys: string[];
  rows: CorrelationRow[];
  strongestPairs: CorrelationPair[];
}

export interface Insight {
  title: string;
  detail: string;
  emphasis: "high" | "medium" | "low";
  category: "data-quality" | "cohort" | "correlation" | "risk-pattern";
}

export const SOURCE_FIELD_LABELS: Record<keyof PatientRow, string> = {
  patientId: "Patient ID",
  age: "Age",
  gender: "Gender",
  heightCm: "Height (cm)",
  weightKg: "Weight (kg)",
  systolicBP: "Systolic BP",
  diastolicBP: "Diastolic BP",
  fastingGlucose: "Fasting Glucose",
  hba1c: "HbA1c",
  totalCholesterol: "Total Cholesterol",
  ldl: "LDL",
  hdl: "HDL",
  triglycerides: "Triglycerides",
  vitaminD: "Vitamin D",
  smokingStatus: "Smoking Status",
  alcoholUse: "Alcohol Use",
  exerciseFrequency: "Exercise Frequency",
  sleepDuration: "Sleep Duration",
  familyHistory: "Family History",
  diseaseLabel: "Disease Label",
  notes: "Notes",
  sourceRow: "Source Row",
};

export const DERIVED_FIELD_LABELS = {
  ageGroup: "Age Group",
  bmi: "BMI",
  bmiCategory: "BMI Category",
  bpCategory: "Blood Pressure Category",
  glucoseCategory: "Glucose Category",
  cholesterolCategory: "Cholesterol Category",
  riskFactorCount: "Risk Factor Count",
  riskFlags: "Risk Flags",
  dataCompleteness: "Data Completeness",
} as const;

export const FIELD_LABELS: Record<string, string> = {
  ...SOURCE_FIELD_LABELS,
  ...DERIVED_FIELD_LABELS,
};

export const FIELD_ALIASES: Record<keyof PatientRow, string[]> = {
  patientId: ["patientid", "patient_id", "id", "recordid"],
  age: ["age", "patientage"],
  gender: ["gender", "sex", "patientgender"],
  heightCm: ["heightcm", "height_cm", "height"],
  weightKg: ["weightkg", "weight_kg", "weight"],
  systolicBP: ["systolicbp", "systolic_bp", "sbp", "bloodpressuresystolic"],
  diastolicBP: ["diastolicbp", "diastolic_bp", "dbp", "bloodpressurediastolic"],
  fastingGlucose: ["fastingglucose", "fasting_glucose", "glucose", "bloodglucose"],
  hba1c: ["hba1c", "a1c"],
  totalCholesterol: ["totalcholesterol", "total_cholesterol", "cholesterol"],
  ldl: ["ldl", "ldlcholesterol", "ldl_c"],
  hdl: ["hdl", "hdlcholesterol", "hdl_c"],
  triglycerides: ["triglycerides", "triglyceride", "tg"],
  vitaminD: ["vitamind", "vitamin_d", "vitd"],
  smokingStatus: ["smokingstatus", "smoking_status", "smoker", "smoking"],
  alcoholUse: ["alcoholuse", "alcohol_use", "alcohol"],
  exerciseFrequency: ["exercisefrequency", "exercise_frequency", "exercise", "activitylevel"],
  sleepDuration: ["sleepduration", "sleep_duration", "sleephours", "sleep"],
  familyHistory: ["familyhistory", "family_history"],
  diseaseLabel: ["diseaselabel", "disease_label", "diagnosis", "condition", "target"],
  notes: ["notes", "symptoms", "comments"],
  sourceRow: [],
};

export const CORE_ANALYSIS_FIELDS: Array<keyof PatientRow> = [
  "age",
  "gender",
  "heightCm",
  "weightKg",
  "systolicBP",
  "diastolicBP",
  "fastingGlucose",
  "hba1c",
  "totalCholesterol",
  "ldl",
  "hdl",
  "triglycerides",
  "smokingStatus",
  "exerciseFrequency",
  "diseaseLabel",
];

export const REVIEW_FIELD_KEYS: Array<keyof PatientRow> = [
  "age",
  "gender",
  "heightCm",
  "weightKg",
  "systolicBP",
  "diastolicBP",
  "fastingGlucose",
  "hba1c",
  "totalCholesterol",
  "ldl",
  "hdl",
  "triglycerides",
  "vitaminD",
  "smokingStatus",
  "alcoholUse",
  "exerciseFrequency",
  "sleepDuration",
  "familyHistory",
  "diseaseLabel",
];

export const NUMERIC_SUMMARY_FIELDS = [
  "age",
  "bmi",
  "systolicBP",
  "fastingGlucose",
  "hba1c",
  "ldl",
  "hdl",
  "triglycerides",
] as const;

export const CORRELATION_FIELDS = [
  "age",
  "bmi",
  "systolicBP",
  "diastolicBP",
  "fastingGlucose",
  "hba1c",
  "totalCholesterol",
  "ldl",
  "hdl",
  "triglycerides",
] as const;

export const DEFAULT_FILTERS: FilterState = {
  search: "",
  gender: "",
  diseaseLabel: "",
  smokingStatus: "",
  bmiCategory: "",
  ageGroup: "",
  glucoseCategory: "",
  minAge: "",
  maxAge: "",
};
