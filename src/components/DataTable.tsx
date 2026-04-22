import { useState } from "react";
import type { CleanedPatientRow } from "../types/data";

const columns: Array<{
  key: keyof CleanedPatientRow;
  label: string;
}> = [
  { key: "patientId", label: "Patient" },
  { key: "age", label: "Age" },
  { key: "gender", label: "Gender" },
  { key: "diseaseLabel", label: "Diagnosis" },
  { key: "bmi", label: "BMI" },
  { key: "fastingGlucose", label: "Glucose" },
  { key: "systolicBP", label: "SBP" },
  { key: "smokingStatus", label: "Smoking" },
  { key: "riskFactorCount", label: "Risk Flags" },
];

interface DataTableProps {
  rows: CleanedPatientRow[];
}

function compareValues(left: string | number | null, right: string | number | null) {
  if (left === right) {
    return 0;
  }

  if (left === null || left === "") {
    return 1;
  }

  if (right === null || right === "") {
    return -1;
  }

  if (typeof left === "number" && typeof right === "number") {
    return left - right;
  }

  return String(left).localeCompare(String(right));
}

export function DataTable({ rows }: DataTableProps) {
  const [sortKey, setSortKey] = useState<keyof CleanedPatientRow>("riskFactorCount");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const sortedRows = [...rows].sort((left, right) => {
    const baseComparison = compareValues(left[sortKey] as never, right[sortKey] as never);
    return sortDirection === "asc" ? baseComparison : baseComparison * -1;
  });

  return (
    <div className="rounded-[1.75rem] border border-white/70 bg-white/84 p-6 shadow-[0_18px_45px_rgba(27,64,76,0.08)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-700">
            Filtered Records
          </p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">Patient-level table</h3>
        </div>
        <p className="text-sm text-slate-500">Top {Math.min(sortedRows.length, 12)} rows shown</p>
      </div>

      <div className="mt-6 overflow-hidden rounded-[1.25rem] border border-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                {columns.map((column) => (
                  <th key={column.key} className="px-4 py-3 font-semibold">
                    <button
                      type="button"
                      onClick={() => {
                        if (sortKey === column.key) {
                          setSortDirection((direction) =>
                            direction === "asc" ? "desc" : "asc",
                          );
                        } else {
                          setSortKey(column.key);
                          setSortDirection("desc");
                        }
                      }}
                      className="inline-flex items-center gap-2 text-left"
                    >
                      {column.label}
                      {sortKey === column.key ? (
                        <span className="text-xs text-cyan-700">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      ) : null}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {sortedRows.slice(0, 12).map((row) => (
                <tr key={`${row.patientId}-${row.sourceRow}`} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{row.patientId}</td>
                  <td className="px-4 py-3 text-slate-700">{row.age ?? "NA"}</td>
                  <td className="px-4 py-3 text-slate-700">{row.gender}</td>
                  <td className="px-4 py-3 text-slate-700">{row.diseaseLabel}</td>
                  <td className="px-4 py-3 text-slate-700">{row.bmi ?? "NA"}</td>
                  <td className="px-4 py-3 text-slate-700">{row.fastingGlucose ?? "NA"}</td>
                  <td className="px-4 py-3 text-slate-700">{row.systolicBP ?? "NA"}</td>
                  <td className="px-4 py-3 text-slate-700">{row.smokingStatus}</td>
                  <td className="px-4 py-3 text-slate-700">{row.riskFactorCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
