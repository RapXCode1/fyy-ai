// next.config.mjs
/** @type {import('next').NextConfig} */
const baseConfig = {
  // Enable React strict mode and compression
  reactStrictMode: true,
  compress: true,
  productionBrowserSourceMaps: false,

  // Image handling – AVIF & WebP for maximum compression and mobile speed
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { hostname: 'fyy-ai.vercel.app' },
      { hostname: 'images.unsplash.com' },
      { hostname: 'api-inference.huggingface.co' },
      { hostname: '*.supabase.co' },
      { hostname: 'img.clerk.com' },
    ],
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },

  // Optimize package imports for extreme tree-shaking & smaller client bundles
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@clerk/nextjs',
      '@vercel/analytics',
      '@vercel/speed-insights',
    ],
  },

  env: {
    NEXT_PUBLIC_CLERK_JS: '/_clerk/js/clerk.js',
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: '/sign-in',
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: '/sign-up',
    NEXT_PUBLIC_AUTH_CALLBACK: 'https://fyy-ai.vercel.app/api/auth/clerk/callback',
  },

  // Proxy Clerk script
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
