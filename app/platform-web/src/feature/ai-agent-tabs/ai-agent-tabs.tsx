"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Tabs, TabsList, TabsTrigger } from "@/component/ui/tabs";

const aiAgentTabs = ["overview", "run"] as const;
type AiAgentTab = (typeof aiAgentTabs)[number];

type AiAgentTabsProps = {
  aiAgentId: string;
};

const resolveActiveTab = (
  pathname: string | null,
  aiAgentId: string,
): AiAgentTab => {
  if (pathname === null) {
    return "overview";
  }
  const runPathPrefix = `/platform/ai-agent/${aiAgentId}/run`;
  if (pathname === runPathPrefix || pathname.startsWith(`${runPathPrefix}/`)) {
    return "run";
  }
  return "overview";
};

export function AiAgentTabs({ aiAgentId }: AiAgentTabsProps) {
  const pathname = usePathname();
  const activeTab = resolveActiveTab(pathname, aiAgentId);

  return (
    <Tabs value={activeTab}>
      <TabsList variant="line">
        <TabsTrigger
          value="overview"
          render={<Link href={`/platform/ai-agent/${aiAgentId}`} />}
        >
          Overview
        </TabsTrigger>
        <TabsTrigger
          value="run"
          render={<Link href={`/platform/ai-agent/${aiAgentId}/run`} />}
        >
          Runs
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
