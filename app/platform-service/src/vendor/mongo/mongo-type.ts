import type { ClientSession } from "mongodb";

type MongoCtx = { session?: ClientSession | undefined };

export type { MongoCtx };
