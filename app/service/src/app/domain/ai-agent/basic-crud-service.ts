import { isNil } from "es-toolkit";
import { err, ok } from "neverthrow";
import type z from "zod";
import { Err } from "@/common/err/err";
import type { AiAgentCrudRepository } from "@/core/domain/ai-agent/crud-repository";
import type {
  AiAgentCrudService,
  aiAgentCrudServiceInputSchema,
} from "@/core/domain/ai-agent/crud-service";
import { AiAgentEntity } from "@/core/domain/ai-agent/entity";

export class AiAgentBasicCrudService implements AiAgentCrudService {
  #aiAgentCrudRepository: AiAgentCrudRepository;

  constructor(aiAgentCrudRepository: AiAgentCrudRepository) {
    this.#aiAgentCrudRepository = aiAgentCrudRepository;
  }

  async create(input: z.infer<typeof aiAgentCrudServiceInputSchema.create>) {
    const { ctx, payload } = input;
    const { name, model, projects } = payload;

    const newEntity = AiAgentEntity.makeNew(ctx.tenant, {
      name,
      model,
      projects,
    });

    return await this.#aiAgentCrudRepository.insert({
      ctx,
      data: newEntity,
    });
  }

  async get(input: z.infer<typeof aiAgentCrudServiceInputSchema.get>) {
    const { ctx, payload } = input;
    const { id } = payload;

    const findOneResult = await this.#aiAgentCrudRepository.findOne({
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

  async list(input: z.infer<typeof aiAgentCrudServiceInputSchema.list>) {
    const { ctx, filter } = input;

    return await this.#aiAgentCrudRepository.findMany({
      ctx,
      filter,
    });
  }

  async update(input: z.infer<typeof aiAgentCrudServiceInputSchema.update>) {
    const { ctx, payload } = input;
    const { id, ...updatedProps } = payload;

    const findOneResult = await this.#aiAgentCrudRepository.findOne({
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

    return await this.#aiAgentCrudRepository.update({
      ctx,
      id,
      data: maybeEntity,
    });
  }

  async delete(input: z.infer<typeof aiAgentCrudServiceInputSchema.delete>) {
    const { ctx, payload } = input;
    const { id } = payload;

    return await this.#aiAgentCrudRepository.delete({ ctx, id });
  }
}
