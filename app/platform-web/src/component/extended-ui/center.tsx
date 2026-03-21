import type { PropsWithChildren } from "react";

export function Center({ children }: PropsWithChildren) {
  return (
    <div className="flex h-full w-full items-center justify-center">
      {children}
    </div>
  );
}
