import { peso } from '../../lib/formatters';
import { parseDiagnosticTests, diagnosticTestsTotal } from '../../lib/diagnosticTests';

/**
 * The ordered diagnostic tests with their prices and a total, for the
 * read-only record views.
 *
 * The total counts only the tests that carry a price. Tests the office has no
 * fixed rate for are shown with a dash and called out under the total, so the
 * figure is never read as covering work that has not been quoted yet.
 */
export default function DiagnosticTestList({ value, placeholder = 'None ordered.' }) {
  const rows = parseDiagnosticTests(value);
  if (!rows.length) return <p className="text-sm text-ink-400 italic">{placeholder}</p>;

  const { total, pricedCount, unpricedCount } = diagnosticTestsTotal(value);

  return (
    <div className="flex flex-col gap-1.5">
      <ul className="flex flex-col gap-1">
        {rows.map((row, i) => (
          <li key={`${row.name}-${i}`} className="flex items-baseline justify-between gap-4 text-sm">
            <span className="text-ink-900">{row.name}</span>
            {row.price == null ? (
              <span className="shrink-0 text-ink-400 italic">Not priced</span>
            ) : (
              <span className="shrink-0 tabular-nums text-ink-700">{peso(row.price)}</span>
            )}
          </li>
        ))}
      </ul>

      {pricedCount > 0 && (
        <div className="mt-1 flex items-baseline justify-between gap-4 border-t border-line pt-1.5">
          <span className="text-sm font-semibold text-ink-900">Diagnostic test total</span>
          <span className="shrink-0 text-sm font-semibold tabular-nums text-ink-900">{peso(total)}</span>
        </div>
      )}

      {unpricedCount > 0 && (
        <p className="text-xs text-ink-500">
          {pricedCount > 0
            ? `Excludes ${unpricedCount} test${unpricedCount === 1 ? '' : 's'} with no set price.`
            : `No set price for ${unpricedCount === 1 ? 'this test' : 'these tests'}.`}
        </p>
      )}
    </div>
  );
}
