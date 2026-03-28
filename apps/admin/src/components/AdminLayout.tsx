import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', icon: '📊', label: 'Dashboard' },
  { to: '/users', icon: '👥', label: 'Users' },
  { to: '/stories', icon: '📖', label: 'Stories' },
  { to: '/avatars', icon: '🎭', label: 'Avatars' },
  { to: '/reports', icon: '🚩', label: 'Abuse Reports' },
  { to: '/flags', icon: '🏴', label: 'Feature Flags' },
  { to: '/languages', icon: '🌐', label: 'Languages' },
  { to: '/audit', icon: '📋', label: 'Audit Log' },
];

interface Props {
  user: { name: string; role: string } | null;
  onLogout: () => void;
}

export function AdminLayout({ user, onLogout }: Props) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.brand}>
          <span style={{ fontSize: 24 }}>📖</span>
          <span style={styles.brandText}>Katha Admin</span>
        </div>

        <nav style={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              style={({ isActive }) => ({
                ...styles.navItem,
                ...(isActive ? styles.navItemActive : {}),
              })}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div style={styles.userBox}>
          <div style={styles.userName}>{user?.name ?? 'Admin'}</div>
          <div style={styles.userRole}>{user?.role}</div>
          <button onClick={onLogout} style={styles.logoutBtn}>Log out</button>
        </div>
      </aside>

      {/* Main content */}
      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 240,
    backgroundColor: '#1A1A2E',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 10,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '20px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  brandText: { fontSize: 18, fontWeight: 700 },
  nav: {
    flex: 1,
    padding: '12px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 8,
    color: '#9CA3AF',
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 500,
    transition: 'background 0.15s',
  },
  navItemActive: {
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
    color: '#FF6B35',
  },
  userBox: {
    padding: 16,
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  userName: { fontWeight: 600, fontSize: 14 },
  userRole: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  logoutBtn: {
    marginTop: 8,
    background: 'none',
    border: '1px solid rgba(255,255,255,0.2)',
    color: '#9CA3AF',
    padding: '6px 12px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    width: '100%',
  },
  main: {
    flex: 1,
    marginLeft: 240,
    padding: 32,
    backgroundColor: '#F8F9FA',
    minHeight: '100vh',
  },
};
