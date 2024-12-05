/** @type {import('next').NextConfig} */
const nextConfig = {}

module.exports = nextConfig
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://api.coingecko.com/:path*',
      },
    ];
  },
};
