import { useStateHandler } from "../../hooks/useStateHandler";
import StateHandler from "../StateHandler";
import Pagination from "./Pagination";

/**
 * Reusable data table with optional pagination and improved styling.
 */
export default function Table({
  columns = [],
  data = [],
  keyField = "_id",
  loading: externalLoading,
  error: externalError,
  retry: externalRetry,
  emptyMessage = "No data available",
  emptyIcon,
  className = "",
  stickyHeader = true,
  onRowClick,
  rowClassName = "",
  dependencies = [],
  density = "comfortable",
  pagination = null,
  ...props
}) {
  const isDataFunction = typeof data === "function";
  const {
    loading: internalLoading,
    error: internalError,
    data: internalData,
    retry: internalRetry
  } = isDataFunction
    ? useStateHandler(data, { dependencies })
    : { loading: false, error: null, data: null, retry: null };

  const loading = externalLoading !== undefined ? externalLoading : internalLoading;
  const error = externalError !== undefined ? externalError : internalError;
  const retry = externalRetry || internalRetry;
  const tableData = isDataFunction ? internalData || [] : data || [];

  const cellPad = density === "compact" ? "px-3 py-2.5" : "px-4 py-3.5";
  const firstCellPad = density === "compact" ? "pl-5" : "pl-6";
  const lastCellPad = density === "compact" ? "pr-5" : "pr-6";

  const handleRowClick = (row) => {
    if (onRowClick) onRowClick(row);
  };

  const getHeaderAlign = (column) => {
    if (column.align === "center") return "text-center";
    if (column.align === "right") return "text-right";
    return "text-left";
  };

  const getCellAlign = (column) => getHeaderAlign(column);

  return (
    <StateHandler loading={loading} error={error} retry={retry}>
      <div
        className={`rounded-xl border border-card-border overflow-hidden bg-card shadow-sm ${className}`}
        {...props}
      >
        <div className="overflow-x-auto scrollbar-sm">
          {tableData.length === 0 ? (
            <EmptyState message={emptyMessage} icon={emptyIcon} />
          ) : (
            <table className="w-full border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-card-border bg-background">
                  {columns.map((column, columnIndex) => (
                    <th
                      key={column.key}
                      scope="col"
                      className={`
                        ${cellPad}
                        ${columnIndex === 0 ? firstCellPad : ""}
                        ${columnIndex === columns.length - 1 ? lastCellPad : ""}
                        text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted whitespace-nowrap
                        ${getHeaderAlign(column)}
                        ${stickyHeader ? "sticky top-0 z-10 bg-surface" : ""}
                      `}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        {column.label}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, rowIndex) => {
                  const isEven = rowIndex % 2 === 0;
                  return (
                    <tr
                      key={row[keyField] || rowIndex}
                      onClick={() => handleRowClick(row)}
                      className={`
                        border-b border-card-border last:border-b-0
                        transition-colors duration-150
                        ${isEven ? "bg-card" : "bg-surface"}
                        ${onRowClick ? "cursor-pointer hover:bg-primary-light" : "hover:bg-surface-hover"}
                        ${rowClassName}
                      `}
                    >
                      {columns.map((column, columnIndex) => (
                        <td
                          key={column.key}
                          className={`
                            ${cellPad}
                            ${columnIndex === 0 ? firstCellPad : ""}
                            ${columnIndex === columns.length - 1 ? lastCellPad : ""}
                            text-sm text-text-primary align-middle
                            ${getCellAlign(column)}
                            ${column.className || ""}
                          `}
                        >
                          {column.render
                            ? column.render(row[column.key], row, rowIndex)
                            : row[column.key] ?? (
                                <span className="text-text-muted">—</span>
                              )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {pagination && tableData.length > 0 && (
          <div className="border-t border-card-border px-4 py-3.5 bg-surface">
            <Pagination {...pagination} />
          </div>
        )}
      </div>
    </StateHandler>
  );
}

function EmptyState({ message, icon }) {
  return (
    <div className="m-4 rounded-xl border border-dashed border-card-border bg-surface">
      <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
        {icon ? (
          <div className="mb-4 text-text-muted">{icon}</div>
        ) : (
          <div className="w-14 h-14 rounded-2xl bg-primary-light flex items-center justify-center mb-4 border border-card-border">
            <svg
              className="w-7 h-7 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
        )}
        <p className="text-text-primary font-medium text-sm m-0">{message}</p>
        <p className="text-text-muted text-xs mt-1.5 m-0">Rows will appear here once data is available.</p>
      </div>
    </div>
  );
}
