/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    formats: ['image/webp'],
    domains: ['fyy-ai.vercel.app'],
  },
  experimental: {
    appDir: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.plugins.push(new (require('webpack-bundle-analyzer')).BundleAnalyzerPlugin({
        analyzerMode: 'static',
        openAnalyzer: false,
        reportFilename: '../bundles/client.html',
      }));
    }
    return config;
  },
  env: {
    NEXT_PUBLIC_CLERK_JS: '/_clerk/js/clerk.js',
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: '/sign-in',
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: '/sign-up',
  },
  async rewrites() {
    return [
      {
        source: '/_clerk/js/clerk.js',
        destination: 'https://mutual-drum-35.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js',
      },
    ];
  },
};

export default nextConfig;
