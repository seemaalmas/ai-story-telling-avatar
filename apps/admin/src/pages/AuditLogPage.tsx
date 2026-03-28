import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/services/api';
import { DataTable } from '@/components/DataTable';

export function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'audit', page, actionFilter],
    queryFn: () =>
      adminApi.get('/admin/audit-log', { params: { page, limit: 30, action: actionFilter || undefined } }).then((r) => r.data),
  });

  const columns = [
    { key: 'createdAt', header: 'Time', render: (r: Record<string, unknown>) => new Date(r.createdAt as string).toLocaleString('en-IN') },
    { key: 'action', header: 'Action', render: (r: Record<string, unknown>) => <code style={styles.code}>{r.action as string}</code> },
    { key: 'resource', header: 'Resource', render: (r: Record<string, unknown>) => `${r.resource}${r.resourceId ? `:${(r.resourceId as string).slice(0, 8)}` : ''}` },
    { key: 'adminUserId', header: 'Admin', render: (r: Record<string, unknown>) => (r.adminUserId as string).slice(0, 12) + '...' },
    { key: 'ipAddress', header: 'IP' },
  ];

  return (
    <div>
      <h1 style={styles.heading}>Admin Audit Trail</h1>
      <div style={styles.filterRow}>
        <input
          placeholder="Filter by action (e.g. user_banned)..."
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          style={styles.input}
        />
      </div>
      <DataTable columns={columns} data={data?.data ?? []} loading={isLoading} emptyMessage="No audit entries" />
      {data?.meta && data.meta.totalPages > 1 && (
        <div style={styles.pagination}>
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} style={styles.pageBtn}>Previous</button>
          <span>Page {page} of {data.meta.totalPages}</span>
          <button disabled={page >= data.meta.totalPages} onClick={() => setPage(page + 1)} style={styles.pageBtn}>Next</button>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  heading: { fontSize: 24, fontWeight: 700, color: '#1A1A2E', marginBottom: 16, marginTop: 0 },
  filterRow: { marginBottom: 16 },
  input: { width: '100%', maxWidth: 400, padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' },
  code: { backgroundColor: '#F3F4F6', padding: '2px 6px', borderRadius: 4, fontSize: 12, fontFamily: 'monospace' },
  pagination: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 16, fontSize: 14 },
  pageBtn: { padding: '6px 16px', border: '1px solid #E5E7EB', borderRadius: 6, backgroundColor: '#fff', cursor: 'pointer' },
};
