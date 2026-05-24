"use client";
import { useEffect, useState } from "react";
import { ShieldAlert, RefreshCw } from "lucide-react";
import { useAuth, useUser } from "@clerk/nextjs";
import dynamic from "next/dynamic";

// Simple ad‑blocker detection using a hidden bait element
function detectAdblock(): boolean {
  if (typeof window === "undefined") return false;
  const bait = document.createElement("div");
  bait.className = "ad-banner";
  bait.style.display = "block";
  bait.style.position = "absolute";
  bait.style.left = "-9999px";
  document.body.appendChild(bait);
  const isBlocked = bait.offsetHeight === 0 && bait.offsetWidth === 0;
  document.body.removeChild(bait);
  return isBlocked;
}

// Dynamically import a simple toast component (shadcn/ui Toast)
const Toast = dynamic(() => import("../ui/toast"), { ssr: false });

export default function ClerkSecurityShield() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const [showAdblock, setShowAdblock] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Session handling – redirect to sign‑in if not authenticated
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      window.location.href = "/sign-in";
    }
  }, [isLoaded, isSignedIn]);

  // Ad‑blocker detection on mount
  useEffect(() => {
    if (detectAdblock()) {
      setShowAdblock(true);
      setShowToast(true);
    }
  }, []);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-4">
        <RefreshCw className="animate-spin mr-2" /> Loading…
      </div>
    );
  }

  return (
    <>
      {showAdblock && (
        <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 p-3 flex items-center space-x-2 rounded-md">
          <ShieldAlert size={20} />
          <span>Ad‑blocker detected. Some features may be limited.</span>
        </div>
      )}
      {showToast && (
        <Toast
          title="Ad‑blocker Warning"
          description="Please disable any ad‑blocking extensions for optimal experience."
          variant="warning"
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
}
