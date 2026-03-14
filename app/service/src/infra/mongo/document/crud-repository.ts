import type { MongoClient } from "mongodb";
import { err, ok } from "neverthrow";
import type z from "zod";
import { Err } from "@/common/err/err";
import type {
  DocumentCrudRepository,
  documentCrudRepositoryInputSchema,
} from "@/core/domain/document/crud-repository";
import { DocumentEntity } from "@/core/domain/document/entity";
import type { ConfigService } from "@/core/infra/config/service";
import type { LoggerService } from "@/core/infra/logger/service";
import { tenantAwareCollectionIndexes } from "@/infra/mongo/constant";
import type { DocumentMongoModel } from "@/infra/mongo/document/model";
import { tenantAwareEntityToMongoModel } from "@/infra/mongo/model";

class DocumentMongoCrudRepository implements DocumentCrudRepository {
  #configService: ConfigService;
  #mongoClient: MongoClient;
  #logger: LoggerService;

  constructor(configService: ConfigService, mongoClient: MongoClient, logger: LoggerService) {
    this.#configService = configService;
    this.#mongoClient = mongoClient;
    this.#logger = logger;
  }

  async findMany(
    input: z.infer<typeof documentCrudRepositoryInputSchema.findOne>,
  ) {
    const { ctx } = input;

    try {
      const collection = await this.#getCollection();
      const result = await collection
        .find({ tenant: ctx.tenant }, { session: ctx.mongoClientSession })
        .toArray();
      return ok(result.map(this.#toDomain));
    } catch (error) {
      this.#logger.error({ error });
      return err(Err.from(error));
    }
  }

  async findOne(
    input: z.infer<typeof documentCrudRepositoryInputSchema.findOne>,
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
    input: z.infer<typeof documentCrudRepositoryInputSchema.insert>,
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
    input: z.infer<typeof documentCrudRepositoryInputSchema.update>,
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
    input: z.infer<typeof documentCrudRepositoryInputSchema.delete>,
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
      .collection<DocumentMongoModel>("document");
    await collection.createIndexes(tenantAwareCollectionIndexes);
    return collection;
  }

  #toDomain(model: DocumentMongoModel) {
    return DocumentEntity.makeExisting(
      model._id,
      model.createdAt,
      model.updatedAt,
      model.tenant,
      {
        content: model.content,
        projectId: model.projectId,
        title: model.title,
      },
    );
  }
}

export { DocumentMongoCrudRepository };
