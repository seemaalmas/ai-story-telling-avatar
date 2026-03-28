import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/services/api';
import { StatCard } from '@/components/StatCard';

export function StoriesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'stories', 'stats'],
    queryFn: () => adminApi.get('/admin/stories/stats').then((r) => r.data),
  });

  return (
    <div>
      <h1 style={styles.heading}>Story Packs & Stats</h1>
      <div style={styles.grid}>
        <StatCard icon="📖" label="Total Stories" value={isLoading ? '...' : data?.totalStories ?? 0} />
        <StatCard icon="🎭" label="Total Sessions" value={isLoading ? '...' : data?.totalSessions ?? 0} color="#4A90D9" />
      </div>
      {data?.byStatus && (
        <div style={styles.statusGrid}>
          <h2 style={styles.subheading}>By Status</h2>
          <div style={styles.grid}>
            {Object.entries(data.byStatus as Record<string, number>).map(([status, count]) => (
              <StatCard key={status} icon={statusIcon(status)} label={status} value={count} color={statusColor(status)} />
            ))}
          </div>
        </div>
      )}
      <div style={styles.info}>
        <h2 style={styles.subheading}>Story Seed Management</h2>
        <p style={styles.infoText}>
          Story seeds are defined in <code>apps/api/src/modules/story-engine/seeds/index.ts</code>.
          To manage seeds via the admin UI, migrate them to a database-backed model.
        </p>
      </div>
    </div>
  );
}

function statusIcon(s: string) { return { DRAFT: '📝', GENERATING: '⏳', COMPLETED: '✅', FAILED: '❌' }[s] ?? '❓'; }
function statusColor(s: string) { return { DRAFT: '#6B7280', GENERATING: '#F59E0B', COMPLETED: '#10B981', FAILED: '#EF4444' }[s] ?? '#6B7280'; }

const styles: Record<string, React.CSSProperties> = {
  heading: { fontSize: 24, fontWeight: 700, color: '#1A1A2E', marginBottom: 24, marginTop: 0 },
  subheading: { fontSize: 18, fontWeight: 600, color: '#1A1A2E', marginBottom: 12 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 },
  statusGrid: { marginTop: 32 },
  info: { marginTop: 32, backgroundColor: '#fff', padding: 24, borderRadius: 12, border: '1px solid #E5E7EB' },
  infoText: { color: '#6B7280', fontSize: 14, lineHeight: '1.6' },
};
