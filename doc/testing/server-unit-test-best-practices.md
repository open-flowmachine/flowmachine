# TypeScript Unit Testing Best Practices

A framework-agnostic guide to writing reliable, maintainable, and expressive unit tests in any TypeScript project.

---

## 1. Naming Conventions

### Test Files

Mirror the source file name with a `.test.ts` or `.spec.ts` suffix, colocated or in a parallel `__tests__` directory.

```
src/
  utils/
    formatCurrency.ts
    formatCurrency.test.ts
```

### Test Suites and Cases

Use `describe` blocks that name the **unit under test** and `it`/`test` blocks that describe the **expected behavior**, not the implementation.

```typescript
// ✅ Good — reads like a specification
describe("formatCurrency", () => {
  it("returns a USD string with two decimal places for positive numbers", () => { ... });
  it("returns $0.00 when given zero", () => { ... });
  it("throws a RangeError for negative amounts", () => { ... });
});

// ❌ Bad — vague, implementation-focused
describe("tests", () => {
  it("works", () => { ... });
  it("calls toFixed", () => { ... });
});
```

Follow the pattern: **"it [expected behavior] when/given [scenario]"**.

---

## 2. Test Structure — Arrange, Act, Assert

Every test should have three clearly separated phases.

```typescript
it("applies the discount to the subtotal", () => {
  // Arrange
  const cart = new Cart([{ price: 100, qty: 2 }]);
  const coupon = Coupon.percentage(10);

  // Act
  const total = cart.applyDiscount(coupon);

  // Assert
  expect(total).toBe(180);
});
```

Keep each phase short. If arrangement takes more than a few lines, extract a helper or use a factory.

---

## 3. One Logical Assertion per Test

A single test should verify one behavior. Multiple `expect` calls are fine when they assert different facets of the **same outcome**; they should not test separate behaviors.

```typescript
// ✅ Multiple expects, single behavior
it("returns a valid user response", () => {
  const result = createUser("Ada");
  expect(result.id).toBeDefined();
  expect(result.name).toBe("Ada");
  expect(result.createdAt).toBeInstanceOf(Date);
});

// ❌ Two unrelated behaviors crammed into one test
it("creates and deletes a user", () => {
  const user = createUser("Ada");
  expect(user).toBeDefined();
  deleteUser(user.id);
  expect(getUserById(user.id)).toBeNull();
});
```

---

## 4. Leverage TypeScript's Type System

### Prefer typed fakes over `as any`

```typescript
// ❌ Unsafe — hides missing properties, defeats TypeScript
const mockService = { fetch: jest.fn() } as any;

// ✅ Safe — compiler tells you if the interface changes
const mockService: jest.Mocked<DataService> = {
  fetch: jest.fn(),
  save: jest.fn(),
};
```

### Use `satisfies` for inline fixtures

```typescript
const input = {
  email: "ada@example.com",
  role: "admin",
} satisfies CreateUserDTO;
```

This ensures the fixture matches the type at authoring time without widening it.

---

## 5. Factories and Builders over Raw Fixtures

Avoid duplicating object literals across tests. Use factory functions with sensible defaults and selective overrides.

```typescript
function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-1",
    name: "Default Name",
    email: "test@example.com",
    role: "viewer",
    ...overrides,
  };
}

it("grants access when the user is an admin", () => {
  const admin = buildUser({ role: "admin" });
  expect(canAccess(admin, "/settings")).toBe(true);
});
```

This isolates the detail that matters (the `role`) and makes refactoring painless when `User` gains a new required field.

---

## 6. Mocking Guidelines

### Mock at the boundary, not the internals

Mock I/O (network, file system, databases, clocks) and third-party services. Do **not** mock the module you are testing or its pure-logic helpers.

### Keep mocks narrow

Only stub the methods the test exercises. Overly broad mocks hide coupling and make tests pass for the wrong reasons.

### Reset state between tests

```typescript
afterEach(() => {
  jest.restoreAllMocks(); // or vi.restoreAllMocks() in Vitest
});
```

This prevents one test's stubs from leaking into the next.

### Prefer dependency injection over module patching

```typescript
// ✅ Easy to test — inject the dependency
function fetchOrders(client: HttpClient): Promise<Order[]> {
  return client.get("/orders");
}

// Test: pass a fake client, no need to patch modules
const fakeClient: HttpClient = { get: vi.fn().mockResolvedValue([]) };
await fetchOrders(fakeClient);
```

---

## 7. Async Testing

Always `await` asynchronous code or return the promise. An un-awaited assertion silently passes.

