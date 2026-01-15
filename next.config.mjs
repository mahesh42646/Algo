/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production configuration
  env: {
    NEXT_PUBLIC_API_URL: process.env.NODE_ENV === 'production'
      ? 'https://algo.skylith.cloud/api'
      : 'http://localhost:4006/api',
    NEXT_PUBLIC_APP_URL: process.env.NODE_ENV === 'production'
      ? 'https://algo.skylith.cloud'
      : 'http://localhost:3006',
  },

  // Image optimization
  images: {
    domains: ['algo.skylith.cloud', 'localhost'],
    unoptimized: process.env.NODE_ENV === 'development',
  },

  // Headers for security and CORS
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type,Authorization' },
        ],
      },
    ];
  },

  // Build optimization
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Output configuration for static deployment if needed
  output: process.env.NEXT_OUTPUT_MODE || undefined,

  // Port configuration
  ...(process.env.NODE_ENV === 'development' && {
    devServer: {
      port: 3006,
    },
  }),
};

export default nextConfig;
