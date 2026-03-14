import { isNil } from "es-toolkit";
import { err, ok } from "neverthrow";
import type z from "zod";
import { Err } from "@/common/err/err";
import type { ProjectIssueFieldDefinitionCrudRepository } from "@/core/domain/project/issue/field/definition/crud-repository";
import type {
  ProjectIssueFieldDefinitionCrudService,
  projectIssueFieldDefinitionCrudServiceInputSchema,
} from "@/core/domain/project/issue/field/definition/crud-service";
import { ProjectIssueFieldDefinitionEntity } from "@/core/domain/project/issue/field/definition/entity";

export class ProjectIssueFieldDefinitionBasicCrudService implements ProjectIssueFieldDefinitionCrudService {
  #projectIssueFieldDefinitionCrudRepository: ProjectIssueFieldDefinitionCrudRepository;

  constructor(
    projectIssueFieldDefinitionCrudRepository: ProjectIssueFieldDefinitionCrudRepository,
  ) {
    this.#projectIssueFieldDefinitionCrudRepository =
      projectIssueFieldDefinitionCrudRepository;
  }

  async create(
    input: z.infer<
      typeof projectIssueFieldDefinitionCrudServiceInputSchema.create
    >,
  ) {
    const { ctx, payload } = input;
    const { type, name, options, project } = payload;

    const newEntity = ProjectIssueFieldDefinitionEntity.makeNew(ctx.tenant, {
      type,
      name,
      options,
      project,
    });

    const insertResult =
      await this.#projectIssueFieldDefinitionCrudRepository.insert({
        ctx,
        data: newEntity,
      });

    if (insertResult.isErr()) {
      return err(insertResult.error);
    }
    return ok(newEntity);
  }

  async get(
    input: z.infer<
      typeof projectIssueFieldDefinitionCrudServiceInputSchema.get
    >,
  ) {
    const { ctx, payload } = input;
    const { id } = payload;

    const findOneResult =
      await this.#projectIssueFieldDefinitionCrudRepository.findOne({
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
    input: z.infer<
      typeof projectIssueFieldDefinitionCrudServiceInputSchema.list
    >,
  ) {
    const { ctx, filter } = input;

    return await this.#projectIssueFieldDefinitionCrudRepository.findMany({
      ctx,
      filter,
    });
  }

  async update(
    input: z.infer<
      typeof projectIssueFieldDefinitionCrudServiceInputSchema.update
    >,
  ) {
    const { ctx, payload } = input;
    const { id, ...updatedProps } = payload;

    const findOneResult =
      await this.#projectIssueFieldDefinitionCrudRepository.findOne({
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

    const updateResult =
      await this.#projectIssueFieldDefinitionCrudRepository.update({
        ctx,
        id,
        data: maybeEntity,
      });

    if (updateResult.isErr()) {
      return err(updateResult.error);
    }
    return ok(maybeEntity);
  }

  async delete(
    input: z.infer<
      typeof projectIssueFieldDefinitionCrudServiceInputSchema.delete
    >,
  ) {
    const { ctx, payload } = input;
    const { id } = payload;

    return await this.#projectIssueFieldDefinitionCrudRepository.delete({
      ctx,
      id,
    });
  }
}
