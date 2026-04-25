import { aiAgentConversationEventBus } from "@/feature/ai-agent-conversation/ai-agent-conversation-event";
import { makeAiAgentRunMessageService } from "@/module/ai-agent-run-message/ai-agent-run-message-service";
import { makeAiAgentRunService } from "@/module/ai-agent-run/ai-agent-run-service";
import { makeAiAgentService } from "@/module/ai-agent/ai-agent-service";
import { Err } from "@/shared/err/err";
import { type Id } from "@/shared/model/model-id";
import { type Tenant } from "@/shared/model/model-tenant";
import { daytonaClient } from "@/vendor/daytona/daytona-client";
import { getEnv } from "@/vendor/env/env";
import { baseLog } from "@/vendor/pino/pino-log";

const log = baseLog.child({ context: "ai-agent-conversation-turn" });

const aiAgentService = makeAiAgentService();
const aiAgentRunService = makeAiAgentRunService();
const aiAgentRunMessageService = makeAiAgentRunMessageService();

const volumeName = (aiAgentRunId: Id) => `ai-agent-run-${aiAgentRunId}`;

const provisionVolume = async (input: { aiAgentRunId: Id }) => {
  const volume = await daytonaClient.volume.get(
    volumeName(input.aiAgentRunId),
    true,
  );
  return { volumeId: volume.id };
};

const destroyVolume = async (input: { aiAgentRunId: Id }) => {
  try {
    const volume = await daytonaClient.volume.get(
      volumeName(input.aiAgentRunId),
      false,
    );
    await daytonaClient.volume.delete(volume);
  } catch (error) {
    log.warn(
      { error, aiAgentRunId: input.aiAgentRunId },
      "volume delete skipped",
    );
  }
};

const provisionSandbox = async (input: { volumeId: string }) => {
  const sandbox = await daytonaClient.create({
    envVars: { ANTHROPIC_API_KEY: getEnv().ANTHROPIC_API_KEY },
    volumes: [{ volumeId: input.volumeId, mountPath: "/home/daytona/.claude" }],
  });
  await sandbox.process.executeCommand(
    "curl -fsSL https://claude.ai/install.sh | bash",
  );
  return { sandboxId: sandbox.id };
};

const teardownSandbox = async (input: { sandboxId: string }) => {
  try {
    const sandbox = await daytonaClient.get(input.sandboxId);
    await daytonaClient.delete(sandbox);
  } catch (error) {
    log.warn({ error, sandboxId: input.sandboxId }, "sandbox teardown skipped");
  }
};

const shellEscape = (value: string) => `'${value.replace(/'/g, "'\\''")}'`;

const buildClaudeCommand = (input: {
  model: string;
  content: string;
  sessionId: string | null;
}) => {
  const parts = [
    "claude",
    "--bare",
    `--model ${shellEscape(input.model)}`,
    `-p ${shellEscape(input.content)}`,
    "--output-format stream-json",
    '--allowedTools "*"',
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
    try {
      events.push(JSON.parse(line) as StreamJsonEvent);
    } catch (error) {
      log.warn({ error, line }, "unable to parse stream-json line");
    }
  }
  return events;
};

type AppendInput = {
  role: "assistant" | "tool_use" | "tool_result" | "system";
  content: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  toolResult?: Record<string, unknown>;
};

