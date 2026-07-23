import { useState } from "react";
import { FiFilter, FiX, FiChevronDown } from "react-icons/fi";
import Popover from "../ui/Popover";

const COURTS = [
  "Supreme Court of Pakistan",
  "Federal Shariat Court",
  "Lahore High Court",
  "Sindh High Court",
  "Islamabad High Court",
  "Peshawar High Court",
  "Balochistan High Court"
];

const SUBJECTS = [
  "Constitutional Law",
  "Criminal Law",
  "Family Law",
  "Civil Procedure",
  "Contract Law",
  "Property Law",
  "Tax Law",
  "Labour Law",
  "Corporate Law",
  "Shariah Law"
];

export default function ResearchFilters({ filters, onChange }) {
  const [open, setOpen] = useState(false);

  function update(patch) {
    const next = { ...filters, ...patch };
    Object.keys(next).forEach((k) => {
      const v = next[k];
      if (v === "" || v === null || v === undefined || (Array.isArray(v) && v.length === 0)) {
        delete next[k];
      }
    });
    onChange(next);
  }

  function clearAll() {
    onChange({});
  }

  const activeCount = Object.keys(filters || {}).filter((k) => {
    const v = filters[k];
    if (v === "" || v === null || v === undefined) return false;
    if (Array.isArray(v) && v.length === 0) return false;
    return true;
  }).length;

  return (
    <div className="relative">
      <div className="flex items-center gap-2 flex-wrap">
        <Popover
          placement="top-start"
          isOpen={open}
          onClose={() => setOpen(false)}
          onToggle={() => setOpen((v) => !v)}
          className="w-[min(420px,calc(100vw-2rem))] p-3 sm:p-4 rounded-xl border border-card-border shadow-xl"
          trigger={
            <button
              type="button"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                activeCount > 0
                  ? "bg-primary-light text-primary border-primary-border"
                  : "bg-card text-text-secondary border-card-border hover:bg-surface-hover"
              }`}
            >
              <FiFilter className="w-3.5 h-3.5" />
              Filters
              {activeCount > 0 && (
                <span className="ml-0.5 inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full bg-primary text-primary-text text-[10px] font-semibold">
                  {activeCount}
                </span>
              )}
              <FiChevronDown
                className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
              />
            </button>
          }
        >
          <div className="max-h-[70vh] overflow-y-auto pr-1 space-y-3">
            <FilterRow label="Court">
              <select
                value={filters?.court || ""}
                onChange={(e) => update({ court: e.target.value })}
                className="w-full h-9 px-2 rounded-md border border-input-border bg-input-background text-sm outline-none"
              >
                <option value="">Any court</option>
                {COURTS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </FilterRow>

            <FilterRow label="Year range">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="From"
                  min={1900}
                  max={2100}
                  value={filters?.yearFrom || ""}
                  onChange={(e) => update({ yearFrom: e.target.value ? Number(e.target.value) : "" })}
                  className="w-1/2 h-9 px-2 rounded-md border border-input-border bg-input-background text-input-text placeholder:text-input-placeholder text-sm outline-none"
                />
                <span className="text-text-muted text-xs">to</span>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="To"
                  min={1900}
                  max={2100}
                  value={filters?.yearTo || ""}
                  onChange={(e) => update({ yearTo: e.target.value ? Number(e.target.value) : "" })}
                  className="w-1/2 h-9 px-2 rounded-md border border-input-border bg-input-background text-input-text placeholder:text-input-placeholder text-sm outline-none"
                />
              </div>
            </FilterRow>

            <FilterRow label="Subject">
              <select
                value={filters?.subject || ""}
                onChange={(e) => update({ subject: e.target.value })}
                className="w-full h-9 px-2 rounded-md border border-input-border bg-input-background text-sm outline-none"
              >
                <option value="">Any subject</option>
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </FilterRow>

            <p className="text-[11px] text-text-muted m-0">
              Filters apply to retrieved case law on every new question.
            </p>
          </div>
        </Popover>

        {filters?.court && (
          <Chip onRemove={() => update({ court: "" })}>
            {Array.isArray(filters.court) ? filters.court.join(", ") : filters.court}
          </Chip>
        )}
        {(filters?.yearFrom || filters?.yearTo) && (
          <Chip
            onRemove={() => update({ yearFrom: "", yearTo: "" })}
          >
            {filters.yearFrom || "any"}–{filters.yearTo || "any"}
          </Chip>
        )}
        {filters?.subject && (
          <Chip onRemove={() => update({ subject: "" })}>{filters.subject}</Chip>
        )}

        {activeCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="text-[11px] text-text-muted hover:text-text-secondary underline"
          >
            Clear all
          </button>
        )}
      </div>

    </div>
  );
}

function FilterRow({ label, children }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

function Chip({ children, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-light text-primary text-[11px] font-medium border border-primary-border">
      {children}
      <button
        type="button"
        onClick={onRemove}
        className="hover:bg-surface rounded-full p-0.5"
        aria-label="Remove filter"
      >
        <FiX className="w-3 h-3" />
      </button>
    </span>
  );
}
