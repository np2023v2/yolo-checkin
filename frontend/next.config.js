/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },
  images: {
    domains: ['localhost'],
  },
  webpack: (config, { isServer }) => {
    // Exclude canvas from server-side bundle
    if (isServer) {
      config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    }
    return config;
  },
}

module.exports = nextConfig
