import type { MongoClient } from "mongodb";
import { err, ok } from "neverthrow";
import type z from "zod";
import { Err } from "@/common/err/err";
import type {
  ProjectIssueFieldDefinitionCrudRepository,
  projectIssueFieldDefinitionCrudRepositoryInputSchema,
} from "@/core/domain/project/issue/field/definition/crud-repository";
import { ProjectIssueFieldDefinitionEntity } from "@/core/domain/project/issue/field/definition/entity";
import type { ConfigService } from "@/core/infra/config/service";
import { tenantAwareCollectionIndexes } from "@/infra/mongo/constant";
import { tenantAwareEntityToMongoModel } from "@/infra/mongo/model";
import type { ProjectIssueFieldDefinitionMongoModel } from "@/infra/mongo/project/issue/field/definition/model";

class ProjectIssueFieldDefinitionMongoCrudRepository implements ProjectIssueFieldDefinitionCrudRepository {
  #configService: ConfigService;
  #mongoClient: MongoClient;

  constructor(configService: ConfigService, mongoClient: MongoClient) {
    this.#configService = configService;
    this.#mongoClient = mongoClient;
  }

  async findMany(
    input: z.infer<
      typeof projectIssueFieldDefinitionCrudRepositoryInputSchema.findMany
    >,
  ) {
    const { ctx } = input;

    try {
      const collection = await this.#getCollection();
      const query: Record<string, unknown> = { tenant: ctx.tenant };
      if (input.filter?.projectId) {
        query["project.id"] = input.filter.projectId;
      }
      if (input.filter?.name) {
        query["name"] = input.filter.name;
      }
      const result = await collection
        .find(query, { session: ctx.mongoClientSession })
        .toArray();
      return ok(result.map(this.#toDomain));
    } catch (error) {
      return err(Err.from(error));
    }
  }

  async findOne(
    input: z.infer<
      typeof projectIssueFieldDefinitionCrudRepositoryInputSchema.findOne
    >,
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
    input: z.infer<
      typeof projectIssueFieldDefinitionCrudRepositoryInputSchema.insert
    >,
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
    input: z.infer<
      typeof projectIssueFieldDefinitionCrudRepositoryInputSchema.update
    >,
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
    input: z.infer<
      typeof projectIssueFieldDefinitionCrudRepositoryInputSchema.delete
    >,
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
      .collection<ProjectIssueFieldDefinitionMongoModel>(
        "project-issue-field-definition",
      );
    await collection.createIndexes(tenantAwareCollectionIndexes);
    return collection;
  }

  #toDomain(model: ProjectIssueFieldDefinitionMongoModel) {
    return ProjectIssueFieldDefinitionEntity.makeExisting(
      model._id,
      model.createdAt,
      model.updatedAt,
      model.tenant,
      {
        type: model.type,
        name: model.name,
        options: model.options,
        integration: model.integration,
        project: model.project,
      } as ProjectIssueFieldDefinitionEntity["props"],
    );
  }
}

export { ProjectIssueFieldDefinitionMongoCrudRepository };
