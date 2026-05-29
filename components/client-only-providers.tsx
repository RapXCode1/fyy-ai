"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";

const ClerkSecurityShield = dynamic(() => import("@/components/clerk-security-shield"), { ssr: false });
const ServiceWorkerRegister = dynamic(() => import("@/components/service-worker-register"), { ssr: false });

export default function ClientOnlyProviders() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleAppUrlOpen = async (event: any) => {
        try {
          const urlStr = event.url;
          if (urlStr.startsWith("fyyai://sync")) {
            const url = new URL(urlStr.replace("fyyai://", "https://"));
            const clientToken = url.searchParams.get("client_token");
            const sessionToken = url.searchParams.get("session_token");

            if (sessionToken) {
              // Set Clerk cookies on Webview directly
              document.cookie = `__session=${decodeURIComponent(sessionToken)}; path=/; max-age=31536000; SameSite=Lax; Secure`;

              if (clientToken) {
                document.cookie = `__client=${decodeURIComponent(clientToken)}; path=/; max-age=31536000; SameSite=Lax; Secure`;
              }

              // Clear guest cookie
              document.cookie = "fyy_guest=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Strict";

              // Redirect to /chat (forces reload and routes to workspace)
              window.location.href = "/chat";
            }
          }
        } catch (e) {
          console.error("Deep link sync error:", e);
        }
      };

      // Listen to Capacitor App events safely
      import("@capacitor/app").then(({ App }) => {
        App.addListener("appUrlOpen", handleAppUrlOpen);
      }).catch((err) => {
        console.log("Capacitor App listener not active (standard web mode)", err);
      });
    }
  }, []);

  return (
    <>
      <ClerkSecurityShield />
      <ServiceWorkerRegister />
    </>
  );
}
