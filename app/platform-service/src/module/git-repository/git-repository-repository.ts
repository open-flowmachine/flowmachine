import type { Document, WithId } from "mongodb";
import { err, ok } from "neverthrow";
import type { GitRepository } from "@/module/git-repository/git-repository-model";
import type { Id } from "@/shared/model/model-id";
import type { Tenant } from "@/shared/model/model-tenant";
import { mongoClient } from "@/vendor/mongo/mongo-client";
import { mapMongoError } from "@/vendor/mongo/mongo-err";
import { makeTenantAwareMongoRepository } from "@/vendor/mongo/mongo-repository";

const gitRepositoryRepository = makeTenantAwareMongoRepository<GitRepository>({
  collectionName: "git-repository",
});

const mapFromDoc = (doc: WithId<Document>): GitRepository => {
  const { _id, ...rest } = doc;
  return { id: _id, ...rest } as unknown as GitRepository;
};

const findManyByFilter = async (input: {
  ctx: { tenant: Tenant };
  filter?: { projectId: Id };
}) => {
  try {
    const { ctx, filter } = input;

    const collection = mongoClient
      .db(process.env.MONGO_DB_NAME)
      .collection("git-repository");

    const query: Record<string, unknown> = { _tenant: ctx.tenant };
    if (filter?.projectId) {
      query["projects.id"] = filter.projectId;
    }

    const docs = await collection.find(query).toArray();
    const data = docs.map(mapFromDoc);

    return ok({ data });
  } catch (error) {
    return err(mapMongoError(error));
  }
};

export { gitRepositoryRepository, findManyByFilter };
