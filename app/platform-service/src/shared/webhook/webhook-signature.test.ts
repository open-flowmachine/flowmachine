import { describe, expect, it } from "bun:test";
import { createHmac } from "crypto";

import { verifyWebhookSignature } from "@/shared/webhook/webhook-signature";

describe("verifyWebhookSignature", () => {
  const secret = "It's a Secret to Everybody";
  const body = "Hello World!";
  const validSignature =
    "sha256=a4771c39fbe90f317c7824e83ddef3caae9cb3d976c214ace1f2937e133263c9";

  it("should return true for a valid signature", () => {
    const result = verifyWebhookSignature(body, secret, validSignature);

    expect(result).toBe(true);
  });

  it("should return false for an invalid signature", () => {
    const result = verifyWebhookSignature(
      body,
      secret,
      "sha256=0000000000000000000000000000000000000000000000000000000000000000",
    );

    expect(result).toBe(false);
  });

  it("should return false for a wrong secret", () => {
    const result = verifyWebhookSignature(body, "wrong-secret", validSignature);

    expect(result).toBe(false);
  });

  it("should return false for a tampered body", () => {
    const result = verifyWebhookSignature(
      "Tampered Body",
      secret,
      validSignature,
    );

    expect(result).toBe(false);
  });

  it("should return false when method is not sha256", () => {
    const result = verifyWebhookSignature(
      body,
      secret,
      "sha1=a4771c39fbe90f317c7824e83ddef3caae9cb3d976c214ace1f2937e133263c9",
    );

    expect(result).toBe(false);
  });

  it("should return false when signature header has no method prefix", () => {
    const result = verifyWebhookSignature(
      body,
      secret,
      "a4771c39fbe90f317c7824e83ddef3caae9cb3d976c214ace1f2937e133263c9",
    );

    expect(result).toBe(false);
  });

  it("should return false when signature length does not match", () => {
    const result = verifyWebhookSignature(body, secret, "sha256=abcd");

    expect(result).toBe(false);
  });

  it("should compute correct HMAC for a JSON payload", () => {
    const jsonBody =
      '{"webhookEvent":"jira:issue_updated","issue":{"key":"PROJ-1"}}';
    const hmac = createHmac("sha256", secret).update(jsonBody).digest("hex");
    const signature = `sha256=${hmac}`;

    const result = verifyWebhookSignature(jsonBody, secret, signature);

    expect(result).toBe(true);
  });
});
