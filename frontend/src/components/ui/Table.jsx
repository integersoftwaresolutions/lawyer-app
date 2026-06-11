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

  const handleRowClick = (row) => {
    if (onRowClick) onRowClick(row);
  };

  return (
    <StateHandler loading={loading} error={error} retry={retry}>
      <div className={`rounded-xl border border-card-border overflow-hidden bg-card ${className}`} {...props}>
        <div className="overflow-x-auto">
          {tableData.length === 0 ? (
            <EmptyState message={emptyMessage} icon={emptyIcon} />
          ) : (
            <table className="w-full border-collapse min-w-[640px]">
              <thead>
                <tr className="bg-surface/80 border-b border-card-border">
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className={`${cellPad} text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted whitespace-nowrap ${
                        column.align === "center"
                          ? "text-center"
                          : column.align === "right"
                            ? "text-right"
                            : ""
                      } ${stickyHeader ? "sticky top-0 z-10 bg-surface/95 backdrop-blur-sm" : ""}`}
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                {tableData.map((row, rowIndex) => (
                  <tr
                    key={row[keyField] || rowIndex}
                    onClick={() => handleRowClick(row)}
                    className={`
                      transition-colors duration-150
                      ${onRowClick ? "cursor-pointer" : ""}
                      hover:bg-surface-hover/60
                      ${rowClassName}
                    `}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`${cellPad} text-sm text-text-primary align-middle ${
                          column.align === "center"
                            ? "text-center"
                            : column.align === "right"
                              ? "text-right"
                              : ""
                        } ${column.className || ""}`}
                      >
                        {column.render
                          ? column.render(row[column.key], row, rowIndex)
                          : row[column.key] ?? (
                              <span className="text-text-muted">—</span>
                            )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {pagination && tableData.length > 0 && (
          <div className="border-t border-card-border px-4 py-3 bg-surface/30">
            <Pagination {...pagination} />
          </div>
        )}
      </div>
    </StateHandler>
  );
}

function EmptyState({ message, icon }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {icon ? (
        <div className="mb-4 text-text-muted">{icon}</div>
      ) : (
        <div className="w-14 h-14 rounded-2xl bg-surface flex items-center justify-center mb-4 border border-card-border">
          <svg
            className="w-7 h-7 text-text-muted"
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
      <p className="text-text-secondary font-medium text-sm">{message}</p>
    </div>
  );
}
