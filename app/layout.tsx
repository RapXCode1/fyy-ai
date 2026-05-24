import type React from "react"
import type { Metadata } from "next"
import { ThemeProvider } from "@/components/theme-provider"
import SpaceBackground from "@/components/space-background"
import ThemeStyleProvider from "@/components/theme-style-provider"
import "./globals.css"

import { ClerkProvider } from "@clerk/nextjs"
import type { Viewport } from "next"
import ServiceWorkerRegister from "@/components/service-worker-register"
import ClerkSecurityShield from "@/components/clerk-security-shield"

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
}

export const metadata: Metadata = {
  title: "FYY-AI - Advanced AI Intelligence Platform",
  description: "Experience the future of AI with FYY-AI, powered by FYY-GROQ SYSTEM INTELLIGENCE (FYY-LLM).",
  generator: "fyy-ai",
  icons: {
    icon: "/logo.png",
    apple: "/apple-icon.png",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FYY-AI",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider afterSignOutUrl="/">
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,600;0,700;0,800;1,400;1,600;1,700;1,800&family=Lato:wght@400;700&family=Merriweather:wght@400;700&family=Montserrat:wght@400;500;600;700&family=Nunito:wght@400;600;700&family=Open+Sans:wght@400;600;700&family=Playfair+Display:wght@400;600;700&family=Poppins:wght@400;500;600;700&family=Roboto:wght@400;500;700&family=Ubuntu:wght@400;500;700&display=swap" rel="stylesheet" />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                  (function() {
                    try {
                      var theme = localStorage.getItem('theme') || 'dark';
                      if (theme === 'dark') document.documentElement.classList.add('dark');
                    } catch (e) {}
                  })()
                `,
            }}
          />
        </head>
        <body className="font-sans antialiased">
          <ThemeProvider>
            <ThemeStyleProvider />
            <SpaceBackground />
            <ClerkSecurityShield />
            {children}
            <ServiceWorkerRegister />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
