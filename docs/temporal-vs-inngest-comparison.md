# Temporal.io vs Inngest — Comparison for Flow Machine

## Context

Flow Machine is an AI Software Engineer platform that orchestrates AI-driven engineers to pick up tasks from team backlogs. The core workflow is an SDLC pipeline (Research → Plan → Code) where end-users define custom workflow definitions (actions + edges as a DAG) stored in MongoDB. The project currently uses **Inngest v3.49.3** + **@inngest/workflow-kit v0.1.3**, but the integration is early-stage with empty action handlers — making now the ideal time to evaluate alternatives.

---

## 1. Architecture & Philosophy

| | **Temporal.io** | **Inngest** |
|---|---|---|
| **Model** | Server-based orchestration. Requires a Temporal Cluster (server + DB + optional Elasticsearch) | Event-driven, serverless-first. Lightweight dev server, cloud or self-hosted |
| **Core abstraction** | Workflows (deterministic) + Activities (side effects) + Workers (long-lived processes) | Durable Functions with Steps (individually retriable blocks) triggered by Events |
| **State management** | Event History — append-only log replayed on recovery | Automatic state capture at each step boundary |
| **Execution model** | Workers poll the Temporal server for tasks | Inngest server pushes work to your HTTP endpoint (`/api/inngest`) |
| **Determinism** | **Required** — workflow code runs in a sandboxed VM. No `Date.now()`, `Math.random()`, or I/O in workflows | **Not required** — each step is a normal function. No sandbox, no replay |

**Key takeaway:** Temporal gives you a replay-based distributed state machine with strong correctness guarantees. Inngest gives you a simpler step-function model where each step is an independent HTTP invocation with automatic retries.

---

## 2. Developer Experience & Learning Curve

### Temporal

- **Steep learning curve**: Must understand determinism constraints, the replay model, workflow sandbox, activity heartbeats, signals, queries, versioning
- **Debugging**: Replay-based — you inspect Event History in the Temporal Web UI. Non-intuitive at first
- **TypeScript SDK**: Mature but uses Node.js-specific internals (`worker_threads`, `vm` module, Node-API native modules)
- **Testing**: Provides a test framework with time-skipping for workflow tests

### Inngest

- **Low learning curve**: Write normal async functions, wrap steps in `step.run()`. No determinism rules
- **Debugging**: Native language debugging — set breakpoints, use `console.log`, standard tooling
- **TypeScript SDK**: Works with any runtime (Bun, Deno, Node, serverless). No native modules required
- **Testing**: Inngest Dev Server provides local execution with event replay and visual function traces

**Key takeaway:** Inngest is significantly easier to adopt and debug. Temporal's power comes at the cost of conceptual overhead.

---

## 3. Infrastructure & Operational Complexity

### Temporal

- **Self-hosted**: Temporal Server + PostgreSQL/MySQL/Cassandra + Elasticsearch (optional for visibility). This is a significant operational burden
- **Temporal Cloud**: Managed option, but adds cost and vendor dependency
- **Local dev**: `temporalite` or Docker Compose with multiple services
- **Workers**: Must run long-lived worker processes that poll the Temporal server

### Inngest

