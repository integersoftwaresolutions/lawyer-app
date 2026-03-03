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
    <div className={`border border-card-border rounded-lg bg-card p-6 text-center transition-all duration-200 hover:shadow-md hover:border-primary-border ${className}`} {...props}>
      {IconComponent && (
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 rounded-lg bg-surface flex items-center justify-center text-primary">
            <IconComponent className="w-6 h-6" />
          </div>
        </div>
      )}
      <div className="text-[32px] font-bold text-text-primary mb-1">{value}</div>
      <div className="text-sm text-text-secondary">{label}</div>
      {trend && (
        <div className={`text-xs mt-2 font-medium ${trendUp ? "text-success" : "text-danger"}`}>
          {trendUp ? "↑" : "↓"} {trend}
        </div>
      )}
    </div>
  );
}
