import Button from './Button';

/**
 * Numbered page pills with Previous/Next, showing at most `maxButtons` pages.
 * When the run is truncated an ellipsis marks the hidden pages on that side,
 * so "… 3 4 5 6 …" reads as a window rather than as the whole range.
 *
 * `fullWidth` stretches Previous/Next to fill the row with the pills centred
 * between them -- bigger tap targets on a phone, and no dead space beside them.
 */
export default function Pagination({ page, totalPages, onPageChange, maxButtons = 4, fullWidth = false }) {
  const half = Math.floor(maxButtons / 2);
  let start = Math.max(1, page - half);
  const end = Math.min(totalPages, start + maxButtons - 1);
  // Re-anchor after clamping to the end, so the window keeps its full width
  // on the last pages instead of shrinking.
  start = Math.max(1, end - maxButtons + 1);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const ellipsis = <span className="px-1 text-sm text-ink-400 select-none">…</span>;

  return (
    <div className={`flex items-center gap-1.5 ${fullWidth ? 'w-full' : ''}`}>
      <Button
        type="button"
        variant="secondary"
        size="lg"
        className={fullWidth ? 'flex-1' : ''}
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </Button>

      {start > 1 && ellipsis}

      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPageChange(p)}
          aria-current={p === page ? 'page' : undefined}
          aria-label={`Page ${p}`}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-medium transition ${
            p === page
              ? 'bg-[#1fc8a8] text-white'
              : 'text-ink-700 hover:bg-gray-100'
          }`}
        >
          {p}
        </button>
      ))}

      {end < totalPages && ellipsis}

      <Button
        type="button"
        variant="secondary"
        size="lg"
        className={fullWidth ? 'flex-1' : ''}
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </Button>
    </div>
  );
}
