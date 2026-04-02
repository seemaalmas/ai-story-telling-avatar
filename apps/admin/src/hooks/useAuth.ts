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
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchUser = useCallback(async (): Promise<boolean> => {
    const token = localStorage.getItem('admin_token');
    if (!token) { setLoading(false); return false; }
    try {
      const { data } = await adminApi.get('/users/me');
      if (data.role === 'ADMIN' || data.role === 'SUPER_ADMIN') {
        setUser(data);
        return true;
      } else {
        localStorage.removeItem('admin_token');
        setError('Access denied. Your account does not have admin privileges.');
        return false;
      }
    } catch {
      localStorage.removeItem('admin_token');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      const { data } = await adminApi.post('/auth/login', { email, password });
      localStorage.setItem('admin_token', data.accessToken);
      const isAdmin = await fetchUser();
      if (isAdmin) {
        navigate('/');
      }
    } catch (err: unknown) {
      localStorage.removeItem('admin_token');
      const axiosErr = err as { response?: { data?: { message?: string }; status?: number } };
      if (axiosErr.response?.status === 401) {
        throw new Error('Invalid email or password');
      }
      throw new Error(axiosErr.response?.data?.message ?? 'Login failed. Please try again.');
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    setUser(null);
    setError(null);
    navigate('/login');
  };

  return { user, loading, login, logout, error, isAuthenticated: !!user };
}
