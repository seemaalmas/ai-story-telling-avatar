import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/services/api';
import { StatCard } from '@/components/StatCard';

export function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => adminApi.get('/admin/dashboard').then((r) => r.data),
  });

  return (
    <div>
      <h1 style={styles.heading}>Dashboard</h1>
      <div style={styles.grid}>
        <StatCard icon="👥" label="Total Users" value={isLoading ? '...' : data?.totalUsers ?? 0} />
        <StatCard icon="🟢" label="Active Today" value={isLoading ? '...' : data?.activeToday ?? 0} color="#10B981" />
        <StatCard icon="📖" label="Total Stories" value={isLoading ? '...' : data?.totalStories ?? 0} color="#4A90D9" />
        <StatCard icon="🚩" label="Open Reports" value={isLoading ? '...' : data?.openReports ?? 0} color="#EF4444" />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  heading: { fontSize: 24, fontWeight: 700, color: '#1A1A2E', marginBottom: 24, marginTop: 0 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 },
};
