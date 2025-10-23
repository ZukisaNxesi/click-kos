"use client";

import { ThemeProvider } from "./theme-provider";
import { Toaster } from "./ui/sonner";
import { CartProvider } from "../context/CartContext";
import { AppProgressProvider as ProgressProvider } from "@bprogress/next";
import AuthSyncProvider from "./AuthSyncProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthSyncProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <ProgressProvider>
          <CartProvider>
            {children}
            <Toaster richColors />
          </CartProvider>
        </ProgressProvider>
      </ThemeProvider>
    </AuthSyncProvider>
  );
}
