import type { ClientSession, Document } from "mongodb";

import type { Id } from "@/shared/model/model-id";

type MongoCtx = { session?: ClientSession | undefined };
type MongoDoc = Document & { _id: Id };

export type { MongoCtx, MongoDoc };
