import Pagination from './Pagination';

/**
 * The "Page 1 of 4 (32 employees)" line plus its page pills, as every list
 * screen shows it. `plural` covers nouns an appended "s" gets wrong (entries).
 */
export default function TableFooter({ page, totalPages, total, noun, plural, onPageChange }) {
  if (total === 0) return null;

  return (
    <div className="flex items-center justify-between text-sm text-ink-500">
      <span>
        Page {page} of {totalPages} ({total} {total === 1 ? noun : (plural ?? `${noun}s`)})
      </span>
      <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
    </div>
  );
}
