import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { AdminLayout } from './components/AdminLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { UsersPage } from './pages/UsersPage';
import { StoriesPage } from './pages/StoriesPage';
import { AvatarsPage } from './pages/AvatarsPage';
import { ReportsPage } from './pages/ReportsPage';
import { FeatureFlagsPage } from './pages/FeatureFlagsPage';
import { LanguagesPage } from './pages/LanguagesPage';
import { AuditLogPage } from './pages/AuditLogPage';

export function App() {
  const { user, loading, login, logout, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={login} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<AdminLayout user={user} onLogout={logout} />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/stories" element={<StoriesPage />} />
        <Route path="/avatars" element={<AvatarsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/flags" element={<FeatureFlagsPage />} />
        <Route path="/languages" element={<LanguagesPage />} />
        <Route path="/audit" element={<AuditLogPage />} />
      </Route>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
