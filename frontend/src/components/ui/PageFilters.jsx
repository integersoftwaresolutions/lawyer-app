import FilterTabs from "./FilterTabs";

export default function PageFilters({ children, className = "" }) {
  if (!children) return null;

  return (
    <div
      className={`rounded-xl border border-card-border bg-surface px-3 py-3 sm:px-4 sm:py-3.5 ${className}`}
    >
      {children}
    </div>
  );
}

export function PageTabFilters({ options, value, onChange, className = "" }) {
  return (<FilterTabs options={options} value={value} onChange={onChange} />
  );
}

export function PageFilterGrid({ children, columns = 4, className = "" }) {
  const gridClass =
    columns === 5
      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 items-end"
      : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-end";

  return <div className={`${gridClass} ${className}`}>{children}</div>;
}

export function PageFilterField({ label, children, className = "" }) {
  return (
    <div className={className}>
      <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

export function PageFilterActions({ children, className = "" }) {
  return <div className={`flex flex-wrap items-center gap-2 ${className}`}>{children}</div>;
}

export function PageSearchField({ value, onChange, placeholder, className = "", onSubmit }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.(e);
      }}
      className={className}
    >
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full h-9 px-3 rounded-md border border-input-border bg-input-background text-input-text text-sm outline-none focus:border-primary"
      />
    </form>
  );
}
