import { createHmac, timingSafeEqual } from "crypto";

const verifyWebhookSignature = (
  body: string,
  secret: string,
  signatureHeader: string,
): boolean => {
  const [method, signature] = signatureHeader.split("=");
  if (method !== "sha256" || !signature) {
    return false;
  }

  const expected = createHmac("sha256", secret).update(body).digest("hex");

  const expectedBuffer = Buffer.from(expected, "utf-8");
  const receivedBuffer = Buffer.from(signature, "utf-8");
  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
};

export { verifyWebhookSignature };
