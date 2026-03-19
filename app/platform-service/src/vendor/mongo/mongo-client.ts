import { MongoClient } from "mongodb";

const mongoClient = new MongoClient(process.env.MONGO_DB_URL);

export { mongoClient };
