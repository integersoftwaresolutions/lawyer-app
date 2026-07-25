import { FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from "react-icons/fi";
import IconButton from "./IconButton";
import Button from "./Button";

/**
 * Standalone list pagination. Place below DataTable.
 *
 * Pass either discrete props or `meta` from the list API:
 *   meta: { page, pages, total, limit }
 */
export default function Pagination({
  meta = null,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  className = "",
  showInfo = true,
  showFirstLast = true,
  alwaysShow = false
}) {
  const page = Number(meta?.page ?? currentPage ?? 1) || 1;
  const pages = Math.max(1, Number(meta?.pages ?? totalPages ?? 1) || 1);
  const total = Math.max(0, Number(meta?.total ?? totalItems ?? 0) || 0);
  const limit = Math.max(1, Number(meta?.limit ?? itemsPerPage ?? 10) || 10);

  if (!alwaysShow && pages <= 1 && total <= limit) return null;

  const handlePageChange = (next) => {
    if (next >= 1 && next <= pages && next !== page && onPageChange) {
      onPageChange(next);
    }
  };

  const getPageNumbers = () => {
    const list = [];
    const maxVisible = 5;

    if (pages <= maxVisible) {
      for (let i = 1; i <= pages; i++) list.push(i);
      return list;
    }

    list.push(1);
    let start = Math.max(2, page - 1);
    let end = Math.min(pages - 1, page + 1);
    if (page <= 3) end = Math.min(5, pages - 1);
    if (page >= pages - 2) start = Math.max(2, pages - 4);
    if (start > 2) list.push("ellipsis-start");
    for (let i = start; i <= end; i++) list.push(i);
    if (end < pages - 1) list.push("ellipsis-end");
    if (pages > 1) list.push(pages);
    return list;
  };

  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-card-border bg-card px-3.5 py-3 sm:px-4 ${className}`}
    >
      {showInfo && (
        <p className="text-xs text-text-muted order-2 sm:order-1 m-0 tabular-nums">
          Showing{" "}
          <span className="font-medium text-text-secondary">{startItem}</span>
          {" – "}
          <span className="font-medium text-text-secondary">{endItem}</span>
          {" of "}
          <span className="font-medium text-text-secondary">{total}</span>
        </p>
      )}

      <div className="flex items-center gap-1 order-1 sm:order-2">
        {showFirstLast && (
          <IconButton
            icon={FiChevronsLeft}
            label="First page"
            variant="secondary"
            size="icon-sm"
            outline
            disabled={page <= 1}
            onClick={() => handlePageChange(1)}
          />
        )}

        <IconButton
          icon={FiChevronLeft}
          label="Previous page"
          variant="secondary"
          size="icon-sm"
          outline
          disabled={page <= 1}
          onClick={() => handlePageChange(page - 1)}
        />

        <div className="hidden sm:flex items-center gap-0.5 mx-1">
          {getPageNumbers().map((p, index) => {
            if (p === "ellipsis-start" || p === "ellipsis-end") {
              return (
                <span key={`ellipsis-${index}`} className="px-2 text-text-muted text-xs select-none">
                  …
                </span>
              );
            }
            return (
              <Button
                key={p}
                variant={page === p ? "primary" : "ghost"}
                size="xs"
                rounded="md"
                className="min-w-[2rem]"
                onClick={() => handlePageChange(p)}
              >
                {p}
              </Button>
            );
          })}
        </div>

        <span className="sm:hidden text-xs text-text-muted px-2 tabular-nums">
          {page} / {pages}
        </span>

        <IconButton
          icon={FiChevronRight}
          label="Next page"
          variant="secondary"
          size="icon-sm"
          outline
          disabled={page >= pages}
          onClick={() => handlePageChange(page + 1)}
        />

        {showFirstLast && (
          <IconButton
            icon={FiChevronsRight}
            label="Last page"
            variant="secondary"
            size="icon-sm"
            outline
            disabled={page >= pages}
            onClick={() => handlePageChange(pages)}
          />
        )}
      </div>
    </div>
  );
}
