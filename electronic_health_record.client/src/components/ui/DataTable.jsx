export default function DataTable({ columns, rows, onRowClick, empty = 'Nothing here yet.' }) {
  if (!rows?.length) {
    return <p className="px-3 py-8 text-center text-sm text-ink-500">{empty}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-line bg-gray-50 text-left">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="px-3 py-2 text-xs font-semibold text-ink-700">
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
              className={`border-b border-line ${onRowClick ? 'cursor-pointer hover:bg-brand-50' : ''}`}
            >
              {columns.map((c) => (
                <td key={c.key} className="px-3 py-2">
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
