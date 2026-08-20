import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { ThemeProvider } from "@/components/theme-provider"
import ThemeStyleProvider from "@/components/theme-style-provider"
import ClientOnlyProviders from "@/components/client-only-providers"
import "./globals.css"

import { ClerkProvider } from "@clerk/nextjs"
import type { Viewport } from "next"

// Preload Inter font with zero render-blocking
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "500", "600", "700", "800"],
})

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://fyy-ai.vercel.app'),
  title: "FYY-AI - Advanced AI Intelligence Platform",
  description: "Experience the future of AI with FYY-AI, powered by FYY-GROQ SYSTEM INTELLIGENCE (FYY-LLM).",
  generator: "fyy-ai",
  icons: {
    icon: [
      { url: "/brand-logo.png", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FYY-AI",
  },
  openGraph: {
    title: "FYY-AI - Advanced AI Intelligence Platform",
    description: "Experience the future of AI with FYY-AI, powered by FYY-GROQ SYSTEM INTELLIGENCE (FYY-LLM).",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "FYY-AI Logo" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FYY-AI - Advanced AI Intelligence Platform",
    description: "Experience the future of AI with FYY-AI, powered by FYY-GROQ SYSTEM INTELLIGENCE (FYY-LLM).",
    images: ["/og-image.png"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider afterSignOutUrl="/">
      <html lang="en" className={inter.variable} suppressHydrationWarning>
        <body className={`font-sans antialiased ${inter.className}`}>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
            <ThemeStyleProvider />
            <ClientOnlyProviders />
            {children}
            <Analytics />
            <SpeedInsights />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
