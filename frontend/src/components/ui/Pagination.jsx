import { FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from "react-icons/fi";
import Button from "./Button";

/**
 * Reusable Pagination Component
 * 
 * @param {Object} props
 * @param {number} props.currentPage - Current page number (1-indexed)
 * @param {number} props.totalPages - Total number of pages
 * @param {number} props.totalItems - Total number of items
 * @param {number} props.itemsPerPage - Items per page
 * @param {Function} props.onPageChange - Callback when page changes (page) => void
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.showInfo - Show page info (default: true)
 * @param {boolean} props.showFirstLast - Show first/last page buttons (default: true)
 */
export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 10,
  onPageChange,
  className = "",
  showInfo = true,
  showFirstLast = true,
}) {
  if (totalPages <= 1) return null;

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage && onPageChange) {
      onPageChange(page);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust if we're near the start
      if (currentPage <= 3) {
        end = Math.min(5, totalPages - 1);
      }
      
      // Adjust if we're near the end
      if (currentPage >= totalPages - 2) {
        start = Math.max(2, totalPages - 4);
      }
      
      // Add ellipsis after first page if needed
      if (start > 2) {
        pages.push("ellipsis-start");
      }
      
      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      // Add ellipsis before last page if needed
      if (end < totalPages - 1) {
        pages.push("ellipsis-end");
      }
      
      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
      {showInfo && (
        <div className="text-sm text-text-secondary">
          Showing <span className="font-medium text-text-primary">{startItem}</span> to{" "}
          <span className="font-medium text-text-primary">{endItem}</span> of{" "}
          <span className="font-medium text-text-primary">{totalItems}</span> results
        </div>
      )}
      
      <div className="flex items-center gap-1">
        {showFirstLast && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className="px-2"
            title="First page"
          >
            <FiChevronsLeft className="w-4 h-4" />
          </Button>
        )}
        
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-2"
          title="Previous page"
        >
          <FiChevronLeft className="w-4 h-4" />
        </Button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => {
            if (page === "ellipsis-start" || page === "ellipsis-end") {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-3 py-1 text-text-muted"
                >
                  ...
                </span>
              );
            }
            
            return (
              <Button
                key={page}
                variant={currentPage === page ? "primary" : "secondary"}
                size="sm"
                onClick={() => handlePageChange(page)}
                className="min-w-[36px]"
              >
                {page}
              </Button>
            );
          })}
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-2"
          title="Next page"
        >
          <FiChevronRight className="w-4 h-4" />
        </Button>

        {showFirstLast && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="px-2"
            title="Last page"
          >
            <FiChevronsRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}




