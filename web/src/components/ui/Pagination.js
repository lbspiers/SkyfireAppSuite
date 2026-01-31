import React from 'react';
import styles from './Pagination.module.css';

const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  siblingCount = 1,    // Pages shown on each side of current
  showFirstLast = true,
  showPrevNext = true,
  size = 'md',         // sm, md, lg
  className = '',
}) => {
  const range = (start, end) => {
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const generatePages = () => {
    const totalNumbers = siblingCount * 2 + 3; // siblings + current + first + last
    const totalBlocks = totalNumbers + 2; // + 2 for ellipsis

    if (totalPages <= totalBlocks) {
      return range(1, totalPages);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const showLeftEllipsis = leftSiblingIndex > 2;
    const showRightEllipsis = rightSiblingIndex < totalPages - 1;

    if (!showLeftEllipsis && showRightEllipsis) {
      const leftRange = range(1, 3 + 2 * siblingCount);
      return [...leftRange, 'ellipsis', totalPages];
    }

    if (showLeftEllipsis && !showRightEllipsis) {
      const rightRange = range(totalPages - (2 + 2 * siblingCount), totalPages);
      return [1, 'ellipsis', ...rightRange];
    }

    const middleRange = range(leftSiblingIndex, rightSiblingIndex);
    return [1, 'ellipsis', ...middleRange, 'ellipsis', totalPages];
  };

  const pages = generatePages();

  const handlePageClick = (page) => {
    if (page !== currentPage && onPageChange) {
      onPageChange(page);
    }
  };

  return (
    <nav aria-label="Pagination" className={`${styles.pagination} ${styles[size]} ${className}`}>
      {showFirstLast && (
        <button
          className={styles.button}
          onClick={() => handlePageClick(1)}
          disabled={currentPage === 1}
          aria-label="First page"
        >
          ««
        </button>
      )}

      {showPrevNext && (
        <button
          className={styles.button}
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          «
        </button>
      )}

      {pages.map((page, index) => (
        page === 'ellipsis' ? (
          <span key={`ellipsis-${index}`} className={styles.ellipsis}>...</span>
        ) : (
          <button
            key={page}
            className={`${styles.button} ${styles.page} ${currentPage === page ? styles.active : ''}`}
            onClick={() => handlePageClick(page)}
            aria-current={currentPage === page ? 'page' : undefined}
          >
            {page}
          </button>
        )
      ))}

      {showPrevNext && (
        <button
          className={styles.button}
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
        >
          »
        </button>
      )}

      {showFirstLast && (
        <button
          className={styles.button}
          onClick={() => handlePageClick(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="Last page"
        >
          »»
        </button>
      )}
    </nav>
  );
};

export default Pagination;
