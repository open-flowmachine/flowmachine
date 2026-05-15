import { baseLog } from "@/vendor/pino/pino-log";

const makeHttpLog = (input: {
  requestId: string;
  userId?: string;
  tenantId?: string;
}) => baseLog.child({ kind: "http", ...input });

export { makeHttpLog };
