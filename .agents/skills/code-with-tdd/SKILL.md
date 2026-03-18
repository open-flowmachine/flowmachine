---
name: code-with-tdd
description: Test-driven development for feature work in codebases. Use when the user asks to start coding, implement a feature, add behavior, or change existing functionality and wants a TDD loop with tests-first, red-green-refactor, and pragmatic test scope selection.
---

# Code With TDD

## Overview

Use a tight red-green-refactor loop to implement features with minimal, high-signal tests and small, safe code changes.

## Workflow

1. Establish the change
2. Locate the entry point and existing behavior
3. Choose the smallest high-signal test
4. Write a failing test (red)
5. Implement the minimal change (green)
6. Refactor with tests passing
7. Expand coverage if risk remains

## Step 1: Establish The Change

- Restate the desired behavior in one sentence.
- Identify the user-facing surface or API contract that must change.
- Note any constraints that affect test choice: performance, existing fixtures, feature flags, or integration boundaries.

If the change is unclear, ask for concrete examples or acceptance criteria before writing tests.

## Step 2: Locate The Entry Point

- Find the primary code path using project conventions and existing tests.
- Prefer the thinnest seam that exercises the behavior without unnecessary integration setup.
- If no tests exist, plan a new test location that matches repository patterns.

## Step 3: Choose The Smallest High-Signal Test

Pick a test that fails for the right reason and is cheap to run.

Heuristics:

- Prefer unit tests for pure logic.
- Prefer integration tests when multiple modules must cooperate.
- Prefer UI tests only when the behavior cannot be validated lower in the stack.

When unsure, select the lowest layer that still validates the change.

## Step 4: Write The Failing Test (Red)

- Name the test with the intended behavior.
- Construct minimal inputs.
- Assert only the behavior you intend to change.
- Run the test to ensure it fails for the expected reason.

If the test passes, tighten assertions or adjust the setup so it truly proves the absence of the feature.

## Step 5: Implement The Minimal Change (Green)

- Implement only enough code to make the test pass.
- Avoid unrelated refactors.
- Re-run the test suite or the narrowest subset that proves the change.

## Step 6: Refactor

- Remove duplication, clarify names, and simplify control flow.
- Keep behavior identical; tests must remain green.
- If refactor is risky, split into smaller steps with intermediate tests.

## Step 7: Expand Coverage If Risk Remains

Add tests only when:

- Edge cases are likely or high impact.
- Regression risk is high.
- You touched a fragile or ambiguous area.

Otherwise, keep scope tight to preserve momentum.

## Decision Guide

If the user asks for feature work and no tests exist:

- Create the smallest test harness in the closest layer to the change.
- Prefer adding one stable test over multiple brittle tests.

If the user asks for a refactor:

- Convert to characterization tests first.
- Proceed with the refactor after tests capture current behavior.

If the user asks for bug fixes:

- Reproduce with a failing test that captures the bug.
- Fix only after the failing test proves the bug exists.

## References

- Use `references/tdd-playbook.md` for concrete templates and examples.
