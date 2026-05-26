"use client";
import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";

/**
 * Detects ad-blockers by injecting a tiny bait element and checking if CSS hides it.
 * Runs asynchronously after a short delay to avoid false positives on slow connections.
 */
async function detectAdblock(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  return new Promise((resolve) => {
    // Delay slightly so the DOM and ad-blocker lists are fully active
    setTimeout(() => {
      try {
        const bait = document.createElement("div");
        bait.setAttribute("class", "ad-banner pub_300x250 pub_300x250m");
        bait.setAttribute(
          "style",
          "width: 1px; height: 1px; position: absolute; left: -9999px; top: -9999px;"
        );
        document.body.appendChild(bait);

        const blocked =
          bait.offsetHeight === 0 ||
          bait.offsetWidth === 0 ||
          bait.style.display === "none" ||
          bait.style.visibility === "hidden" ||
          bait.style.opacity === "0";

        document.body.removeChild(bait);
        resolve(blocked);
      } catch {
        resolve(false);
      }
    }, 500);
  });
}

const SESSION_KEY = "fyy-adblock-warned";

export default function ClerkSecurityShield() {
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    // Only run detection once per browser session
    if (sessionStorage.getItem(SESSION_KEY)) return;

    detectAdblock().then((isBlocked) => {
      if (isBlocked) {
        setShowToast(true);
        // Mark as warned so it doesn't re-appear on every page navigation
        sessionStorage.setItem(SESSION_KEY, "1");
      }
    });
  }, []);

  if (!showToast) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-4 right-4 z-[100] max-w-sm bg-zinc-950 border border-yellow-500/30 text-zinc-100 p-4 rounded-xl shadow-2xl flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="text-yellow-500 shrink-0" size={18} />
          <span className="font-semibold text-sm">Ad‑blocker Terdeteksi</span>
        </div>
        <button
          onClick={() => setShowToast(false)}
          className="text-zinc-400 hover:text-zinc-100 text-xs p-1 cursor-pointer transition-colors"
          aria-label="Tutup peringatan"
        >
          ✕
        </button>
      </div>
      <p className="text-xs text-zinc-300 leading-relaxed">
        Ad‑blocker aktif dapat memblokir fitur autentikasi (login/logout). Jika
        mengalami masalah saat login, coba nonaktifkan sementara.
      </p>
    </div>
  );
}
