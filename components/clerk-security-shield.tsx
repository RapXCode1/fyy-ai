"use client";
import { useEffect, useState } from "react";
import { ShieldAlert, RefreshCw } from "lucide-react";
import { useAuth, useUser } from "@clerk/nextjs";

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
        <div className="fixed bottom-4 right-4 z-[100] max-w-sm bg-zinc-950 border border-yellow-500/30 text-zinc-100 p-4 rounded-xl shadow-2xl flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="text-yellow-500 shrink-0" size={18} />
              <span className="font-semibold text-sm">Ad‑blocker Warning</span>
            </div>
            <button 
              onClick={() => setShowToast(false)} 
              className="text-zinc-400 hover:text-zinc-100 text-xs p-1 cursor-pointer transition-colors"
              aria-label="Close warning"
            >
              ✕
            </button>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Please disable any ad‑blocking extensions for an optimal experience. Some security features and authentication panels may fail to load correctly.
          </p>
        </div>
      )}
    </>
  );
}
