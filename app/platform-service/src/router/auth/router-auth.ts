import Elysia from "elysia";

import { routerUnprotectedSetup } from "@/router/router-plugin";
import { betterAuthClient } from "@/vendor/better-auth/better-auth-client";

const authRouter = new Elysia({ name: "auth-router" })
  .use(routerUnprotectedSetup)
  .mount(betterAuthClient.handler);

export { authRouter };
