import Spinner from "./Spinner";
import Button from "./Button";
import { getErrorMessage } from "../../utils/errorHandler";
import { isLawyerNotVerifiedError } from "../../utils/lawyerVerification";
import VerificationRequiredPanel from "../verification/VerificationRequiredPanel";

/**
 * Canonical data table for list pages.
 * Pagination is intentionally separate — place <Pagination /> below this component.
 *
 * columns: [{ key, label, render?, align?, className?, width?, hideOnMobile? }]
 */
export default function DataTable({
  columns = [],
  data = [],
  keyField = "id",
  loading = false,
  error = null,
  retry = null,
  emptyMessage = "No records found",
  emptyDescription = "Try adjusting filters or check back later.",
  emptyIcon = null,
  emptyAction = null,
  className = "",
  stickyHeader = true,
  onRowClick,
  rowClassName = "",
  density = "comfortable",
  minWidth = "640px",
  skeletonRows = 6
}) {
  const rows = Array.isArray(data) ? data : [];
  const cellPad = density === "compact" ? "px-3 py-2.5" : "px-4 py-3.5";
  const edgePadFirst = density === "compact" ? "pl-4 sm:pl-5" : "pl-4 sm:pl-6";
  const edgePadLast = density === "compact" ? "pr-4 sm:pr-5" : "pr-4 sm:pr-6";

  const alignClass = (align) => {
    if (align === "center") return "text-center";
    if (align === "right") return "text-right";
    return "text-left";
  };

  const resolveKey = (row, index) => {
    if (row?.[keyField] != null) return String(row[keyField]);
    if (row?._id != null) return String(row._id);
    return String(index);
  };

  return (
    <div
      className={`rounded-xl border border-card-border bg-card overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`}
    >
      <div className="overflow-x-auto scrollbar-sm">
        {error ? (
          isLawyerNotVerifiedError(error) ? (
            <div className="px-4 py-8 sm:px-6">
              <VerificationRequiredPanel compact />
            </div>
          ) : (
            <div className="px-6 py-14 text-center">
              <p className="text-sm font-medium text-text-primary m-0 mb-1">Couldn’t load data</p>
              <p className="text-xs text-text-muted m-0 mb-4 max-w-sm mx-auto">
                {getErrorMessage(error)}
              </p>
              {typeof retry === "function" && (
                <Button size="sm" variant="secondary" outline onClick={retry}>
                  Try again
                </Button>
              )}
            </div>
          )
        ) : loading ? (
          <TableSkeleton
            columns={columns}
            rows={skeletonRows}
            cellPad={cellPad}
            edgePadFirst={edgePadFirst}
            edgePadLast={edgePadLast}
            minWidth={minWidth}
            stickyHeader={stickyHeader}
          />
        ) : rows.length === 0 ? (
          <EmptyState message={emptyMessage} description={emptyDescription} icon={emptyIcon} action={emptyAction} />
        ) : (
          <table className="w-full border-collapse" style={{ minWidth }}>
            <thead>
              <tr className="border-b border-card-border">
                {columns.map((column, columnIndex) => (
                  <th
                    key={column.key}
                    scope="col"
                    style={column.width ? { width: column.width } : undefined}
                    className={`
                      ${cellPad}
                      ${columnIndex === 0 ? edgePadFirst : ""}
                      ${columnIndex === columns.length - 1 ? edgePadLast : ""}
                      text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted whitespace-nowrap
                      ${alignClass(column.align)}
                      ${column.hideOnMobile ? "hidden md:table-cell" : ""}
                      ${stickyHeader ? "sticky top-0 z-10 bg-surface" : "bg-surface"}
                    `}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr
                  key={resolveKey(row, rowIndex)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`
                    group border-b border-card-border last:border-b-0
                    transition-colors duration-150
                    ${rowIndex % 2 === 0 ? "bg-card" : "bg-surface"}
                    ${onRowClick ? "cursor-pointer" : ""}
                    hover:bg-surface-hover
                    ${typeof rowClassName === "function" ? rowClassName(row, rowIndex) : rowClassName}
                  `}
                >
                  {columns.map((column, columnIndex) => (
                    <td
                      key={column.key}
                      className={`
                        ${cellPad}
                        ${columnIndex === 0 ? edgePadFirst : ""}
                        ${columnIndex === columns.length - 1 ? edgePadLast : ""}
                        text-sm text-text-primary align-middle
                        ${alignClass(column.align)}
                        ${column.hideOnMobile ? "hidden md:table-cell" : ""}
                        ${column.className || ""}
                      `}
                    >
                      {column.render
                        ? column.render(row[column.key], row, rowIndex)
                        : row[column.key] ?? <span className="text-text-muted">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function TableSkeleton({
  columns,
  rows,
  cellPad,
  edgePadFirst,
  edgePadLast,
  minWidth,
  stickyHeader
}) {
  return (
    <table className="w-full border-collapse" style={{ minWidth }}>
      <thead>
        <tr className="border-b border-card-border">
          {columns.map((column, columnIndex) => (
            <th
              key={column.key}
              className={`
                ${cellPad}
                ${columnIndex === 0 ? edgePadFirst : ""}
                ${columnIndex === columns.length - 1 ? edgePadLast : ""}
                text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted
                ${stickyHeader ? "sticky top-0 z-10 bg-surface" : "bg-surface"}
              `}
            >
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <tr key={rowIndex} className="border-b border-card-border last:border-b-0">
            {columns.map((column, columnIndex) => (
              <td
                key={column.key}
                className={`
                  ${cellPad}
                  ${columnIndex === 0 ? edgePadFirst : ""}
                  ${columnIndex === columns.length - 1 ? edgePadLast : ""}
                `}
              >
                <div
                  className="h-3.5 rounded-md bg-surface-hover animate-pulse"
                  style={{ width: `${55 + ((rowIndex + columnIndex) % 4) * 10}%` }}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function EmptyState({ message, description, icon, action }) {
  return (
    <div className="m-4 sm:m-5 rounded-xl border border-dashed border-card-border bg-surface">
      <div className="flex flex-col items-center justify-center py-12 sm:py-14 px-6 text-center">
        <div className="mb-4 w-12 h-12 rounded-2xl bg-primary-light border border-primary-light flex items-center justify-center text-primary">
          {icon || (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          )}
        </div>
        <p className="text-text-primary font-medium text-sm m-0">{message}</p>
        {description ? <p className="text-text-muted text-xs mt-1.5 m-0 max-w-xs">{description}</p> : null}
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    </div>
  );
}

/** Thin loading bar for use above tables when preferred over skeleton */
export function DataTableLoadingBar({ loading }) {
  if (!loading) return null;
  return (
    <div className="h-0.5 w-full overflow-hidden rounded-full bg-surface-hover mb-2">
      <div className="h-full w-1/3 rounded-full bg-primary animate-pulse" />
      <span className="sr-only">
        <Spinner size="sm" />
      </span>
    </div>
  );
}