```typescript
// ✅ Correct
it("fetches orders", async () => {
  const orders = await fetchOrders();
  expect(orders).toHaveLength(3);
});

// ❌ Dangerous — test resolves before the assertion runs
it("fetches orders", () => {
  fetchOrders().then((orders) => {
    expect(orders).toHaveLength(3);
  });
});
```

For expected rejections:

```typescript
await expect(fetchOrders()).rejects.toThrow("Network error");
```

---

## 8. Testing Error Paths

Verify that your code fails correctly, not just that it works.

```typescript
it("throws when the token is expired", () => {
  const expired = buildToken({ exp: Date.now() - 1000 });
  expect(() => verifyToken(expired)).toThrow(TokenExpiredError);
});

it("returns a 404 result when the item does not exist", async () => {
  const result = await getItem("nonexistent-id");
  expect(result).toEqual({ ok: false, error: "NOT_FOUND" });
});
```

Test both the error **type** and the error **message** or code when the distinction matters to callers.

---

## 9. Test Isolation

Each test must be independent and run in any order.

- Do not rely on tests running sequentially.
- Do not share mutable state between tests. If you must share setup, ensure `beforeEach` resets it.
- Avoid `beforeAll` for anything that mutates state; prefer `beforeEach`.

```typescript
// ❌ Shared mutable state — test B depends on test A's side effect
let counter = 0;
it("increments", () => {
  counter++;
  expect(counter).toBe(1);
});
it("is still one", () => {
  expect(counter).toBe(1);
}); // brittle

// ✅ Isolated
beforeEach(() => {
  counter = 0;
});
```

---

## 10. Parameterized / Data-Driven Tests

When the same logic needs many input/output pairs, use `it.each` (or your framework's equivalent) to reduce boilerplate without sacrificing clarity.

```typescript
it.each([
  { input: 0, expected: "0 B" },
  { input: 1024, expected: "1 KB" },
  { input: 1048576, expected: "1 MB" },
])("formatBytes($input) → $expected", ({ input, expected }) => {
  expect(formatBytes(input)).toBe(expected);
});
```

Keep the data table short enough to read at a glance. If it grows past ~10 entries, consider whether you need property-based testing instead.

---

## 11. Snapshot Testing — Use Sparingly

Snapshots are useful for catching unintended changes in serialized output (component trees, config objects). They become harmful when:

- The snapshot is large and no one reviews the diff.
- Tests auto-update snapshots without understanding the change.
- They replace explicit behavioral assertions.

**Rule of thumb:** If you can write a targeted assertion, prefer it over a snapshot.

---

## 12. Code Coverage — Meaningful, Not Maximal

- Use coverage to discover blind spots, not as a quality metric.
- A line being "covered" does not mean it is tested well.
- Focus coverage efforts on business logic, edge cases, and error handling — not getters, DTOs, or framework boilerplate.
- Set a pragmatic threshold (e.g., 80%) as a floor, not a ceiling to chase.

---

## 13. What to Avoid

### Testing implementation details

If refactoring the internals (without changing behavior) breaks your tests, the tests are too coupled. Test the public API and observable outputs.

### Excessive mocking

If a test has more mocks than real code, it is testing the mock setup, not the production logic. Simplify the design or use integration-level tests.

### Conditional logic in tests

Tests should be linear paths with no `if`, `switch`, `try/catch`, or loops around assertions. Branching belongs in production code, not in tests.

### Non-determinism

Avoid `Math.random()`, `Date.now()`, or any I/O without explicit control (fakes, clocks, seeds). Flaky tests erode trust in the suite faster than no tests at all.

### Using `@ts-ignore` or `as any` to silence type errors

If a test needs a type bypass, it likely means the mock or fixture is incomplete. Fix the type, don't suppress the compiler — it's catching a real problem.

### Testing private methods directly

If a private method is complex enough that you want to test it in isolation, extract it into its own module and test the public interface. Accessing private members in tests couples you to the internal structure.

### Magic values without explanation

```typescript
// ❌ What does 86400 mean?
expect(result.ttl).toBe(86400);

// ✅ Clear intent
const ONE_DAY_IN_SECONDS = 86_400;
expect(result.ttl).toBe(ONE_DAY_IN_SECONDS);
```

---

## 14. Practical Checklist

Before pushing a test, ask:

1. Can I tell what this test verifies from its name alone?
2. Does it break only when the behavior it describes changes?
3. Is it independent of every other test in the suite?
4. Does it run fast (< 100 ms for a unit test)?
5. Would a teammate understand it without reading the source?

If any answer is no, revise the test before moving on.
