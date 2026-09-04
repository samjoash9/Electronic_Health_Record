import Button from './Button';

/** Numbered page pills with Previous/Next, capped to a window around the current page. */
export default function Pagination({ page, totalPages, onPageChange, maxButtons = 5 }) {
  const half = Math.floor(maxButtons / 2);
  let start = Math.max(1, page - half);
  const end = Math.min(totalPages, start + maxButtons - 1);
  start = Math.max(1, end - maxButtons + 1);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <div className="flex items-center gap-1.5">
      <Button
        type="button"
        variant="secondary"
        size="lg"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </Button>

      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPageChange(p)}
          aria-current={p === page ? 'page' : undefined}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium transition ${
            p === page
              ? 'bg-[#1fc8a8] text-white'
              : 'text-ink-700 hover:bg-gray-100'
          }`}
        >
          {p}
        </button>
      ))}

      <Button
        type="button"
        variant="secondary"
        size="lg"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </Button>
    </div>
  );
}
