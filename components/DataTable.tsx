// Tableau partagé des listes de modules (bureau) : carte blanche arrondie,
// en-têtes en petites capitales, lignes séparées par un filet.

export type Column<T> = {
  key: string;
  header: React.ReactNode;
  className?: string;
  headerClassName?: string;
  render: (row: T) => React.ReactNode;
};

export default function DataTable<T>({
  columns,
  rows,
  rowKey,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl bg-white shadow-sm shadow-neutral-900/5 dark:bg-card-dark">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-neutral-400">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-4 first:pl-6 last:pr-6 ${col.headerClassName ?? ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className="border-t border-neutral-100 dark:border-neutral-800"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-4 py-4 first:pl-6 last:pr-6 ${col.className ?? ""}`}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
