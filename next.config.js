/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  compress: true, // Enable response compression
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: false,
    domains: [
      "supabasekong-pgo8c80w04gcoo4w88kgsw0s.breaktheice.in",
      "supabasekong-u0k8kkksk4k8ccw0ow0kg084.breaktheice.in",
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
  },
};

module.exports = config;
