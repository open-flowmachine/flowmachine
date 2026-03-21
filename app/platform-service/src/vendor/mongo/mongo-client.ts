import { MongoClient } from "mongodb";
import { getEnv } from "@/vendor/env/env";

const mongoClient = new MongoClient(getEnv().MONGO_DB_URL);

export { mongoClient };
