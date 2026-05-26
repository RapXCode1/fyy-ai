"use client";

import dynamic from "next/dynamic";

const SpaceBackground = dynamic(() => import("@/components/space-background"), { ssr: false });
const ClerkSecurityShield = dynamic(() => import("@/components/clerk-security-shield"), { ssr: false });
const ServiceWorkerRegister = dynamic(() => import("@/components/service-worker-register"), { ssr: false });

export default function ClientOnlyProviders() {
  return (
    <>
      <SpaceBackground />
      <ClerkSecurityShield />
      <ServiceWorkerRegister />
    </>
  );
}
