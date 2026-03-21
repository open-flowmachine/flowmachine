import Elysia from "elysia";
import { betterAuthClient } from "@/vendor/better-auth/better-auth-client";

const authRouter = new Elysia({ name: "auth-router" }).mount(
  betterAuthClient.handler,
);

export { authRouter };
