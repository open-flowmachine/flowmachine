import { cors } from "@elysiajs/cors";
import openapi, { fromTypes } from "@elysiajs/openapi";
import Elysia from "elysia";
import z from "zod";
import {
  aiAgentV1HttpRouterFactory,
  betterAuthHttpRouterFactory,
  credentialV1HttpRouterFactory,
  documentV1HttpRouterFactory,
  gitRepositoryV1HttpRouterFactory,
  healthHttpRouterFactory,
  httpErrorHandlerFactory,
  inngestHttpRouterFactory,
  projectV1HttpRouterFactory,
  workflowActionDefinitionV1HttpRouterFactory,
  workflowDefinitionV1HttpRouterFactory,
} from "@/di/api";
import { envConfigService } from "@/di/infra";

const app = new Elysia();

app
  .use(cors())
  .use(
    openapi({
      mapJsonSchema: { zod: z.toJSONSchema },
      references: fromTypes(
        envConfigService.get("app.env") === "production"
          ? "dist/api.d.ts"
          : "src/api.ts",
      ),
    }),
  )
  .use(httpErrorHandlerFactory.make())
  .use(aiAgentV1HttpRouterFactory.make())
  .use(betterAuthHttpRouterFactory.make())
  .use(credentialV1HttpRouterFactory.make())
  .use(documentV1HttpRouterFactory.make())
  .use(gitRepositoryV1HttpRouterFactory.make())
  .use(healthHttpRouterFactory.make())
  .use(inngestHttpRouterFactory.make())
  .use(projectV1HttpRouterFactory.make())
  .use(workflowActionDefinitionV1HttpRouterFactory.make())
  .use(workflowDefinitionV1HttpRouterFactory.make())
  .listen(8000);
