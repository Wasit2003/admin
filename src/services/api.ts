import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// Get API URL from environment or use default
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
// We'll use this for proxying
const BACKEND_URL = API_URL;

console.log('🌐 API Service Initialized with original URL:', API_URL);
console.log('🌐 Running in environment:', process.env.NODE_ENV);
console.log('🌐 Using local API proxies in this environment');

// Define response types
interface ConnectionTestResponse {
  success: boolean;
  data?: Record<string, unknown>;
  error?: Error;
  responseDetails?: ResponseDetails;
}

interface ResponseDetails {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  url: string;
  redirected: boolean;
  type: string;
  requestTime?: number;
}

// Extend AxiosInstance type to include our custom methods
interface EnhancedAxiosInstance extends AxiosInstance {
  testConnection(): Promise<ConnectionTestResponse>;
}

// Create axios instance with base configuration
const api = axios.create({
  // Use relative URLs by default so they go through Next.js API routes
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000, // Increase timeout to 20 seconds
}) as EnhancedAxiosInstance;

// Helper function to convert backend URLs to local proxy URLs
const convertToProxyUrl = (url: string): string => {
  console.log(`🔄 Original URL before conversion: ${url}`);
  
  // If it's already a local API route, leave it alone
  if (url.startsWith('/api/') && !url.includes('wasit-backend.onrender.com')) {
    console.log(`✅ URL is already a local API route: ${url}`);
    return url;
  }
  
  let proxyUrl = url;
  
  // Case 1: Full backend URL (with or without API path)
  if (url.includes('wasit-backend.onrender.com') || url.includes(BACKEND_URL)) {
    // Extract the path after the domain
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    
    // Check if this is an admin API path
    if (pathParts.includes('api') && pathParts.includes('admin')) {
      // Find the index of 'admin' in the path
      const adminIndex = pathParts.indexOf('admin');
      if (adminIndex >= 0 && adminIndex + 1 < pathParts.length) {
        // Reconstruct path with everything after 'admin'
        const endpointPath = pathParts.slice(adminIndex + 1).join('/');
        proxyUrl = `/api/admin/${endpointPath}${urlObj.search || ''}`;
      } else {
        proxyUrl = `/api/admin${urlObj.search || ''}`;
      }
    } else {
      // For non-admin API paths, just use the catch-all
      proxyUrl = `/api${urlObj.pathname}${urlObj.search || ''}`;
    }
  } 
  // Case 2: Relative path starting with /admin
  else if (url.startsWith('/admin/')) {
    proxyUrl = `/api${url}`;
  }
  // Case 3: Other relative path not starting with /api (treat as admin endpoint)
  else if (!url.startsWith('/api/') && !url.startsWith('http')) {
    proxyUrl = `/api/admin/${url.replace(/^\//, '')}`;
  }
  
  console.log(`🔄 Converted URL: ${url} -> ${proxyUrl}`);
  return proxyUrl;
};

// Helper function to log detailed request information
const logRequest = (config: AxiosRequestConfig) => {
  console.group('🔍 API Request Details:');
  console.log('Method:', config.method?.toUpperCase());
  console.log('URL:', `${config.baseURL || ''}${config.url}`);
  console.log('Headers:', config.headers);
  if (config.data) {
    try {
      console.log('Body:', typeof config.data === 'string' ? JSON.parse(config.data) : config.data);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      // Ignore parsing errors, just log the raw data
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
      console.log('🔑 Added authorization token to request');
    }
    
    // Force all URLs to go through our local proxies
    if (config.url) {
      // Save original URL for logging
      const originalUrl = config.url;
      
      // Convert the URL to use our local proxy
      config.url = convertToProxyUrl(config.url);
      
      // If the URL was changed, log the conversion
      if (originalUrl !== config.url) {
        console.log(`🔄 Redirecting request through local proxy: ${originalUrl} -> ${config.url}`);
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
    console.log('🔄 Testing connection to backend API...');
    const startTime = Date.now();
    const token = localStorage.getItem('admin_token');
    
    // First try the local API proxy which should handle CORS properly
    const localApiUrl = `/api/admin/settings?_t=${Date.now()}`;
    console.log('🔄 Testing connection to local API proxy:', localApiUrl);
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Adding token to request');
    }
    
    const requestTime = Date.now() - startTime;
    console.log(`🔄 Request prepared in ${requestTime}ms`);
    
    // Try the connection
    const response = await fetch(localApiUrl, {
      method: 'GET',
      headers: headers,
    });
    
    // Capture detailed response info for debugging
    const responseDetails: ResponseDetails = {
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
    console.error('❌ Connection test failed:', error instanceof Error ? error.message : String(error));
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
};

export default api;