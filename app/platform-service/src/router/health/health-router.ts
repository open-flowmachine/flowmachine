import Elysia from "elysia";

const healthRouter = new Elysia().get("/health", () => ({
  status: "ok",
  version: process.env.APP_VERSION,
  environment: process.env.APP_ENV,
}));

export { healthRouter };
