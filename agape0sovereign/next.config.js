/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Enable Web Vitals reporting
  experimental: {
    // Enable better performance
    optimizePackageImports: ['@tanstack/react-query'],
  },
};

module.exports = nextConfig;
