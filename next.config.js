/** @type {import('next').NextConfig} */
export const nextConfig = {
  experimental: {
    appDir: true,
    typedRoutes: true,
    serverActions: true,
    missingSuspenseWithCSRBailout: false,
  },
  images: {
    domains: [
      "goodhive-image.s3.us-east-005.backblazeb2.com",
      "goodhive.s3.us-east-005.backblazeb2.com",
      "cdn.sanity.io",
    ],
  },
};

