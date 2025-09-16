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
  console.log('🔄 LOGIN API PROXY: Request received', {
    method: req.method,
    url: req.url,
    // Don't log sensitive information like passwords
    body: req.body ? { email: req.body.email, hasPassword: !!req.body.password } : null
  });

  // Handle CORS preflight
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://wasit-backend.onrender.com';
  const targetUrl = `${apiUrl}/api/admin/login`;
  
  console.log('🔄 Proxying login request to:', targetUrl);
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  
  try {
    // Forward the request to the backend
    console.log('🔄 Sending login request to backend with email:', req.body?.email);
    
    // Check if request body is valid
    if (!req.body || !req.body.email || !req.body.password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(req.body),
    });
    
    console.log('🔄 Backend login response status:', response.status);
    
    // Get the raw text first, so we can handle non-JSON responses
    const rawText = await response.text();
    
    // Try to parse the response as JSON
    let responseData;
    try {
      responseData = JSON.parse(rawText);
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
        message: responseData?.message || 'Login failed',
        statusCode: response.status,
        error: responseData
      });
    }
    
    // Check if response contains a token
    if (!responseData.token) {
      console.error('❌ Backend response missing token:', responseData);
      return res.status(502).json({
        success: false,
        message: 'Backend did not provide an authentication token',
        error: 'Missing token in response'
      });
    }
    
    console.log('✅ Login response successful with token');
    
    // Return the response with the same status
    res.status(response.status).json(responseData);
  } catch (error) {
    console.error('❌ Error proxying login to backend:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to connect to backend server',
      error: (error as Error).message
    });
  }
} 