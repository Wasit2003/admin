import type { NextApiRequest, NextApiResponse } from 'next';

// Helper function to handle CORS preflight requests
function setCorsHeaders(res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Enhanced logging
  console.log('🔄 API PROXY: Request received', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    query: req.query,
    body: req.body
  });

  // Handle CORS preflight
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://wasit-backend.onrender.com';
  const targetUrl = `${apiUrl}/api/admin/transactions`;
  
  console.log('🔄 Proxying request to:', targetUrl);
  console.log('🔄 Request method:', req.method);
  console.log('🔄 API URL from env:', process.env.NEXT_PUBLIC_API_URL || 'Not set (using default)');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // Forward auth header if it exists
  if (req.headers.authorization) {
    headers['Authorization'] = req.headers.authorization as string;
    console.log('🔑 Authorization header present');
  } else {
    console.warn('⚠️ No Authorization header in request');
  }
  
  try {
    // Add query params if they exist
    const queryString = new URLSearchParams(req.query as Record<string, string>).toString();
    const url = queryString ? `${targetUrl}?${queryString}` : targetUrl;
    
    console.log('🔄 Complete URL with query parameters:', url);
    
    // Try a ping first to check if the backend is reachable
    try {
      console.log('🔄 Pinging backend to check availability...');
      const pingResponse = await fetch(`${apiUrl}/api/admin/debug-settings`, { 
        method: 'HEAD',
        headers: { 'Authorization': headers['Authorization'] || '' }
      });
      
      console.log('🔄 Backend ping result:', pingResponse.status);
    } catch (pingError) {
      console.error('❌ Backend ping failed:', pingError);
    }
    
    // Forward the request to the backend
    console.log('🔄 Sending request to backend...');
    const response = await fetch(url, {
      method: req.method,
      headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? 
        // For DELETE requests, ensure we send a proper empty JSON object if body is empty
        (req.method === 'DELETE' && (!req.body || Object.keys(req.body).length === 0) ? 
          JSON.stringify({}) : 
          JSON.stringify(req.body)
        ) : undefined,
    });
    
    console.log('🔄 Backend response status:', response.status);
    console.log('🔄 Backend response headers:', response.headers);
    
    if (!response.ok) {
      console.error('❌ Backend returned error status:', response.status);
      
      // Try to read the response body even for error responses
      let errorData;
      try {
        errorData = await response.json();
        console.error('❌ Error response body:', errorData);
      } catch (jsonError) {
        console.error('❌ Could not parse error response as JSON:', jsonError);
        errorData = { message: 'Backend error with unparseable response' };
      }
      
      return res.status(response.status).json({
        success: false,
        message: 'Backend server returned an error',
        statusCode: response.status,
        error: errorData
      });
    }
    
    // Get the response data
    const data = await response.json();
    console.log('✅ Backend response data:', data);
    
    // Return the response with the same status
    res.status(response.status).json(data);
  } catch (error) {
    console.error('❌ Error proxying to backend:', error);
    console.error('❌ Detailed error info:', {
      name: (error as Error).name,
      message: (error as Error).message,
      stack: (error as Error).stack
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to connect to backend server',
      error: (error as Error).message,
      requestInfo: {
        targetUrl,
        method: req.method,
        headers: Object.keys(headers),
        hasAuthorization: !!headers['Authorization']
      }
    });
  }
} 