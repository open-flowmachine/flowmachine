import { listAiAgents } from "@/action/ai-agent/list-ai-agents";
import AiAgentsTablePage from "@/presentation/feature/ai-agents-table/ai-agents-table-page";

export default async function Page() {
  const initialData = await listAiAgents();
  return <AiAgentsTablePage initialData={initialData} />;
}
