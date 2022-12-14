/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    outputStandalone: true,
  },
  images: {
    domains: [
      'localhost',
      'lh3.googleusercontent.com',
      'firebasestorage.googleapis.com',
    ],
  },
};

module.exports = nextConfig;
