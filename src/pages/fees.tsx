import React, { useState, useEffect, ChangeEvent } from 'react';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import axios from 'axios';
import api from '../services/api';

interface FeeSettings {
  transferFee: number;
  withdrawalFee: number;
  minimumAmount: number;
}

export default function Fees() {
  const [networkFee, setNetworkFee] = useState('');
  const [exchangeRate, setExchangeRate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown> | null>(null);
  const [settings, setSettings] = useState<FeeSettings>({
    transferFee: 0,
    withdrawalFee: 0,
    minimumAmount: 0
  });

  // Set up axios with authentication
  const setupAxiosAuth = () => {
    const token = localStorage.getItem('admin_token');
    console.log('🔑 DEBUG: Token available:', !!token);
    
    if (token) {
      return {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
    }
    return {};
  };

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 DEBUG: Attempting to fetch settings...');
      
      // Log the API URL we're using
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      console.log('🔍 DEBUG: API URL from env:', apiUrl);
      
      // Get authentication config
      const authConfig = setupAxiosAuth();
      
      // Use the api client instead of direct axios with the correct path
      const response = await api.get('/api/admin/settings', authConfig);
      
      console.log('✅ DEBUG: Settings fetch successful:', response.data);
      
      if (response.data.success && response.data.settings) {
        const { networkFeePercentage, exchangeRate } = response.data.settings;
        
        setNetworkFee(networkFeePercentage.toString());
        setExchangeRate(exchangeRate.toString());
        setSettings(response.data.settings);
      }
    } catch (err: unknown) {
      console.error('❌ DEBUG: Error fetching settings:', err);
      
      // Enhanced error logging
      const errorInfo = {
        message: (err as Error)?.message,
        status: (err as { response?: { status: number } })?.response?.status,
        statusText: (err as { response?: { statusText: string } })?.response?.statusText,
        url: (err as { config?: { url: string } })?.config?.url,
        method: (err as { config?: { method: string } })?.config?.method,
        headers: (err as { config?: { headers: Record<string, string> } })?.config?.headers,
        responseData: (err as { response?: { data: unknown } })?.response?.data
      };
      
      console.error('❌ DEBUG: Detailed error:', errorInfo);
      setDebugInfo(errorInfo);
      
      setError(`Failed to load settings: ${(err as Error)?.message || 'unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

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
      
      // Get authentication config
      const authConfig = setupAxiosAuth();
      
      // Use the api client instead of direct axios with the correct path
      const response = await api.put('/api/admin/settings', {
        networkFeePercentage: networkFeeValue,
        exchangeRate: exchangeRateValue
      }, authConfig);
      
      console.log('✅ DEBUG: Settings save response:', response.data);
      
      if (response.data.success) {
        setMessage(`Changes saved! Network Fee: ${networkFeeValue}%, Exchange Rate: ${exchangeRateValue}`);
        
        // Clear message after 3 seconds
        setTimeout(() => {
          setMessage('');
        }, 3000);
      } else {
        setError('Failed to save settings');
      }
    } catch (err: unknown) {
      console.error('❌ DEBUG: Error saving settings:', err);
      
      // Enhanced error logging
      const errorInfo = {
        message: (err as Error)?.message,
        status: (err as { response?: { status: number } })?.response?.status,
        statusText: (err as { response?: { statusText: string } })?.response?.statusText,
        url: (err as { config?: { url: string } })?.config?.url,
        method: (err as { config?: { method: string } })?.config?.method,
        headers: (err as { config?: { headers: Record<string, string> } })?.config?.headers,
        responseData: (err as { response?: { data: unknown } })?.response?.data
      };
      
      console.error('❌ DEBUG: Detailed save error:', errorInfo);
      setDebugInfo(errorInfo);
      
      setError(`Failed to save settings: ${(err as Error)?.message || 'unknown error'}`);
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

  console.log('Current settings:', settings);

  return (
    <ProtectedRoute>
      <div className="bg-gray-100 dark:bg-[#121212] min-h-screen">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Fee Management</h1>
            
            {isLoading ? (
              <div className="bg-white dark:bg-[#1a1a1a] shadow rounded-lg p-6 flex justify-center">
                <div className="animate-pulse">Loading settings...</div>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#1a1a1a] shadow rounded-lg p-6">
                <div className="space-y-6">
                  {debugInfo && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Debug Information</h3>
                      <pre className="mt-2 text-xs overflow-auto max-h-40 p-2 bg-gray-100 dark:bg-gray-800 rounded">
                        {JSON.stringify(debugInfo, null, 2)}
                      </pre>
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