import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

import type { AiAgentRun } from "@/module/ai-agent-run/ai-agent-run-type";

import { Badge } from "@/component/ui/badge";
import { Button } from "@/component/ui/button";
import { makeAiAgentRunService } from "@/module/ai-agent-run/ai-agent-run-service";

type AiAgentRunChatHeaderProps = {
  aiAgentId: string;
  run: AiAgentRun;
};

export function AiAgentRunChatHeader({
  aiAgentId,
  run,
}: AiAgentRunChatHeaderProps) {
  const service = makeAiAgentRunService({ run });
  return (
    <div className="flex items-center justify-between gap-2">
      <Button
        variant="ghost"
        size="sm"
        nativeButton={false}
        render={<Link href={`/platform/ai-agent/${aiAgentId}/run`} />}
      >
        <ArrowLeftIcon />
        Runs
      </Button>
      <Badge variant={service.getStatusBadgeVariant()}>
        {service.getStatusDisplayName()}
      </Badge>
    </div>
  );
}
