import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
  },
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  webpack(config) {
    // Suppress the "Serializing big strings" perf hint from webpack's file cache.
    // This is a dev-only cosmetic warning about webpack's own cache serialization;
    // it has no effect on production builds or runtime behavior.
    config.infrastructureLogging = {
      ...config.infrastructureLogging,
      level: 'error',
    }
    return config
  },
}

export default nextConfig
