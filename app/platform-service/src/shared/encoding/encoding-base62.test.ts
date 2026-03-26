import { describe, expect, it } from "bun:test";
import { decodeBase62, encodeBase62 } from "@/shared/encoding/encoding-base62";

describe("encodeBase62", () => {
  it("should encode a JSON string to a URL-safe string", () => {
    const input = '{"id":"019606a0-0000-7000-8000-000000000001","type":"organization"}';

    const result = encodeBase62(input);

    expect(result).not.toContain("{");
    expect(result).not.toContain('"');
    expect(result).toBe(encodeURIComponent(input));
  });

  it("should encode special characters", () => {
    const input = "hello world & foo=bar";

    const result = encodeBase62(input);

    expect(result).not.toContain(" ");
    expect(result).not.toContain("&");
    expect(result).not.toContain("=");
  });
});

describe("decodeBase62", () => {
  it("should decode a URL-encoded string back to the original", () => {
    const original = '{"id":"019606a0-0000-7000-8000-000000000001","type":"organization"}';
    const encoded = encodeBase62(original);

    const result = decodeBase62(encoded);

    expect(result).toBe(original);
  });

  it("should round-trip a tenant JSON object", () => {
    const tenant = { id: "019606a0-0000-7000-8000-000000000001", type: "organization" };
    const json = JSON.stringify(tenant);
    const encoded = encodeBase62(json);

    const decoded = decodeBase62(encoded);
    const parsed = JSON.parse(decoded);

    expect(parsed).toEqual(tenant);
  });

  it("should handle strings with special characters", () => {
    const input = "hello world & foo=bar";
    const encoded = encodeBase62(input);

    const result = decodeBase62(encoded);

    expect(result).toBe(input);
  });
});
