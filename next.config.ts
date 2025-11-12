import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Webpack config for native module resolution
  webpack: (config, { isServer }) => {
    // Externalize native modules that Turbopack can't handle
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'lightningcss': 'commonjs lightningcss',
        '@tailwindcss/oxide': 'commonjs @tailwindcss/oxide',
      });
    }
    
    // Alias for client-side resolution
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    
    return config;
  },
};

export default nextConfig;
