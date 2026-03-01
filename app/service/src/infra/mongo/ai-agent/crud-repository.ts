import type { MongoClient } from "mongodb";
import { err, ok } from "neverthrow";
import type z from "zod";
import { Err } from "@/common/err/err";
import type {
  AiAgentCrudRepository,
  aiAgentCrudRepositoryInputSchema,
} from "@/core/domain/ai-agent/crud-repository";
import { AiAgentEntity } from "@/core/domain/ai-agent/entity";
import type { ConfigService } from "@/core/infra/config/service";
import type { AiAgentMongoModel } from "@/infra/mongo/ai-agent/model";
import { tenantAwareCollectionIndexes } from "@/infra/mongo/constant";
import { tenantAwareEntityToMongoModel } from "@/infra/mongo/model";

class AiAgentMongoCrudRepository implements AiAgentCrudRepository {
  #configService: ConfigService;
  #mongoClient: MongoClient;

  constructor(configService: ConfigService, mongoClient: MongoClient) {
    this.#configService = configService;
    this.#mongoClient = mongoClient;
  }

  async findMany(
    input: z.infer<typeof aiAgentCrudRepositoryInputSchema.findMany>,
  ) {
    const { ctx } = input;

    try {
      const collection = await this.#getCollection();
      const query: Record<string, unknown> = { tenant: ctx.tenant };
      if (input.filter?.projectId) {
        query["projects.id"] = input.filter.projectId;
      }
      const result = await collection
        .find(query, { session: ctx.mongoClientSession })
        .toArray();
      return ok(result.map(this.#toDomain));
    } catch (error) {
      console.error(error);
      return err(Err.from(error));
    }
  }

  async findOne(
    input: z.infer<typeof aiAgentCrudRepositoryInputSchema.findOne>,
  ) {
    const { ctx, id } = input;

    try {
      const collection = await this.#getCollection();
      const result = await collection.findOne(
        { _id: id, tenant: ctx.tenant },
        { session: ctx.mongoClientSession },
      );
      return ok(result ? this.#toDomain(result) : null);
    } catch (error) {
      return err(Err.from(error));
    }
  }

  async insert(input: z.infer<typeof aiAgentCrudRepositoryInputSchema.insert>) {
    const { ctx, data } = input;

    try {
      const collection = await this.#getCollection();
      const model = tenantAwareEntityToMongoModel(data);
      await collection.insertOne(model, { session: ctx.mongoClientSession });
      return ok();
    } catch (error) {
      return err(Err.from(error));
    }
  }

  async update(input: z.infer<typeof aiAgentCrudRepositoryInputSchema.update>) {
    const { ctx, id, data } = input;

    try {
      const collection = await this.#getCollection();
      const model = tenantAwareEntityToMongoModel(data);
      await collection.replaceOne({ _id: id, tenant: ctx.tenant }, model, {
        session: ctx.mongoClientSession,
      });
      return ok();
    } catch (error) {
      return err(Err.from(error));
    }
  }

  async delete(input: z.infer<typeof aiAgentCrudRepositoryInputSchema.delete>) {
    const { ctx, id } = input;

    try {
      const collection = await this.#getCollection();
      await collection.deleteOne(
        { _id: id, tenant: ctx.tenant },
        { session: ctx.mongoClientSession },
      );
      return ok();
    } catch (error) {
      return err(Err.from(error));
    }
  }

  async #getCollection() {
    const collection = this.#mongoClient
      .db(this.#configService.get("database.name"))
      .collection<AiAgentMongoModel>("ai-agent");
    await collection.createIndexes(tenantAwareCollectionIndexes);
    return collection;
  }

  #toDomain(model: AiAgentMongoModel) {
    return AiAgentEntity.makeExisting(
      model._id,
      model.createdAt,
      model.updatedAt,
      model.tenant,
      {
        name: model.name,
        model: model.model,
        projects: model.projects,
      },
    );
  }
}

export { AiAgentMongoCrudRepository };
