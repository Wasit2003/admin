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
  // Get the path from the URL
  const { path } = req.query;
  
  if (!path || !Array.isArray(path)) {
    return res.status(400).json({ error: 'Invalid path' });
  }
  
  // Join the path segments and create the target URL
  const pathSegments = path.join('/');
  
  // Enhanced logging
  console.log(`🔄 API PROXY [${req.method}]: ${pathSegments}`, {
    method: req.method,
    query: req.query,
    path: pathSegments
  });

  // Handle CORS preflight
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://wasit-backend.onrender.com';
  // Remove the query params from the path array since we'll add them separately
  const targetUrl = `${apiUrl}/api/admin/${pathSegments}`;
  
  console.log('🔄 Proxying request to:', targetUrl);
  
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
    // Create full URL with query parameters
    const url = new URL(targetUrl);
    
    // Add query parameters (except the path parameter)
    const query = { ...req.query };
    delete query.path;
    
    Object.keys(query).forEach(key => {
      if (query[key] !== undefined) {
        url.searchParams.append(key, query[key] as string);
      }
    });
    
    console.log('🔄 Final URL:', url.toString());
    
    // Forward the request to the backend
    const response = await fetch(url.toString(), {
      method: req.method,
      headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' && req.body ? 
            JSON.stringify(req.body) : undefined,
    });
    
    console.log(`🔄 Backend response status for ${pathSegments}:`, response.status);
    
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
      console.error(`❌ Backend returned error status for ${pathSegments}:`, response.status);
      console.error('❌ Error response data:', responseData);
      
      return res.status(response.status).json({
        success: false,
        message: responseData?.message || `Request to ${pathSegments} failed`,
        statusCode: response.status,
        error: responseData
      });
    }
    
    // Success! Return the response data
    console.log(`✅ Response for ${pathSegments} successful`);
    res.status(response.status).json(responseData);
    
  } catch (error) {
    console.error(`❌ Error proxying to ${pathSegments}:`, error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to connect to backend server',
      error: (error as Error).message,
      path: pathSegments
    });
  }
} 