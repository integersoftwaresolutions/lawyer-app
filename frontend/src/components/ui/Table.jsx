/**
 * Backwards-compatible Table API → DataTable.
 * Prefer importing DataTable + Pagination separately for new code.
 * Embedded `pagination` prop is ignored; place Pagination below the table.
 */
import DataTable from "./DataTable";

export default function Table({
  pagination: _pagination,
  data,
  dependencies: _dependencies,
  ...rest
}) {
  // Legacy: data was sometimes a fetch function via useStateHandler — callers should migrate.
  const rows = typeof data === "function" ? [] : data;
  const loading = typeof data === "function" ? true : rest.loading;

  if (typeof data === "function" && import.meta.env.DEV) {
    console.warn(
      "[Table] Passing a fetch function as `data` is deprecated. Use usePaginatedQuery + DataTable + Pagination."
    );
  }

  return <DataTable {...rest} data={rows} loading={loading} />;
}
