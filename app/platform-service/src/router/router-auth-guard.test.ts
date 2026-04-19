import { expect, mock, test } from "bun:test";
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

test("routerAuthGuard: given no activeOrganizationId, when session resolves, then tenant is the user", async () => {
  // given
  mockGetSession.mockResolvedValue({
    session: { userId: USER_ID, activeOrganizationId: null },
    user: { id: USER_ID },
  });

  // when
  const app = makeTestApp();
  const response = await app
    .handle(new Request("http://localhost/test"))
    .then((r) => r.json());

  // then
  expect(response).toEqual({
    tenant: { id: USER_ID, type: "user" },
  });
});

test("routerAuthGuard: given an activeOrganizationId, when session resolves, then tenant is the organization", async () => {
  // given
  mockGetSession.mockResolvedValue({
    session: { userId: USER_ID, activeOrganizationId: ORG_ID },
    user: { id: USER_ID },
  });

  // when
  const app = makeTestApp();
  const response = await app
    .handle(new Request("http://localhost/test"))
    .then((r) => r.json());

  // then
  expect(response).toEqual({
    tenant: { id: ORG_ID, type: "organization" },
  });
});

test("routerAuthGuard: given a null session, when request is handled, then response is not 200", async () => {
  // given
  mockGetSession.mockResolvedValue(null);

  // when
  const app = makeTestApp();
  const response = await app.handle(new Request("http://localhost/test"));

  // then
  expect(response.status).not.toBe(200);
});

test("routerAuthGuard: given getSession throws, when request is handled, then response is not 200", async () => {
  // given
  mockGetSession.mockRejectedValue(new Error("Auth service error"));

  // when
  const app = makeTestApp();
  const response = await app.handle(new Request("http://localhost/test"));

  // then
  expect(response.status).not.toBe(200);
});
