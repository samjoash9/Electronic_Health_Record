import { Inbox } from 'lucide-react';

export default function DataTable({ columns, rows, onRowClick, empty = 'Nothing here yet.' }) {
  if (!rows?.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line px-3 py-14 text-center">
        <Inbox size={28} className="text-ink-300" />
        <p className="text-sm text-ink-500">{empty}</p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-line shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-[#e9fbf6] text-left">
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#0e7d6b]"
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.id ?? row.formID ?? i}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`border-t border-line transition-colors ${
                i % 2 === 1 ? 'bg-[#fafcfc]' : 'bg-white'
              } ${onRowClick ? 'cursor-pointer hover:bg-[#eafaf6]' : ''}`}
            >
              {columns.map((c, ci) => (
                <td
                  key={c.key}
                  className={`px-4 py-3 ${ci === 0 ? 'font-medium text-ink-900' : 'text-ink-700'}`}
                >
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
