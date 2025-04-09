import React, { useState, useEffect } from 'react';

interface ReceiptViewerProps {
  receiptUrl: string | null;
  onClose: () => void;
}

export const ReceiptViewer: React.FC<ReceiptViewerProps> = ({ receiptUrl, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!receiptUrl) {
      setLoading(false);
      setError("No receipt available for this transaction.");
      return;
    }

    // Add a timestamp query parameter to avoid caching issues
    let url;
    try {
      // Check if the URL is a path that needs the backend server hostname prepended
      if (receiptUrl.startsWith('/uploads/')) {
        // Use backend URL instead of current window origin
        url = new URL(receiptUrl, 'http://localhost:3000');
      } else {
        url = new URL(receiptUrl, window.location.origin);
      }
      url.searchParams.append('t', Date.now().toString());
      
      console.log('Attempting to fetch receipt from URL:', url.toString());
      
      // Use fetch API to load the image as a blob
      fetch(url.toString())
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to load image: ${response.status} ${response.statusText}`);
          }
          return response.blob();
        })
        .then(blob => {
          // Create a local object URL for the image
          const objectUrl = URL.createObjectURL(blob);
          setImageSrc(objectUrl);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error loading receipt image:', err);
          setError(`Failed to load the receipt image. The image may be missing or corrupted.`);
          setLoading(false);
        });
    } catch (err) {
      console.error('Error parsing URL:', err);
      setError(`Invalid receipt URL: ${receiptUrl}`);
      setLoading(false);
    }
      
    // Clean up function to revoke object URL
    return () => {
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [receiptUrl]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Transaction Receipt</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
            aria-label="Close"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
          {loading && (
            <div className="flex items-center justify-center p-8">
              <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="ml-2 text-gray-600 dark:text-gray-300">Loading receipt...</span>
            </div>
          )}
          
          {error && (
            <div className="text-center p-8">
              <svg className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-700 dark:text-gray-300 mb-2 font-medium">Receipt Unavailable</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto">{error}</p>
            </div>
          )}
          
          {imageSrc && !loading && !error && (
            <img 
              src={imageSrc} 
              alt="Receipt" 
              className="max-w-full max-h-[70vh] object-contain"
            />
          )}
        </div>
        
        {imageSrc && !loading && !error && receiptUrl && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <a
              href={receiptUrl}
              download
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </a>
          </div>
        )}
      </div>
    </div>
  );
};