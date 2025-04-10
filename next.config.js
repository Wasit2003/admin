/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://wasit-backend.onrender.com',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://wasit-backend.onrender.com/:path*',
      },
    ];
  },
  webpack: (config) => {
    // Add custom webpack configurations if needed
    return config;
  },
};

module.exports = nextConfig;
