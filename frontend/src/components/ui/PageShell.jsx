export default function PageShell({ children, className = "" }) {
  return <div className={`space-y-4 sm:space-y-6 ${className}`}>{children}</div>;
}
