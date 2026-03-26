const BASE62_CHARS =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

const decodeBase62 = (encoded: string): string => {
  let num = 0n;
  for (const ch of encoded) {
    const idx = BASE62_CHARS.indexOf(ch);
    if (idx === -1) {
      throw new Error(`Invalid base62 character: ${ch}`);
    }
    num = num * 62n + BigInt(idx);
  }

  const hex = num.toString(16);
  const paddedHex = hex.length % 2 ? "0" + hex : hex;
  const bytes = new Uint8Array(paddedHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(paddedHex.slice(i * 2, i * 2 + 2), 16);
  }

  return new TextDecoder().decode(bytes);
};

export { decodeBase62 };
