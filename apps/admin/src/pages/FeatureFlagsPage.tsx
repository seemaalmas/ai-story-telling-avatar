import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/services/api';

interface Flag {
  id: string;
  key: string;
  enabled: boolean;
  description?: string;
  isKillSwitch: boolean;
  updatedBy?: string;
  updatedAt: string;
}

export function FeatureFlagsPage() {
  const qc = useQueryClient();
  const [newKey, setNewKey] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const { data: flags = [], isLoading } = useQuery<Flag[]>({
    queryKey: ['admin', 'flags'],
    queryFn: () => adminApi.get('/admin/flags').then((r) => r.data),
  });

  const toggle = useMutation({
    mutationFn: (flag: Flag) => adminApi.post('/admin/flags', { key: flag.key, enabled: !flag.enabled, isKillSwitch: flag.isKillSwitch }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'flags'] }),
  });

  const create = useMutation({
    mutationFn: () => adminApi.post('/admin/flags', { key: newKey, enabled: false, description: newDesc }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'flags'] }); setNewKey(''); setNewDesc(''); },
  });

  const remove = useMutation({
    mutationFn: (key: string) => adminApi.delete(`/admin/flags/${key}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'flags'] }),
  });

  const killSwitches = flags.filter((f) => f.isKillSwitch);
  const regular = flags.filter((f) => !f.isKillSwitch);

  return (
    <div>
      <h1 style={styles.heading}>Feature Flags</h1>

      {/* Kill Switches */}
      {killSwitches.length > 0 && (
        <div style={styles.killSection}>
          <h2 style={styles.killHeading}>Emergency Kill Switches</h2>
          <p style={styles.killDesc}>Toggling these immediately disables live features.</p>
          <div style={styles.flagGrid}>
            {killSwitches.map((f) => (
              <div key={f.id} style={{ ...styles.flagCard, borderColor: f.enabled ? '#10B981' : '#EF4444' }}>
                <div style={styles.flagHeader}>
                  <span style={styles.flagKey}>{f.key}</span>
                  <button onClick={() => toggle.mutate(f)} style={f.enabled ? styles.onBtn : styles.offBtn}>
                    {f.enabled ? 'ACTIVE' : 'KILLED'}
                  </button>
                </div>
                <div style={styles.flagDesc}>{f.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Regular Flags */}
      <h2 style={styles.subheading}>Feature Flags</h2>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div style={styles.flagGrid}>
          {regular.map((f) => (
            <div key={f.id} style={styles.flagCard}>
              <div style={styles.flagHeader}>
                <span style={styles.flagKey}>{f.key}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => toggle.mutate(f)} style={f.enabled ? styles.onBtn : styles.offBtn}>
                    {f.enabled ? 'ON' : 'OFF'}
                  </button>
                  <button onClick={() => { if (confirm(`Delete flag "${f.key}"?`)) remove.mutate(f.key); }} style={styles.deleteBtn}>×</button>
                </div>
              </div>
              <div style={styles.flagDesc}>{f.description ?? '—'}</div>
            </div>
          ))}
        </div>
      )}

      {/* Create new flag */}
      <div style={styles.createBox}>
        <h3 style={styles.subheading}>Add Flag</h3>
        <div style={styles.createRow}>
          <input placeholder="flag_key" value={newKey} onChange={(e) => setNewKey(e.target.value)} style={styles.input} />
          <input placeholder="Description" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} style={{ ...styles.input, flex: 2 }} />
          <button onClick={() => create.mutate()} disabled={!newKey} style={styles.createBtn}>Add</button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  heading: { fontSize: 24, fontWeight: 700, color: '#1A1A2E', marginBottom: 24, marginTop: 0 },
  subheading: { fontSize: 16, fontWeight: 600, color: '#1A1A2E', marginBottom: 12 },
  killSection: { backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: 20, marginBottom: 24 },
  killHeading: { fontSize: 16, fontWeight: 700, color: '#DC2626', margin: 0 },
  killDesc: { fontSize: 13, color: '#7F1D1D', marginTop: 4, marginBottom: 12 },
  flagGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 },
  flagCard: { backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: 16 },
  flagHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  flagKey: { fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: '#1A1A2E' },
  flagDesc: { fontSize: 13, color: '#6B7280' },
  onBtn: { backgroundColor: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700 },
  offBtn: { backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700 },
  deleteBtn: { background: 'none', border: '1px solid #E5E7EB', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 14, color: '#9CA3AF' },
  createBox: { marginTop: 32, backgroundColor: '#fff', padding: 20, borderRadius: 12, border: '1px solid #E5E7EB' },
  createRow: { display: 'flex', gap: 8 },
  input: { flex: 1, padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 },
  createBtn: { padding: '8px 20px', backgroundColor: '#FF6B35', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
};
