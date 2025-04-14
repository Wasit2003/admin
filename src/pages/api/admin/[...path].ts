import type { NextApiRequest, NextApiResponse } from 'next';

// Helper function to handle CORS preflight requests
function setCorsHeaders(req: NextApiRequest, res: NextApiResponse) {
  const allowedOrigins = [
    'https://admin-snowy-iota.vercel.app',
    'https://admin-11d4m5t4j-wasit2003s-projects.vercel.app',
    'http://localhost:3000' // For local development
  ];
  
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Enhanced logging
  console.log('🔄 API PROXY: Request received', {
    method: req.method,
    url: req.url,
    origin: req.headers.origin,
    headers: req.headers,
    query: req.query,
    body: req.body
  });

  // Handle CORS preflight
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Get the path from the URL
  const path = Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://wasit-backend.onrender.com';
  const targetUrl = `${apiUrl}/api/admin/${path}`;
  
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
    const queryParams = { ...req.query };
    delete queryParams.path; // Remove the path parameter
    const queryString = new URLSearchParams(queryParams as Record<string, string>).toString();
    const url = queryString ? `${targetUrl}?${queryString}` : targetUrl;
    
    console.log('🔄 Complete URL with query parameters:', url);
    
    // Forward the request to the backend
    console.log('🔄 Sending request to backend...');
    const response = await fetch(url, {
      method: req.method,
      headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });
    
    console.log('🔄 Backend response status:', response.status);
    
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
    console.log('✅ Backend response data received');
    
    // Return the response with the same status
    res.status(response.status).json(data);
  } catch (error) {
    console.error('❌ Error proxying to backend:', error);
    
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