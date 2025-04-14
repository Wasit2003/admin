import type { NextApiRequest, NextApiResponse } from 'next';

// Helper to set CORS headers for preflight requests
function setCorsHeaders(res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log(`🔄 [API Proxy] Transactions - ${req.method} request received`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('🔄 [API Proxy] Handling CORS preflight request');
    setCorsHeaders(res);
    return res.status(200).end();
  }

  try {
    // Set CORS headers for all responses
    setCorsHeaders(res);
    
    // Construct target URL (backend API endpoint)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://wasit-backend.onrender.com';
    const targetUrl = new URL('/api/admin/transactions', apiUrl);
    
    // Add any query parameters
    if (req.query) {
      Object.entries(req.query).forEach(([key, value]) => {
        if (typeof value === 'string') {
          targetUrl.searchParams.append(key, value);
        } else if (Array.isArray(value)) {
          value.forEach(v => targetUrl.searchParams.append(key, v));
        }
      });
    }
    
    console.log(`🔄 [API Proxy] Forwarding to: ${targetUrl.toString()}`);
    
    // Forward the request to the backend API
    const fetchOptions: RequestInit = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    // Forward authorization header if present
    if (req.headers.authorization) {
      fetchOptions.headers = {
        ...fetchOptions.headers,
        'Authorization': req.headers.authorization,
      };
    }
    
    // Include body for non-GET requests
    if (req.method !== 'GET' && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }
    
    // Make the request to the backend
    const response = await fetch(targetUrl.toString(), fetchOptions);
    
    // Try to get JSON response
    let responseData;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        responseData = await response.json();
      } catch (error) {
        console.error('❌ [API Proxy] Failed to parse JSON response:', error);
        // If JSON parsing fails, get the raw text
        responseData = { error: 'Invalid JSON response', rawText: await response.text() };
      }
    } else {
      // For non-JSON responses, get the text
      const text = await response.text();
      responseData = { text };
      console.log(`ℹ️ [API Proxy] Non-JSON response received: ${text.substring(0, 100)}...`);
    }
    
    // Return the response to the client
    return res.status(response.status).json(responseData);
  } catch (error) {
    console.error('❌ [API Proxy] Error in transactions proxy:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 