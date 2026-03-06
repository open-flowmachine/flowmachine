import {
  PROJECT_SYNC_EVENT,
  PROJECT_SYNC_FUNCTION_ID,
} from "@/app/feature/project/sync/constant";
import type { Tenant } from "@/core/domain/tenant-aware-entity";
import type { DurableFunctionFactory } from "@/core/infra/durable-function/factory";
import type { ProjectSyncService } from "@/core/feature/project/sync/service";

class ProjectSyncDurableFunctionFactory {
  #durableFunctionFactory: DurableFunctionFactory;
  #projectSyncService: ProjectSyncService;

  constructor(
    durableFunctionFactory: DurableFunctionFactory,
    projectSyncService: ProjectSyncService,
  ) {
    this.#durableFunctionFactory = durableFunctionFactory;
    this.#projectSyncService = projectSyncService;
  }

  make() {
    return this.#durableFunctionFactory.make({
      config: { id: PROJECT_SYNC_FUNCTION_ID },
      trigger: { event: PROJECT_SYNC_EVENT },
      handler: async ({ event, step }) => {
        const { projectId, tenant } = event.data as {
          projectId: string;
          tenant: Tenant;
        };
        const ctx = { tenant };

        await step.run("sync-ai-agents", async () => {
          const result = await this.#projectSyncService.syncAiAgents({
            ctx,
            payload: { projectId },
          });
          if (result.isErr()) {
            throw result.error;
          }
        });

        await step.run("sync-git-repositories", async () => {
          const result = await this.#projectSyncService.syncGitRepositories({
            ctx,
            payload: { projectId },
          });
          if (result.isErr()) {
            throw result.error;
          }
        });

        await step.run("sync-workflow-definitions", async () => {
          const result =
            await this.#projectSyncService.syncWorkflowDefinitions({
              ctx,
              payload: { projectId },
            });
          if (result.isErr()) {
            throw result.error;
          }
        });
      },
    });
  }
}

export { ProjectSyncDurableFunctionFactory };
