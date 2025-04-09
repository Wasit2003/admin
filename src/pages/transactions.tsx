import { useEffect, useState } from 'react';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { ReceiptViewer } from '../components/common/ReceiptViewer';
import { TransactionDetailsModal } from '../components/common/TransactionDetailsModal';
import api from '../services/api';
import axios from 'axios';

interface Transaction {
  _id: string;
  userId: string;
  mainAccountName: string;
  type: 'BUY' | 'SELL' | 'SEND' | 'RECEIVE' | 'WITHDRAW';
  amount: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  txHash?: string;
  fromAddress?: string;
  toAddress?: string;
  customerDetails: {
    name: string;
    phone: string;
    location: string;
  };
  metadata: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [transactionType, setTransactionType] = useState<'ALL' | 'BUY' | 'WITHDRAW'>('ALL');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/admin/transactions');
      console.log('API Response:', response.data);
      
      const transactions = response.data.transactions || [];
      console.log('Number of transactions:', transactions.length);
      
      if (transactions.length > 0) {
        console.log('First transaction:', transactions[0]);
        console.log('First transaction metadata:', transactions[0].metadata);
      }
      
      // Convert all status values to uppercase for consistency
      const formattedTransactions = transactions.map((tx: Transaction) => {
        // Ensure metadata is properly processed
        let metadata = tx.metadata || {};
        
        // Convert Map-like objects to regular objects if necessary
        if (typeof metadata !== 'object' || metadata === null) {
          metadata = {};
        } else if (metadata instanceof Map) {
          // Convert Map to object
          const obj: Record<string, string> = {};
          metadata.forEach((value, key) => {
            obj[key] = value;
          });
          metadata = obj;
        }
        
        console.log(`Transaction ${tx._id} metadata:`, metadata);
        
        return {
          ...tx,
          status: tx.status?.toUpperCase() || 'PENDING',
          // Ensure metadata is an object
          metadata: metadata,
          // Ensure customerDetails exists
          customerDetails: tx.customerDetails || {
            name: metadata.userName || 'N/A',
            phone: metadata.userPhone || 'N/A',
            location: metadata.userLocation || 'N/A'
          }
        };
      });
      
      setTransactions(formattedTransactions);
      setError(null);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transactions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    
    // Set up polling every 30 seconds
    const interval = setInterval(fetchTransactions, 30000);
    
