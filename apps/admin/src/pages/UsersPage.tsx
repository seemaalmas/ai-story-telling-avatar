import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/services/api';
import { DataTable } from '@/components/DataTable';

export function UsersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', page, search],
    queryFn: () => adminApi.get('/admin/users', { params: { page, limit: 20, search: search || undefined } }).then((r) => r.data),
  });

  const banMutation = useMutation({
    mutationFn: (userId: string) => adminApi.post(`/admin/users/${userId}/ban`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role', render: (r: Record<string, unknown>) => <span style={badgeStyle(r.role as string)}>{r.role as string}</span> },
    { key: 'isActive', header: 'Status', render: (r: Record<string, unknown>) => r.isActive ? '🟢 Active' : '🔴 Banned' },
    { key: 'createdAt', header: 'Joined', render: (r: Record<string, unknown>) => new Date(r.createdAt as string).toLocaleDateString('en-IN') },
    {
      key: 'actions',
      header: '',
      render: (r: Record<string, unknown>) =>
        r.isActive ? (
          <button onClick={() => { if (confirm('Ban this user?')) banMutation.mutate(r.id as string); }} style={styles.dangerBtn}>Ban</button>
        ) : null,
    },
  ];

  return (
    <div>
      <h1 style={styles.heading}>Users</h1>
      <input
        type="text"
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        style={styles.search}
      />
      <DataTable columns={columns} data={data?.data ?? []} loading={isLoading} emptyMessage="No users found" />
      {data?.meta && (
        <div style={styles.pagination}>
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} style={styles.pageBtn}>Previous</button>
          <span>Page {page} of {data.meta.totalPages}</span>
          <button disabled={page >= data.meta.totalPages} onClick={() => setPage(page + 1)} style={styles.pageBtn}>Next</button>
        </div>
      )}
    </div>
  );
}

function badgeStyle(role: string): React.CSSProperties {
  const colors: Record<string, string> = { SUPER_ADMIN: '#7C3AED', ADMIN: '#2563EB', USER: '#6B7280' };
  return { backgroundColor: (colors[role] ?? '#6B7280') + '15', color: colors[role] ?? '#6B7280', padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600 };
}

const styles: Record<string, React.CSSProperties> = {
  heading: { fontSize: 24, fontWeight: 700, color: '#1A1A2E', marginBottom: 16, marginTop: 0 },
  search: { width: '100%', maxWidth: 400, padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, marginBottom: 16, boxSizing: 'border-box' },
  dangerBtn: { backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  pagination: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 16, fontSize: 14 },
  pageBtn: { padding: '6px 16px', border: '1px solid #E5E7EB', borderRadius: 6, backgroundColor: '#fff', cursor: 'pointer' },
};
