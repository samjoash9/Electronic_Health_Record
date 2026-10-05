import { pct } from './format';

/** Top-N names with their figure, in the order the server ranked them. */
export function RankedList({ title, items, format = (v) => v }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-ink-600">{title}</p>
      {items.length === 0 ? (
        <p className="text-xs text-ink-400">None recorded.</p>
      ) : (
        <ol aria-label={title} className="flex flex-col gap-1 text-xs">
          {items.map((item) => (
            <li key={item.name} className="flex items-center justify-between gap-2">
              <span className="truncate text-ink-700">{item.name}</span>
              <span className="font-semibold tabular-nums text-ink-900">{format(item.value)}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/**
 * How many patients had each finding, as a count, a share and a thin bar.
 * An item's own `total` (the patients whose answer was recorded) wins over
 * the list's, so a blank answer never counts as "no".
 */
export function PrevalenceList({ title, items, total, color }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-ink-600">{title}</p>
      <ul aria-label={title} className="flex flex-col gap-1.5 text-xs">
        {items.map((item) => {
          const of = item.total ?? total;
          return (
            <li key={item.key} className="flex items-center gap-2">
              <span className="w-36 shrink-0 truncate text-ink-700">{item.label}</span>
              <span aria-hidden="true" className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                <span
                  className="block h-full rounded-full"
                  style={{ width: of ? `${(item.count / of) * 100}%` : '0%', backgroundColor: color }}
                />
              </span>
              <span className="flex w-16 shrink-0 justify-end gap-1 tabular-nums">
                <span className="font-semibold text-ink-900">{item.count}</span>
                <span className="text-ink-500">{pct(item.count, of)}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** The card's "needs attention" line; the caller decides which items alert. */
export function FlagList({ items }) {
  return (
    <ul aria-label="Flags" className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
      {items.map((item) => (
        <li key={item.label} className={item.alert ? 'font-medium text-rose-600' : 'text-ink-600'}>
          <span>{item.label}</span>: <span className="font-semibold tabular-nums">{item.value}</span>
        </li>
      ))}
    </ul>
  );
}