    // Clean up on unmount
    return () => clearInterval(interval);
  }, []);

  const filteredTransactions = transactions
    .filter((transaction) => transaction.status === activeTab)
    .filter((transaction) => transactionType === 'ALL' || transaction.type === transactionType);

  const handleViewReceipt = (transaction: Transaction) => {
    let receiptUrl = transaction.metadata?.receiptUrl || null;
    
    // Log for debugging
    console.log('Original Receipt URL:', receiptUrl);
    console.log('Transaction metadata:', transaction.metadata);
    
    // Don't modify the URL here, let the ReceiptViewer component handle it
    setSelectedReceipt(receiptUrl);
    setShowReceiptModal(true);
  };

  const handleCloseReceipt = () => {
    setShowReceiptModal(false);
    setSelectedReceipt(null);
  };

  const handleShowDeleteConfirmation = () => {
    setShowDeleteConfirmation(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirmation(false);
  };

  const handleDeleteAllTransactions = async () => {
    setIsDeleting(true);
    try {
      const response = await api.delete('/admin/transactions');
      
      if (response.data.success) {
        setTransactions([]);
        setError(null);
        setShowDeleteConfirmation(false);
      } else {
        setError(response.data.message || 'Failed to delete transactions');
      }
    } catch (err) {
      console.error('Error deleting transactions:', err);
      setError('Failed to delete transactions. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="bg-gray-100 dark:bg-[#121212] min-h-screen">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Transactions</h1>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <label htmlFor="transactionType" className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Type:
                  </label>
                  <select
                    id="transactionType"
                    value={transactionType}
                    onChange={(e) => setTransactionType(e.target.value as 'ALL' | 'BUY' | 'WITHDRAW')}
                    className="block w-40 pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="ALL">All Types</option>
                    <option value="BUY">Buy</option>
                    <option value="WITHDRAW">Withdraw</option>
                  </select>
                </div>
                
                <button
                  onClick={fetchTransactions}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Refresh
                </button>
                
                <button
                  onClick={handleShowDeleteConfirmation}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete All Transactions
                </button>
              </div>
            </div>

            {/* Delete confirmation modal */}
            {showDeleteConfirmation && (
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-50 flex items-center justify-center">
                <div className="bg-white dark:bg-[#242424] rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full sm:p-6">
                  <div>
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900">
                      <svg className="h-6 w-6 text-red-600 dark:text-red-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="mt-3 text-center sm:mt-5">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Delete All Transactions</h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Are you sure you want to delete all transactions? This action cannot be undone and will permanently remove all transaction data from the database.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                    <button
                      type="button"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm"
                      onClick={handleDeleteAllTransactions}
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Deleting...' : 'Delete All'}
                    </button>
                    <button
                      type="button"
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                      onClick={handleCancelDelete}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-[#1a1a1a] shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                  Transaction List
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                  View and manage all transactions on the platform.
                </p>
              </div>

              {/* Tab navigation */}
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex" aria-label="Tabs">
                  <button
                    onClick={() => setActiveTab('PENDING')}
                    className={`${
                      activeTab === 'PENDING'
                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    <span className={`${
                      activeTab === 'PENDING' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-300'
                    } px-2.5 py-0.5 rounded-full text-xs font-medium inline-block mr-2`}>
                      {transactions.filter(t => t.status === 'PENDING').length}
                    </span>
                    Pending
                  </button>

                  <button
                    onClick={() => setActiveTab('APPROVED')}
                    className={`${
                      activeTab === 'APPROVED'
                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    <span className={`${
                      activeTab === 'APPROVED' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-300'
                    } px-2.5 py-0.5 rounded-full text-xs font-medium inline-block mr-2`}>
                      {transactions.filter(t => t.status === 'APPROVED').length}
                    </span>
                    Approved
                  </button>

                  <button
                    onClick={() => setActiveTab('REJECTED')}
                    className={`${
                      activeTab === 'REJECTED'
                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    <span className={`${
                      activeTab === 'REJECTED' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-300'
                    } px-2.5 py-0.5 rounded-full text-xs font-medium inline-block mr-2`}>
                      {transactions.filter(t => t.status === 'REJECTED').length}
                    </span>
                    Rejected
                  </button>
                </nav>
              </div>

              {/* Transactions table */}
              {isLoading ? (
                <div className="py-6 px-4 sm:px-6">
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading transactions...</p>
                </div>
              ) : filteredTransactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-[#242424]">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          ID
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          User
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Type
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Amount
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Receipt
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-[#1a1a1a] divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredTransactions.map((transaction) => (
                        <tr key={transaction._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {transaction._id.substring(0, 8)}...
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {transaction.mainAccountName || 'Anonymous'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {transaction.type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {transaction.amount} USDT
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${transaction.status === 'PENDING' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' : ''} 
                                ${transaction.status === 'APPROVED' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : ''} 
                                ${transaction.status === 'REJECTED' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' : ''}`}
                            >
                              {transaction.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            <button
                              onClick={() => handleViewReceipt(transaction)} 
                              className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              View
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setSelectedTransaction(transaction)}
                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                              >
                                SHOW
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-6 px-4 sm:px-6 text-center">
                  <p className="text-gray-500 dark:text-gray-400">No {activeTab.toLowerCase()} transactions found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showReceiptModal && (
        <ReceiptViewer
          receiptUrl={selectedReceipt}
          onClose={handleCloseReceipt}
        />
      )}

      {selectedTransaction && (
        <TransactionDetailsModal
          transaction={selectedTransaction}
          onClose={() => {
            setSelectedTransaction(null);
            setRejectionReason('');
          }}
          onApprove={
            selectedTransaction.status === 'PENDING'
              ? async () => {
                  try {
                    await api.put(`/admin/transactions/${selectedTransaction._id}/approve`);
                    setSelectedTransaction(null);
                    fetchTransactions();
                  } catch (err) {
                    console.error('Error approving transaction:', err);
                    setError('Failed to approve transaction');
                  }
                }
              : undefined
          }
          onReject={
            selectedTransaction.status === 'PENDING'
              ? async () => {
                  try {
                    // Get the rejection reason from the modal component
                    const modalElement = document.querySelector('textarea[placeholder="Enter reason for rejection"]');
                    const reason = modalElement ? (modalElement as HTMLTextAreaElement).value : '';
                    
                    // Send the rejection reason to the backend
                    await api.put(`/admin/transactions/${selectedTransaction._id}/reject`, {
                      rejectionReason: reason
                    });
                    
                    setSelectedTransaction(null);
                    fetchTransactions();
                  } catch (err) {
                    console.error('Error rejecting transaction:', err);
                    setError('Failed to reject transaction');
                  }
                }
              : undefined
          }
        />
      )}
    </ProtectedRoute>
  );
} 