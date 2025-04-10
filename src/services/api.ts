import axios, { AxiosInstance } from 'axios';

// Get API URL from environment or use default
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

console.log('🌐 API Service Initialized with URL:', API_URL);
console.log('🌐 Running in environment:', process.env.NODE_ENV);

// Extend AxiosInstance type to include our custom methods
interface EnhancedAxiosInstance extends AxiosInstance {
  testConnection(): Promise<{ success: boolean; data?: any; error?: any }>;
}

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000, // Increase timeout to 20 seconds
}) as EnhancedAxiosInstance;

// Helper function to log detailed request information
const logRequest = (config: any) => {
  console.group('🔍 API Request Details:');
  console.log('Method:', config.method?.toUpperCase());
  console.log('URL:', `${config.baseURL}${config.url}`);
  console.log('Headers:', config.headers);
  if (config.data) {
    try {
      console.log('Body:', typeof config.data === 'string' ? JSON.parse(config.data) : config.data);
    } catch (e) {
      console.log('Body:', config.data);
    }
  }
  console.groupEnd();
};

// Add request interceptor for authentication and logging
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Ensure URL has the correct format
    if (config.url && !config.url.startsWith('/api/') && !config.url.startsWith('http')) {
      // Special handling for settings endpoint which has direct handlers
      if (config.url === '/admin/settings' || config.url === '/settings') {
        console.log('🔧 Converting settings URL to use direct handler path');
        config.url = '/api/admin/settings';
      } 
      // Convert non-absolute URLs that don't start with /api/
      else if (config.url.startsWith('/admin/')) {
        config.url = config.url.replace('/admin/', '/api/admin/');
      } else if (!config.url.includes('/admin/')) {
        // Add /api/ prefix to any other URLs that don't have it
        config.url = `/api${config.url.startsWith('/') ? '' : '/'}${config.url}`;
      }
    }
    
    // Add timestamp to avoid caching issues
    const timestamp = new Date().getTime();
    const separator = config.url?.includes('?') ? '&' : '?';
    config.url = `${config.url}${separator}_t=${timestamp}`;
    
    // Log the complete request details for debugging
    logRequest(config);
    
    return config;
  },
  (error) => {
    console.error('❌ API Request initialization error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling and logging
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response from ${response.config.url}: Status ${response.status}`);
    return response;
  },
  (error) => {
    console.group('❌ API Error:');
    console.error('Message:', error.message);
    
    // Enhanced error logging
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received from server');
      console.error('Request details:', {
        url: error.config?.url,
        method: error.config?.method,
        timeout: error.config?.timeout,
        baseURL: error.config?.baseURL
      });
    }
    
    // Show network information
    if (navigator.onLine) {
      console.log('🌐 Browser reports internet connection is online');
    } else {
      console.warn('🌐 Browser reports internet connection is offline');
    }
    
    // Add special handling for network errors
    if (error.message.includes('Network Error')) {
      console.error('This is a network connectivity issue. The server may be unreachable.');
      
      // Try to ping the backend to verify connectivity
      fetch(API_URL, { method: 'HEAD', mode: 'no-cors' })
        .then(() => console.log('✅ Backend server appears to be reachable (ping test)'))
        .catch(err => console.error('❌ Backend server unreachable:', err));
    }
    
    console.groupEnd();
    return Promise.reject(error);
  }
);

// Add a method to test connectivity to the backend
api.testConnection = async () => {
  try {
    console.log('🔍 Testing connection to backend...');
    
    // Try local API endpoint
    const endpoint = '/api/admin/settings';
    console.log(`🔍 Using local API endpoint: ${endpoint}`);
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('admin_token') || ''}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Connection failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Connection test successful:', data);
    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    
    return {
      success: false,
      error,
      message: 'Failed to connect to API. Check your connection or contact support.'
    };
  }
};

export default api;