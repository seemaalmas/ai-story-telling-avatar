import React, { useState } from 'react';

interface Props {
  onLogin: (email: string, password: string) => Promise<void>;
}

export function LoginPage({ onLogin }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onLogin(email, password);
    } catch {
      setError('Invalid credentials or insufficient permissions. Admin/Super Admin role required.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>📖</div>
        <h1 style={styles.title}>Katha AI Admin</h1>
        <p style={styles.subtitle}>Sign in with your admin account</p>

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} required />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} required />
          </div>
          {error && <div style={styles.error}>{error}</div>}
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F9FA' },
  card: { maxWidth: 400, width: '100%', padding: 32, backgroundColor: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', textAlign: 'center' },
  logo: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 700, color: '#1A1A2E', margin: 0 },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4, marginBottom: 24 },
  field: { textAlign: 'left', marginBottom: 16 },
  label: { display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' },
  error: { backgroundColor: '#FEF2F2', color: '#DC2626', padding: 12, borderRadius: 8, fontSize: 13, marginBottom: 16 },
  button: { width: '100%', padding: 12, backgroundColor: '#FF6B35', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' },
};
