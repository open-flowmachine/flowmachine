import { describe, expect, it, mock } from "bun:test";
import Elysia from "elysia";
import type { Id } from "@/shared/model/model-id";

const USER_ID = "019606a0-0000-7000-8000-000000000001" as Id;
const ORG_ID = "019606a0-0000-7000-8000-000000000002" as Id;

const mockGetSession = mock();

mock.module("@/vendor/better-auth/better-auth-client", () => ({
  betterAuthClient: {
    api: {
      getSession: mockGetSession,
    },
  },
}));

const { routerAuthGuard } = await import("@/router/router-auth-guard");

const makeTestApp = () =>
  new Elysia().use(routerAuthGuard).get("/test", ({ tenant }) => ({ tenant }));

describe("routerAuthGuard", () => {
  it("should resolve tenant as user when no activeOrganizationId", async () => {
    mockGetSession.mockResolvedValue({
      session: { userId: USER_ID, activeOrganizationId: null },
      user: { id: USER_ID },
    });

    const app = makeTestApp();
    const response = await app
      .handle(new Request("http://localhost/test"))
      .then((r) => r.json());

    expect(response).toEqual({
      tenant: { id: USER_ID, type: "user" },
    });
  });

  it("should resolve tenant as organization when activeOrganizationId exists", async () => {
    mockGetSession.mockResolvedValue({
      session: { userId: USER_ID, activeOrganizationId: ORG_ID },
      user: { id: USER_ID },
    });

    const app = makeTestApp();
    const response = await app
      .handle(new Request("http://localhost/test"))
      .then((r) => r.json());

    expect(response).toEqual({
      tenant: { id: ORG_ID, type: "organization" },
    });
  });

  it("should throw when session is null", async () => {
    mockGetSession.mockResolvedValue(null);

    const app = makeTestApp();
    const response = await app.handle(new Request("http://localhost/test"));

    expect(response.status).not.toBe(200);
  });

  it("should throw when getSession throws", async () => {
    mockGetSession.mockRejectedValue(new Error("Auth service error"));

    const app = makeTestApp();
    const response = await app.handle(new Request("http://localhost/test"));

    expect(response.status).not.toBe(200);
  });
});
