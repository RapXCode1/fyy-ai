/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode and SWC minification
  reactStrictMode: true,


  // Image handling – use remotePatterns (Next 16) instead of deprecated domains
  images: {
    formats: ['image/webp'],
    remotePatterns: [{ hostname: 'fyy-ai.vercel.app' }],
  },

  // Remove experimental appDir – Next 16 enables app directory by default
  // (no experimental block needed)

  // Disable custom webpack config to prevent require errors in ESM and missing dependencies.

  env: {
    NEXT_PUBLIC_CLERK_JS: '/_clerk/js/clerk.js',
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: '/sign-in',
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: '/sign-up',
  },

  // Proxy Clerk script (middleware deprecated → proxy)
  async rewrites() {
    return [
      {
        source: '/_clerk/js/clerk.js',
        destination:
          'https://mutual-drum-35.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js',
      },
    ];
  },
};

export default nextConfig;
