import { expect, test } from "bun:test";
import { createHmac } from "crypto";

import { verifyWebhookSignature } from "@/shared/webhook/webhook-signature";

const secret = "It's a Secret to Everybody";
const body = "Hello World!";
const validSignature =
  "sha256=a4771c39fbe90f317c7824e83ddef3caae9cb3d976c214ace1f2937e133263c9";

test("verifyWebhookSignature: given a valid signature, when verified, then returns true", () => {
  // given

  // when
  const result = verifyWebhookSignature(body, secret, validSignature);

  // then
  expect(result).toBe(true);
});

test("verifyWebhookSignature: given an invalid signature, when verified, then returns false", () => {
  // given
  const invalidSignature =
    "sha256=0000000000000000000000000000000000000000000000000000000000000000";

  // when
  const result = verifyWebhookSignature(body, secret, invalidSignature);

  // then
  expect(result).toBe(false);
});

test("verifyWebhookSignature: given a wrong secret, when verified, then returns false", () => {
  // given

  // when
  const result = verifyWebhookSignature(body, "wrong-secret", validSignature);

  // then
  expect(result).toBe(false);
});

test("verifyWebhookSignature: given a tampered body, when verified, then returns false", () => {
  // given

  // when
  const result = verifyWebhookSignature(
    "Tampered Body",
    secret,
    validSignature,
  );

  // then
  expect(result).toBe(false);
});

test("verifyWebhookSignature: given a non-sha256 method prefix, when verified, then returns false", () => {
  // given
  const sha1Signature =
    "sha1=a4771c39fbe90f317c7824e83ddef3caae9cb3d976c214ace1f2937e133263c9";

  // when
  const result = verifyWebhookSignature(body, secret, sha1Signature);

  // then
  expect(result).toBe(false);
});

test("verifyWebhookSignature: given a signature with no method prefix, when verified, then returns false", () => {
  // given
  const noPrefix =
    "a4771c39fbe90f317c7824e83ddef3caae9cb3d976c214ace1f2937e133263c9";

  // when
  const result = verifyWebhookSignature(body, secret, noPrefix);

  // then
  expect(result).toBe(false);
});

test("verifyWebhookSignature: given a signature with wrong length, when verified, then returns false", () => {
  // given
  const shortSignature = "sha256=abcd";

  // when
  const result = verifyWebhookSignature(body, secret, shortSignature);

  // then
  expect(result).toBe(false);
});

test("verifyWebhookSignature: given a JSON payload with computed HMAC, when verified, then returns true", () => {
  // given
  const jsonBody =
    '{"webhookEvent":"jira:issue_updated","issue":{"key":"PROJ-1"}}';
  const hmac = createHmac("sha256", secret).update(jsonBody).digest("hex");
  const signature = `sha256=${hmac}`;

  // when
  const result = verifyWebhookSignature(jsonBody, secret, signature);

  // then
  expect(result).toBe(true);
});
