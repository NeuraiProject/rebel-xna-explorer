import * as React from "react";

interface PaginationProps {
  total: number;
  page: number;
  onChange: (page: number) => void;
}

export function Pagination({ total, page, onChange }: PaginationProps) {
  const pages = Array.from({ length: total }, (_, i) => i + 1);

  // Mostrar solo algunas páginas alrededor de la actual
  const getVisiblePages = () => {
    if (total <= 7) {
      return pages;
    }

    if (page <= 4) {
      return [...pages.slice(0, 5), -1, total];
    }

    if (page >= total - 3) {
      return [1, -1, ...pages.slice(total - 5)];
    }

    return [1, -1, page - 1, page, page + 1, -2, total];
  };

  const visiblePages = getVisiblePages();

  return (
    <div className="pagination">
      <button
        className="pagination-btn"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
      >
        ‹
      </button>

      {visiblePages.map((p, index) => {
        if (p === -1 || p === -2) {
          return (
            <span key={`ellipsis-${index}`} className="pagination-btn" style={{ cursor: "default", border: "none" }}>
              ...
            </span>
          );
        }

        return (
          <button
            key={p}
            className={`pagination-btn ${p === page ? "active" : ""}`}
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        );
      })}

      <button
        className="pagination-btn"
        onClick={() => onChange(page + 1)}
        disabled={page === total}
      >
        ›
      </button>
    </div>
  );
}
