import type { PropsWithChildren } from "react";
import { PlatformLayout } from "@/presentation/component/platform/platform-layout";

export default function Layout({ children }: PropsWithChildren) {
  return <PlatformLayout>{children}</PlatformLayout>;
}
