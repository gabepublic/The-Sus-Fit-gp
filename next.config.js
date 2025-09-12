/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
    // Enable CSS optimization features
    optimizeCss: true,
    // Enable container queries support
    cssChunking: 'strict',
  },
  // CSS Modules configuration
  sassOptions: {
    includePaths: ['./src/styles'],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Server-only environment variables - not exposed to the browser
  serverRuntimeConfig: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-image-1',
  },
  // Public runtime config - keep empty to avoid leaking secrets
  publicRuntimeConfig: {},
}

module.exports = nextConfig