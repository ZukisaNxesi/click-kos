"use client";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { TOKEN_STORAGE_KEY } from "@/lib/auth";

export default function AuthSyncProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Listen for token refresh, sign-in, sign-out, etc.
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.access_token) {
          localStorage.setItem(TOKEN_STORAGE_KEY, session.access_token);
        } else {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return <>{children}</>;
}
