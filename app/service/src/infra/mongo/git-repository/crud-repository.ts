import type { MongoClient } from "mongodb";
import { err, ok } from "neverthrow";
import type z from "zod";
import { Err } from "@/common/err/err";
import type {
  GitRepositoryCrudRepository,
  gitRepositoryCrudRepositoryInputSchema,
} from "@/core/domain/git-repository/crud-repository";
import { GitRepositoryEntity } from "@/core/domain/git-repository/entity";
import type { ConfigService } from "@/core/infra/config/service";
import type { LoggerService } from "@/core/infra/logger/service";
import { tenantAwareCollectionIndexes } from "@/infra/mongo/constant";
import type { GitRepositoryMongoModel } from "@/infra/mongo/git-repository/model";
import { tenantAwareEntityToMongoModel } from "@/infra/mongo/model";

class GitRepositoryMongoCrudRepository implements GitRepositoryCrudRepository {
  #configService: ConfigService;
  #mongoClient: MongoClient;
  #logger: LoggerService;

  constructor(configService: ConfigService, mongoClient: MongoClient, logger: LoggerService) {
    this.#configService = configService;
    this.#mongoClient = mongoClient;
    this.#logger = logger;
  }

  async findMany(
    input: z.infer<typeof gitRepositoryCrudRepositoryInputSchema.findMany>,
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
      this.#logger.error({ error });
      return err(Err.from(error));
    }
  }

  async findOne(
    input: z.infer<typeof gitRepositoryCrudRepositoryInputSchema.findOne>,
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

  async insert(
    input: z.infer<typeof gitRepositoryCrudRepositoryInputSchema.insert>,
  ) {
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

  async update(
    input: z.infer<typeof gitRepositoryCrudRepositoryInputSchema.update>,
  ) {
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

  async delete(
    input: z.infer<typeof gitRepositoryCrudRepositoryInputSchema.delete>,
  ) {
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
      .collection<GitRepositoryMongoModel>("git-repository");
    await collection.createIndexes(tenantAwareCollectionIndexes);
    return collection;
  }

  #toDomain(model: GitRepositoryMongoModel) {
    return GitRepositoryEntity.makeExisting(
      model._id,
      model.createdAt,
      model.updatedAt,
      model.tenant,
      {
        name: model.name,
        url: model.url,
        config: model.config,
        integration: model.integration,
        projects: model.projects,
      },
    );
  }
}

export { GitRepositoryMongoCrudRepository };
