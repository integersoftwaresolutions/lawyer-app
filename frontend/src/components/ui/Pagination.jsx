import { FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from "react-icons/fi";
import IconButton from "./IconButton";
import Button from "./Button";

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 10,
  onPageChange,
  className = "",
  showInfo = true,
  showFirstLast = true
}) {
  if (totalPages <= 1 && totalItems <= itemsPerPage) return null;

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage && onPageChange) {
      onPageChange(page);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      if (currentPage <= 3) end = Math.min(5, totalPages - 1);
      if (currentPage >= totalPages - 2) start = Math.max(2, totalPages - 4);
      if (start > 2) pages.push("ellipsis-start");
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push("ellipsis-end");
      if (totalPages > 1) pages.push(totalPages);
    }
    return pages;
  };

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 ${className}`}>
      {showInfo && (
        <p className="text-xs text-text-muted order-2 sm:order-1">
          <span className="font-medium text-text-secondary">{startItem}</span>
          {" – "}
          <span className="font-medium text-text-secondary">{endItem}</span>
          {" of "}
          <span className="font-medium text-text-secondary">{totalItems}</span>
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
            disabled={currentPage === 1}
            onClick={() => handlePageChange(1)}
          />
        )}

        <IconButton
          icon={FiChevronLeft}
          label="Previous page"
          variant="secondary"
          size="icon-sm"
          outline
          disabled={currentPage === 1}
          onClick={() => handlePageChange(currentPage - 1)}
        />

        <div className="hidden sm:flex items-center gap-0.5 mx-1">
          {getPageNumbers().map((page, index) => {
            if (page === "ellipsis-start" || page === "ellipsis-end") {
              return (
                <span key={`ellipsis-${index}`} className="px-2 text-text-muted text-xs">
                  …
                </span>
              );
            }
            return (
              <Button
                key={page}
                variant={currentPage === page ? "primary" : "ghost"}
                size="xs"
                rounded="md"
                className="min-w-[2rem]"
                onClick={() => handlePageChange(page)}
              >
                {page}
              </Button>
            );
          })}
        </div>

        <span className="sm:hidden text-xs text-text-muted px-2 tabular-nums">
          {currentPage} / {totalPages}
        </span>

        <IconButton
          icon={FiChevronRight}
          label="Next page"
          variant="secondary"
          size="icon-sm"
          outline
          disabled={currentPage === totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
        />

        {showFirstLast && (
          <IconButton
            icon={FiChevronsRight}
            label="Last page"
            variant="secondary"
            size="icon-sm"
            outline
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(totalPages)}
          />
        )}
      </div>
    </div>
  );
}
