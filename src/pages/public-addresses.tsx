import { useEffect, useState } from 'react';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import api from '../services/api';

interface PublicAddress {
  _id: string;
  userId: string;
  userName: string;
  address: string;
  network: string;
  createdAt: string;
  status: string;
}

interface GeneratedAddress {
  _id: string;
  address: string;
  status: 'available' | 'taken';
  createdAt?: string;
}

// Constants for local storage keys
const STORAGE_KEYS = {
  ADDRESSES: 'admin_public_addresses',
  GENERATED_ADDRESSES: 'admin_generated_addresses',
  ACTIVE_TAB: 'admin_addresses_active_tab'
};

// Helper to safely access localStorage
const isBrowser = typeof window !== 'undefined';
const getLocalStorageItem = (key: string) => {
  if (isBrowser) {
    return localStorage.getItem(key);
  }
  return null;
};

const setLocalStorageItem = (key: string, value: string) => {
  if (isBrowser) {
    localStorage.setItem(key, value);
  }
};

export default function PublicAddressesPage() {
  const [addresses, setAddresses] = useState<PublicAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'view' | 'add'>('view'); // Default to 'view'
  const [newAddress, setNewAddress] = useState('');
  const [generatedAddresses, setGeneratedAddresses] = useState<GeneratedAddress[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editAddress, setEditAddress] = useState('');
  const [editStatus, setEditStatus] = useState<'available' | 'taken'>('available');

  // Load data from localStorage on client side only
  useEffect(() => {
    // Initialize activeTab from localStorage
    const savedTab = getLocalStorageItem(STORAGE_KEYS.ACTIVE_TAB);
    if (savedTab === 'add' || savedTab === 'view') {
      setActiveTab(savedTab);
    }
    
    // Initialize generatedAddresses from localStorage
    const savedGeneratedAddresses = getLocalStorageItem(STORAGE_KEYS.GENERATED_ADDRESSES);
    if (savedGeneratedAddresses) {
      try {
        setGeneratedAddresses(JSON.parse(savedGeneratedAddresses));
      } catch (e) {
        console.error('Failed to parse generated addresses from localStorage', e);
      }
    }
    
    // Initialize addresses from localStorage
    const savedAddresses = getLocalStorageItem(STORAGE_KEYS.ADDRESSES);
    if (savedAddresses) {
      try {
        setAddresses(JSON.parse(savedAddresses));
        setIsLoading(false);
      } catch (e) {
        console.error('Failed to parse addresses from localStorage', e);
      }
    }
  }, []);

  // Save activeTab to localStorage when it changes
  useEffect(() => {
    setLocalStorageItem(STORAGE_KEYS.ACTIVE_TAB, activeTab);
  }, [activeTab]);

  // Save generatedAddresses to localStorage when they change
  useEffect(() => {
    setLocalStorageItem(STORAGE_KEYS.GENERATED_ADDRESSES, JSON.stringify(generatedAddresses));
  }, [generatedAddresses]);

  // Save addresses to localStorage when they change
  useEffect(() => {
    if (!isLoading && addresses.length > 0) {
      setLocalStorageItem(STORAGE_KEYS.ADDRESSES, JSON.stringify(addresses));
    }
  }, [addresses, isLoading]);

  const fetchAddresses = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/admin/public-addresses');
      
      // Ensure we're getting an array from the response
      const addressesData = Array.isArray(response.data) ? response.data : 
                          (response.data?.data && Array.isArray(response.data.data)) ? response.data.data : [];
      
      setAddresses(addressesData);
      
      // Update generatedAddresses with the latest addresses
      setGeneratedAddresses(addressesData.map((addr: PublicAddress) => ({
        _id: addr._id,
        address: addr.address,
        status: addr.userId ? 'taken' : 'available',
        createdAt: addr.createdAt
      })));
      
      setError(null);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error fetching addresses:', error.message);
        setError('Failed to load addresses. Please try again.');
      }
      // Set empty arrays on error to prevent mapping issues
      setAddresses([]);
      setGeneratedAddresses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditAddress = async (addressId: string) => {
    try {
      const address = addresses.find(a => a._id === addressId);
      if (!address) return;

      const newStatus = address.status === 'available' ? 'taken' : 'available';
      
      await api.put(`/admin/public-addresses/${addressId}/status`, {
        status: newStatus
      });

      // Refresh the addresses list
      fetchAddresses();
    } catch (err) {
      console.error('Error updating address:', err);
      alert('Failed to update address. Please try again.');
    }
  };

  const handleNewAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewAddress(e.target.value);
  };

  const addNewAddress = async () => {
    if (!newAddress.trim()) {
      alert('Please enter a valid address');
      return;
    }
    
    // Check if address already exists in the local array
    const exists = generatedAddresses.some(a => a.address === newAddress);
    if (exists) {
      alert('This address already exists in the list');
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await api.post('/admin/public-addresses', {
        address: newAddress
      });
      
      // Add the new address to the generated addresses list
      if (response.data && response.data.address) {
        const newGeneratedAddress: GeneratedAddress = {
          _id: response.data._id || response.data.address._id,
          address: response.data.address.address || response.data.address,
          status: 'available',
          createdAt: response.data.createdAt || new Date().toISOString()
        };
        
        setGeneratedAddresses(prev => [...prev, newGeneratedAddress]);
      }
      
      // Clear the input
      setNewAddress('');
      
      // Show success message
      setError(null);
      
      // Refresh the addresses list for the View tab
      fetchAddresses();
    } catch (error: unknown) {
      console.error('Error adding address:', error);
      
      // Check if it's a duplicate key error
      if (
        error instanceof Error && 
        typeof error === 'object' && 
        error !== null && 
        'response' in error && 
        typeof error.response === 'object' && 
        error.response !== null &&
        'data' in error.response &&
        typeof error.response.data === 'object' &&
        error.response.data !== null &&
        'message' in error.response.data &&
        typeof error.response.data.message === 'string' &&
        error.response.data.message.includes('duplicate key error')
      ) {
        setError('This address already exists in the database. Please try a different address.');
      } else {
        setError('Failed to add address. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (index: number) => {
    const addressToEdit = generatedAddresses[index];
    setEditingIndex(index);
    setEditAddress(addressToEdit.address);
    setEditStatus(addressToEdit.status);
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditAddress('');
  };

  const saveEditing = () => {
    if (!editAddress.trim()) {
      alert('Please enter a valid address');
      return;
    }

    // Check if the edited address already exists in another row
    const exists = generatedAddresses.some((a, idx) => 
      a.address === editAddress && idx !== editingIndex);
    
    if (exists) {
      alert('This address already exists in the list');
      return;
    }

    if (editingIndex !== null) {
      const updatedAddresses = [...generatedAddresses];
      updatedAddresses[editingIndex] = {
        ...updatedAddresses[editingIndex],
        address: editAddress,
        status: editStatus
      };
      setGeneratedAddresses(updatedAddresses);
      setEditingIndex(null);
    }
  };

  const removeAddress = async (addressId: string) => {
    try {
      await api.delete(`/admin/public-addresses/${addressId}`);
      
      // Remove from local state
      setGeneratedAddresses(prev => prev.filter(addr => addr._id !== addressId));
      
      // Refresh the addresses list for the View tab
      fetchAddresses();
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error removing address:', error.message);
        alert('Failed to remove address. Please try again.');
      }
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  return (
    <ProtectedRoute>
      <div className="bg-gray-100 dark:bg-[#121212] min-h-screen">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Public Addresses</h1>

            {error && (
              <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded relative">
                {error}
                <button
                  className="absolute top-0 bottom-0 right-0 px-4 py-3"
                  onClick={() => setError(null)}
                >
                  <span className="sr-only">Dismiss</span>
                  &times;
                </button>
              </div>
            )}

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('view')}
                  className={`${
                    activeTab === 'view'
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  View
                </button>
                <button
                  onClick={() => setActiveTab('add')}
                  className={`${
                    activeTab === 'add'
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Add
                </button>
              </nav>
            </div>

            {/* View Tab Content */}
            {activeTab === 'view' && (
              <div className="bg-white dark:bg-[#1a1a1a] shadow overflow-hidden sm:rounded-lg mt-4">
                <div className="px-4 py-5 sm:px-6">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      Public Addresses
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                      Manage public addresses for all users.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-[#242424]">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Public Address
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-[#1a1a1a] divide-y divide-gray-200 dark:divide-gray-700">
                      {isLoading ? (
                        <tr>
                          <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                            Loading addresses...
                          </td>
                        </tr>
                      ) : addresses.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                            No addresses found
                          </td>
                        </tr>
                      ) : (
                        addresses.map((address) => (
                          <tr key={address._id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {address.userName || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-mono">
                              {address.address}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              <button 
                                onClick={() => handleEditAddress(address._id)}
                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            
            {activeTab === 'add' && (
              <div className="bg-white dark:bg-[#1a1a1a] shadow overflow-hidden sm:rounded-lg mt-4">
                <div className="px-4 py-5 sm:px-6">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      Add Public Addresses
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                      Add public addresses to the system.
                    </p>
                  </div>
                </div>

                {/* Address Input Form */}
                <div className="px-4 py-5 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex">
                    <div className="flex-grow mr-4">
                      <input
                        type="text"
                        value={newAddress}
                        onChange={handleNewAddressChange}
                        placeholder="Enter public address (0x...)"
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-md py-2 px-3"
                      />
                    </div>
                    <button
                      onClick={addNewAddress}
                      disabled={isLoading}
                      className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${isLoading ? 'bg-indigo-400 dark:bg-indigo-600 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-800 dark:hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900`}
                    >
                      {isLoading ? 'Adding...' : 'Add Address'}
                    </button>
                  </div>
                </div>

                {/* Generated Addresses Table */}
                <div className="border-t border-gray-200 dark:border-gray-700">
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Generated Addresses
                    </h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-[#242424]">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Public Address
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-[#1a1a1a] divide-y divide-gray-200 dark:divide-gray-700">
                        {isLoading && generatedAddresses.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                              Loading addresses...
                            </td>
                          </tr>
                        ) : generatedAddresses.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                              No addresses added yet
                            </td>
                          </tr>
                        ) : (
                          generatedAddresses.map((address, index) => (
                            <tr key={address._id || index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-mono">
                                {editingIndex === index ? (
                                  <input
                                    type="text"
                                    value={editAddress}
                                    onChange={(e) => setEditAddress(e.target.value)}
                                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-md"
                                  />
                                ) : (
                                  address.address
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {editingIndex === index ? (
                                  <select
                                    value={editStatus}
                                    onChange={(e) => setEditStatus(e.target.value as 'available' | 'taken')}
                                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-md"
                                  >
                                    <option value="available">Available</option>
                                    <option value="taken">Not available</option>
                                  </select>
                                ) : (
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    address.status === 'available'
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                  }`}>
                                    {address.status === 'available' ? 'Available' : 'Not available'}
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {editingIndex === index ? (
                                  <>
                                    <button
                                      onClick={saveEditing}
                                      className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 mr-2"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={cancelEditing}
                                      className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                                    >
                                      Cancel
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => startEditing(index)}
                                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-2"
                                    >
                                      Edit
                                    </button>
                                    <button 
                                      onClick={() => removeAddress(address._id)}
                                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                    >
                                      Delete
                                    </button>
                                  </>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
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