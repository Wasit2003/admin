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
      // For /api/* routes - proxy to the backend server
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      // For /admin/api/* routes - proxy to the backend server
      {
        source: '/admin/api/:path*',
        destination: `${backendUrl}/admin/api/:path*`,
      },
    ];
  },
  webpack: (config) => {
    // Add custom webpack configurations if needed
    return config;
  },
};

module.exports = nextConfig;
