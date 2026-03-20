import { Elysia } from "elysia";
import { aiAgentV1Router } from "@/router/ai-agent/v1/router-ai-agent-v1";
import { projectV1Router } from "@/router/project/v1/router-project-v1";

const app = new Elysia().use(aiAgentV1Router).use(projectV1Router);

app.listen(8000);
