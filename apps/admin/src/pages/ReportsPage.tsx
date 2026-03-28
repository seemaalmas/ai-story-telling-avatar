import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/services/api';
import { DataTable } from '@/components/DataTable';

export function ReportsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('OPEN');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'reports', page, statusFilter],
    queryFn: () => adminApi.get('/admin/reports', { params: { page, limit: 20, status: statusFilter || undefined } }).then((r) => r.data),
  });

  const resolve = useMutation({
    mutationFn: ({ id, resolution, notes }: { id: string; resolution: string; notes?: string }) =>
      adminApi.post(`/admin/reports/${id}/resolve`, { resolution, notes }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'reports'] }),
  });

  const columns = [
    { key: 'category', header: 'Category', render: (r: Record<string, unknown>) => <strong>{r.category as string}</strong> },
    { key: 'targetType', header: 'Target' },
    { key: 'description', header: 'Description', render: (r: Record<string, unknown>) => ((r.description as string) ?? '').slice(0, 80) + '...' },
    { key: 'reporter', header: 'Reporter', render: (r: Record<string, unknown>) => (r.reporter as Record<string, string>)?.email ?? '-' },
    { key: 'status', header: 'Status', render: (r: Record<string, unknown>) => <span style={statusBadge(r.status as string)}>{r.status as string}</span> },
    { key: 'createdAt', header: 'Filed', render: (r: Record<string, unknown>) => new Date(r.createdAt as string).toLocaleDateString('en-IN') },
    {
      key: 'actions',
      header: '',
      render: (r: Record<string, unknown>) =>
        (r.status as string) === 'OPEN' ? (
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => resolve.mutate({ id: r.id as string, resolution: 'RESOLVED_ACTION_TAKEN', notes: 'Action taken' })} style={styles.actionBtn}>Action</button>
            <button onClick={() => resolve.mutate({ id: r.id as string, resolution: 'DISMISSED' })} style={styles.dismissBtn}>Dismiss</button>
          </div>
        ) : null,
    },
  ];

  return (
    <div>
      <h1 style={styles.heading}>Abuse Reports</h1>
      <div style={styles.filters}>
        {['OPEN', 'INVESTIGATING', 'RESOLVED_ACTION_TAKEN', 'DISMISSED', ''].map((s) => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }} style={statusFilter === s ? styles.filterActive : styles.filterBtn}>
            {s || 'All'}
          </button>
        ))}
      </div>
      <DataTable columns={columns} data={data?.data ?? []} loading={isLoading} emptyMessage="No reports" />
    </div>
  );
}

function statusBadge(status: string): React.CSSProperties {
  const colors: Record<string, string> = { OPEN: '#EF4444', INVESTIGATING: '#F59E0B', RESOLVED_ACTION_TAKEN: '#10B981', RESOLVED_NO_ACTION: '#6B7280', DISMISSED: '#9CA3AF' };
  const c = colors[status] ?? '#6B7280';
  return { backgroundColor: c + '15', color: c, padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 };
}

const styles: Record<string, React.CSSProperties> = {
  heading: { fontSize: 24, fontWeight: 700, color: '#1A1A2E', marginBottom: 16, marginTop: 0 },
  filters: { display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' },
  filterBtn: { padding: '6px 14px', border: '1px solid #E5E7EB', borderRadius: 20, backgroundColor: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 500 },
  filterActive: { padding: '6px 14px', border: '1px solid #FF6B35', borderRadius: 20, backgroundColor: '#FFF5F0', color: '#FF6B35', cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  actionBtn: { backgroundColor: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 11, fontWeight: 600 },
  dismissBtn: { backgroundColor: '#F3F4F6', color: '#6B7280', border: '1px solid #E5E7EB', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 11, fontWeight: 600 },
};
