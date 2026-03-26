const encodeBase62 = (input: string): string => {
  return encodeURIComponent(input);
};

const decodeBase62 = (encoded: string): string => {
  return decodeURIComponent(encoded);
};

export { decodeBase62, encodeBase62 };
