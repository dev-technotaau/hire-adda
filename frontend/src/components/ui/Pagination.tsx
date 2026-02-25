'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
  className?: string;
}

function getPageNumbers(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | 'ellipsis')[] = [1];

  if (currentPage > 3) {
    pages.push('ellipsis');
  }

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (currentPage < totalPages - 2) {
    pages.push('ellipsis');
  }

  pages.push(totalPages);

  return pages;
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  className,
}: PaginationProps) {
  const pages = useMemo(() => getPageNumbers(currentPage, totalPages), [currentPage, totalPages]);

  if (totalPages <= 1) return null;

  const showingFrom = totalItems && pageSize ? (currentPage - 1) * pageSize + 1 : null;
  const showingTo = totalItems && pageSize ? Math.min(currentPage * pageSize, totalItems) : null;

  return (
    <div
      className={cn('flex flex-col items-center gap-3 sm:flex-row sm:justify-between', className)}
    >
      {totalItems !== undefined && pageSize && (
        <p className="text-sm text-[var(--text-muted)]">
          Showing <span className="font-medium text-[var(--text)]">{showingFrom}</span>-
          <span className="font-medium text-[var(--text)]">{showingTo}</span> of{' '}
          <span className="font-medium text-[var(--text)]">{totalItems}</span>
        </p>
      )}
      <nav className="flex items-center gap-1" aria-label="Pagination">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={cn(
            'inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm transition-colors duration-200',
            'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]',
            'disabled:pointer-events-none disabled:opacity-50',
          )}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pages.map((page, index) => {
          if (page === 'ellipsis') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="inline-flex h-9 w-9 items-center justify-center text-sm text-[var(--text-muted)]"
              >
                ...
              </span>
            );
          }

          const isActive = page === currentPage;
          return (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={cn(
                'inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors duration-200',
                isActive
                  ? 'bg-primary text-white'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]',
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              {page}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={cn(
            'inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm transition-colors duration-200',
            'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]',
            'disabled:pointer-events-none disabled:opacity-50',
          )}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </nav>
    </div>
  );
}

Pagination.displayName = 'Pagination';

export default Pagination;
