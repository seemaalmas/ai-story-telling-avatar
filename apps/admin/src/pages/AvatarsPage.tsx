import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/services/api';
import { DataTable } from '@/components/DataTable';

export function AvatarsPage() {
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'avatars', page],
    queryFn: () => adminApi.get('/admin/avatars', { params: { page, limit: 20 } }).then((r) => r.data),
  });

  const togglePublic = useMutation({
    mutationFn: ({ id, isPublic }: { id: string; isPublic: boolean }) =>
      adminApi.patch(`/admin/avatars/${id}`, { isPublic }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'avatars'] }),
  });

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'description', header: 'Description', render: (r: Record<string, unknown>) => ((r.description as string) ?? '').slice(0, 60) },
    { key: 'user', header: 'Owner', render: (r: Record<string, unknown>) => (r.user as Record<string, string>)?.name ?? '-' },
    {
      key: 'isPublic',
      header: 'Public',
      render: (r: Record<string, unknown>) => (
        <button
          onClick={() => togglePublic.mutate({ id: r.id as string, isPublic: !r.isPublic })}
          style={r.isPublic ? styles.activeBadge : styles.inactiveBadge}
        >
          {r.isPublic ? 'Public' : 'Private'}
        </button>
      ),
    },
  ];

  return (
    <div>
      <h1 style={styles.heading}>Avatar Catalog</h1>
      <DataTable columns={columns} data={data?.data ?? []} loading={isLoading} />
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
  heading: { fontSize: 24, fontWeight: 700, color: '#1A1A2E', marginBottom: 24, marginTop: 0 },
  activeBadge: { backgroundColor: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', borderRadius: 12, padding: '2px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  inactiveBadge: { backgroundColor: '#F3F4F6', color: '#6B7280', border: '1px solid #E5E7EB', borderRadius: 12, padding: '2px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  pagination: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 16, fontSize: 14 },
  pageBtn: { padding: '6px 16px', border: '1px solid #E5E7EB', borderRadius: 6, backgroundColor: '#fff', cursor: 'pointer' },
};
