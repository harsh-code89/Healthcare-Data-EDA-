import type { FilterState } from "../types/data";

interface FilterPanelProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
  totalRows: number;
  filteredRows: number;
  options: {
    genders: string[];
    diseases: string[];
    smokingStatuses: string[];
    bmiCategories: string[];
    ageGroups: string[];
    glucoseCategories: string[];
  };
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-cyan-400"
      >
        <option value="">All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export function FilterPanel({
  filters,
  onChange,
  onReset,
  totalRows,
  filteredRows,
  options,
}: FilterPanelProps) {
  const update = (key: keyof FilterState, value: string) => {
    onChange({
      ...filters,
      [key]: value,
    });
  };

  return (
    <div className="rounded-[1.75rem] border border-white/70 bg-white/84 p-6 shadow-[0_18px_45px_rgba(27,64,76,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-700">
            Cohort Filters
          </p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">Slice the patient view</h3>
        </div>
        <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
          Showing <span className="font-semibold text-slate-900">{filteredRows}</span> of{" "}
          <span className="font-semibold text-slate-900">{totalRows}</span> cleaned rows
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="block xl:col-span-2">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Search
          </span>
          <input
            value={filters.search}
            onChange={(event) => update("search", event.target.value)}
            placeholder="Patient ID, diagnosis, risk category..."
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-cyan-400"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Min age
          </span>
          <input
            value={filters.minAge}
            onChange={(event) => update("minAge", event.target.value)}
            placeholder="30"
            type="number"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-cyan-400"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Max age
          </span>
          <input
            value={filters.maxAge}
            onChange={(event) => update("maxAge", event.target.value)}
            placeholder="70"
            type="number"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-cyan-400"
          />
        </label>

        <SelectField
          label="Gender"
          value={filters.gender}
          options={options.genders}
          onChange={(value) => update("gender", value)}
        />
        <SelectField
          label="Diagnosis"
          value={filters.diseaseLabel}
          options={options.diseases}
          onChange={(value) => update("diseaseLabel", value)}
        />
        <SelectField
          label="Smoking"
          value={filters.smokingStatus}
          options={options.smokingStatuses}
          onChange={(value) => update("smokingStatus", value)}
        />
        <SelectField
          label="BMI Class"
          value={filters.bmiCategory}
          options={options.bmiCategories}
          onChange={(value) => update("bmiCategory", value)}
        />
        <SelectField
          label="Age Group"
          value={filters.ageGroup}
          options={options.ageGroups}
          onChange={(value) => update("ageGroup", value)}
        />
        <SelectField
          label="Glucose Band"
          value={filters.glucoseCategory}
          options={options.glucoseCategories}
          onChange={(value) => update("glucoseCategory", value)}
        />
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onReset}
          className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700"
        >
          Reset filters
        </button>
      </div>
    </div>
  );
}
