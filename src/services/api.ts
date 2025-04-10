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
    console.log('🌐 Browser online status:', navigator.onLine ? 'Online' : 'Offline');
    console.log('🌐 Environment:', process.env.NODE_ENV);
    console.log('🌐 Origin:', window.location.origin);
    console.log('🌐 API URL from env:', process.env.NEXT_PUBLIC_API_URL || 'Not set');
    
    // Try local API endpoint
    const endpoint = '/api/admin/settings';
    console.log(`🔍 Using local API endpoint: ${endpoint}`);
    
    // Get authentication token
    const token = localStorage.getItem('admin_token');
    console.log('🔑 Auth token available:', !!token);
    if (token) {
      console.log('🔑 Token first 10 chars:', token.substring(0, 10) + '...');
    }
    
    // First try a HEAD request to check basic connectivity
    try {
      console.log('🔄 Testing with HEAD request first...');
      const headResponse = await fetch(endpoint, {
        method: 'HEAD',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        }
      });
      console.log('🔄 HEAD response status:', headResponse.status);
    } catch (headError) {
      console.error('❌ HEAD request failed:', headError);
    }
    
    // Now try the actual GET request
    console.log('🔄 Sending main connection test request...');
    const startTime = Date.now();
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token || ''}`
      }
    });
    const endTime = Date.now();
    const requestTime = endTime - startTime;
    
    console.log(`🔄 Response received in ${requestTime}ms`);
    console.log('🔄 Response status:', response.status);
    console.log('🔄 Response status text:', response.statusText);
    
    // Capture detailed response info for debugging
    const responseDetails = {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries([...response.headers.entries()]),
      url: response.url,
      redirected: response.redirected,
      type: response.type,
      requestTime: requestTime
    };
    
    if (!response.ok) {
      console.error('❌ Connection test response not OK:', responseDetails);
      
      // Try to read the error body anyway
      try {
        const errorData = await response.json();
        console.error('❌ Error response body:', errorData);
        
        throw new Error(`Connection failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
      } catch (jsonError) {
        console.error('❌ Could not parse error response:', jsonError);
        throw new Error(`Connection failed: ${response.status} ${response.statusText} - Could not parse response`);
      }
    }
    
    console.log('🔄 Parsing response JSON...');
    const data = await response.json();
    console.log('✅ Connection test successful, data:', data);
    
    // Try a direct ping to the backend as well
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://wasit-backend.onrender.com';
      console.log(`🔄 Testing direct connection to backend: ${apiUrl}/api/admin/debug-settings`);
      
      const directResponse = await fetch(`${apiUrl}/api/admin/debug-settings`, {
        method: 'HEAD',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        }
      });
      
      console.log('🔄 Direct backend response status:', directResponse.status);
    } catch (directError) {
      console.error('❌ Direct backend connection test failed:', directError);
    }
    
    return {
      success: true,
      data: data,
      responseDetails: responseDetails
    };
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    console.error('❌ Detailed error:', {
      name: (error as Error).name,
      message: (error as Error).message,
      stack: (error as Error).stack
    });
    
    // Try a direct network check
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://wasit-backend.onrender.com';
      console.log(`🔄 Attempting direct ping to backend domain: ${apiUrl}`);
      const pingResult = await fetch(apiUrl, { method: 'HEAD', mode: 'no-cors' });
      console.log('🔄 Direct ping result:', pingResult.type); // Will be 'opaque' for no-cors
    } catch (pingError) {
      console.error('❌ Direct ping failed:', pingError);
    }
    
    return {
      success: false,
      error: {
        name: (error as Error).name,
        message: (error as Error).message,
        stack: (error as Error).stack
      },
      message: 'Failed to connect to API. Check your connection or contact support.',
      environmentInfo: {
        apiUrl: process.env.NEXT_PUBLIC_API_URL || 'Not set',
        origin: window.location.origin,
        nodeEnv: process.env.NODE_ENV,
        browserOnline: navigator.onLine
      }
    };
  }
};

export default api;