import { EventEmitter } from "node:events";

import type { AiAgentRunStatus } from "@/module/ai-agent-run/ai-agent-run-model";
import type { AiAgentRunMessage } from "@/module/ai-agent-run-message/ai-agent-run-message-model";
import type { Id } from "@/shared/model/model-id";

type AiAgentConversationEventBase = { aiAgentRunId: Id };

type AiAgentConversationRunStatusEvent = AiAgentConversationEventBase & {
  type:
    | "run.provisioning"
    | "run.idle"
    | "run.processing"
    | "run.errored"
    | "run.stopped";
  status: AiAgentRunStatus;
};

type AiAgentConversationTurnStartedEvent = AiAgentConversationEventBase & {
  type: "turn.started";
  messageId: Id;
};

type AiAgentConversationTurnFinishedEvent = AiAgentConversationEventBase & {
  type: "turn.finished";
  messageId: Id;
};

type AiAgentConversationMessageAppendedEvent = AiAgentConversationEventBase & {
  type: "message.appended";
  message: AiAgentRunMessage;
};

type AiAgentConversationErrorEvent = AiAgentConversationEventBase & {
  type: "error";
  code: string;
  message: string;
};

type AiAgentConversationEvent =
  | AiAgentConversationRunStatusEvent
  | AiAgentConversationTurnStartedEvent
  | AiAgentConversationTurnFinishedEvent
  | AiAgentConversationMessageAppendedEvent
  | AiAgentConversationErrorEvent;

const channel = (aiAgentRunId: Id) => `ai-agent-run:${aiAgentRunId}`;

const makeAiAgentConversationEventBus = () => {
  const emitter = new EventEmitter();
  emitter.setMaxListeners(0);

  const publish = (event: AiAgentConversationEvent) => {
    emitter.emit(channel(event.aiAgentRunId), event);
  };

  const subscribe = (
    aiAgentRunId: Id,
    handler: (event: AiAgentConversationEvent) => void,
  ) => {
    const key = channel(aiAgentRunId);
    emitter.on(key, handler);
    return () => {
      emitter.off(key, handler);
    };
  };

  return { publish, subscribe };
};

const aiAgentConversationEventBus = makeAiAgentConversationEventBus();

export { aiAgentConversationEventBus };
export type {
  AiAgentConversationEvent,
  AiAgentConversationRunStatusEvent,
  AiAgentConversationTurnStartedEvent,
  AiAgentConversationTurnFinishedEvent,
  AiAgentConversationMessageAppendedEvent,
  AiAgentConversationErrorEvent,
};
