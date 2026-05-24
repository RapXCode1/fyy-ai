/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // ignoreBuildErrors: true, // DANGEROUS: Disabled for production safety
  },
  images: {
    unoptimized: true,
  },
  // Enable experimental features if needed
  experimental: {
    // Add experimental features here if required
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
    ]
  },
}

export default nextConfig
