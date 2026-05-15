import { baseLog } from "@/vendor/pino/pino-log";

const makeInngestLog = (input: {
  runId: string;
  eventName: string;
  attempt: number;
}) => baseLog.child({ kind: "inngest", ...input });

export { makeInngestLog };
