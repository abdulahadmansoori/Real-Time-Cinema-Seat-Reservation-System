"use client";

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
};

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  empty = "No results",
}: {
  columns: Column<T>[];
  rows: T[];
  empty?: string;
}) {
  return (
    <div className="wrap">
      <table>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>{empty}</td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id}>
                {columns.map((c) => (
                  <td key={c.key}>{c.render(row)}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      <style jsx>{`
        .wrap {
          overflow: auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
        }
        th,
        td {
          text-align: left;
          padding: 0.7rem 0.55rem;
          border-bottom: 1px solid var(--border);
        }
        th {
          color: var(--text-muted);
          font-weight: 600;
          font-size: 0.8rem;
        }
      `}</style>
    </div>
  );
}
