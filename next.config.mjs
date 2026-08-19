// next.config.mjs
/** @type {import('next').NextConfig} */
const baseConfig = {
  // Enable React strict mode and SWC minification
  reactStrictMode: true,

  // Image handling – use remotePatterns (Next 16) instead of deprecated domains
  images: {
    formats: ['image/webp'],
    remotePatterns: [{ hostname: 'fyy-ai.vercel.app' }],
  },

  env: {
    NEXT_PUBLIC_CLERK_JS: '/_clerk/js/clerk.js',
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: '/sign-in',
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: '/sign-up',
    NEXT_PUBLIC_AUTH_CALLBACK: 'https://fyy-ai.vercel.app/api/auth/clerk/callback',
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

export default baseConfig;
