function FeatureGrid({ items, columns = "default" }) {
  const colClass =
    columns === "stack"
      ? "grid grid-cols-1 gap-4"
      : columns === "two"
        ? "grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5"
        : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5";

  return (
    <div className={colClass}>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.title}
            className="rounded-2xl border border-border bg-card p-5 sm:p-6 transition-shadow hover:shadow-md"
          >
            <div className="mb-3 sm:mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light text-primary">
              <Icon className="h-5 w-5" aria-hidden />
            </div>
            <h3 className="m-0 text-sm sm:text-base font-semibold text-text-primary">{item.title}</h3>
            <p className="m-0 mt-2 text-sm leading-relaxed text-text-secondary">{item.body}</p>
          </div>
        );
      })}
    </div>
  );
}

function SectionHeader({ eyebrow, title, subtitle }) {
  return (
    <div className="mb-8 sm:mb-10 max-w-2xl">
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
