import { isNil } from "es-toolkit";
import { err, ok } from "neverthrow";
import type z from "zod";
import { Err } from "@/common/err/err";
import type { WorkflowDefinitionCrudRepository } from "@/core/domain/workflow/definition/crud-repository";
import type {
  WorkflowDefinitionCrudService,
  workflowDefinitionCrudServiceInputSchema,
} from "@/core/domain/workflow/definition/crud-service";
import { WorkflowDefinitionEntity } from "@/core/domain/workflow/definition/entity";

export class WorkflowDefinitionBasicCrudService implements WorkflowDefinitionCrudService {
  #workflowDefinitionCrudRepository: WorkflowDefinitionCrudRepository;

  constructor(
    workflowDefinitionCrudRepository: WorkflowDefinitionCrudRepository,
  ) {
    this.#workflowDefinitionCrudRepository = workflowDefinitionCrudRepository;
  }

  async create(
    input: z.infer<typeof workflowDefinitionCrudServiceInputSchema.create>,
  ) {
    const { ctx, payload } = input;
    const { name, description, projects, actions, edges, isActive } = payload;

    const newEntity = WorkflowDefinitionEntity.makeNew(ctx.tenant, {
      name,
      description,
      projects,
      actions,
      edges,
      isActive,
    });

    return await this.#workflowDefinitionCrudRepository.insert({
      ctx,
      data: newEntity,
    });
  }

  async get(
    input: z.infer<typeof workflowDefinitionCrudServiceInputSchema.get>,
  ) {
    const { ctx, payload } = input;
    const { id } = payload;

    const findOneResult = await this.#workflowDefinitionCrudRepository.findOne({
      ctx,
      id,
    });

    if (findOneResult.isErr()) {
      return err(findOneResult.error);
    }
    const maybeEntity = findOneResult.value;

    if (isNil(maybeEntity)) {
      return err(Err.code("notFound"));
    }
    return ok(maybeEntity);
  }

  async list(
    input: z.infer<typeof workflowDefinitionCrudServiceInputSchema.list>,
  ) {
    const { ctx, filter } = input;

    return await this.#workflowDefinitionCrudRepository.findMany({
      ctx,
      filter,
    });
  }

  async update(
    input: z.infer<typeof workflowDefinitionCrudServiceInputSchema.update>,
  ) {
    const { ctx, payload } = input;
    const { id, ...updatedProps } = payload;

    const findOneResult = await this.#workflowDefinitionCrudRepository.findOne({
      ctx,
      id,
    });

    if (findOneResult.isErr()) {
      return err(findOneResult.error);
    }
    const maybeEntity = findOneResult.value;

    if (isNil(maybeEntity)) {
      return err(Err.code("notFound"));
    }
    maybeEntity.update(updatedProps);

    return await this.#workflowDefinitionCrudRepository.update({
      ctx,
      id,
      data: maybeEntity,
    });
  }

  async delete(
    input: z.infer<typeof workflowDefinitionCrudServiceInputSchema.delete>,
  ) {
    const { ctx, payload } = input;
    const { id } = payload;

    return await this.#workflowDefinitionCrudRepository.delete({ ctx, id });
  }
}
