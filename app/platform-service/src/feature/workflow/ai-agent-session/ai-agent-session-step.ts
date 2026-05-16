import type { Sandbox } from "@daytonaio/sdk";

import { UTCDate } from "@date-fns/utc";
import { sub } from "date-fns";
import { camelCase } from "es-toolkit";

import type { AiAgentRunMessage } from "@/module/ai-agent-run-message/ai-agent-run-message-model";
import type { AiAgentRun } from "@/module/ai-agent-run/ai-agent-run-model";

import { makeAiAgentRunMessageService } from "@/module/ai-agent-run-message/ai-agent-run-message-service";
import { makeAiAgentRunService } from "@/module/ai-agent-run/ai-agent-run-service";
import { makeAiAgentService } from "@/module/ai-agent/ai-agent-service";
import { Err } from "@/shared/err/err";
import { safeFn, safeFnSync } from "@/shared/err/err-util";
import { type Id } from "@/shared/model/model-id";
import { type Tenant, type TenantAware } from "@/shared/tenant/tenant-model";
import { daytonaClient } from "@/vendor/daytona/daytona-client";
import { getEnv } from "@/vendor/env/env";
import { baseLogger } from "@/vendor/pino/pino-logger";

const log = baseLogger.child({ context: "ai-agent-session-step" });

const aiAgentRunService = makeAiAgentRunService();
const aiAgentService = makeAiAgentService();
const aiAgentRunMessageService = makeAiAgentRunMessageService();

// ---------------------------------------------------------------------------
// Run steps
// ---------------------------------------------------------------------------

const createAiAgentRun =
  (input: { tenant: Tenant; aiAgentId: Id }) =>
  async (): Promise<{ id: AiAgentRun["id"] }> => {
    const result = await aiAgentRunService.create({
      ctx: { tenant: input.tenant },
      payload: {
        aiAgentId: input.aiAgentId,
        sandbox: null,
        sessionId: null,
        status: "idle",
      },
    });

    if (result.isErr()) {
      throw Err.from(result.error);
    }
    return result.value;
  };

const getAiAgentRun =
  (input: { tenant: Tenant; aiAgentRunId: Id }) =>
  async (): Promise<AiAgentRun> => {
    const result = await aiAgentRunService.get({
      ctx: { tenant: input.tenant },
      id: input.aiAgentRunId,
    });

    if (result.isErr()) {
      throw Err.from(result.error);
    }
    return result.value.data;
  };

const markAiAgentRunAsInitializing =
  (input: { tenant: Tenant; aiAgentRunId: Id }) => async () => {
    const result = await aiAgentRunService.update({
      ctx: { tenant: input.tenant },
      id: input.aiAgentRunId,
      data: {
        status: "initializing",
      },
    });

    if (result.isErr()) {
      throw Err.from(result.error);
    }
  };

const markAiAgentRunAsInitialized =
  (input: { tenant: Tenant; aiAgentRunId: Id; sandboxId: Id }) => async () => {
    const result = await aiAgentRunService.update({
      ctx: { tenant: input.tenant },
      id: input.aiAgentRunId,
      data: {
        status: "initialized",
        sandbox: {
          integration: { externalId: input.sandboxId, provider: "daytona" },
        },
      },
    });

    if (result.isErr()) {
      throw Err.from(result.error);
    }
  };

// ---------------------------------------------------------------------------
// Sandbox steps
// ---------------------------------------------------------------------------

const createSandbox = () => async (): Promise<{ sandboxId: string }> => {
  const sandbox = await daytonaClient.create({
    envVars: { ANTHROPIC_API_KEY: getEnv().ANTHROPIC_API_KEY },
  });
  return { sandboxId: sandbox.id };
};

const getSandbox =
  (input: { sandboxId: string }) => async (): Promise<Sandbox> => {
    return daytonaClient.get(input.sandboxId);
  };

const startSandbox = async (input: { sandboxId: string }): Promise<Sandbox> => {
  const sandbox = await daytonaClient.get(input.sandboxId);
  await sandbox.start();
  return sandbox;
};

