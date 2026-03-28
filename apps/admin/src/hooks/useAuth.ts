import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '@/services/api';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export function useAuth() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await adminApi.get('/users/me');
      if (data.role === 'ADMIN' || data.role === 'SUPER_ADMIN') {
        setUser(data);
      } else {
        localStorage.removeItem('admin_token');
      }
    } catch {
      localStorage.removeItem('admin_token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const login = async (email: string, password: string) => {
    const { data } = await adminApi.post('/auth/login', { email, password });
    localStorage.setItem('admin_token', data.accessToken);
    await fetchUser();
    navigate('/');
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    setUser(null);
    navigate('/login');
  };

  return { user, loading, login, logout, isAuthenticated: !!user };
}
