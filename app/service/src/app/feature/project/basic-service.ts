import type { MongoClient } from "mongodb";
import { err, ok } from "neverthrow";
import type { Result } from "neverthrow";
import type z from "zod";
import { Err } from "@/common/err/err";
import type { AiAgentCrudService } from "@/core/domain/ai-agent/crud-service";
import type { GitRepositoryCrudService } from "@/core/domain/git-repository/crud-service";
import type { ProjectCrudService } from "@/core/domain/project/crud-service";
import type { WorkflowDefinitionCrudService } from "@/core/domain/workflow/definition/crud-service";
import type {
  ProjectService,
  projectServiceInputSchema,
} from "@/core/feature/project/service";

export class ProjectBasicService implements ProjectService {
  #mongoClient: MongoClient;
  #projectCrudService: ProjectCrudService;
  #aiAgentCrudService: AiAgentCrudService;
  #gitRepositoryCrudService: GitRepositoryCrudService;
  #workflowDefinitionCrudService: WorkflowDefinitionCrudService;

  constructor(
    mongoClient: MongoClient,
    projectCrudService: ProjectCrudService,
    aiAgentCrudService: AiAgentCrudService,
    gitRepositoryCrudService: GitRepositoryCrudService,
    workflowDefinitionCrudService: WorkflowDefinitionCrudService,
  ) {
    this.#mongoClient = mongoClient;
    this.#projectCrudService = projectCrudService;
    this.#aiAgentCrudService = aiAgentCrudService;
    this.#gitRepositoryCrudService = gitRepositoryCrudService;
    this.#workflowDefinitionCrudService = workflowDefinitionCrudService;
  }

  async delete(
    input: z.infer<typeof projectServiceInputSchema.delete>,
  ): Promise<Result<void, Err>> {
    const { ctx, payload } = input;
    const { id: projectId } = payload;

    const session = this.#mongoClient.startSession();

    try {
      session.startTransaction();

      const txCtx = { ...ctx, mongoClientSession: session };

      const removeAiAgentsResult = await this.#removeProjectFromAiAgents(
        txCtx,
        projectId,
      );
      if (removeAiAgentsResult.isErr()) {
        await session.abortTransaction();
        return err(removeAiAgentsResult.error);
      }

      const removeGitRepositoriesResult =
        await this.#removeProjectFromGitRepositories(txCtx, projectId);
      if (removeGitRepositoriesResult.isErr()) {
        await session.abortTransaction();
        return err(removeGitRepositoriesResult.error);
      }

      const removeWorkflowDefinitionsResult =
        await this.#removeProjectFromWorkflowDefinitions(txCtx, projectId);
      if (removeWorkflowDefinitionsResult.isErr()) {
        await session.abortTransaction();
        return err(removeWorkflowDefinitionsResult.error);
      }

      const deleteResult = await this.#projectCrudService.delete({
        ctx: txCtx,
        payload: { id: projectId },
      });
      if (deleteResult.isErr()) {
        await session.abortTransaction();
        return err(deleteResult.error);
      }

      await session.commitTransaction();

      return ok();
    } catch (error) {
      await session.abortTransaction();
      return err(Err.from(error));
    } finally {
      await session.endSession();
    }
  }

  async #removeProjectFromAiAgents(
    ctx: z.infer<typeof projectServiceInputSchema.delete>["ctx"],
    projectId: string,
  ): Promise<Result<void, Err>> {
    const listResult = await this.#aiAgentCrudService.list({
      ctx,
      filter: { projectId },
    });

    if (listResult.isErr()) {
      return err(listResult.error);
    }

    for (const aiAgent of listResult.value) {
      const updatedProjects = aiAgent.props.projects.filter(
        (p) => p.id !== projectId,
      );

      const updateResult = await this.#aiAgentCrudService.update({
        ctx,
        payload: { id: aiAgent.id, projects: updatedProjects },
      });

      if (updateResult.isErr()) {
        return err(updateResult.error);
      }
    }

    return ok();
  }

  async #removeProjectFromGitRepositories(
    ctx: z.infer<typeof projectServiceInputSchema.delete>["ctx"],
    projectId: string,
  ): Promise<Result<void, Err>> {
    const listResult = await this.#gitRepositoryCrudService.list({
      ctx,
      filter: { projectId },
    });

    if (listResult.isErr()) {
      return err(listResult.error);
    }

    for (const gitRepository of listResult.value) {
      const updatedProjects = gitRepository.props.projects.filter(
        (p) => p.id !== projectId,
      );

      const updateResult = await this.#gitRepositoryCrudService.update({
        ctx,
        payload: { id: gitRepository.id, projects: updatedProjects },
      });

      if (updateResult.isErr()) {
        return err(updateResult.error);
      }
    }

    return ok();
  }

  async #removeProjectFromWorkflowDefinitions(
    ctx: z.infer<typeof projectServiceInputSchema.delete>["ctx"],
    projectId: string,
  ): Promise<Result<void, Err>> {
    const listResult = await this.#workflowDefinitionCrudService.list({
      ctx,
      filter: { projectId },
    });

    if (listResult.isErr()) {
      return err(listResult.error);
    }

    for (const workflowDefinition of listResult.value) {
      const updatedProjects = workflowDefinition.props.projects.filter(
        (p) => p.id !== projectId,
      );

      const updateResult = await this.#workflowDefinitionCrudService.update({
        ctx,
        payload: { id: workflowDefinition.id, projects: updatedProjects },
      });

      if (updateResult.isErr()) {
        return err(updateResult.error);
      }
    }

    return ok();
  }
}
