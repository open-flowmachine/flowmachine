"use client";

import { AuthUIProvider } from "@daveyplate/better-auth-ui";
import { QueryClientProvider } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PropsWithChildren } from "react";
import { Toaster } from "@/presentation/component/ui/sonner";
import { authClient } from "@/presentation/lib/auth/auth-client";
import { queryClient } from "@/presentation/lib/query/query-client";

export function GlobalProvider({ children }: PropsWithChildren) {
  const router = useRouter();
  return (
    <AuthUIProvider
      authClient={authClient}
      credentials={false}
      emailOTP
      navigate={router.push}
      replace={router.replace}
      onSessionChange={() => router.refresh()}
      Link={Link}
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      <Toaster position="bottom-center" />
    </AuthUIProvider>
  );
}
