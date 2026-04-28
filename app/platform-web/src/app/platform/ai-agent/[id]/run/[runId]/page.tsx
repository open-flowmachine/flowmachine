import { AiAgentRunChatPage } from "@/feature/ai-agent-run-chat/ai-agent-run-chat-page";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string; runId: string }>;
}) {
  const { id, runId } = await params;
  return <AiAgentRunChatPage aiAgentId={id} runId={runId} />;
}
