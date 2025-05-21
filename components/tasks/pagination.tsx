'use client';

import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBreakpoints } from '@/hooks/use-breakpoints';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  // Use the breakpoints hook to check screen size
  const { isAtMost } = useBreakpoints();
  const isSmallScreen = isAtMost('sm');

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];

    // For very small screens, show a more compact pagination
    if (isSmallScreen) {
      // Always show current page
      pages.push(currentPage);

      // If we're not at the start or end, show ellipsis
      if (currentPage > 2) {
        pages.unshift(-1); // ellipsis before
      }

      // Always show first page if we're not on it
      if (currentPage > 1) {
        pages.unshift(1);
      }

      // Always show last page if we're not on it
      if (currentPage < totalPages) {
        pages.push(totalPages);
      }

      // If we're not at the start or end, show ellipsis
      if (currentPage < totalPages - 1) {
        pages.splice(pages.length - 1, 0, -2); // ellipsis after
      }
    } else {
      // Desktop pagination - show more pages
      // Always show first page
      pages.push(1);

      // Calculate range around current page
      const rangeStart = Math.max(2, currentPage - 1);
      const rangeEnd = Math.min(totalPages - 1, currentPage + 1);

      // Add ellipsis if needed before range
      if (rangeStart > 2) {
        pages.push(-1); // -1 represents ellipsis
      }

      // Add pages in range
      for (let i = rangeStart; i <= rangeEnd; i++) {
        pages.push(i);
      }

      // Add ellipsis if needed after range
      if (rangeEnd < totalPages - 1) {
        pages.push(-2); // -2 represents ellipsis
      }

      // Always show last page if more than 1 page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-center space-x-1 sm:space-x-2 py-4 sm:py-6 mt-2">
      {/* Previous page button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="h-8 w-8 sm:w-auto sm:px-3"
        aria-label="Previous Page"
        title="Previous Page"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only sm:not-sr-only sm:ml-1 sm:inline-block">
          {isSmallScreen ? '' : 'Previous'}
        </span>
      </Button>

      {/* Page numbers or ellipsis */}
      <div className="flex items-center space-x-1 sm:space-x-2">
        {pageNumbers.map((page, index) => {
          // Render ellipsis
          if (page < 0) {
            return (
              <Button
                key={`ellipsis-${index}`}
                variant="ghost"
                size="sm"
                disabled
                className="px-1 sm:px-2 h-8 w-6 sm:w-8"
              >
                <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="sr-only">More Pages</span>
              </Button>
            );
          }

          // Render page number
          return (
            <Button
              key={page}
              variant={currentPage === page ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPageChange(page)}
              className="h-8 w-6 sm:w-8 p-0 text-xs sm:text-sm"
              aria-label={`Page ${page}`}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              {page}
            </Button>
          );
        })}
      </div>

      {/* Next page button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="h-8 w-8 sm:w-auto sm:px-3"
        aria-label="Next Page"
        title="Next Page"
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only sm:not-sr-only sm:ml-1 sm:inline-block">
          {isSmallScreen ? '' : 'Next'}
        </span>
      </Button>

      {/* Page info for accessibility */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Page {currentPage} of {totalPages}
      </div>
    </div>
  );
}
