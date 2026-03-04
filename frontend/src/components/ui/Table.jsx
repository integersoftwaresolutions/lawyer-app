import { useStateHandler } from "../../hooks/useStateHandler";
import StateHandler from "../StateHandler";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

/**
 * Reusable Table Component with built-in StateHandler
 * 
 * @param {Object} props
 * @param {Array} props.columns - Column configuration [{ key, label, render?, align? }]
 * @param {Array|Function} props.data - Data array or async function that returns data
 * @param {string} props.keyField - Field to use as key (default: '_id')
 * @param {boolean} props.loading - External loading state (optional, uses StateHandler if data is function)
 * @param {Error} props.error - External error state (optional)
 * @param {Function} props.retry - External retry function (optional)
 * @param {React.ReactNode} props.emptyMessage - Custom empty state message
 * @param {React.ReactNode} props.emptyIcon - Custom empty state icon
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.stickyHeader - Make header sticky
 * @param {Function} props.onRowClick - Callback when row is clicked
 * @param {string} props.rowClassName - Additional classes for rows
 * @param {Array} props.dependencies - Dependencies array for re-fetching when data is a function
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
  stickyHeader = false,
  onRowClick,
  rowClassName = "",
  dependencies = [],
  ...props
}) {
  // If data is a function, use useStateHandler
  const isDataFunction = typeof data === "function";
  const {
    loading: internalLoading,
    error: internalError,
    data: internalData,
    retry: internalRetry,
  } = isDataFunction
    ? useStateHandler(data, { dependencies })
    : { loading: false, error: null, data: null, retry: null };

  const loading = externalLoading !== undefined ? externalLoading : internalLoading;
  const error = externalError !== undefined ? externalError : internalError;
  const retry = externalRetry || internalRetry;
  const tableData = isDataFunction ? (internalData || []) : (data || []);

  const handleRowClick = (row) => {
    if (onRowClick) {
      onRowClick(row);
    }
  };

  return (
    <StateHandler loading={loading} error={error} retry={retry}>
      <div className={`overflow-x-auto ${className}`} {...props}>
        {tableData.length === 0 ? (
          <EmptyState message={emptyMessage} icon={emptyIcon} />
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-surface border-b border-border">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`text-left p-4 text-text-secondary text-xs font-semibold uppercase tracking-wider ${
                      column.align === "center" ? "text-center" : column.align === "right" ? "text-right" : ""
                    } ${stickyHeader ? "sticky top-0 z-10 bg-surface" : ""}`}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, rowIndex) => (
                <tr
                  key={row[keyField] || rowIndex}
                  onClick={() => handleRowClick(row)}
                  className={`
                    border-b border-border transition-colors
                    ${onRowClick ? "cursor-pointer hover:bg-surface" : ""}
                    ${rowIndex % 2 === 0 ? "bg-card" : "bg-surface"}
                    ${rowClassName}
                  `}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`p-4 text-text-primary text-sm ${
                        column.align === "center" ? "text-center" : column.align === "right" ? "text-right" : ""
                      }`}
                    >
                      {column.render
                        ? column.render(row[column.key], row, rowIndex)
                        : row[column.key] ?? "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </StateHandler>
  );
}

/**
 * Empty state component
 */
function EmptyState({ message, icon }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon ? (
        <div className="mb-4 text-text-muted">{icon}</div>
      ) : (
        <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-text-muted"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
      )}
      <p className="text-text-secondary font-medium">{message}</p>
    </div>
  );
}

