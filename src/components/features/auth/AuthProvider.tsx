import { ReactNode, useState, useEffect } from 'react';
import { AuthContext } from '../../../hooks/useAuth';
import api from '../../../services/api';
import { useRouter } from 'next/router';

interface AuthProviderProps {
  children: ReactNode;
}

interface AdminUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
}

interface LoginResponse {
  token: string;
  user: AdminUser;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('admin_token');
    if (token) {
      checkAuth();
    }
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      console.log('Token retrieved:', token); // Debugging print
      
      const response = await api.get('/admin/me');
      console.log('Auth check response:', response.data); // Debugging print
      
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error: unknown) {
      console.error('Auth check failed:', error);
      logout();
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login with:', { email });
      const response = await api.post<LoginResponse>('/admin/login', { email, password });
      console.log('Login response:', response.data);
      
      if (response.data.token) {
        localStorage.setItem('admin_token', response.data.token);
        setUser(response.data.user);
        setIsAuthenticated(true);
        router.push('/dashboard');
        return response.data;
      } else {
        throw new Error('No token received');
      }
    } catch (error: unknown) {
      // Type assertion for error object
      const errorMessage = 
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 
        (error as Error)?.message || 
        'Unknown error occurred';
      
      console.error('Login error:', errorMessage);
      throw new Error(errorMessage === 'Unknown error occurred' ? 'Invalid credentials' : errorMessage);
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    setUser(null);
    setIsAuthenticated(false);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
