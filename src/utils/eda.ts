import {
  CORRELATION_FIELDS,
  DEFAULT_FILTERS,
  FIELD_LABELS,
  NUMERIC_SUMMARY_FIELDS,
  type CategoryCount,
  type CleanedPatientRow,
  type CleaningReport,
  type CorrelationMatrix,
  type DashboardMetric,
  type FilterState,
  type HistogramBin,
  type Insight,
  type NumericSummary,
  type ScatterPoint,
} from "../types/data";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function round(value: number | null, decimals = 1) {
  if (value === null || Number.isNaN(value)) {
    return null;
  }

  return Number(value.toFixed(decimals));
}

function valuesForKey(rows: CleanedPatientRow[], key: keyof CleanedPatientRow) {
  return rows
    .map((row) => row[key])
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
}

function average(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }

  return sorted[mid];
}

function percentage(count: number, total: number) {
  if (total === 0) {
    return 0;
  }

  return Number(((count / total) * 100).toFixed(1));
}

function formatLabel(value: string) {
  return value || "Unknown";
}

export function getUniqueOptions(
  rows: CleanedPatientRow[],
  key: keyof CleanedPatientRow,
) {
  return Array.from(
    new Set(
      rows
        .map((row) => String(row[key] ?? "").trim())
        .filter(Boolean)
        .map((value) => value),
    ),
  ).sort((left, right) => left.localeCompare(right));
}

export function applyFilters(rows: CleanedPatientRow[], filters: FilterState = DEFAULT_FILTERS) {
  const search = filters.search.trim().toLowerCase();
  const minAge = filters.minAge ? Number(filters.minAge) : null;
  const maxAge = filters.maxAge ? Number(filters.maxAge) : null;

  return rows.filter((row) => {
    if (search) {
      const haystack = [
        row.patientId,
        row.gender,
        row.diseaseLabel,
        row.familyHistory,
        row.notes,
        row.bmiCategory,
        row.glucoseCategory,
      ]
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(search)) {
        return false;
      }
    }

    if (filters.gender && row.gender !== filters.gender) {
      return false;
    }

    if (filters.diseaseLabel && row.diseaseLabel !== filters.diseaseLabel) {
      return false;
    }

    if (filters.smokingStatus && row.smokingStatus !== filters.smokingStatus) {
      return false;
    }

    if (filters.bmiCategory && row.bmiCategory !== filters.bmiCategory) {
      return false;
    }

    if (filters.ageGroup && row.ageGroup !== filters.ageGroup) {
      return false;
    }

    if (filters.glucoseCategory && row.glucoseCategory !== filters.glucoseCategory) {
      return false;
    }

    if (minAge !== null && (row.age === null || row.age < minAge)) {
      return false;
    }

    if (maxAge !== null && (row.age === null || row.age > maxAge)) {
      return false;
    }

    return true;
  });
}

export function buildSummaryMetrics(
  rows: CleanedPatientRow[],
  cleaningReport: CleaningReport,
): DashboardMetric[] {
  const averageAge = round(average(valuesForKey(rows, "age")));
  const averageBmi = round(average(valuesForKey(rows, "bmi")));
  const highRiskCount = rows.filter((row) => row.riskFactorCount >= 3).length;
  const topDisease = buildCategoryCounts(rows, "diseaseLabel", 1)[0];

  return [
    {
      label: "Patients in view",
      value: rows.length.toString(),
      helper: `${cleaningReport.retainedRows} retained after cleaning`,
    },
    {
      label: "Average age",
      value: averageAge === null ? "NA" : `${averageAge}`,
      helper: "Based on rows with valid age values",
    },
    {
      label: "Average BMI",
      value: averageBmi === null ? "NA" : `${averageBmi}`,
      helper: "Derived from height and weight",
    },
    {
      label: "High-risk share",
      value: `${percentage(highRiskCount, rows.length)}%`,
      helper: `${highRiskCount} patients with 3+ risk signals`,
    },
    {
      label: "Most common diagnosis",
      value: topDisease?.label ?? "Unavailable",
      helper: topDisease ? `${topDisease.count} rows in the current view` : "No disease label available",
    },
    {
      label: "Average completeness",
      value: `${cleaningReport.averageCompleteness}%`,
      helper: "Across core analytic columns",
    },
  ];
}

