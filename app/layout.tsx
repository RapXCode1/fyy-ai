import type React from "react"
import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { ThemeProvider } from "@/components/theme-provider"
import ThemeStyleProvider from "@/components/theme-style-provider"
import ClientOnlyProviders from "@/components/client-only-providers"
import "./globals.css"

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
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <ThemeStyleProvider />
          <ClientOnlyProviders />
          {children}
          <Analytics />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  )
}
