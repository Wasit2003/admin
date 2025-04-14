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
  console.log('🔄 DASHBOARD STATS API PROXY: Request received', {
    method: req.method,
    url: req.url,
    query: req.query
  });

  // Handle CORS preflight
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://wasit-backend.onrender.com';
  const targetUrl = `${apiUrl}/api/admin/dashboard/stats`;
  
  console.log('🔄 Proxying dashboard stats request to:', targetUrl);
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  
  // Forward auth header if it exists
  if (req.headers.authorization) {
    headers['Authorization'] = req.headers.authorization as string;
    console.log('🔑 Authorization header present');
  } else {
    console.warn('⚠️ No Authorization header in request');
  }
  
  try {
    // Create URL with query parameters
    const url = new URL(targetUrl);
    
    // Add query parameters
    Object.keys(req.query).forEach(key => {
      if (req.query[key] !== undefined) {
        url.searchParams.append(key, req.query[key] as string);
      }
    });
    
    // Forward the request to the backend
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers
    });
    
    console.log('🔄 Backend dashboard stats response status:', response.status);
    
    // Get the raw text first, so we can handle non-JSON responses
    const rawText = await response.text();
    
    // Try to parse the response as JSON
    let responseData;
    try {
      responseData = rawText ? JSON.parse(rawText) : {};
    } catch (parseError) {
      console.error('❌ Error parsing response as JSON:', parseError);
      console.error('❌ Raw response text:', rawText);
      
      // Return a friendly error message
      return res.status(502).json({
        success: false,
        message: 'Invalid response from backend server',
        error: 'The backend returned an invalid JSON response',
        details: rawText.slice(0, 200) // Include a snippet of the raw response for debugging
      });
    }
    
    if (!response.ok) {
      console.error('❌ Backend returned error status:', response.status);
      console.error('❌ Error response data:', responseData);
      
      return res.status(response.status).json({
        success: false,
        message: responseData?.message || 'Failed to get dashboard stats',
        statusCode: response.status,
        error: responseData
      });
    }
    
    // Return the response with the same status
    res.status(response.status).json(responseData);
  } catch (error) {
    console.error('❌ Error proxying dashboard stats to backend:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to connect to backend server',
      error: (error as Error).message
    });
  }
} 