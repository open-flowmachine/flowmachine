import type { MongoClient } from "mongodb";
import { err, ok } from "neverthrow";
import type z from "zod";
import { Err } from "@/common/err/err";
import type {
  CredentialCrudRepository,
  credentialCrudRepositoryInputSchema,
} from "@/core/domain/credential/crud-repository";
import type { CredentialEntityProps } from "@/core/domain/credential/entity";
import { CredentialEntity } from "@/core/domain/credential/entity";
import type { ConfigService } from "@/core/infra/config/service";
import type { LoggerService } from "@/core/infra/logger/service";
import { tenantAwareCollectionIndexes } from "@/infra/mongo/constant";
import type { CredentialMongoModel } from "@/infra/mongo/credential/model";
import { tenantAwareEntityToMongoModel } from "@/infra/mongo/model";

class CredentialMongoCrudRepository implements CredentialCrudRepository {
  #configService: ConfigService;
  #mongoClient: MongoClient;
  #logger: LoggerService;

  constructor(
    configService: ConfigService,
    mongoClient: MongoClient,
    logger: LoggerService,
  ) {
    this.#configService = configService;
    this.#mongoClient = mongoClient;
    this.#logger = logger;
  }

  async findMany(
    input: z.infer<typeof credentialCrudRepositoryInputSchema.findMany>,
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
    input: z.infer<typeof credentialCrudRepositoryInputSchema.findOne>,
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
    input: z.infer<typeof credentialCrudRepositoryInputSchema.insert>,
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
    input: z.infer<typeof credentialCrudRepositoryInputSchema.update>,
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
    input: z.infer<typeof credentialCrudRepositoryInputSchema.delete>,
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
      .collection<CredentialMongoModel>("credential");
    await collection.createIndexes(tenantAwareCollectionIndexes);
    return collection;
  }

  #toDomain(model: CredentialMongoModel) {
    const props: CredentialEntityProps =
      model.type === "apiKey"
        ? {
            type: "apiKey",
            name: model.name,
            apiKey: model.apiKey,
            expiredAt: model.expiredAt,
          }
        : {
            type: "basic",
            name: model.name,
            username: model.username,
            password: model.password,
            expiredAt: model.expiredAt,
          };

    return CredentialEntity.makeExisting(
      model._id,
      model.createdAt,
      model.updatedAt,
      model.tenant,
      props,
    );
  }
}

export { CredentialMongoCrudRepository };
