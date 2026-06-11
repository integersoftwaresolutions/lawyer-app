/**
 * Horizontal group of table row actions with consistent spacing.
 */
export default function ActionMenu({ children, className = "" }) {
  return (
    <div
      className={`flex flex-wrap items-center justify-end gap-1 ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}
