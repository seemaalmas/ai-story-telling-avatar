import React from 'react';

interface Props {
  icon: string;
  label: string;
  value: string | number;
  color?: string;
}

export function StatCard({ icon, label, value, color = '#FF6B35' }: Props) {
  return (
    <div style={styles.card}>
      <div style={{ ...styles.iconBox, backgroundColor: color + '15' }}>
        <span style={{ fontSize: 24 }}>{icon}</span>
      </div>
      <div>
        <div style={styles.value}>{value}</div>
        <div style={styles.label}>{label}</div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    border: '1px solid #E5E7EB',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { fontSize: 24, fontWeight: 700, color: '#1A1A2E' },
  label: { fontSize: 13, color: '#6B7280', marginTop: 2 },
};
