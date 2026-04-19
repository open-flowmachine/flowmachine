---
paths:
  - "app/**/*.test.ts"
---

# Unit Testing

- Use `test` with a flat hierarchy (no nested `describe`).
- Name: `{function}: given ..., when ..., then ...`.
- Structure the body as given-when-then.
- One behaviour per `test`.
- Mock external dependencies.

```ts
test("parseAmount: given a valid decimal string, when parsed, then returns the number", () => {
  // given
  const raw = "12.34";

  // when
  const result = parseAmount(raw);

  // then
  expect(result).toBe(12.34);
});
```
