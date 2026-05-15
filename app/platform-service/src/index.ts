import { cors } from "@elysiajs/cors";
import openapi, { fromTypes } from "@elysiajs/openapi";
import { Elysia } from "elysia";
import z from "zod";

import { aiAgentRunMessageV1Router } from "@/router/ai-agent-run-message/v1/router-ai-agent-run-message-v1";
import { aiAgentRunV1Router } from "@/router/ai-agent-run/v1/router-ai-agent-run-v1";
import { aiAgentV1Router } from "@/router/ai-agent/v1/router-ai-agent-v1";
import { authRouter } from "@/router/auth/router-auth";
import { credentialV1Router } from "@/router/credential/v1/router-credential-v1";
import { gitRepositoryV1Router } from "@/router/git-repository/v1/router-git-repository-v1";
import { healthRouter } from "@/router/health/router-health";
import { inngestRouter } from "@/router/inngest/router-inngest";
import { projectSyncV1Router } from "@/router/project/v1/router-project-sync-v1";
import { projectV1Router } from "@/router/project/v1/router-project-v1";
import { routerErrorHandler } from "@/router/router-error-handler";
import { routerLogger } from "@/router/router-logger";
import { webhookV1Router } from "@/router/webhook/v1/router-webhook-v1";
import { workflowDefinitionV1Router } from "@/router/workflow/v1/router-workflow-definition-v1";
import { workflowExecutionV1Router } from "@/router/workflow/v1/router-workflow-execution-v1";

const app = new Elysia()
  .use(routerLogger)
  .use(routerErrorHandler)
  .use(cors())
  .use(
    openapi({
      mapJsonSchema: {
        zod: z.toJSONSchema,
      },
      references: fromTypes(),
    }),
  )
  .use(aiAgentV1Router)
  .use(aiAgentRunV1Router)
  .use(aiAgentRunMessageV1Router)
  .use(authRouter)
  .use(credentialV1Router)
  .use(healthRouter)
  .use(inngestRouter)
  .use(projectV1Router)
  .use(projectSyncV1Router)
  .use(gitRepositoryV1Router)
  .use(webhookV1Router)
  .use(workflowDefinitionV1Router)
  .use(workflowExecutionV1Router);

app.listen(8000);
