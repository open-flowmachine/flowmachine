import { randomUUIDv7 } from "bun";
import Elysia from "elysia";

import { makeHttpLog } from "@/vendor/pino/pino-log-http";

const routerLogger = new Elysia({ name: "router-logger" }).derive(
  { as: "global" },
  ({ headers, set, store }) => {
    const requestId = headers["x-request-id"] ?? randomUUIDv7();

    const tenant = (store as { tenant?: { id: string } }).tenant;
    const userId = (store as { userId?: string }).userId;

    const log = makeHttpLog({
      requestId,
      ...(userId !== undefined && { userId }),
      ...(tenant?.id !== undefined && { tenantId: tenant.id }),
    });

    set.headers["x-request-id"] = requestId;

    return { log, requestId };
  },
);

export { routerLogger };
