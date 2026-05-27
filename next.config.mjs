// next.config.mjs
import withPWA from 'next-pwa';

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

// 🎉 PWA configuration – only applied in production builds
const nextConfig = process.env.NODE_ENV === 'production'
  ? withPWA({
      pwa: {
        dest: 'public',
        register: true,
        skipWaiting: true,
        // Default caching strategies
        runtimeCaching: [
          {
            urlPattern: /^\/(_next\/static\/.*)\.(js|css)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'next-static-assets',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'next-image-assets',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 60 },
            },
          },
          {
            urlPattern: /\/api\/.*$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 5 },
            },
          },
        ],
      },
    })(baseConfig)
  : baseConfig;

export default nextConfig;