const stopSandbox = (input: { sandboxId: string }) => async () => {
  const result = await safeFn(async () => {
    const sandbox = await daytonaClient.get(input.sandboxId);
    await daytonaClient.stop(sandbox);
  });
  if (result.isErr()) {
    log.warn(
      { error: result.error, sandboxId: input.sandboxId },
      "sandbox teardown skipped",
    );
  }
};

// ---------------------------------------------------------------------------
// Turn execution
// ---------------------------------------------------------------------------

const shellEscape = (value: string) => `'${value.replace(/'/g, "'\\''")}'`;

const buildClaudeCommand = (input: {
  model: string;
  content: string;
  sessionId: string | null;
}) => {
  const parts = [
    "claude",
    "--dangerously-skip-permissions",
    `-p "${shellEscape(input.content)}"`,
    `--model ${input.model}`,
    "--output-format stream-json",
    "--verbose",
  ];

  if (input.sessionId) {
    parts.splice(2, 0, `--resume ${shellEscape(input.sessionId)}`);
  }
  return parts.join(" ");
};

type StreamJsonEvent = {
  type?: string;
  subtype?: string;
  session_id?: string;
  message?: {
    content?: Array<{
      type?: string;
      text?: string;
      name?: string;
      input?: Record<string, unknown>;
      id?: string;
      tool_use_id?: string;
      content?: unknown;
    }>;
  };
  tool_use_id?: string;
  content?: unknown;
};

const parseStreamJsonEvents = (stdout: string): StreamJsonEvent[] => {
  const events: StreamJsonEvent[] = [];

  for (const raw of stdout.split("\n")) {
    const line = raw.trim();

    if (!line) {
      continue;
    }
    const result = safeFnSync(() => JSON.parse(line) as StreamJsonEvent);
    if (result.isErr()) {
      log.warn(
        { error: result.error, line },
        "unable to parse stream-json line",
      );
      continue;
    }
    events.push(result.value);
  }
  return events;
};

type AppendInput = {
  role: "assistant" | "tool_use" | "tool_result" | "system";
  content: string;
  toolName?: string | undefined;
  toolInput?: Record<string, unknown> | undefined;
  toolResult?: Record<string, unknown> | undefined;
};

type StreamJsonContentBlock = NonNullable<
  NonNullable<StreamJsonEvent["message"]>["content"]
>[number];

const mapAssistantBlocks = (
  blocks: StreamJsonContentBlock[],
): AppendInput | null => {
  const toolUseBlock = blocks.find((b) => b.type === "tool_use");

  if (toolUseBlock) {
    return {
      role: "tool_use",
      content: toolUseBlock.name ?? "",
      toolName: toolUseBlock.name,
      toolInput: toolUseBlock.input,
    };
  }
  const textBlocks = blocks
    .filter((b) => b.type === "text" && typeof b.text === "string")
    .map((b) => b.text ?? "")
    .filter((text) => text.length > 0);

  if (textBlocks.length > 0) {
    return { role: "assistant", content: textBlocks.join("\n") };
  }
  return null;
};

const mapUserBlocks = (
  blocks: StreamJsonContentBlock[],
): AppendInput | null => {
  const toolResultBlock = blocks.find((b) => b.type === "tool_result");

  if (!toolResultBlock) {
    return null;
  }
  const raw = toolResultBlock.content;
  const content = typeof raw === "string" ? raw : JSON.stringify(raw ?? null);

  return {
    role: "tool_result",
    content,
    toolInput: toolResultBlock.tool_use_id
      ? { tool_use_id: toolResultBlock.tool_use_id }
      : undefined,
    toolResult:
      typeof raw === "object" && raw !== null
        ? (raw as Record<string, unknown>)
        : undefined,
  };
};

const mapEventToAppendInput = (event: StreamJsonEvent): AppendInput | null => {
  const blocks = event.message?.content ?? [];

  if (event.type === "assistant") {
    return mapAssistantBlocks(blocks);
  }
  if (event.type === "user") {
    return mapUserBlocks(blocks);
  }
  return null;
};

