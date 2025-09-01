/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  compress: true, // Enable response compression
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'supabasekong-pgo8c80w04gcoo4w88kgsw0s.breaktheice.in',
      },
      {
        protocol: 'https',
        hostname: 'supabasekong-u0k8kkksk4k8ccw0ow0kg084.breaktheice.in',
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  experimental: {
    optimizeCss: true,
    optimizeServerReact: true,
    turbo: {
      rules: {
        "*.svg": ["@svgr/webpack"],
      },
    },
    // Performance optimizations
    webpackBuildWorker: true,
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
  },
  // Performance optimizations
  poweredByHeader: false,
  generateEtags: false,
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle size
    if (!dev && !isServer) {
      config.optimization.splitChunks.chunks = 'all';
      config.optimization.splitChunks.cacheGroups = {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      };
    }
    
    return config;
  },
};

module.exports = config;
