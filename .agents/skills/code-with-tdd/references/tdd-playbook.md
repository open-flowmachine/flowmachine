# TDD Playbook

## Quick Start Template

Use this as a minimal checklist when the user says "start coding" or "implement this feature":

1. Identify the primary behavior change.
1. Find the smallest seam that can validate it.
1. Write the red test for that behavior.
1. Make it pass with the smallest change.
1. Refactor if needed.

## Test Selection Heuristics

- Choose the lowest layer that still proves the requirement.
- Prefer deterministic inputs and outputs.
- Avoid tests that depend on network or time unless the feature is inherently time-based.

## Red-Green-Refactor Checklist

Red:
- Test name describes the behavior.
- Fails for the expected reason.
- Minimal setup.

Green:
- Smallest code change.
- No extra features.
- Rerun the test subset.

Refactor:
- Clean names and structure.
- Keep behavior unchanged.
- Keep tests green.

## Sample Prompts That Should Trigger This Skill

- "Start coding this feature using tests first."
- "Implement this feature using TDD."
- "Add behavior with a red-green-refactor loop."
- "Fix this bug with a failing test first."

## Common Pitfalls

- Writing multiple tests before seeing a red failure.
- Testing too high in the stack when a lower layer would work.
- Overfitting tests to implementation details.
- Refactoring without a safety net.
