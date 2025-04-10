import axios from 'axios';

// Get API URL from environment or use default
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

console.log('🌐 API Service Initialized with URL:', API_URL);

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 seconds timeout
});

// Add request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Ensure URL has the correct format
    if (config.url && !config.url.startsWith('/api/') && !config.url.startsWith('http')) {
      // Convert non-absolute URLs that don't start with /api/
      // e.g., '/admin/settings' becomes '/api/admin/settings'
      if (config.url.startsWith('/admin/')) {
        config.url = config.url.replace('/admin/', '/api/admin/');
      }
    }
    
    // Add timestamp to avoid caching issues
    const timestamp = new Date().getTime();
    const separator = config.url?.includes('?') ? '&' : '?';
    config.url = `${config.url}${separator}_t=${timestamp}`;
    
    console.log(`🔍 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response from ${response.config.url}: Status ${response.status}`);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.message);
    
    // Enhanced error logging
    if (error.response) {
      console.error('❌ Response status:', error.response.status);
      console.error('❌ Response data:', error.response.data);
      console.error('❌ Request URL:', error.config?.url);
    } else if (error.request) {
      console.error('❌ No response received. Request:', error.request);
      console.error('❌ Request URL:', error.config?.url);
      console.error('❌ Request method:', error.config?.method);
    }
    
    return Promise.reject(error);
  }
);

export default api;