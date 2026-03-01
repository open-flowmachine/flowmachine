import type { MongoClient } from "mongodb";
import { err, ok } from "neverthrow";
import type z from "zod";
import { Err } from "@/common/err/err";
import type {
  WorkflowDefinitionCrudRepository,
  workflowDefinitionCrudRepositoryInputSchema,
} from "@/core/domain/workflow/definition/crud-repository";
import { WorkflowDefinitionEntity } from "@/core/domain/workflow/definition/entity";
import type { ConfigService } from "@/core/infra/config/service";
import { tenantAwareCollectionIndexes } from "@/infra/mongo/constant";
import { tenantAwareEntityToMongoModel } from "@/infra/mongo/model";
import type { WorkflowDefinitionMongoModel } from "@/infra/mongo/workflow/definition/model";

class WorkflowDefinitionMongoCrudRepository implements WorkflowDefinitionCrudRepository {
  #configService: ConfigService;
  #mongoClient: MongoClient;

  constructor(configService: ConfigService, mongoClient: MongoClient) {
    this.#configService = configService;
    this.#mongoClient = mongoClient;
  }

  async findMany(
    input: z.infer<typeof workflowDefinitionCrudRepositoryInputSchema.findMany>,
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
    input: z.infer<typeof workflowDefinitionCrudRepositoryInputSchema.findOne>,
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
    input: z.infer<typeof workflowDefinitionCrudRepositoryInputSchema.insert>,
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
    input: z.infer<typeof workflowDefinitionCrudRepositoryInputSchema.update>,
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
    input: z.infer<typeof workflowDefinitionCrudRepositoryInputSchema.delete>,
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
      .collection<WorkflowDefinitionMongoModel>("workflow-definition");
    await collection.createIndexes(tenantAwareCollectionIndexes);
    return collection;
  }

  #toDomain(model: WorkflowDefinitionMongoModel) {
    return WorkflowDefinitionEntity.makeExisting(
      model._id,
      model.createdAt,
      model.updatedAt,
      model.tenant,
      {
        name: model.name,
        description: model.description,
        projects: model.projects,
        actions: model.actions,
        edges: model.edges,
        isActive: model.isActive,
      },
    );
  }
}

export { WorkflowDefinitionMongoCrudRepository };
