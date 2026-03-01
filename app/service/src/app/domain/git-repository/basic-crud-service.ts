import { isNil } from "es-toolkit";
import { err, ok } from "neverthrow";
import type z from "zod";
import { Err } from "@/common/err/err";
import type { GitRepositoryCrudRepository } from "@/core/domain/git-repository/crud-repository";
import type {
  GitRepositoryCrudService,
  gitRepositoryCrudServiceInputSchema,
} from "@/core/domain/git-repository/crud-service";
import { GitRepositoryEntity } from "@/core/domain/git-repository/entity";

export class GitRepositoryBasicCrudService implements GitRepositoryCrudService {
  #gitRepositoryCrudRepository: GitRepositoryCrudRepository;

  constructor(gitRepositoryCrudRepository: GitRepositoryCrudRepository) {
    this.#gitRepositoryCrudRepository = gitRepositoryCrudRepository;
  }

  async create(
    input: z.infer<typeof gitRepositoryCrudServiceInputSchema.create>,
  ) {
    const { ctx, payload } = input;
    const { name, url, config, integration, projects } = payload;

    const newEntity = GitRepositoryEntity.makeNew(ctx.tenant, {
      name,
      url,
      config,
      integration,
      projects,
    });

    return await this.#gitRepositoryCrudRepository.insert({
      ctx,
      data: newEntity,
    });
  }

  async get(input: z.infer<typeof gitRepositoryCrudServiceInputSchema.get>) {
    const { ctx, payload } = input;
    const { id } = payload;

    const findOneResult = await this.#gitRepositoryCrudRepository.findOne({
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

  async list(input: z.infer<typeof gitRepositoryCrudServiceInputSchema.list>) {
    const { ctx } = input;

    return await this.#gitRepositoryCrudRepository.findMany({
      ctx,
    });
  }

  async update(
    input: z.infer<typeof gitRepositoryCrudServiceInputSchema.update>,
  ) {
    const { ctx, payload } = input;
    const { id, ...updatedProps } = payload;

    const findOneResult = await this.#gitRepositoryCrudRepository.findOne({
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

    return await this.#gitRepositoryCrudRepository.update({
      ctx,
      id,
      data: maybeEntity,
    });
  }

  async delete(
    input: z.infer<typeof gitRepositoryCrudServiceInputSchema.delete>,
  ) {
    const { ctx, payload } = input;
    const { id } = payload;

    return await this.#gitRepositoryCrudRepository.delete({ ctx, id });
  }
}
