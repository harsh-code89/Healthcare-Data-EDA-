import type { CleanedPatientRow, PatientRow } from "../types/data";

function compactWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function titleCase(value: string) {
  if (!value.trim()) {
    return "";
  }

  return value
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeGender(value: string) {
  const normalized = compactWhitespace(value).toLowerCase();

  if (!normalized) {
    return "Unknown";
  }

  if (normalized.startsWith("m")) {
    return "Male";
  }

  if (normalized.startsWith("f")) {
    return "Female";
  }

  return titleCase(normalized);
}

function normalizeSmokingStatus(value: string) {
  const normalized = compactWhitespace(value).toLowerCase();

  if (!normalized) {
    return "Unknown";
  }

  if (normalized.includes("current") || normalized.includes("yes")) {
    return "Current";
  }

  if (normalized.includes("former") || normalized.includes("quit")) {
    return "Former";
  }

  if (normalized.includes("never") || normalized.includes("no")) {
    return "Never";
  }

  return titleCase(normalized);
}

function normalizeAlcoholUse(value: string) {
  const normalized = compactWhitespace(value).toLowerCase();

  if (!normalized) {
    return "Unknown";
  }

  if (normalized.includes("heavy")) {
    return "Heavy";
  }

  if (normalized.includes("moderate")) {
    return "Moderate";
  }

  if (normalized.includes("light") || normalized.includes("occasional")) {
    return "Light";
  }

  if (normalized.includes("none") || normalized.includes("never") || normalized.includes("no")) {
    return "None";
  }

  return titleCase(normalized);
}

function normalizeExerciseFrequency(value: string) {
  const normalized = compactWhitespace(value).toLowerCase();

  if (!normalized) {
    return "Unknown";
  }

  if (
    normalized.includes("none") ||
    normalized.includes("sedentary") ||
    normalized.includes("0")
  ) {
    return "Sedentary";
  }

  if (normalized.includes("1") || normalized.includes("2") || normalized.includes("light")) {
    return "Light";
  }

  if (normalized.includes("3") || normalized.includes("4") || normalized.includes("moderate")) {
    return "Moderate";
  }

  if (
    normalized.includes("5") ||
    normalized.includes("6") ||
    normalized.includes("daily") ||
    normalized.includes("active")
  ) {
    return "Active";
  }

  return titleCase(normalized);
}

export function calculateBmi(weightKg: number | null, heightCm: number | null) {
  if (!weightKg || !heightCm || heightCm <= 0) {
    return null;
  }

  const heightM = heightCm / 100;
  return Number((weightKg / (heightM * heightM)).toFixed(1));
}

export function getBmiCategory(bmi: number | null) {
  if (bmi === null) {
    return "Unknown";
  }

  if (bmi < 18.5) {
    return "Underweight";
  }

  if (bmi < 25) {
    return "Healthy";
  }

  if (bmi < 30) {
    return "Overweight";
  }

  return "Obesity";
}

export function getAgeGroup(age: number | null) {
  if (age === null) {
    return "Unknown";
  }

  if (age < 30) {
    return "Under 30";
  }

  if (age < 45) {
    return "30-44";
  }

  if (age < 60) {
    return "45-59";
  }

  return "60+";
}

export function getBloodPressureCategory(
  systolicBP: number | null,
  diastolicBP: number | null,
) {
  if (systolicBP === null || diastolicBP === null) {
    return "Unknown";
  }

  if (systolicBP >= 140 || diastolicBP >= 90) {
    return "Hypertension";
  }

  if (systolicBP >= 120 || diastolicBP >= 80) {
    return "Elevated";
  }

  return "Healthy";
}

export function getGlucoseCategory(
  fastingGlucose: number | null,
  hba1c: number | null,
) {
  if (fastingGlucose === null && hba1c === null) {
    return "Unknown";
  }

  if (
    (fastingGlucose !== null && fastingGlucose >= 126) ||
    (hba1c !== null && hba1c >= 6.5)
  ) {
    return "Diabetes Range";
  }

  if (
    (fastingGlucose !== null && fastingGlucose >= 100) ||
    (hba1c !== null && hba1c >= 5.7)
  ) {
    return "Prediabetes Range";
  }

  return "Healthy";
}

export function getCholesterolCategory(
  totalCholesterol: number | null,
  ldl: number | null,
) {
  if (totalCholesterol === null && ldl === null) {
    return "Unknown";
  }

  if (
    (totalCholesterol !== null && totalCholesterol >= 240) ||
    (ldl !== null && ldl >= 160)
  ) {
    return "High";
  }

  if (
    (totalCholesterol !== null && totalCholesterol >= 200) ||
    (ldl !== null && ldl >= 130)
  ) {
    return "Borderline";
  }

  return "Healthy";
}

function buildRiskFlags(row: PatientRow, derived: Omit<CleanedPatientRow, keyof PatientRow>) {
  const flags: string[] = [];

  if (derived.bmiCategory === "Overweight" || derived.bmiCategory === "Obesity") {
    flags.push("BMI");
  }

  if (derived.bpCategory === "Elevated" || derived.bpCategory === "Hypertension") {
    flags.push("Blood pressure");
  }

  if (
    derived.glucoseCategory === "Prediabetes Range" ||
    derived.glucoseCategory === "Diabetes Range"
  ) {
    flags.push("Glucose");
  }

  if (
    derived.cholesterolCategory === "Borderline" ||
    derived.cholesterolCategory === "High"
  ) {
    flags.push("Cholesterol");
  }

  if (row.smokingStatus === "Current") {
    flags.push("Smoking");
  }

  if (row.alcoholUse === "Heavy") {
    flags.push("Alcohol");
  }

  if (row.exerciseFrequency === "Sedentary") {
    flags.push("Activity");
  }

  if (row.sleepDuration !== null && row.sleepDuration < 6) {
    flags.push("Sleep");
  }

  if (row.diseaseLabel !== "Healthy" && row.diseaseLabel !== "Unspecified") {
    flags.push("Diagnosis");
  }

  return flags;
}

export function buildDerivedPatientRow(row: PatientRow): CleanedPatientRow {
  const normalizedRow: PatientRow = {
    ...row,
    gender: normalizeGender(row.gender),
    smokingStatus: normalizeSmokingStatus(row.smokingStatus),
    alcoholUse: normalizeAlcoholUse(row.alcoholUse),
    exerciseFrequency: normalizeExerciseFrequency(row.exerciseFrequency),
    familyHistory: compactWhitespace(row.familyHistory),
    diseaseLabel: titleCase(row.diseaseLabel) || "Unspecified",
    notes: compactWhitespace(row.notes),
  };

  const completenessFields = [
    normalizedRow.age,
    normalizedRow.gender,
    normalizedRow.heightCm,
    normalizedRow.weightKg,
    normalizedRow.systolicBP,
    normalizedRow.diastolicBP,
    normalizedRow.fastingGlucose,
    normalizedRow.hba1c,
    normalizedRow.totalCholesterol,
    normalizedRow.ldl,
    normalizedRow.hdl,
    normalizedRow.triglycerides,
    normalizedRow.smokingStatus,
    normalizedRow.exerciseFrequency,
    normalizedRow.diseaseLabel,
  ];

  const presentFieldCount = completenessFields.filter((value) => {
    if (typeof value === "number") {
      return true;
    }

    return Boolean(String(value).trim()) && String(value).trim().toLowerCase() !== "unknown";
  }).length;

  const bmi = calculateBmi(normalizedRow.weightKg, normalizedRow.heightCm);

  const derived: Omit<CleanedPatientRow, keyof PatientRow> = {
    ageGroup: getAgeGroup(normalizedRow.age),
    bmi,
    bmiCategory: getBmiCategory(bmi),
    bpCategory: getBloodPressureCategory(
      normalizedRow.systolicBP,
      normalizedRow.diastolicBP,
    ),
    glucoseCategory: getGlucoseCategory(
      normalizedRow.fastingGlucose,
      normalizedRow.hba1c,
    ),
    cholesterolCategory: getCholesterolCategory(
      normalizedRow.totalCholesterol,
      normalizedRow.ldl,
    ),
    riskFactorCount: 0,
    riskFlags: [],
    dataCompleteness: Number(((presentFieldCount / completenessFields.length) * 100).toFixed(0)),
  };

  const riskFlags = buildRiskFlags(normalizedRow, derived);

  return {
    ...normalizedRow,
    ...derived,
    riskFlags,
    riskFactorCount: riskFlags.length,
  };
}
