// app/hooks/use-session.ts
"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";

/**
 * Hook that provides a boolean indicating whether the user is authenticated
 * and whether the session has expired. It also stores a timestamp in localStorage
 * to survive page refreshes.
 */
export function useSession() {
  const { isLoaded, isSignedIn } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) {
      setIsAuthenticated(true);
      const now = Date.now();
      localStorage.setItem("fyyai_session_ts", now.toString());
    } else {
      setIsAuthenticated(false);
      const stored = localStorage.getItem("fyyai_session_ts");
      if (stored) {
        const diff = Date.now() - Number(stored);
        // consider session expired after 24h of inactivity
        if (diff > 24 * 60 * 60 * 1000) setSessionExpired(true);
      }
    }
  }, [isLoaded, isSignedIn]);

  return { isLoaded, isAuthenticated, sessionExpired };
}
