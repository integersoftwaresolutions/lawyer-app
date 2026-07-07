export default function StatCard({
  icon: IconComponent,
  value,
  label,
  trend,
  trendUp,
  className = "",
  ...props
}) {
  return (
    <div
      className={`border border-card-border rounded-lg bg-card p-4 sm:p-5 md:p-6 text-center transition-all duration-200 hover:shadow-md min-w-0 ${className}`}
      {...props}
    >
      {IconComponent && (
        <div className="flex justify-center mb-2 sm:mb-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-background border border-background-border flex items-center justify-center text-text">
            <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>
      )}
      <div className="text-2xl sm:text-[28px] md:text-[32px] font-bold text-text-primary mb-1 truncate">
        {value}
      </div>
      <div className="text-xs sm:text-sm text-text-secondary leading-snug">{label}</div>
      {trend && (
        <div className={`text-xs mt-2 font-medium ${trendUp ? "text-success" : "text-danger"}`}>
          {trendUp ? "↑" : "↓"} {trend}
        </div>
      )}
    </div>
  );
}
