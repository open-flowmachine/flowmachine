import { getAiAgent } from "@/action/ai-agent/get-ai-agent";
import { EditableAiAgentDetailsPage } from "@/presentation/feature/editable-ai-agent-details/editable-ai-agent-details-page";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const initialData = await getAiAgent(id);
  return <EditableAiAgentDetailsPage id={id} initialData={initialData} />;
}
