import React, { useState, useEffect, ChangeEvent, useCallback } from 'react';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import api from '../services/api';

interface ResponseDetails {
  status: number;
  statusText: string;
  headers?: Record<string, string>;
  url: string;
  redirected: boolean;
  type: string;
  requestTime?: number;
}

interface DebugInfo {
  message?: string;
  status?: number;
  statusText?: string;
  url?: string;
  method?: string;
  responseDetails?: ResponseDetails;
}

export default function Fees() {
  const [networkFee, setNetworkFee] = useState('');
  const [exchangeRate, setExchangeRate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  const handleError = useCallback((error: Error, message: string) => {
    console.error(`❌ ${message}:`, error);
    setError(`${message}: ${error.message}`);
    setDebugInfo({
      message: error.message
    });
    setIsLoading(false);
    setIsSaving(false);
  }, []);

  // Check connection to backend first
  useEffect(() => {
    const checkConnection = async () => {
      try {
        setConnectionStatus('checking');
        const result = await api.testConnection();
        if (result.success) {
          setConnectionStatus('connected');
          console.log('✅ Backend connection verified');
        } else {
          setConnectionStatus('error');
          console.error('❌ Backend connection failed');
        }
      } catch (err) {
        setConnectionStatus('error');
        console.error('❌ Connection test error:', err);
      }
    };
    
    checkConnection();
  }, []);

  // Define fetchSettings with useCallback to avoid dependency issues
  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('🔍 DEBUG: Attempting to fetch settings...');
      
      // Capture environment information
      console.log('🌐 Runtime ENV:', {
        nodeEnv: process.env.NODE_ENV,
        baseUrl: window.location.origin,
        apiUrl: process.env.NEXT_PUBLIC_API_URL || 'Not set'
      });
      
      // Using our local API route that proxies to the backend
      const token = localStorage.getItem('admin_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('🔑 DEBUG: Auth token available (first 10 chars):', token.substring(0, 10) + '...');
      } else {
        console.error('❌ DEBUG: No authentication token found!');
      }
      
      // Add timestamp to prevent caching - now use the local API endpoint
      const localApiUrl = `/api/admin/settings?_ts=${Date.now()}`;
      console.log('🔍 DEBUG: Using local API URL:', localApiUrl);
      
      // Make the request
      const response = await fetch(localApiUrl, {
        method: 'GET',
        headers: headers
      });
      
      console.log('🔍 DEBUG: Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
        console.error('❌ DEBUG: Error response:', errorData);
        
        setDebugInfo({
          message: `Failed to fetch settings: ${errorData.message || 'Unknown error'}`,
          status: response.status,
          statusText: response.statusText,
          url: localApiUrl,
          method: 'GET',
          responseDetails: {
            status: response.status,
            statusText: response.statusText,
            url: response.url,
            type: response.type,
            redirected: response.redirected
          }
        });
        
        setError(`Failed to fetch settings: ${response.status} ${response.statusText}`);
        setIsLoading(false);
        return;
      }
      
      const data = await response.json();
      console.log('✅ DEBUG: Settings fetched successfully:', data);
      
      if (data && data.settings) {
        // Extract and set the network fee and exchange rate
        const networkFeePercentage = data.settings.networkFeePercentage;
        const exchangeRateValue = data.settings.exchangeRate;
        
        if (networkFeePercentage !== undefined) {
          setNetworkFee(networkFeePercentage.toString());
        }
        
        if (exchangeRateValue !== undefined) {
          setExchangeRate(exchangeRateValue.toString());
        }
        
        console.log('✅ DEBUG: Settings parsed and applied');
      } else {
        console.error('❌ DEBUG: Invalid or missing settings data:', data);
        setError('Received invalid settings data from server');
        setDebugInfo({
          message: 'Invalid settings data structure',
          responseDetails: {
            status: response.status,
            statusText: response.statusText,
            url: response.url,
            type: response.type,
            redirected: response.redirected
          }
        });
      }
      
      setIsLoading(false);
    } catch (err) {
      handleError(err instanceof Error ? err : new Error(String(err)), 'Failed to fetch settings');
    }
  }, [handleError]);

  // Only fetch settings if connected
  useEffect(() => {
    if (connectionStatus === 'connected') {
      fetchSettings();
    }
  }, [connectionStatus, fetchSettings]); // Add fetchSettings as a dependency

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError('');
      setMessage('');
      setDebugInfo(null);
      
      const networkFeeValue = parseFloat(networkFee);
      const exchangeRateValue = parseFloat(exchangeRate);
      
      // Validate values
      if (isNaN(networkFeeValue) || networkFeeValue < 0 || networkFeeValue > 100) {
        setError('Network fee must be between 0 and 100%');
        setIsSaving(false);
        return;
      }
      
      if (isNaN(exchangeRateValue) || exchangeRateValue <= 0) {
        setError('Exchange rate must be greater than 0');
        setIsSaving(false);
        return;
      }
      
      // Log the request we're about to make
      console.log('🔍 DEBUG: Saving settings:', {
        networkFeePercentage: networkFeeValue,
        exchangeRate: exchangeRateValue
      });
      
      // Get token for authentication
      const token = localStorage.getItem('admin_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Use the local API endpoint
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify({
          networkFeePercentage: networkFeeValue,
          exchangeRate: exchangeRateValue
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
        console.error('❌ DEBUG: Error response:', errorData);
        
        setDebugInfo({
          message: `Failed to save settings: ${errorData.message || 'Unknown error'}`,
          status: response.status,
          statusText: response.statusText,
          url: '/api/admin/settings',
          method: 'PUT',
          responseDetails: {
            status: response.status,
            statusText: response.statusText,
            url: response.url,
            type: response.type,
            redirected: response.redirected
          }
        });
        
        setError(`Failed to save settings: ${response.status} ${response.statusText}`);
        setIsSaving(false);
        return;
      }
      
      const responseData = await response.json();
      console.log('✅ DEBUG: Settings save response:', responseData);
      
      if (responseData.success) {
        setMessage(`Changes saved! Network Fee: ${networkFeeValue}%, Exchange Rate: ${exchangeRateValue}`);
        
        // Clear message after 3 seconds
        setTimeout(() => {
          setMessage('');
        }, 3000);
      } else {
        setError('Failed to save settings: ' + (responseData.message || 'Unknown error'));
      }
    } catch (err) {
      handleError(err instanceof Error ? err : new Error(String(err)), 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle percentage input validation
  const handleNetworkFeeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Allow empty input for user to clear the field
    if (inputValue === '') {
      setNetworkFee('');
      return;
    }
    
    const value = parseFloat(inputValue);
    // Ensure the value is between 0 and 100
    if (!isNaN(value) && value >= 0 && value <= 100) {
      setNetworkFee(inputValue);
    }
  };

  console.log('Current settings:', { networkFee, exchangeRate });

  return (
    <ProtectedRoute>
      <div className="bg-gray-100 dark:bg-[#121212] min-h-screen">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Fee Management</h1>
            
            {connectionStatus === 'checking' && (
              <div className="bg-white dark:bg-[#1a1a1a] shadow rounded-lg p-6 flex justify-center">
                <div className="animate-pulse">Checking connection to backend...</div>
              </div>
            )}
            
            {connectionStatus === 'error' && (
              <div className="bg-red-50 dark:bg-red-900/20 p-4 mb-4 rounded-md">
                <div className="flex flex-col">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
                        Error connecting to backend server
                      </h3>
                      <div className="mt-2 text-sm text-red-700 dark:text-red-400">
                        <p>Please check your connection or contact support. The backend server might be unavailable.</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex flex-col gap-2">
                    <button 
                      onClick={async () => {
                        setConnectionStatus('checking');
                        try {
                          // Try local API endpoint
                          const response = await fetch(`/api/admin/settings`);
                          console.log('Local API connection test result:', response.status);
                          if (response.ok) {
                            alert(`Connection successful! Status: ${response.status}`);
                          } else {
                            alert(`Connection failed! Status: ${response.status}`);
                          }
                        } catch (error) {
                          console.error('Local API connection error:', error);
                          alert(`Connection error: ${(error as Error).message}`);
                        } finally {
                          // Retry connection test
                          const checkConnection = async () => {
                            try {
                              const result = await api.testConnection();
                              if (result.success) {
                                setConnectionStatus('connected');
                              } else {
                                setConnectionStatus('error');
                              }
                            } catch (error) {
                              setConnectionStatus('error');
                            }
                          };
                          
                          checkConnection();
                        }
                      }}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Test Connection
                    </button>
                    
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                      <p className="font-bold">Debug Information:</p>
                      <p>Environment: {process.env.NODE_ENV}</p>
                      <p>API URL: {process.env.NEXT_PUBLIC_API_URL || 'Not defined'}</p>
                      <p>Connection Status: {connectionStatus}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {isLoading && connectionStatus === 'connected' ? (
              <div className="bg-white dark:bg-[#1a1a1a] shadow rounded-lg p-6 flex justify-center">
                <div className="animate-pulse">Loading settings...</div>
              </div>
            ) : connectionStatus === 'connected' && (
              <div className="bg-white dark:bg-[#1a1a1a] shadow rounded-lg p-6">
                <div className="space-y-6">
                  {debugInfo && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Debug Information</h3>
                        <button 
                          className="text-xs bg-yellow-100 dark:bg-yellow-800 hover:bg-yellow-200 dark:hover:bg-yellow-700 text-yellow-800 dark:text-yellow-300 px-2 py-1 rounded"
                          onClick={() => {
                            console.log('Copying debug info to clipboard:', debugInfo);
                            navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2))
                              .then(() => alert('Debug info copied to clipboard!'))
                              .catch(err => console.error('Failed to copy:', err));
                          }}
                        >
                          Copy to Clipboard
                        </button>
                      </div>
                      <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-400">
                        <p className="font-medium">{debugInfo.message || 'An error occurred'}</p>
                        
                        {debugInfo.status && (
                          <div className="mt-2">
                            <p className="font-medium">Response Status: {debugInfo.status} {debugInfo.statusText}</p>
                            <p>URL: {debugInfo.url}</p>
                            <p>Method: {debugInfo.method}</p>
                          </div>
                        )}
                        
                        {debugInfo.responseDetails && (
                          <div className="mt-2">
                            <p className="font-medium">Response Details:</p>
                            <ul className="list-disc pl-5 mt-1">
                              <li>Status: {debugInfo.responseDetails.status} {debugInfo.responseDetails.statusText}</li>
                              <li>URL: {debugInfo.responseDetails.url}</li>
                              <li>Type: {debugInfo.responseDetails.type}</li>
                              <li>Redirected: {debugInfo.responseDetails.redirected ? 'Yes' : 'No'}</li>
                            </ul>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-3 overflow-auto">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-xs font-medium text-yellow-800 dark:text-yellow-300">Full Debug Data:</p>
                          <button 
                            className="text-xs bg-yellow-100 dark:bg-yellow-800 hover:bg-yellow-200 dark:hover:bg-yellow-700 text-yellow-800 dark:text-yellow-300 px-2 py-1 rounded"
                            onClick={() => {
                              const debugEl = document.getElementById('debug-data-collapsed');
                              if (debugEl) {
                                debugEl.classList.toggle('max-h-40');
                                debugEl.classList.toggle('max-h-[500px]');
                              }
                            }}
                          >
                            Toggle Expand
                          </button>
                        </div>
                        <pre id="debug-data-collapsed" className="text-xs overflow-auto max-h-40 transition-all duration-300 p-2 bg-gray-100 dark:bg-gray-800 rounded">
                          {JSON.stringify(debugInfo, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label htmlFor="networkFee" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Network Fee (%)
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        id="networkFee"
                        value={networkFee}
                        onChange={handleNetworkFeeChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full pr-12 sm:text-sm border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-md"
                        placeholder="1.5"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 dark:text-gray-400 sm:text-sm">%</span>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Enter the network fee percentage (0-100%). This value will be used to calculate fees in the mobile app.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="exchangeRate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Exchange Rate
                    </label>
                    <div className="mt-1">
                      <input
                        type="number"
                        step="0.01"
                        id="exchangeRate"
                        value={exchangeRate}
                        onChange={(e) => setExchangeRate(e.target.value)}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-md"
                        placeholder="1.0"
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Enter the exchange rate value.
                    </p>
                  </div>

                  {error && (
                    <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-red-800 dark:text-red-300">
                            {error}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {message && (
                    <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-green-800 dark:text-green-300">
                            {message}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-5">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={fetchSettings}
                        disabled={isLoading}
                        className="mr-3 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900 disabled:opacity-50"
                      >
                        {isLoading ? 'Refreshing...' : 'Refresh'}
                      </button>
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-800 dark:hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900 disabled:opacity-50"
                      >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 