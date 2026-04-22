import {
  FIELD_ALIASES,
  REVIEW_FIELD_KEYS,
  SOURCE_FIELD_LABELS,
  type CleaningReport,
  type CleanedPatientRow,
  type ColumnIssueSummary,
  type PatientRow,
  type RawCsvRow,
} from "../types/data";
import { buildDerivedPatientRow } from "./featureEngineering";

const numericRules: Partial<
  Record<
    keyof PatientRow,
    {
      hardMin: number;
      hardMax: number;
      outlierMin?: number;
      outlierMax?: number;
    }
  >
> = {
  age: { hardMin: 0, hardMax: 120, outlierMin: 18, outlierMax: 90 },
  heightCm: { hardMin: 80, hardMax: 260, outlierMin: 130, outlierMax: 210 },
  weightKg: { hardMin: 20, hardMax: 300, outlierMin: 40, outlierMax: 180 },
  systolicBP: { hardMin: 70, hardMax: 260, outlierMin: 90, outlierMax: 200 },
  diastolicBP: { hardMin: 40, hardMax: 160, outlierMin: 60, outlierMax: 120 },
  fastingGlucose: { hardMin: 30, hardMax: 400, outlierMin: 70, outlierMax: 250 },
  hba1c: { hardMin: 3, hardMax: 20, outlierMin: 4, outlierMax: 12 },
  totalCholesterol: { hardMin: 70, hardMax: 500, outlierMin: 120, outlierMax: 350 },
  ldl: { hardMin: 10, hardMax: 350, outlierMin: 50, outlierMax: 250 },
  hdl: { hardMin: 10, hardMax: 150, outlierMin: 25, outlierMax: 100 },
  triglycerides: { hardMin: 20, hardMax: 1000, outlierMin: 50, outlierMax: 500 },
  vitaminD: { hardMin: 0, hardMax: 200, outlierMin: 10, outlierMax: 100 },
  sleepDuration: { hardMin: 0, hardMax: 24, outlierMin: 4, outlierMax: 10 },
};

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeTextValue(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function createCountMap<T extends string>(keys: readonly T[]) {
  return Object.fromEntries(keys.map((key) => [key, 0])) as Record<T, number>;
}

function pickValue(
  normalizedRow: Record<string, string>,
  field: keyof PatientRow,
) {
  const aliases = FIELD_ALIASES[field];

  for (const alias of aliases) {
    if (alias in normalizedRow) {
      return normalizedRow[alias];
    }
  }

  return "";
}

function parseNumber(
  rawValue: string,
  field: keyof PatientRow,
  missingCounts: Record<string, number>,
  invalidCounts: Record<string, number>,
  outlierCounts: Record<string, number>,
) {
  const trimmed = normalizeTextValue(rawValue);

  if (!trimmed) {
    missingCounts[field] += 1;
    return null;
  }

  const cleaned = trimmed.replace(/,/g, "");
  const numericValue = Number(cleaned);

  if (!Number.isFinite(numericValue)) {
    invalidCounts[field] += 1;
    return null;
  }

  const rule = numericRules[field];

  if (rule && (numericValue < rule.hardMin || numericValue > rule.hardMax)) {
    invalidCounts[field] += 1;
    outlierCounts[field] += 1;
    return null;
  }

  if (
    rule &&
    ((rule.outlierMin !== undefined && numericValue < rule.outlierMin) ||
      (rule.outlierMax !== undefined && numericValue > rule.outlierMax))
  ) {
    outlierCounts[field] += 1;
  }

  return numericValue;
}

function parseText(
  rawValue: string,
  field: keyof PatientRow,
  missingCounts: Record<string, number>,
) {
  const trimmed = normalizeTextValue(rawValue);

  if (!trimmed) {
    missingCounts[field] += 1;
    return "";
  }

  return trimmed;
}

function isMeaningfulRow(row: PatientRow) {
  const values = Object.entries(row).filter(([key]) => key !== "sourceRow");
  return values.some(([, value]) => {
    if (typeof value === "number") {
      return true;
    }

    return Boolean(String(value).trim());
  });
}

function buildSignature(row: PatientRow) {
  return JSON.stringify({
    age: row.age,
    gender: row.gender,
    heightCm: row.heightCm,
    weightKg: row.weightKg,
    systolicBP: row.systolicBP,
    diastolicBP: row.diastolicBP,
    fastingGlucose: row.fastingGlucose,
    hba1c: row.hba1c,
    totalCholesterol: row.totalCholesterol,
    ldl: row.ldl,
    hdl: row.hdl,
    triglycerides: row.triglycerides,
    smokingStatus: row.smokingStatus,
    alcoholUse: row.alcoholUse,
    exerciseFrequency: row.exerciseFrequency,
    diseaseLabel: row.diseaseLabel,
  });
}

function mapCountSummary(
  counts: Record<string, number>,
  totalRows: number,
): ColumnIssueSummary[] {
  return Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([key, count]) => ({
      key,
      label: SOURCE_FIELD_LABELS[key as keyof PatientRow] ?? key,
      count,
      percentage: totalRows === 0 ? 0 : Number(((count / totalRows) * 100).toFixed(1)),
    }))
    .sort((left, right) => right.count - left.count);
}

