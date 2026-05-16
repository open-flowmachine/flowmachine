import { randomUUIDv7 } from "bun";
import Elysia from "elysia";

const routerRequestIdSetup = (app: Elysia) =>
  app.derive(({ headers, set }) => {
    const requestId = headers["x-request-id"] ?? randomUUIDv7();
    set.headers["x-request-id"] = requestId;
    return { requestId };
  });

export { routerRequestIdSetup };
