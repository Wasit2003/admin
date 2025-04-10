/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    // Make sure this exact URL is set and available in the frontend
    NEXT_PUBLIC_API_URL: 'https://wasit-backend.onrender.com',
  },
  // Simplified rewrite rules - direct pass through only
  async rewrites() {
    return [
      // API routes
      {
        source: '/api/:path*',
        destination: 'https://wasit-backend.onrender.com/api/:path*',
      },
      // Settings route specifically
      {
        source: '/admin/settings',
        destination: 'https://wasit-backend.onrender.com/api/admin/settings',
      },
      // Other admin routes
      {
        source: '/admin/:path*',
        destination: 'https://wasit-backend.onrender.com/admin/:path*',
      },
    ];
  },
  webpack: (config) => {
    return config;
  },
};

module.exports = nextConfig;
