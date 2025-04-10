import { ReactNode, useState, useEffect, useCallback } from 'react';
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

  // Define logout function first to avoid circular dependency
  const logout = useCallback(() => {
    localStorage.removeItem('admin_token');
    setUser(null);
    setIsAuthenticated(false);
    router.push('/login');
  }, [router]);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('admin_token');
        if (!token) return;
        
        console.log('Token retrieved:', token);
        
        // Use local API proxy instead of direct backend call
        const response = await fetch('/api/admin/me', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Authentication check failed');
        }
        
        const data = await response.json();
        console.log('Auth check response:', data);
        
        setUser(data);
        setIsAuthenticated(true);
      } catch (error: unknown) {
        console.error('Auth check failed:', error);
        logout();
      }
    };
    
    checkAuthStatus();
  }, [logout]);

  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login with:', { email });
      
      // Validate inputs before sending request
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      // Use local API proxy instead of direct backend call
      console.log('Sending login request to local API proxy');
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      // Log detailed response info for debugging
      console.log('Login response status:', response.status);
      
      let data;
      try {
        // Get the response data
        const textResponse = await response.text();
        console.log('Got text response, length:', textResponse.length);
        
        try {
          // Try to parse as JSON
          data = JSON.parse(textResponse);
          console.log('Parsed JSON response successfully');
        } catch (parseError) {
          console.error('Failed to parse response as JSON:', parseError);
          console.error('Response text (first 100 chars):', textResponse.substring(0, 100));
          throw new Error('Invalid response from server: not valid JSON');
        }
      } catch (responseError) {
        console.error('Error extracting response data:', responseError);
        throw new Error('Failed to read server response');
      }
      
      if (!response.ok) {
        console.error('Login request failed:', response.status, data);
        throw new Error(data?.message || `Login failed with status ${response.status}`);
      }
      
      console.log('Login successful, token received:', !!data.token);
      
      if (data.token) {
        localStorage.setItem('admin_token', data.token);
        setUser(data.user);
        setIsAuthenticated(true);
        router.push('/dashboard');
        return data;
      } else {
        console.error('No token in response:', data);
        throw new Error('Authentication failed: No token received');
      }
    } catch (error: unknown) {
      // Enhanced error handling and logging
      console.error('Login error:', error);
      
      let errorMessage = 'Unknown error occurred';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String((error as {message: string}).message);
      }
      
      // Show a more user-friendly error
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        errorMessage = 'Cannot connect to the server. Please check your internet connection.';
      } else if (errorMessage.includes('Unexpected token')) {
        errorMessage = 'The server returned an invalid response. Please try again later.';
      }
      
      throw new Error(errorMessage);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
