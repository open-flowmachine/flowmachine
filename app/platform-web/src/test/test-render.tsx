import type { PropsWithChildren, ReactElement } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  type RenderOptions,
  type RenderResult,
  render,
} from "@testing-library/react";
import { Toaster } from "sonner";

import { SidebarProvider } from "@/component/ui/sidebar";

const makeTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });

const TestProvider = ({ children }: PropsWithChildren) => {
  const queryClient = makeTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>{children}</SidebarProvider>
      <Toaster />
    </QueryClientProvider>
  );
};

const testRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
): RenderResult => render(ui, { wrapper: TestProvider, ...options });

export { testRender, makeTestQueryClient };
