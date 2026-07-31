/**
 * Underline tab bar for case detail modules.
 * options: [{ id, label, icon?, count? }]
 */
export default function CaseDetailTabs({ tabs = [], value, onChange, className = "" }) {
  return (
    <div
      className={` -mx-4 sm:-mx-6 px-4 sm:px-6 ${className}`}
      role="tablist"
      aria-label="Case sections"
    >
      <div className="flex gap-0.5 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const active = value === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(tab.id)}
              className={`relative flex items-center gap-2 px-3.5 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-text-secondary hover:text-text-primary hover:border-border"
              }`}
            >
              {Icon ? <Icon className="w-4 h-4 shrink-0 opacity-90" aria-hidden /> : null}
              <span>{tab.label}</span>
              {tab.count != null && tab.count > 0 ? (
                <span
                  className={`min-w-[1.25rem] h-5 px-1.5 rounded-full text-[11px] font-semibold tabular-nums inline-flex items-center justify-center ${
                    active
                      ? "bg-primary-light text-primary"
                      : "bg-surface-hover text-text-muted"
                  }`}
                >
                  {tab.count}
                </span>
              ) : null}
              {tab.dot ? (
                <span className="w-1.5 h-1.5 rounded-full bg-warning shrink-0" aria-label="Unsaved changes" />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
