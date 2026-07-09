/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@atlas/ui', '@atlas/shared', '@atlas/types', '@atlas/api-client'],
  reactStrictMode: true,
  images: {
    domains: [],
  },
};

module.exports = nextConfig;