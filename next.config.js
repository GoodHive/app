/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  experimental: {
    typedRoutes: true,
  },
  async headers() {
    return [
      {
        // Only apply CORS headers in development
        source: process.env.NODE_ENV === "development" ? "/(.*)" : "/dev-only-route-that-never-exists",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "http://localhost:3000",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  },
  images: {
    domains: [
      "goodhive-image.s3.us-east-005.backblazeb2.com",
      "goodhive.s3.us-east-005.backblazeb2.com",
      "cdn.sanity.io",
      "picsum.photos",
    ],
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: "standalone",
  poweredByHeader: false,
  swcMinify: true,
};

module.exports = nextConfig;
