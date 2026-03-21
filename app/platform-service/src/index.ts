import { Elysia } from "elysia";
import { aiAgentV1Router } from "@/router/ai-agent/v1/router-ai-agent-v1";
import { credentialV1Router } from "@/router/credential/v1/router-credential-v1";
import { gitRepositoryV1Router } from "@/router/git-repository/v1/router-git-repository-v1";
import { projectV1Router } from "@/router/project/v1/router-project-v1";
import { projectSyncV1Router } from "@/router/project/v1/router-project-sync-v1";
import { workflowDefinitionV1Router } from "@/router/workflow/v1/router-workflow-definition-v1";

const app = new Elysia()
  .use(aiAgentV1Router)
  .use(credentialV1Router)
  .use(projectV1Router)
  .use(projectSyncV1Router)
  .use(gitRepositoryV1Router)
  .use(workflowDefinitionV1Router);

app.listen(8000);