export function summarizeNumericColumns(rows: CleanedPatientRow[]): NumericSummary[] {
  return NUMERIC_SUMMARY_FIELDS.map((key) => {
    const values = valuesForKey(rows, key);

    return {
      key,
      label: FIELD_LABELS[key],
      count: values.length,
      missing: rows.length - values.length,
      mean: round(average(values)),
      median: round(median(values)),
      min: values.length ? round(Math.min(...values)) : null,
      max: values.length ? round(Math.max(...values)) : null,
    };
  });
}

export function buildHistogram(
  rows: CleanedPatientRow[],
  key: keyof CleanedPatientRow,
  binCount = 7,
): HistogramBin[] {
  const values = valuesForKey(rows, key);

  if (values.length === 0) {
    return [];
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min || 1;
  const width = spread / binCount;
  const bins = Array.from({ length: binCount }, (_, index) => ({
    start: min + width * index,
    end: index === binCount - 1 ? max : min + width * (index + 1),
    count: 0,
  }));

  values.forEach((value) => {
    const rawIndex = Math.floor((value - min) / width);
    const index = clamp(rawIndex, 0, binCount - 1);
    bins[index].count += 1;
  });

  return bins.map((bin) => ({
    label: `${Math.round(bin.start)}-${Math.round(bin.end)}`,
    count: bin.count,
  }));
}

export function buildCategoryCounts(
  rows: CleanedPatientRow[],
  key: keyof CleanedPatientRow,
  limit = 6,
): CategoryCount[] {
  const counts = new Map<string, number>();

  rows.forEach((row) => {
    const value = formatLabel(String(row[key] ?? "").trim()) || "Unknown";
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([label, count]) => ({
      label,
      count,
      percentage: percentage(count, rows.length),
    }))
    .sort((left, right) => right.count - left.count)
    .slice(0, limit);
}

export function buildScatterPoints(
  rows: CleanedPatientRow[],
  xKey: keyof CleanedPatientRow,
  yKey: keyof CleanedPatientRow,
): ScatterPoint[] {
  return rows
    .filter((row) => typeof row[xKey] === "number" && typeof row[yKey] === "number")
    .map((row) => ({
      x: row[xKey] as number,
      y: row[yKey] as number,
      label: row.patientId,
      group: row.diseaseLabel,
    }));
}

function pearsonCorrelation(
  rows: CleanedPatientRow[],
  leftKey: keyof CleanedPatientRow,
  rightKey: keyof CleanedPatientRow,
) {
  const pairedValues = rows
    .map((row) => ({
      left: row[leftKey],
      right: row[rightKey],
    }))
    .filter(
      (value): value is { left: number; right: number } =>
        typeof value.left === "number" && typeof value.right === "number",
    );

  if (pairedValues.length < 3) {
    return { value: 0, sampleSize: pairedValues.length };
  }

  const leftMean = average(pairedValues.map((value) => value.left)) ?? 0;
  const rightMean = average(pairedValues.map((value) => value.right)) ?? 0;

  let numerator = 0;
  let leftSum = 0;
  let rightSum = 0;

  pairedValues.forEach((value) => {
    const leftDistance = value.left - leftMean;
    const rightDistance = value.right - rightMean;
    numerator += leftDistance * rightDistance;
    leftSum += leftDistance ** 2;
    rightSum += rightDistance ** 2;
  });

  const denominator = Math.sqrt(leftSum * rightSum);

  if (!denominator) {
    return { value: 0, sampleSize: pairedValues.length };
  }

  return {
    value: numerator / denominator,
    sampleSize: pairedValues.length,
  };
}

export function buildCorrelationMatrix(rows: CleanedPatientRow[]): CorrelationMatrix {
  const keys = [...CORRELATION_FIELDS];
  const strongestPairs: CorrelationMatrix["strongestPairs"] = [];
  const matrixRows = keys.map((leftKey) => ({
    key: leftKey,
    label: FIELD_LABELS[leftKey],
    cells: keys.map((rightKey) => {
      const result =
        leftKey === rightKey
          ? { value: 1, sampleSize: valuesForKey(rows, leftKey).length }
          : pearsonCorrelation(rows, leftKey, rightKey);

      if (leftKey !== rightKey) {
        strongestPairs.push({
          leftKey,
          leftLabel: FIELD_LABELS[leftKey],
          rightKey,
          rightLabel: FIELD_LABELS[rightKey],
          value: round(result.value, 2) ?? 0,
          sampleSize: result.sampleSize,
        });
      }

      return {
        key: rightKey,
        label: FIELD_LABELS[rightKey],
        value: round(result.value, 2) ?? 0,
        sampleSize: result.sampleSize,
      };
    }),
  }));

  const dedupedPairs = strongestPairs
    .filter((pair, index, array) => {
      return (
        index ===
        array.findIndex(
          (candidate) =>
            [candidate.leftKey, candidate.rightKey].sort().join("-") ===
            [pair.leftKey, pair.rightKey].sort().join("-"),
        )
      );
    })
    .sort((left, right) => Math.abs(right.value) - Math.abs(left.value))
    .slice(0, 4);

  return {
    keys,
    rows: matrixRows,
    strongestPairs: dedupedPairs,
  };
}

function diseaseRate(rows: CleanedPatientRow[], disease: string, predicate?: (row: CleanedPatientRow) => boolean) {
  const eligibleRows = predicate ? rows.filter(predicate) : rows;
  if (eligibleRows.length === 0) {
    return 0;
  }

  const matchingRows = eligibleRows.filter((row) =>
    row.diseaseLabel.toLowerCase().includes(disease.toLowerCase()),
  );

  return percentage(matchingRows.length, eligibleRows.length);
}

export function buildInsights(
  rows: CleanedPatientRow[],
  cleaningReport: CleaningReport,
  correlationMatrix: CorrelationMatrix,
): Insight[] {
  const insights: Insight[] = [];
  const topDisease = buildCategoryCounts(rows, "diseaseLabel", 1)[0];
  const topMissing = cleaningReport.missingByColumn[0];
  const strongestPair = correlationMatrix.strongestPairs[0];
  const diabetesWithObesity = diseaseRate(
    rows,
    "diabetes",
    (row) => row.bmiCategory === "Obesity",
  );
  const diabetesWithHealthyBmi = diseaseRate(
    rows,
    "diabetes",
    (row) => row.bmiCategory === "Healthy",
  );
  const hypertensionSmokers = diseaseRate(
    rows,
    "hypertension",
    (row) => row.smokingStatus === "Current",
  );
  const hypertensionNonSmokers = diseaseRate(
    rows,
    "hypertension",
    (row) => row.smokingStatus === "Never",
  );

  if (topDisease) {
    insights.push({
      title: "Most common disease pattern",
      detail: `${topDisease.label} appears most often in the current view, representing ${topDisease.percentage}% of filtered patients.`,
      emphasis: "high",
      category: "cohort",
    });
  }

  if (topMissing) {
    insights.push({
      title: "Largest data-quality gap",
      detail: `${topMissing.label} has the highest missingness at ${topMissing.percentage}% of imported rows, so any downstream finding tied to that feature should be interpreted carefully.`,
      emphasis: "medium",
      category: "data-quality",
    });
  }

  if (strongestPair) {
    const direction = strongestPair.value >= 0 ? "positive" : "negative";
    insights.push({
      title: "Strongest correlation in the numeric view",
      detail: `${strongestPair.leftLabel} and ${strongestPair.rightLabel} show the strongest ${direction} relationship in the filtered dataset (r = ${strongestPair.value}, n = ${strongestPair.sampleSize}).`,
      emphasis: "high",
      category: "correlation",
    });
  }

  if (diabetesWithObesity || diabetesWithHealthyBmi) {
    insights.push({
      title: "Obesity and diabetes clustering",
      detail: `Diabetes appears in ${diabetesWithObesity}% of patients with obesity compared with ${diabetesWithHealthyBmi}% of patients in the healthy BMI group.`,
      emphasis: diabetesWithObesity > diabetesWithHealthyBmi ? "high" : "low",
      category: "risk-pattern",
    });
  }

  if (hypertensionSmokers || hypertensionNonSmokers) {
    insights.push({
      title: "Smoking subgroup comparison",
      detail: `Hypertension shows up in ${hypertensionSmokers}% of current smokers versus ${hypertensionNonSmokers}% of never-smokers within the same filtered cohort.`,
      emphasis: hypertensionSmokers > hypertensionNonSmokers ? "medium" : "low",
      category: "risk-pattern",
    });
  }

  return insights.slice(0, 5);
}