const appendMessages = async (input: {
  ctx: { tenant: Tenant };
  aiAgentRunId: Id;
  messages: AppendInput[];
}) => {
  for (const message of input.messages) {
    const appendResult = await aiAgentRunMessageService.append({
      ctx: input.ctx,
      payload: {
        aiAgentRunId: input.aiAgentRunId,
        role: message.role,
        content: message.content,
        toolName: message.toolName ?? null,
        toolInput: message.toolInput ?? null,
        toolResult: message.toolResult ?? null,
      },
    });

    if (appendResult.isErr()) {
      throw Err.from(appendResult.error);
    }
    aiAgentConversationEventBus.publish({
      type: "message.appended",
      aiAgentRunId: input.aiAgentRunId,
      message: appendResult.value.data,
    });
  }
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

const runTurn = async (input: {
  ctx: { tenant: Tenant };
  aiAgentRunId: Id;
  aiAgentId: Id;
  userMessageId: Id;
  content: string;
  sandboxId: string;
  sessionId: string | null;
}) => {
  const agentResult = await aiAgentService.get({
    ctx: input.ctx,
    id: input.aiAgentId,
  });

  if (agentResult.isErr()) {
    throw Err.from(agentResult.error);
  }
  aiAgentConversationEventBus.publish({
    type: "turn.started",
    aiAgentRunId: input.aiAgentRunId,
    messageId: input.userMessageId,
  });

  const sandbox = await daytonaClient.get(input.sandboxId);

  const command = buildClaudeCommand({
    model: agentResult.value.data.model,
    content: input.content,
    sessionId: input.sessionId,
  });

  const response = await sandbox.process.executeCommand(
    command,
    undefined,
    undefined,
    60 * 30,
  );

  const events = parseStreamJsonEvents(response.result ?? "");

  const systemInit = events.find(
    (e) => e.type === "system" && e.subtype === "init",
  );
  const nextSessionId = systemInit?.session_id ?? input.sessionId;

  const appendInputs: AppendInput[] = [];
  for (const event of events) {
    const mapped = mapEventToAppendInput(event);
    if (mapped) {
      appendInputs.push(mapped);
    }
  }

  await appendMessages({
    ctx: input.ctx,
    aiAgentRunId: input.aiAgentRunId,
    messages: appendInputs,
  });

  aiAgentConversationEventBus.publish({
    type: "turn.finished",
    aiAgentRunId: input.aiAgentRunId,
    messageId: input.userMessageId,
  });

  return { sessionId: nextSessionId ?? null };
};

const appendSystemErrorMessage = async (input: {
  ctx: { tenant: Tenant };
  aiAgentRunId: Id;
  message: string;
}) => {
  await appendMessages({
    ctx: input.ctx,
    aiAgentRunId: input.aiAgentRunId,
    messages: [{ role: "system", content: input.message }],
  });
};

const markRunStatus = async (input: {
  ctx: { tenant: Tenant };
  aiAgentRunId: Id;
  status: "provisioning" | "idle" | "processing" | "errored" | "stopped";
  endedReason?: "user_stop" | "idle_timeout" | "error";
  sandbox?: Parameters<typeof aiAgentRunService.update>[0]["data"]["sandbox"];
  sessionId?: string | null;
}) => {
  const getResult = await aiAgentRunService.get({
    ctx: input.ctx,
    id: input.aiAgentRunId,
  });

  if (getResult.isErr()) {
    throw Err.from(getResult.error);
  }
  const run = getResult.value.data;

  const patch: Parameters<typeof aiAgentRunService.update>[0]["data"] = {
    status: input.status,
    _version: run._version,
  };

  if (input.sandbox !== undefined) {
    patch.sandbox = input.sandbox;
  }
  if (input.sessionId !== undefined) {
    patch.sessionId = input.sessionId;
  }
  const isEnded = input.status === "stopped" || input.status === "errored";

  if (isEnded) {
    patch.endedAt = new Date();
  }
  if (isEnded && input.endedReason) {
    patch.endedReason = input.endedReason;
  }

  const result = await aiAgentRunService.update({
    ctx: input.ctx,
    id: input.aiAgentRunId,
    data: patch,
  });
  if (result.isErr()) {
    throw Err.from(result.error);
  }

  aiAgentConversationEventBus.publish({
    type: `run.${input.status}` as const,
    aiAgentRunId: input.aiAgentRunId,
    status: input.status,
  });
};

export {
  provisionVolume,
  destroyVolume,
  provisionSandbox,
  teardownSandbox,
  runTurn,
  appendSystemErrorMessage,
  markRunStatus,
  volumeName,
};