export function parseCsvText(text: string): RawCsvRow[] {
  const rows: string[][] = [];
  let currentCell = "";
  let currentRow: string[] = [];
  let inQuotes = false;

  const normalizedText = text.replace(/^\uFEFF/, "");

  for (let index = 0; index < normalizedText.length; index += 1) {
    const character = normalizedText[index];
    const nextCharacter = normalizedText[index + 1];

    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        currentCell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === "," && !inQuotes) {
      currentRow.push(currentCell);
      currentCell = "";
      continue;
    }

    if ((character === "\n" || character === "\r") && !inQuotes) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }

      currentRow.push(currentCell);
      currentCell = "";

      if (currentRow.some((cell) => cell.trim() !== "")) {
        rows.push(currentRow);
      }

      currentRow = [];
      continue;
    }

    currentCell += character;
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    if (currentRow.some((cell) => cell.trim() !== "")) {
      rows.push(currentRow);
    }
  }

  if (rows.length === 0) {
    return [];
  }

  const [headerRow, ...valueRows] = rows;
  const headers = headerRow.map((header, index) => {
    const trimmed = header.trim();
    return trimmed || `column_${index + 1}`;
  });

  return valueRows.map((row) => {
    const record: RawCsvRow = {};

    headers.forEach((header, index) => {
      record[header] = normalizeTextValue(row[index] ?? "");
    });

    return record;
  });
}

