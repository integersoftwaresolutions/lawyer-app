/**
 * Consistent stack for list pages: filters → DataTable → Pagination.
 */
export default function DataList({
  filters = null,
  children,
  pagination = null,
  className = ""
}) {
  return (
    <div className={`flex flex-col gap-3 sm:gap-3.5 ${className}`}>
      {filters}
      {children}
      {pagination}
    </div>
  );
}
