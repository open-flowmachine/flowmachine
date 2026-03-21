import type { PropsWithChildren } from "react";
import { Center } from "@/component/extended-ui/center";
import { Pending } from "@/component/extended-ui/pending";
import { Separator } from "@/component/ui/separator";
import { SidebarTrigger } from "@/component/ui/sidebar";
import { cn } from "@/lib/util";

type PlatformPageTemplate = {
  heading: string;
  isPending?: boolean;
};

export function PlatformPageTemplate({
  children,
  heading,
  isPending = false,
}: PropsWithChildren<PlatformPageTemplate>) {
  return (
    <div className="grid h-full w-full grid-rows-[auto_1fr]">
      <header className="border-muted flex shrink-0 items-center gap-1.5 border-b px-4 py-2">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-auto"
        />
        <h1 className="ml-1.5 text-sm font-medium tracking-wide">{heading}</h1>
      </header>
      <div className={cn("h-full w-full max-w-7xl overflow-auto p-4")}>
        {isPending ? (
          <Center>
            <Pending />
          </Center>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
