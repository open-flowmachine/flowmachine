import { AiAgentRunsTablePage } from "@/feature/ai-agent-runs-table/ai-agent-runs-table-page";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AiAgentRunsTablePage aiAgentId={id} />;
}
