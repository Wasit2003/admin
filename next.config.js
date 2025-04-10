/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://wasit-backend.onrender.com',
  },
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://wasit-backend.onrender.com';
    return [
      // Direct request to /api/admin/settings to backend's /admin/settings endpoint
      {
        source: '/api/admin/settings',
        destination: `${backendUrl}/admin/settings`,
      },
      // Direct request to /api/admin/debug-settings to backend's /admin/debug-settings endpoint
      {
        source: '/api/admin/debug-settings',
        destination: `${backendUrl}/admin/debug-settings`,
      },
      // For all other /api/* routes - proxy to the backend server
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      // For /admin/* routes - proxy to the backend server's admin routes
      {
        source: '/admin/:path*',
        destination: `${backendUrl}/admin/:path*`,
      },
    ];
  },
  webpack: (config) => {
    // Add custom webpack configurations if needed
    return config;
  },
};

module.exports = nextConfig;
