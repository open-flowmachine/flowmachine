"use client";

import { isNil } from "es-toolkit";

import { PlatformPageNotFoundError } from "@/component/platform/platform-page-not-found-error";
import { PlatformPageTemplate } from "@/component/platform/platform-page-template";
import { AiAgentRunChatComposer } from "@/feature/ai-agent-run-chat/ai-agent-run-chat-composer";
import { AiAgentRunChatDisconnectBanner } from "@/feature/ai-agent-run-chat/ai-agent-run-chat-disconnect-banner";
import { AiAgentRunChatHeader } from "@/feature/ai-agent-run-chat/ai-agent-run-chat-header";
import { AiAgentRunChatMessageList } from "@/feature/ai-agent-run-chat/ai-agent-run-chat-message-list";
import { AiAgentTabs } from "@/feature/ai-agent-tabs/ai-agent-tabs";
import { useListAiAgentRunMessages } from "@/module/ai-agent-run-message/use-list-ai-agent-run-messages";
import { useAiAgentRunEventStream } from "@/module/ai-agent-run/use-ai-agent-run-event-stream";
import { useGetAiAgentRun } from "@/module/ai-agent-run/use-get-ai-agent-run";
import { useGetAiAgent } from "@/module/ai-agent/use-get-ai-agent";

type AiAgentRunChatPageProps = {
  aiAgentId: string;
  runId: string;
};

export function AiAgentRunChatPage({
  aiAgentId,
  runId,
}: AiAgentRunChatPageProps) {
  const { data: aiAgent } = useGetAiAgent(aiAgentId);
  const {
    data: run,
    isPending: isRunPending,
    isError: isRunError,
  } = useGetAiAgentRun(aiAgentId, runId);
  const { data: messages } = useListAiAgentRunMessages(aiAgentId, runId);
  const { connectionStatus, reconnect } = useAiAgentRunEventStream(
    aiAgentId,
    runId,
  );

  if (isNil(run) || isRunError) {
    return (
      <PlatformPageTemplate heading="AI Agent">
        <PlatformPageNotFoundError />
      </PlatformPageTemplate>
    );
  }

  return (
    <PlatformPageTemplate
      heading={aiAgent?.name ?? "AI Agent"}
      isPending={isRunPending}
    >
      <div className="flex h-full min-h-0 max-w-3xl flex-col gap-3">
        <AiAgentTabs aiAgentId={aiAgentId} />
        <AiAgentRunChatHeader aiAgentId={aiAgentId} run={run} />
        {connectionStatus === "disconnected" && (
          <AiAgentRunChatDisconnectBanner onReconnect={reconnect} />
        )}
        <AiAgentRunChatMessageList messages={messages ?? []} />
        <AiAgentRunChatComposer aiAgentId={aiAgentId} run={run} />
      </div>
    </PlatformPageTemplate>
  );
}