const runTurn =
  (input: {
    tenant: Tenant;
    aiAgentRunId: Id;
    aiAgentId: Id;
    userMessageId: Id;
    content: string;
    sandboxId: string;
    sessionId: string | null;
  }) =>
  async (): Promise<{ sessionId: string | null }> => {
    const agentResult = await aiAgentService.get({
      ctx: { tenant: input.tenant },
      id: input.aiAgentId,
    });

    if (agentResult.isErr()) {
      throw Err.from(agentResult.error);
    }
    const sandbox = await daytonaClient.get(input.sandboxId);
    const command = buildClaudeCommand({
      model: agentResult.value.data.model,
      content: input.content,
      sessionId: input.sessionId,
    });
    const response = await sandbox.process.executeCommand(
      command,
      "/home/daytona",
      undefined,
      60 * 30,
    );
    const events = parseStreamJsonEvents(response.result ?? "");
    const systemInit = events.find(
      (e) => e.type === "system" && e.subtype === "init",
    );
    const nextSessionId = systemInit?.session_id ?? input.sessionId;

    for (const event of events) {
      const appendInput = mapEventToAppendInput(event);

      if (!appendInput) {
        continue;
      }
      const appendResult = await aiAgentRunMessageService.create({
        ctx: { tenant: input.tenant },
        payload: {
          aiAgentRunId: input.aiAgentRunId,
          role: camelCase(appendInput.role) as AiAgentRunMessage["role"],
          content: appendInput.content,
          toolName: appendInput.toolName ?? null,
          toolInput: appendInput.toolInput ?? null,
          toolResult: appendInput.toolResult ?? null,
        },
      });

      if (appendResult.isErr()) {
        throw Err.from(appendResult.error);
      }
    }
    return { sessionId: nextSessionId ?? null };
  };

// ---------------------------------------------------------------------------
// Message steps
// ---------------------------------------------------------------------------

const appendUserMessage =
  (input: { tenant: Tenant; aiAgentRunId: Id; content: string }) =>
  async (): Promise<Id> => {
    const result = await aiAgentRunMessageService.create({
      ctx: { tenant: input.tenant },
      payload: {
        aiAgentRunId: input.aiAgentRunId,
        role: "user",
        content: input.content,
        toolName: null,
        toolInput: null,
        toolResult: null,
      },
    });

    if (result.isErr()) {
      throw Err.from(result.error);
    }
    return result.value.data.id;
  };

// ---------------------------------------------------------------------------
// Batch steps
// ---------------------------------------------------------------------------

const listNonActiveAiAgentRuns =
  (input: { ctx: TenantAware }) => async (): Promise<AiAgentRun[]> => {
    const { ctx } = input;

    const result = await aiAgentRunService.list({
      ctx,
      filter: { status: "initialized" },
    });

    if (result.isErr()) {
      throw Err.from(result.error);
    }

    const aiAgentRuns = result.value.data;
    const recentActivityThreshold = sub(new UTCDate(), { minutes: 15 });

    const recentMessages = await aiAgentRunMessageService.list({
      ctx,
      filter: {
        aiAgentRunId: { $in: aiAgentRuns.map((run) => run.id) },
        createdAt: { $gte: recentActivityThreshold },
      },
    });

    if (recentMessages.isErr()) {
      throw Err.from(recentMessages.error);
    }
    const activeRunIds = new Set(
      recentMessages.value.data.map((message) => message.aiAgentRunId),
    );

    return aiAgentRuns.filter((run) => !activeRunIds.has(run.id));
  };

const markAiAgentRunAsStopping =
  (input: { ctx: TenantAware; id: string }) => async (): Promise<void> => {
    const { ctx, id } = input;

    const result = await aiAgentRunService.update({
      ctx,
      id,
      data: { status: "stopping" },
    });

    if (result.isErr()) {
      throw Err.from(result.error);
    }
  };

const markAiAgentRunAsStopped =
  (input: { ctx: TenantAware; id: string }) => async (): Promise<void> => {
    const { ctx, id } = input;

    const result = await aiAgentRunService.update({
      ctx,
      id,
      data: { status: "stopped" },
    });

    if (result.isErr()) {
      throw Err.from(result.error);
    }
  };

export {
  createAiAgentRun,
  getAiAgentRun,
  markAiAgentRunAsInitializing,
  markAiAgentRunAsInitialized,
  createSandbox,
  getSandbox,
  startSandbox,
  stopSandbox,
  runTurn,
  appendUserMessage,
  listNonActiveAiAgentRuns,
  markAiAgentRunAsStopping,
  markAiAgentRunAsStopped,
};
