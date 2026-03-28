import React from 'react';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
}

interface Props<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  loading,
  emptyMessage = 'No data',
}: Props<T>) {
  return (
    <div style={styles.wrapper}>
      <table style={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={styles.th}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={columns.length} style={styles.empty}>Loading...</td></tr>
          ) : data.length === 0 ? (
            <tr><td colSpan={columns.length} style={styles.empty}>{emptyMessage}</td></tr>
          ) : (
            data.map((row, i) => (
              <tr key={i} style={i % 2 === 0 ? styles.rowEven : undefined}>
                {columns.map((col) => (
                  <td key={col.key} style={styles.td}>
                    {col.render ? col.render(row) : String(row[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: { overflowX: 'auto', borderRadius: 8, border: '1px solid #E5E7EB', backgroundColor: '#fff' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' },
  td: { padding: '12px 16px', fontSize: 14, color: '#1A1A2E', borderBottom: '1px solid #F3F4F6' },
  rowEven: { backgroundColor: '#FAFAFA' },
  empty: { textAlign: 'center', padding: 32, color: '#9CA3AF' },
};
