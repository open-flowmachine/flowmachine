import { SignedIn } from "@daveyplate/better-auth-ui";
import type { CSSProperties, PropsWithChildren } from "react";
import { PlatformSidebar } from "@/component/platform/platform-sidebar";
import { SidebarInset, SidebarProvider } from "@/component/ui/sidebar";

export function PlatformLayout({ children }: PropsWithChildren) {
  return (
    <SignedIn>
      <SidebarProvider
        className="h-full"
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 56)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as CSSProperties
        }
      >
        <PlatformSidebar />
        <SidebarInset className="md:peer-data-[variant=inset]:m-1.5 md:peer-data-[variant=inset]:rounded-lg">
          {children}
        </SidebarInset>
      </SidebarProvider>
    </SignedIn>
  );
}
