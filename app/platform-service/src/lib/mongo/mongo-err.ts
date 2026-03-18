import { Err } from "@/err/err";

const mapMongoError = (error: unknown) => {
  return Err.from(error, { message: "Mongo database error" });
};

export { mapMongoError };
