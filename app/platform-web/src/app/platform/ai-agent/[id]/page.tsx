import { EditableAiAgentDetailsPage } from "@/feature/editable-ai-agent-details/editable-ai-agent-details-page";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditableAiAgentDetailsPage id={id} />;
}
