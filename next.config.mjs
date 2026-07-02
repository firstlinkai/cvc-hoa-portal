/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      // Document uploads go through Server Actions; cap matches the 10MB
      // business rule plus multipart overhead.
      bodySizeLimit: '11mb',
    },
  },
};

export default nextConfig;
