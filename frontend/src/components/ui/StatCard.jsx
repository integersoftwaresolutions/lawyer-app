export default function StatCard({ 
  icon,
  value,
  label,
  trend,
  trendUp,
  className = "",
  ...props 
}) {
  return (
    <div className={`border border-border rounded-lg bg-surface p-5 text-center ${className}`} {...props}>
      {icon && <div className="text-3xl mb-2">{icon}</div>}
      <div className="text-[28px] font-bold text-text-primary mb-1">{value}</div>
      <div className="text-sm text-text-secondary">{label}</div>
      {trend && (
        <div className={`text-xs mt-2 ${trendUp ? "text-success" : "text-danger"}`}>
          {trendUp ? "↑" : "↓"} {trend}
        </div>
      )}
    </div>
  );
}
