/**
 * Segmented filter control for tables and lists.
 */
export default function FilterTabs({ options = [], value, onChange, className = "" }) {
  return (
    <div
      className={`inline-flex flex-wrap items-center gap-1 p-1 rounded-lg bg-surface border border-card-border ${className}`}
      role="tablist"
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value ?? "all"}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
              active
                ? "bg-primary text-primary-text shadow-sm"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
