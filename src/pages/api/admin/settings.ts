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
  // Handle CORS preflight
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://wasit-backend.onrender.com';
  const targetUrl = `${apiUrl}/api/admin/settings`;
  
  console.log('🔄 Proxying request to:', targetUrl);
  console.log('🔄 Request method:', req.method);
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // Forward auth header if it exists
  if (req.headers.authorization) {
    headers['Authorization'] = req.headers.authorization as string;
  }
  
  try {
    // Add query params if they exist
    const queryString = new URLSearchParams(req.query as Record<string, string>).toString();
    const url = queryString ? `${targetUrl}?${queryString}` : targetUrl;
    
    // Forward the request to the backend
    const response = await fetch(url, {
      method: req.method,
      headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });
    
    // Get the response data
    const data = await response.json();
    
    // Return the response with the same status
    res.status(response.status).json(data);
  } catch (error) {
    console.error('❌ Error proxying to backend:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to connect to backend server',
      error: (error as Error).message,
    });
  }
} 