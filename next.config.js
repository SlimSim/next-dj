const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  buildExcludes: [/middleware-manifest.json$/],
  exclude: [
    /\.map$/,
    /^manifest.*\.js$/,
    /\.js\.nft\.json$/,
    /\.mjs$/,
    /^workbox-.*\.js$/,
    /^worker-.*\.js$/,
    /^fallback-.*\.js$/,
    /^middleware-manifest\.json$/,
    /^app-build-manifest\.json$/,
    /_buildManifest\.js$/,
    /_ssgManifest\.js$/
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your other Next.js config options
};

module.exports = withPWA(nextConfig);