export function cleanDataset(rawRows: RawCsvRow[]) {
  const sourceKeys = Object.keys(SOURCE_FIELD_LABELS) as Array<keyof PatientRow>;
  const trackedKeys = REVIEW_FIELD_KEYS as string[];
  const missingCounts = createCountMap(trackedKeys);
  const invalidCounts = createCountMap(trackedKeys);
  const outlierCounts = createCountMap(trackedKeys);
  const recognizedColumns = new Set<string>();
  const cleanedRows: CleanedPatientRow[] = [];
  const signatures = new Set<string>();
  let removedEmptyRows = 0;
  let duplicateRowsRemoved = 0;

  rawRows.forEach((rawRow, index) => {
    const normalizedRow = Object.fromEntries(
      Object.entries(rawRow).map(([key, value]) => [normalizeHeader(key), value]),
    );

    sourceKeys.forEach((field) => {
      if (field === "sourceRow") {
        return;
      }

      const aliases = FIELD_ALIASES[field];
      if (aliases.some((alias) => alias in normalizedRow)) {
        recognizedColumns.add(SOURCE_FIELD_LABELS[field]);
      }
    });

    const row: PatientRow = {
      patientId: normalizeTextValue(pickValue(normalizedRow, "patientId")) || `PT-${index + 1}`,
      age: parseNumber(pickValue(normalizedRow, "age"), "age", missingCounts, invalidCounts, outlierCounts),
      gender: parseText(pickValue(normalizedRow, "gender"), "gender", missingCounts),
      heightCm: parseNumber(
        pickValue(normalizedRow, "heightCm"),
        "heightCm",
        missingCounts,
        invalidCounts,
        outlierCounts,
      ),
      weightKg: parseNumber(
        pickValue(normalizedRow, "weightKg"),
        "weightKg",
        missingCounts,
        invalidCounts,
        outlierCounts,
      ),
      systolicBP: parseNumber(
        pickValue(normalizedRow, "systolicBP"),
        "systolicBP",
        missingCounts,
        invalidCounts,
        outlierCounts,
      ),
      diastolicBP: parseNumber(
        pickValue(normalizedRow, "diastolicBP"),
        "diastolicBP",
        missingCounts,
        invalidCounts,
        outlierCounts,
      ),
      fastingGlucose: parseNumber(
        pickValue(normalizedRow, "fastingGlucose"),
        "fastingGlucose",
        missingCounts,
        invalidCounts,
        outlierCounts,
      ),
      hba1c: parseNumber(
        pickValue(normalizedRow, "hba1c"),
        "hba1c",
        missingCounts,
        invalidCounts,
        outlierCounts,
      ),
      totalCholesterol: parseNumber(
        pickValue(normalizedRow, "totalCholesterol"),
        "totalCholesterol",
        missingCounts,
        invalidCounts,
        outlierCounts,
      ),
      ldl: parseNumber(pickValue(normalizedRow, "ldl"), "ldl", missingCounts, invalidCounts, outlierCounts),
      hdl: parseNumber(pickValue(normalizedRow, "hdl"), "hdl", missingCounts, invalidCounts, outlierCounts),
      triglycerides: parseNumber(
        pickValue(normalizedRow, "triglycerides"),
        "triglycerides",
        missingCounts,
        invalidCounts,
        outlierCounts,
      ),
      vitaminD: parseNumber(
        pickValue(normalizedRow, "vitaminD"),
        "vitaminD",
        missingCounts,
        invalidCounts,
        outlierCounts,
      ),
      smokingStatus: parseText(
        pickValue(normalizedRow, "smokingStatus"),
        "smokingStatus",
        missingCounts,
      ),
      alcoholUse: parseText(
        pickValue(normalizedRow, "alcoholUse"),
        "alcoholUse",
        missingCounts,
      ),
      exerciseFrequency: parseText(
        pickValue(normalizedRow, "exerciseFrequency"),
        "exerciseFrequency",
        missingCounts,
      ),
      sleepDuration: parseNumber(
        pickValue(normalizedRow, "sleepDuration"),
        "sleepDuration",
        missingCounts,
        invalidCounts,
        outlierCounts,
      ),
      familyHistory: parseText(
        pickValue(normalizedRow, "familyHistory"),
        "familyHistory",
        missingCounts,
      ),
      diseaseLabel: parseText(
        pickValue(normalizedRow, "diseaseLabel"),
        "diseaseLabel",
        missingCounts,
      ),
      notes: parseText(pickValue(normalizedRow, "notes"), "notes", missingCounts),
      sourceRow: index + 2,
    };

    if (!isMeaningfulRow(row)) {
      removedEmptyRows += 1;
      return;
    }

    const signature = buildSignature(row);
    if (signatures.has(signature)) {
      duplicateRowsRemoved += 1;
      return;
    }
    signatures.add(signature);

    cleanedRows.push(buildDerivedPatientRow(row));
  });

  const totalRows = rawRows.length;
  const invalidValueCount = Object.values(invalidCounts).reduce(
    (sum, value) => sum + value,
    0,
  );
  const outlierCount = Object.values(outlierCounts).reduce((sum, value) => sum + value, 0);
  const averageCompleteness =
    cleanedRows.length === 0
      ? 0
      : Number(
          (
            cleanedRows.reduce((sum, row) => sum + row.dataCompleteness, 0) / cleanedRows.length
          ).toFixed(1),
        );

  const cleaningReport: CleaningReport = {
    totalRows,
    retainedRows: cleanedRows.length,
    removedEmptyRows,
    duplicateRowsRemoved,
    invalidValueCount,
    outlierCount,
    averageCompleteness,
    recognizedColumns: Array.from(recognizedColumns).sort(),
    missingByColumn: mapCountSummary(missingCounts, totalRows),
    invalidByColumn: mapCountSummary(invalidCounts, totalRows),
    outlierByColumn: mapCountSummary(outlierCounts, totalRows),
  };

  return {
    cleanedRows,
    cleaningReport,
  };
}
