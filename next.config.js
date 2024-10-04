const withPWA = require('next-pwa')({
  dest: 'public/service-workers',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  buildExcludes: [/middleware-manifest.json$/, /app-build-manifest.json$/],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your other Next.js config options
};

module.exports = withPWA(nextConfig);