- **Self-hosted**: Single Go binary or Docker image. Minimal dependencies
- **Inngest Cloud**: Managed option available
- **Local dev**: `npx inngest-cli@latest dev` or Docker container (already in project's `docker-compose.yml`)
- **No workers needed**: Your existing HTTP server (Elysia) serves as the execution target

**Key takeaway:** Flow Machine currently runs with Docker Compose (MongoDB + Inngest). Adding Temporal would require Temporal Server + its own database — a significant infrastructure increase. Inngest fits the current lightweight setup.

---

## 4. Bun Runtime Compatibility (Critical)

### Temporal

- **Client (`@temporalio/client`)**: Reported to work on Bun
- **Worker (`@temporalio/worker`)**: **NOT supported on Bun**. Uses Node-API native modules, `worker_threads`, and `vm` — all Node.js-specific. Users report Rust crashes when attempting to run workers on Bun ([GitHub Issue #1334](https://github.com/temporalio/sdk-typescript/issues/1334), [Issue #1618](https://github.com/temporalio/sdk-typescript/issues/1618))
- **Temporal officially states**: "We strongly discourage running Temporal Workers in anything except authentic Node.js at this time"
- **Impact**: Flow Machine would need to either (a) abandon Bun for the worker process, or (b) run a separate Node.js worker alongside the Bun-based Elysia server

### Inngest

- **Full Bun compatibility**: Uses standard HTTP — your Elysia server handles execution via the `/api/inngest` endpoint. No native modules, no `worker_threads`
- **Already working**: The project's current integration uses `inngest/bun` adapter with Elysia

**Key takeaway:** Temporal is incompatible with the project's Bun runtime for worker execution. This is a **blocker** unless the team is willing to run a separate Node.js process for workers.

---

## 5. User-Defined Workflows (Critical for Flow Machine)

This is arguably the most important differentiator for this specific project.

### Temporal

- **No built-in user-defined workflow support**. You would need to build:
  - A custom DAG engine that interprets workflow definitions from MongoDB
  - A custom React-based visual workflow editor
  - Translation layer from user-defined DAGs to Temporal workflow execution
- This is substantial custom engineering work

### Inngest

- **@inngest/workflow-kit** provides exactly this out of the box:
  - **Backend Engine**: `Engine` class that accepts action definitions + a `loader` function for dynamic workflow retrieval from MongoDB. Executes DAGs as durable Inngest steps
  - **Frontend Components**: Pre-built React components (`Provider`, `Editor`, `Sidebar`) built on React Flow for visual workflow editing
  - **Already integrated**: Flow Machine's `InngestWorkflowEngineFactory` uses the Engine with a MongoDB loader. The plumbing is done

**Key takeaway:** Inngest's workflow-kit is purpose-built for Flow Machine's use case. Replicating this with Temporal would require significant custom development with no clear benefit.

---

## 6. Fit for AI/Agentic Workflows

Both platforms support long-running, multi-step AI workflows. The differences are nuanced:

### Temporal strengths for AI

- Child workflows for complex agent hierarchies
- Signals for human-in-the-loop approvals mid-workflow
- Extremely strong durability guarantees (years-long workflows)
- Versioning for deploying updated workflow logic alongside running executions

### Inngest strengths for AI

- `step.run()` wraps each AI call (LLM, tool use) as a retriable step
- `step.waitForEvent()` for human-in-the-loop patterns
- `step.sleep()` / `step.sleepUntil()` for timed waits
- Flow control (rate limiting, concurrency) to manage API quotas
- Simpler model — each LLM call is just a step, no determinism concerns

**Key takeaway:** Both are capable for AI workflows. Temporal's additional primitives (signals, child workflows, versioning) are powerful but may be over-engineering for the current SDLC workflow pattern. Inngest's simpler model is sufficient and more aligned with the project's current architecture.

---

## 7. Clean Architecture Alignment

### Current Problem

The core layer leaks Inngest types, violating clean architecture:

```
core/infra/durable-function/type.ts    → export type DurableFunction = InngestFunction.Any
core/infra/durable-function/factory.ts → imports Handler, Inngest from "inngest"
core/infra/workflow/engine/type.ts     → export type WorkflowEngine = Engine (from @inngest/workflow-kit)
```

### Recommendation (regardless of library choice)

Fix the abstraction leak by defining framework-agnostic interfaces in the core layer:

- **`DurableFunction`** should be a generic type (e.g., `{ id: string; trigger: string; handler: (...args: unknown[]) => Promise<void> }`)
- **`DurableFunctionFactory.make()`** should accept framework-agnostic input (no `Handler<Inngest.Any>`)
- **`WorkflowEngine`** should be a project-defined interface (e.g., `{ run(payload: unknown): Promise<void> }`)

The Inngest-specific types stay in `infra/inngest/` where they belong. This makes swapping implementations possible without touching the core layer.

**Key takeaway:** This is an independent concern. The abstraction should be fixed regardless of which library is chosen. However, since Inngest is staying, the fix is straightforward — define thin interfaces in core and keep Inngest types in the infra layer.

---

## 8. Recommendation: Stay with Inngest

**Inngest is the clear choice for Flow Machine.** Here's why, ranked by importance:

### Decisive factors

1. **User-defined workflows**: `@inngest/workflow-kit` provides the exact DAG engine + visual editor that Flow Machine needs. Temporal has no equivalent — you'd build this from scratch
2. **Bun compatibility**: Temporal workers cannot run on Bun (known crashes, officially unsupported). Inngest works natively with Bun via HTTP
3. **Infrastructure simplicity**: Inngest requires no additional infrastructure. Temporal requires a cluster + database

### Supporting factors

4. **Already integrated**: The Inngest plumbing (client, function factory, engine factory, HTTP router, DI wiring) is already in place
5. **Developer experience**: Lower learning curve, native debugging, no determinism constraints
6. **Sufficient for the use case**: The SDLC workflow (Research → Plan → Code) doesn't require Temporal's advanced primitives like child workflows or signals

### When Temporal would be the better choice

- If you needed extremely complex workflow hierarchies with nested child workflows
- If you needed workflow versioning for zero-downtime deployment of long-running (weeks/months) workflows
- If you were running on Node.js and needed the strongest possible durability guarantees
- If you didn't need user-defined workflows

---

## 9. Proposed Action Items

1. **Fix the clean architecture violation** — Define framework-agnostic interfaces in `core/infra/` and move Inngest-specific types to `infra/inngest/`
2. **Implement the SDLC action handlers** — The Research, Plan, and Code handlers are currently empty stubs
3. **Wire up event triggering** — No code currently sends the `sdlc-workflow.init` event
4. **Integrate @inngest/workflow-kit React components** into the Next.js frontend for the visual workflow editor

### Files to modify for clean architecture fix

- `app/service/src/core/infra/durable-function/type.ts` — Replace Inngest type alias with generic interface
- `app/service/src/core/infra/durable-function/factory.ts` — Remove Inngest imports, use generic handler type
- `app/service/src/core/infra/workflow/engine/type.ts` — Replace Engine alias with generic interface
- `app/service/src/infra/inngest/function-factory.ts` — Adapt to new generic interface
- `app/service/src/infra/inngest/workflow/engine-factory.ts` — Adapt to new generic interface

---

## Sources

- [Inngest vs Temporal comparison (Akka.io)](https://akka.io/blog/inngest-vs-temporal)
- [Inngest's own comparison page](https://www.inngest.com/compare-to-temporal)
- [Temporal TypeScript SDK docs](https://docs.temporal.io/develop/typescript)
- [Temporal Bun issue #1334](https://github.com/temporalio/sdk-typescript/issues/1334)
- [Temporal Bun issue #1618](https://github.com/temporalio/sdk-typescript/issues/1618)
- [Inngest workflow-kit GitHub](https://github.com/inngest/workflow-kit)
- [Inngest workflow-kit docs](https://www.inngest.com/docs/reference/workflow-kit)
- [TypeScript orchestration guide (Medium)](https://medium.com/@matthieumordrel/the-ultimate-guide-to-typescript-orchestration-temporal-vs-trigger-dev-vs-inngest-and-beyond-29e1147c8f2d)
