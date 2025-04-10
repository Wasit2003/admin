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
  console.log('🔄 ME API PROXY: Request received', {
    method: req.method,
    url: req.url,
    headers: req.headers
  });

  // Handle CORS preflight
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://wasit-backend.onrender.com';
  const targetUrl = `${apiUrl}/api/admin/me`;
  
  console.log('🔄 Proxying me request to:', targetUrl);
  
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
    // Forward the request to the backend
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers,
    });
    
    console.log('🔄 Backend me response status:', response.status);
    
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
        message: errorData.message || 'Authentication check failed',
        statusCode: response.status,
        error: errorData
      });
    }
    
    // Get the response data
    const data = await response.json();
    console.log('✅ Me response data:', data);
    
    // Return the response with the same status
    res.status(response.status).json(data);
  } catch (error) {
    console.error('❌ Error proxying me request to backend:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to connect to backend server',
      error: (error as Error).message
    });
  }
} 