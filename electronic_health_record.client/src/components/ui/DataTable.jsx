import { Inbox } from 'lucide-react';

/**
 * Columns may carry an `icon` (a lucide component) shown beside the header
 * label. `rowActions` renders a trailing, header-less cell per row — clicks
 * inside it do not trigger `onRowClick`, so a row menu cannot also navigate.
 *
 * `variant` picks the skin: "tinted" is the station queues' teal header with
 * zebra rows; "plain" is the quieter hairline-and-white treatment the dashboard
 * uses, where the table sits inside an already-busy page.
 */
const VARIANTS = {
  tinted: {
    frame: 'overflow-x-auto rounded-xl border border-line shadow-sm',
    head: 'bg-[#e9fbf6] text-left',
    th: 'whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#0e7d6b]',
    thIcon: 'text-[#0e7d6b]/70',
    row: (i, clickable) => `border-t border-line transition-colors ${
      i % 2 === 1 ? 'bg-[#fafcfc]' : 'bg-white'
    } ${clickable ? 'cursor-pointer hover:bg-[#eafaf6]' : ''}`,
    td: (first) => `px-4 py-3 ${first ? 'font-medium text-ink-900' : 'text-ink-700'}`,
  },
  plain: {
    frame: 'overflow-x-auto rounded-xl border border-[#eef0f4]',
    head: 'text-left',
    th: 'whitespace-nowrap border-b border-[#eef0f4] px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#8b95a7]',
    thIcon: 'text-[#b3bccb]',
    row: (i, clickable) => `${i > 0 ? 'border-t border-[#f2f4f7]' : ''} transition-colors ${
      clickable ? 'cursor-pointer hover:bg-[#f9fafc]' : ''
    }`,
    td: (first) => `px-4 py-3.5 ${first ? 'font-medium text-[#1e293b]' : 'text-[#64748b]'}`,
  },
};

export default function DataTable({
  columns, rows, onRowClick, rowActions, variant = 'tinted', empty = 'Nothing here yet.',
}) {
  const skin = VARIANTS[variant] ?? VARIANTS.tinted;

  if (!rows?.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line px-3 py-14 text-center">
        <Inbox size={28} className="text-ink-300" />
        <p className="text-sm text-ink-500">{empty}</p>
      </div>
    );
  }
  return (
    <div className={skin.frame}>
      <table className="w-full text-sm">
        <thead className={skin.head}>
          <tr>
            {columns.map(({ key, header, icon: Icon }) => (
              <th key={key} className={skin.th}>
                <span className="inline-flex items-center gap-1.5">
                  {Icon && <Icon size={14} strokeWidth={2} className={skin.thIcon} />}
                  {header}
                </span>
              </th>
            ))}
            {rowActions && <th className={skin.th} />}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.id ?? row.formID ?? i}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              // A clickable row must be reachable without a mouse, so it takes
              // focus and answers Enter/Space like the button it behaves as.
              role={onRowClick ? 'button' : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onKeyDown={onRowClick ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onRowClick(row);
                }
              } : undefined}
              className={`${skin.row(i, Boolean(onRowClick))} ${
                onRowClick ? 'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#129883]' : ''
              }`}
            >
              {columns.map((c, ci) => (
                <td key={c.key} className={skin.td(ci === 0)}>
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
              {rowActions && (
                // Stop propagation so the menu does not also fire onRowClick.
                <td
                  className={`${skin.td(false)} w-12 text-right`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {rowActions(row)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
