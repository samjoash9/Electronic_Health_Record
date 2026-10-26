import Pagination from './Pagination';

/**
 * The "Page 1 of 4 (32 employees)" line plus its page pills, as every list
 * screen shows it. `plural` covers nouns an appended "s" gets wrong (entries).
 * On a narrow screen the pills wrap below the summary rather than overflow;
 * `maxButtons` narrows the pill window further where even that is too wide,
 * and `fullWidth` gives the pills a row of their own, spanning it edge to edge.
 */
export default function TableFooter({ page, totalPages, total, noun, plural, onPageChange, maxButtons, fullWidth }) {
  if (total === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 text-sm text-ink-500">
      <span>
        Page {page} of {totalPages} ({total} {total === 1 ? noun : (plural ?? `${noun}s`)})
      </span>
      <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} maxButtons={maxButtons} fullWidth={fullWidth} />
    </div>
  );
}
