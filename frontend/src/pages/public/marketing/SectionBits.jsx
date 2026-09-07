import { RevealGroup } from "./Reveal";

const FLOAT_DELAYS = ["float-delay-1", "float-delay-2", "float-delay-3", "float-delay-4"];

function FeatureGrid({ items, columns = "default", header = null }) {
  const colClass =
    columns === "stack"
      ? "grid grid-cols-1 gap-4"
      : columns === "two"
        ? "grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5"
        : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5";

  return (
    <RevealGroup className={colClass}>
      {header ? <div className="reveal-item col-span-full">{header}</div> : null}
      {items.map((item, index) => {
        const Icon = item.icon;
        const floatDelay = FLOAT_DELAYS[index % FLOAT_DELAYS.length];
        return (
          <div key={item.title} className="reveal-item h-full">
            <div className="mkt-card h-full rounded-2xl border border-border bg-card p-5 sm:p-6 flex flex-col">
              <div
                className={`mb-3 sm:mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light text-primary animate-float-soft ${floatDelay}`}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="m-0 text-sm sm:text-base font-semibold text-text-primary">
                {item.title}
              </h3>
              <p className="m-0 mt-2 text-sm leading-relaxed text-text-secondary flex-1">{item.body}</p>
            </div>
          </div>
        );
      })}
    </RevealGroup>
  );
}

function SectionHeader({ eyebrow, title, subtitle, className = "" }) {
  return (
    <div className={`mb-8 sm:mb-10 max-w-2xl ${className}`.trim()}>
      {eyebrow ? (
        <p className="m-0 mb-2 sm:mb-3 text-xs font-semibold uppercase tracking-wider text-primary">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="m-0 text-2xl sm:text-3xl md:text-4xl font-bold text-text-primary leading-tight">
        {title}
      </h2>
      {subtitle ? (
        <p className="m-0 mt-2 sm:mt-3 text-sm sm:text-base md:text-lg text-text-secondary leading-relaxed">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

export { FeatureGrid, SectionHeader };
