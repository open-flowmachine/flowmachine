---
paths:
  - "**/*.ts"
  - "**/*.tsx"
---

# TypeScript

- Always use braces for `if`, `else if`, and `else`. No single-line / brace-less forms.

```ts
// good
if (isAdmin) {
  return true;
}

// bad
if (isAdmin) return true;
```

- Avoid `else`. Prefer early returns (guard clauses) so the happy path stays unindented.

```ts
// good
if (!user) {
  return null;
}
return user.name;

// bad
if (!user) {
  return null;
} else {
  return user.name;
}
```

- Avoid nested `if`. Flatten with early returns or by combining conditions.

```ts
// good
if (!user) {
  return null;
}
if (!user.isActive) {
  return null;
}
return user.name;

// bad
if (user) {
  if (user.isActive) {
    return user.name;
  }
}
```
