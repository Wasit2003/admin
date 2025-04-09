import React, { useState, useEffect } from 'react';
import { Transaction } from '../../types/transaction';
import api from '../../services/api';

interface TransactionDetailsModalProps {
  transaction: Transaction;
  onClose: () => void;
  onApprove?: () => void;
  onReject?: () => void;
}

export const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({
  transaction,
  onClose,
  onApprove,
  onReject,
}) => {
  // Add state for remittance number and USDT destination
  const [remittanceNumber, setRemittanceNumber] = useState('');
  const [usdtDestination, setUsdtDestination] = useState('N/A');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  // Get remittance number from metadata when modal opens
  useEffect(() => {
    // Extract remittance number from metadata if it exists
    if (transaction.metadata) {
      // Try direct property access in different forms
      const metadataRemittanceNumber = 
        transaction.metadata.remittanceNumber || 
        transaction.metadata['remittanceNumber'];
      
      if (metadataRemittanceNumber) {
        setRemittanceNumber(metadataRemittanceNumber);
      }
      
      // Extract rejection reason if it exists
      const metadataRejectionReason = 
        transaction.metadata.rejectionReason || 
        transaction.metadata['rejectionReason'];
      
      if (metadataRejectionReason) {
        setRejectionReason(metadataRejectionReason);
      }
      
      // Extract wallet address for USDT destination if it exists
      const metadataWalletAddress = 
        transaction.metadata.walletAddress || 
        transaction.metadata['walletAddress'];
      
      if (metadataWalletAddress) {
        console.log('DEBUG_WALLET: Found wallet address in metadata:', metadataWalletAddress);
        setUsdtDestination(metadataWalletAddress);
      }
      
      // If not found with direct access, try more approaches
      
      // Check if metadata might be a stringified object
      if (typeof transaction.metadata === 'string') {
        try {
          const parsedMetadata = JSON.parse(transaction.metadata);
          if (parsedMetadata.remittanceNumber) {
            setRemittanceNumber(parsedMetadata.remittanceNumber);
          }
          if (parsedMetadata.rejectionReason) {
            setRejectionReason(parsedMetadata.rejectionReason);
          }
          if (parsedMetadata.walletAddress) {
            console.log('DEBUG_WALLET: Found wallet address in parsed metadata string:', parsedMetadata.walletAddress);
            setUsdtDestination(parsedMetadata.walletAddress);
          }
        } catch (e) {
          // Ignore parsing errors
          console.log('Error parsing metadata string:', e);
        }
      }
      
      // Try to search through all metadata keys (case insensitive)
      if (typeof transaction.metadata === 'object') {
        const keys = Object.keys(transaction.metadata);
        for (const key of keys) {
          if (key.toLowerCase().includes('remittance') && transaction.metadata[key]) {
            setRemittanceNumber(transaction.metadata[key]);
          }
          if (key.toLowerCase().includes('rejection') && transaction.metadata[key]) {
            setRejectionReason(transaction.metadata[key]);
          }
          if (key.toLowerCase().includes('wallet') || key.toLowerCase().includes('address')) {
            console.log(`DEBUG_WALLET: Found potential wallet address using key "${key}":`, transaction.metadata[key]);
            setUsdtDestination(transaction.metadata[key]);
          }
        }
      }
    }
  }, [transaction]);
  
  // Extract metadata values with comprehensive checking
  const getPaymentGateway = () => {
    console.log('DEBUG_GATEWAY: Transaction metadata in TransactionDetailsModal:', transaction.metadata);
    
    // Check if metadata exists
    if (!transaction.metadata) {
      console.log('DEBUG_GATEWAY: No metadata found in transaction');
      return 'N/A';
    }

    // Try different ways to access the payment gateway information
    const metadata = transaction.metadata;
    console.log('DEBUG_GATEWAY: Metadata keys:', Object.keys(metadata));
    
    // Direct property access
    if (metadata.paymentGateway) {
      console.log('DEBUG_GATEWAY: Found paymentGateway using direct property access:', metadata.paymentGateway);
      return metadata.paymentGateway;
    }
    
    // Array/object notation access
    if (metadata['paymentGateway']) {
      console.log('DEBUG_GATEWAY: Found paymentGateway using array notation:', metadata['paymentGateway']);
      return metadata['paymentGateway'];
    }
    
    // Try with different capitalization
    const keysLowerCase = Object.keys(metadata).map(k => k.toLowerCase());
    if (keysLowerCase.includes('paymentgateway') || keysLowerCase.includes('payment_gateway')) {
      for (const key of Object.keys(metadata)) {
        if (key.toLowerCase() === 'paymentgateway' || key.toLowerCase() === 'payment_gateway') {
          console.log(`DEBUG_GATEWAY: Found paymentGateway using alternate key "${key}":`, metadata[key]);
          return metadata[key];
        }
      }
    }
    
    console.log('DEBUG_GATEWAY: Could not find payment gateway in metadata, returning N/A');
    return 'N/A';
  };
  
  // Extract network fee from metadata
  const getNetworkFee = () => {
    // Check if metadata exists
    if (!transaction.metadata) {
      console.log('DEBUG_FEE: No metadata found in transaction');
      return 0.5; // Default value if not found
    }

    const metadata = transaction.metadata;
    console.log('DEBUG_FEE: Transaction metadata:', metadata);
    console.log('DEBUG_FEE: Metadata type:', typeof metadata);
    console.log('DEBUG_FEE: Metadata keys:', Object.keys(metadata));
    
    // Try different ways to access the network fee information
    if (metadata.networkFee) {
      const fee = parseFloat(metadata.networkFee);
      console.log('DEBUG_FEE: Found network fee in metadata (direct):', fee);
      console.log('DEBUG_FEE: Original value type:', typeof metadata.networkFee);
      return !isNaN(fee) ? fee : 0.5;
    }
    
    if (metadata['networkFee']) {
      const fee = parseFloat(metadata['networkFee']);
      console.log('DEBUG_FEE: Found network fee in metadata (bracket):', fee);
      console.log('DEBUG_FEE: Original value type:', typeof metadata['networkFee']);
      return !isNaN(fee) ? fee : 0.5;
    }
    
    // Try alternative field names
    const possibleKeys = ['fee', 'transactionFee', 'transaction_fee', 'network_fee'];
    for (const key of possibleKeys) {
      if (metadata[key]) {
        const fee = parseFloat(metadata[key]);
        console.log(`DEBUG_FEE: Found fee using alternative key "${key}":`, fee);
        return !isNaN(fee) ? fee : 0.5;
      }
    }
    
    console.log('DEBUG_FEE: No network fee found in metadata, using default');
    return 0.5; // Default value if not found
  };
  
  // Extract SYP amount from metadata
  const getBaseSypAmount = () => {
    // Check if metadata exists
    if (!transaction.metadata) {
      console.log('DEBUG_BASE_SYP: No metadata found in transaction');
      return null; // Return null to use calculated value
    }

    const metadata = transaction.metadata;
    console.log('DEBUG_BASE_SYP: Transaction metadata:', metadata);
    console.log('DEBUG_BASE_SYP: Metadata keys:', Object.keys(metadata));
    
    // Try different ways to access the base SYP amount information
    if (metadata.baseSypAmount) {
      const amount = parseFloat(metadata.baseSypAmount);
      console.log('DEBUG_BASE_SYP: Found base SYP amount in metadata (direct):', amount);
      return !isNaN(amount) ? amount : null;
    }
    
    if (metadata['baseSypAmount']) {
      const amount = parseFloat(metadata['baseSypAmount']);
      console.log('DEBUG_BASE_SYP: Found base SYP amount in metadata (bracket):', amount);
      return !isNaN(amount) ? amount : null;
    }
    
    // Try alternative field names
    const possibleKeys = ['sypAmount', 'syp_amount', 'amountInSYP', 'amount_in_syp'];
    for (const key of possibleKeys) {
      if (metadata[key]) {
        const amount = parseFloat(metadata[key]);
        console.log(`DEBUG_BASE_SYP: Found base SYP amount using alternative key "${key}":`, amount);
        return !isNaN(amount) ? amount : null;
      }
    }
    
    console.log('DEBUG_BASE_SYP: No base SYP amount found in metadata, will use calculated value');
    return null; // Return null to use calculated value
  };
  
  // Extract total SYP amount from metadata (including fee)
  const getTotalSypAmount = () => {
    // Check if metadata exists
    if (!transaction.metadata) {
      console.log('DEBUG_TOTAL_SYP: No metadata found in transaction');
      return null; // Return null to use calculated value
    }

    const metadata = transaction.metadata;
    console.log('DEBUG_TOTAL_SYP: Transaction metadata:', metadata);
    
    // Try different ways to access the total SYP amount information
    if (metadata.totalSypAmount) {
      const amount = parseFloat(metadata.totalSypAmount);
      console.log('DEBUG_TOTAL_SYP: Found total SYP amount in metadata (direct):', amount);
      return !isNaN(amount) ? amount : null;
    }
    
    if (metadata['totalSypAmount']) {
      const amount = parseFloat(metadata['totalSypAmount']);
      console.log('DEBUG_TOTAL_SYP: Found total SYP amount in metadata (bracket):', amount);
      return !isNaN(amount) ? amount : null;
    }
    
    // Try alternative field names
    const possibleKeys = ['totalSyp', 'total_syp', 'totalAmountSyp', 'total_amount_syp', 'sypTotal', 'syp_total'];
    for (const key of possibleKeys) {
      if (metadata[key]) {
        const amount = parseFloat(metadata[key]);
        console.log(`DEBUG_TOTAL_SYP: Found total SYP amount using alternative key "${key}":`, amount);
        return !isNaN(amount) ? amount : null;
      }
    }
    
    console.log('DEBUG_TOTAL_SYP: No total SYP amount found in metadata, will use calculated value');
    return null; // Return null to use calculated value
  };
  
  // Extract exchange rate from metadata or calculate from amounts
  const getExchangeRate = () => {
    // First try to get from metadata
    if (transaction.metadata) {
      const metadata = transaction.metadata;
      console.log('DEBUG_RATE: Checking metadata for exchange rate');

      // Try direct access
      if (metadata.exchangeRate) {
        const rate = parseFloat(metadata.exchangeRate);
        console.log('DEBUG_RATE: Found exchange rate in metadata (direct):', rate);
        if (!isNaN(rate)) return rate;
      }

      // Try bracket notation
      if (metadata['exchangeRate']) {
        const rate = parseFloat(metadata['exchangeRate']);
        console.log('DEBUG_RATE: Found exchange rate in metadata (bracket):', rate);
        if (!isNaN(rate)) return rate;
      }

      // Try alternative field names
      const possibleKeys = ['exchange_rate', 'rate', 'conversionRate', 'conversion_rate'];
      for (const key of possibleKeys) {
        if (metadata[key]) {
          const rate = parseFloat(metadata[key]);
          console.log(`DEBUG_RATE: Found rate using alternative key "${key}":`, rate);
          if (!isNaN(rate)) return rate;
        }
      }
    }

    // If no valid rate found in metadata, calculate from amounts
    const amountInUSDT = parseFloat(transaction.amount) || 0;
    const baseSypAmount = getBaseSypAmount();
    const calculatedSypAmount = baseSypAmount !== null ? baseSypAmount : (amountInUSDT * 5000);

    if (amountInUSDT > 0) {
      const calculatedRate = calculatedSypAmount / amountInUSDT;
      console.log('DEBUG_RATE: Calculated rate from amounts:', calculatedRate);
      console.log('DEBUG_RATE: USDT amount:', amountInUSDT);
      console.log('DEBUG_RATE: SYP amount:', calculatedSypAmount);
      return calculatedRate;
    }

    console.log('DEBUG_RATE: Using default rate');
    return 5000; // Default fallback
  };
  
  // Get network fee and exchange rate
  const networkFee = getNetworkFee();
  const exchangeRate = getExchangeRate();
  console.log('DEBUG_FEE: Final network fee value:', networkFee);
  console.log('DEBUG_RATE: Final exchange rate value:', exchangeRate);
  
  // Calculate SYP amount - first try to get from metadata, fallback to calculation
  const amountInUSDT = parseFloat(transaction.amount) || 0;
  const metadataBaseSypAmount = getBaseSypAmount();
  const amountInSYP = metadataBaseSypAmount !== null ? metadataBaseSypAmount : (amountInUSDT * exchangeRate);
  
  // Get total SYP amount (including fee) - first try from metadata, fallback to calculation
  const metadataTotalSypAmount = getTotalSypAmount();
  const totalAmountInSYP = metadataTotalSypAmount !== null ? 
    metadataTotalSypAmount : 
    (amountInSYP + (amountInSYP * networkFee / amountInUSDT));
  
  // Format amounts with thousands separator
  const formattedSypAmount = new Intl.NumberFormat('en-US').format(amountInSYP);
  const formattedTotalSypAmount = new Intl.NumberFormat('en-US').format(totalAmountInSYP);
  const formattedExchangeRate = new Intl.NumberFormat('en-US').format(exchangeRate);
  
  // New functions to extract user metadata with comprehensive checking
  const getUserName = () => {
    // First check if it's in the transaction customer details
    if (transaction.customerDetails?.name) {
      return transaction.customerDetails.name;
    }

    // Check if metadata exists
    if (!transaction.metadata) {
      return 'N/A';
    }

    const metadata = transaction.metadata;
    
    // Direct property access with multiple possible names
    const possibleKeys = ['userName', 'user_name', 'name', 'displayName', 'customer_name'];
    for (const key of possibleKeys) {
      if (metadata[key]) {
        return metadata[key];
      }
    }
    
    return 'N/A';
  };
  
  const getUserPhone = () => {
    // First check if it's in the transaction customer details
    if (transaction.customerDetails?.phone) {
      return transaction.customerDetails.phone;
    }

    // Check if metadata exists
    if (!transaction.metadata) {
      return 'N/A';
    }

    const metadata = transaction.metadata;
    
    // Direct property access with multiple possible names
    const possibleKeys = ['userPhone', 'user_phone', 'phone', 'phoneNumber', 'customer_phone'];
    for (const key of possibleKeys) {
      if (metadata[key]) {
        return metadata[key];
      }
    }
    
    return 'N/A';
  };
  
  const getUserLocation = () => {
    // First check if it's in the transaction customer details
    if (transaction.customerDetails?.location) {
      return transaction.customerDetails.location;
    }

    // Check if metadata exists
    if (!transaction.metadata) {
      return 'N/A';
    }

    const metadata = transaction.metadata;
    
    // Direct property access with multiple possible names
    const possibleKeys = ['userLocation', 'user_location', 'location', 'address', 'customer_location'];
    for (const key of possibleKeys) {
      if (metadata[key]) {
        return metadata[key];
      }
    }
    
    return 'N/A';
  };
  
  // Extract wallet address from metadata
  const getWalletAddress = () => {
    // Check if metadata exists
    if (!transaction.metadata) {
      console.log('DEBUG_WALLET: No metadata found in transaction');
      return 'N/A';
    }

    const metadata = transaction.metadata;
    console.log('DEBUG_WALLET: Checking metadata for wallet address');
    
    // Direct property access with multiple possible names
    const possibleKeys = ['walletAddress', 'wallet_address', 'address', 'destination', 'bep20Address', 'bep20_address'];
    for (const key of possibleKeys) {
      if (metadata[key]) {
        console.log(`DEBUG_WALLET: Found wallet address using key "${key}":`, metadata[key]);
        return metadata[key];
      }
    }
    
    return 'N/A';
  };
  
  const paymentGateway = getPaymentGateway();
  const userName = getUserName();
  const userPhone = getUserPhone();
  const userLocation = getUserLocation();
  
  // Handle remittance number change
  const handleRemittanceNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRemittanceNumber(e.target.value);
  };
  
  // Handle USDT destination change
  const handleUsdtDestinationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsdtDestination(e.target.value);
  };
  
  // Handle rejection reason change
  const handleRejectionReasonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRejectionReason(e.target.value);
  };
  
  // Save remittance number
  const handleSaveRemittanceNumber = async () => {
    if (!remittanceNumber.trim()) {
      setSaveMessage({ text: 'Please enter a remittance number', type: 'error' });
      return;
    }
    
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      const response = await api.put(`/admin/transactions/${transaction._id}/remittance`, {
        remittanceNumber
      });
      
      if (response.data.success) {
        setSaveMessage({ text: 'Remittance number saved successfully', type: 'success' });
        setTimeout(() => setSaveMessage(null), 3000); // Clear message after 3 seconds
      } else {
        setSaveMessage({ text: 'Failed to save remittance number', type: 'error' });
      }
    } catch (error) {
      console.error('Error saving remittance number:', error);
      setSaveMessage({ text: 'Error saving remittance number', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // Save rejection reason
  const handleSaveRejectionReason = async () => {
    if (!rejectionReason.trim()) {
      setSaveMessage({ text: 'Please enter a rejection reason', type: 'error' });
      return;
    }
    
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      // Make an API call to save the rejection reason
      const response = await api.put(`/admin/transactions/${transaction._id}/rejection-reason`, {
        rejectionReason
      });
      
      if (response.data.success) {
        setSaveMessage({ text: 'Rejection reason saved successfully', type: 'success' });
        setTimeout(() => setSaveMessage(null), 3000); // Clear message after 3 seconds
      } else {
        setSaveMessage({ text: 'Failed to save rejection reason', type: 'error' });
      }
    } catch (error) {
      console.error('Error saving rejection reason:', error);
      setSaveMessage({ text: 'Error saving rejection reason', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Update USDT destination from metadata
  useEffect(() => {
    if (transaction.type === 'BUY') {
      const address = getWalletAddress();
      if (address !== 'N/A') {
        setUsdtDestination(address);
      }
    }
  }, [transaction]);

  useEffect(() => {
    getWalletAddress();
  }, [getWalletAddress]);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-auto">
      <div className="bg-[#1a1a1a] rounded-lg p-6 w-full max-w-6xl text-white my-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Transaction Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200">
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-6">
            {/* Main Account Information */}
            <div className="bg-[#242424] p-4 rounded-lg border border-gray-700">
              <h3 className="text-lg font-semibold text-indigo-400 mb-3">Main Account Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Account Name</p>
                  <p className="font-medium text-white">{transaction.mainAccountName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Transaction Type</p>
                  <p className="font-medium text-white">{transaction.type}</p>
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="bg-[#242424] p-4 rounded-lg border border-gray-700">
              <h3 className="text-lg font-semibold text-indigo-400 mb-3">Customer Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Name</p>
                  <p className="font-medium text-white">{userName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Phone</p>
                  <p className="font-medium text-white">{userPhone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Location</p>
                  <p className="font-medium text-white">{userLocation}</p>
                </div>
              </div>
            </div>

            {/* Fee section */}
            <div className="bg-[#242424] p-4 rounded-lg border border-gray-700">
              <h3 className="text-lg font-semibold text-indigo-400 mb-3">Fee Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Exchange Rate</p>
                  <p className="font-medium text-white">{formattedExchangeRate} SYP/USDT</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Fee</p>
                  <p className="font-medium text-white">
                    {transaction.type === 'BUY' 
                      ? `${new Intl.NumberFormat('en-US').format(totalAmountInSYP - amountInSYP)} SYP`
                      : `${networkFee.toFixed(2)} USDT`}
                  </p>
                </div>
              </div>
              
              {/* USDT Destination Block (only for BUY transactions) */}
              {transaction.type === 'BUY' && (
                <div className="mt-4">
                  <p className="text-sm text-gray-400">USDT DESTINATION</p>
                  <input
                    type="text"
                    value={usdtDestination}
                    onChange={handleUsdtDestinationChange}
                    className="w-full mt-1 px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded text-white"
                    readOnly
                  />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {/* Transaction Details */}
            <div className="bg-[#242424] p-4 rounded-lg border border-gray-700">
              <h3 className="text-lg font-semibold text-indigo-400 mb-3">Transaction Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Amount</p>
                  <p className="font-medium text-white">{transaction.amount} USDT</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Amount in SYP</p>
                  <p className="font-medium text-white">{formattedSypAmount} SYP</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Amount</p>
                  <p className="font-medium text-white">
                    {transaction.type === 'BUY' 
                      ? `${transaction.amount} USDT` 
                      : `${(parseFloat(transaction.amount) + networkFee).toFixed(2)} USDT`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Amount in SYP</p>
                  <p className="font-medium text-white">{formattedTotalSypAmount} SYP</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Payment Gateway</p>
                  <p className="font-medium text-white">{paymentGateway}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Status</p>
                  <p className={`font-medium ${
                    transaction.status === 'PENDING' ? 'text-yellow-400' :
                    transaction.status === 'APPROVED' ? 'text-green-400' :
                    'text-red-400'
                  }`}>{transaction.status}</p>
                </div>
              </div>
            </div>

            {/* Remittance and rejection section */}
            <div className="bg-[#242424] p-4 rounded-lg border border-gray-700">
              {/* Rejection Reason Block */}
              {(transaction.status === 'PENDING' || transaction.status === 'REJECTED') && (
                <div className="mb-4">
                  <label className="block text-sm text-gray-400 mb-1">Rejection Reason</label>
                  <div className="flex space-x-2">
                    <textarea
                      value={rejectionReason}
                      onChange={handleRejectionReasonChange}
                      placeholder="Enter reason for rejection"
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded text-white resize-none h-20"
                      disabled={transaction.status === 'REJECTED'}
                    />
                    {transaction.status === 'PENDING' && (
                      <button
                        onClick={handleSaveRejectionReason}
                        disabled={isSaving}
                        className={`px-4 h-10 rounded self-start ${
                          isSaving 
                            ? 'bg-gray-600 cursor-not-allowed' 
                            : 'bg-indigo-600 hover:bg-indigo-700'
                        } text-white transition-colors whitespace-nowrap`}
                      >
                        {isSaving ? 'Saving...' : 'Save'}
                      </button>
                    )}
                  </div>
                </div>
              )}
              
              {/* Remittance Number Block */}
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1">Remittance Number</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={remittanceNumber}
                    onChange={handleRemittanceNumberChange}
                    placeholder="Enter remittance number"
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded text-white"
                  />
                  <button
                    onClick={handleSaveRemittanceNumber}
                    disabled={isSaving}
                    className={`px-4 py-2 rounded ${
                      isSaving 
                        ? 'bg-gray-600 cursor-not-allowed' 
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    } text-white transition-colors whitespace-nowrap`}
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
                {saveMessage && (
                  <p className={`mt-2 text-sm ${
                    saveMessage.type === 'success' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {saveMessage.text}
                  </p>
                )}
              </div>
            </div>

            {/* Address information */}
            <div className="bg-[#242424] p-4 rounded-lg border border-gray-700">
              {transaction.txHash && (
                <div className="mb-3">
                  <p className="text-sm text-gray-400">Transaction Hash</p>
                  <div className="bg-[#1a1a1a] p-2 rounded font-mono text-sm break-all text-gray-300">
                    {transaction.txHash}
                  </div>
                </div>
              )}
              {transaction.fromAddress && (
                <div className="mb-3">
                  <p className="text-sm text-gray-400">From Address</p>
                  <div className="bg-[#1a1a1a] p-2 rounded font-mono text-sm break-all text-gray-300">
                    {transaction.fromAddress}
                  </div>
                </div>
              )}
              {transaction.toAddress && (
                <div className="mb-3">
                  <p className="text-sm text-gray-400">To Address</p>
                  <div className="bg-[#1a1a1a] p-2 rounded font-mono text-sm break-all text-gray-300">
                    {transaction.toAddress}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {transaction.status === 'PENDING' && (onApprove || onReject) && (
          <div className="mt-6 flex justify-end space-x-3">
            {onReject && (
              <button
                onClick={() => {
                  if (rejectionReason.trim() === '') {
                    setSaveMessage({ 
                      text: 'Please enter a rejection reason before rejecting the transaction', 
                      type: 'error' 
                    });
                    return;
                  }
                  if (onReject) onReject();
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Reject
              </button>
            )}
            {onApprove && (
              <button
                onClick={onApprove}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                Approve
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}; 