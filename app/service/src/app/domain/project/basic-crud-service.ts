import { isNil } from "es-toolkit";
import { err, ok } from "neverthrow";
import type z from "zod";
import { Err } from "@/common/err/err";
import type { ProjectCrudRepository } from "@/core/domain/project/crud-repository";
import type {
  ProjectCrudService,
  projectCrudServiceInputSchema,
} from "@/core/domain/project/crud-service";
import { ProjectEntity } from "@/core/domain/project/entity";

export class ProjectBasicCrudService implements ProjectCrudService {
  #projectCrudRepository: ProjectCrudRepository;

  constructor(projectCrudRepository: ProjectCrudRepository) {
    this.#projectCrudRepository = projectCrudRepository;
  }

  async create(input: z.infer<typeof projectCrudServiceInputSchema.create>) {
    const { ctx, payload } = input;
    const { name, integration } = payload;

    const newEntity = ProjectEntity.makeNew(ctx.tenant, {
      name,
      integration,
    });

    return await this.#projectCrudRepository.insert({
      ctx,
      data: newEntity,
    });
  }

  async get(input: z.infer<typeof projectCrudServiceInputSchema.get>) {
    const { ctx, payload } = input;
    const { id } = payload;

    const findOneResult = await this.#projectCrudRepository.findOne({
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

  async list(input: z.infer<typeof projectCrudServiceInputSchema.list>) {
    const { ctx } = input;

    return await this.#projectCrudRepository.findMany({
      ctx,
    });
  }

  async update(input: z.infer<typeof projectCrudServiceInputSchema.update>) {
    const { ctx, payload } = input;
    const { id, ...updatedProps } = payload;

    const findOneResult = await this.#projectCrudRepository.findOne({
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

    return await this.#projectCrudRepository.update({
      ctx,
      id,
      data: maybeEntity,
    });
  }

  async delete(input: z.infer<typeof projectCrudServiceInputSchema.delete>) {
    const { ctx, payload } = input;
    const { id } = payload;

    return await this.#projectCrudRepository.delete({ ctx, id });
  }
}
