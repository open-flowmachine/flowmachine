import { expect, test } from "bun:test";

import { decodeTenant, encodeTenant } from "@/shared/tenant/tenant-encoding";

const uuidv7 = "01945f4e-9c8f-7b2a-9c10-3a4b5c6d7e8f";

test("encodeTenant: given an organization tenant, when encoded, then returns 'organization%3A{id}'", () => {
  // given
  const tenant = { id: uuidv7, type: "organization" } as const;

  // when
  const encoded = encodeTenant(tenant);

  // then
  expect(encoded).toBe(`organization%3A${uuidv7}`);
});

test("encodeTenant: given a user tenant, when encoded, then returns 'user%3A{id}'", () => {
  // given
  const tenant = { id: uuidv7, type: "user" } as const;

  // when
  const encoded = encodeTenant(tenant);

  // then
  expect(encoded).toBe(`user%3A${uuidv7}`);
});

test("encodeTenant: given the same tenant encoded twice, when compared, then both strings are identical", () => {
  // given
  const tenant = { id: uuidv7, type: "organization" } as const;

  // when
  const first = encodeTenant(tenant);
  const second = encodeTenant(tenant);

  // then
  expect(first).toBe(second);
});

test("decodeTenant: given an encoded organization tenant, when decoded, then returns the original tenant", () => {
  // given
  const tenant = { id: uuidv7, type: "organization" } as const;
  const encoded = encodeTenant(tenant);

  // when
  const result = decodeTenant(encoded);

  // then
  expect(result.isOk()).toBe(true);
  expect(result._unsafeUnwrap()).toEqual(tenant);
});

test("decodeTenant: given an encoded user tenant, when decoded, then returns the original tenant", () => {
  // given
  const tenant = { id: uuidv7, type: "user" } as const;
  const encoded = encodeTenant(tenant);

  // when
  const result = decodeTenant(encoded);

  // then
  expect(result.isOk()).toBe(true);
  expect(result._unsafeUnwrap()).toEqual(tenant);
});

test("decodeTenant: given an unknown type, when decoded, then returns err", () => {
  // given
  const encoded = encodeURIComponent(`admin:${uuidv7}`);

  // when
  const result = decodeTenant(encoded);

  // then
  expect(result.isErr()).toBe(true);
});

test("decodeTenant: given a non-UUIDv7 id, when decoded, then returns err", () => {
  // given
  const encoded = encodeURIComponent("organization:not-a-uuid");

  // when
  const result = decodeTenant(encoded);

  // then
  expect(result.isErr()).toBe(true);
});

test("decodeTenant: given a string without ':' separator, when decoded, then returns err", () => {
  // given
  const encoded = encodeURIComponent("organization");

  // when
  const result = decodeTenant(encoded);

  // then
  expect(result.isErr()).toBe(true);
});

test("decodeTenant: given malformed percent-encoding, when decoded, then returns err", () => {
  // given
  const encoded = "%ZZ";

  // when
  const result = decodeTenant(encoded);

  // then
  expect(result.isErr()).toBe(true);
});

test("encodeTenant -> decodeTenant: given a tenant, when round-tripped, then returns the original tenant", () => {
  // given
  const tenant = { id: uuidv7, type: "organization" } as const;

  // when
  const result = decodeTenant(encodeTenant(tenant));

  // then
  expect(result.isOk()).toBe(true);
  expect(result._unsafeUnwrap()).toEqual(tenant);
});
