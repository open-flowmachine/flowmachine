import { format } from "date-fns";

import type {
  AiAgentRun,
  AiAgentRunEndedReason,
  AiAgentRunStatus,
} from "@/module/ai-agent-run/ai-agent-run-type";

const statusToDisplayName = {
  provisioning: "Provisioning",
  idle: "Idle",
  processing: "Processing",
  stopped: "Stopped",
  errored: "Errored",
} as const satisfies Record<AiAgentRunStatus, string>;

const statusToVariant = {
  provisioning: "secondary",
  idle: "outline",
  processing: "default",
  stopped: "secondary",
  errored: "destructive",
} as const satisfies Record<
  AiAgentRunStatus,
  "default" | "secondary" | "destructive" | "outline"
>;

const endedReasonToDisplayName = {
  user_stop: "Stopped by user",
  idle_timeout: "Idle timeout",
  error: "Error",
} as const satisfies Record<AiAgentRunEndedReason, string>;

const composerHintByStatus = {
  provisioning: "Setting up sandbox…",
  idle: "Send a message",
  processing: "Agent is working…",
  stopped: "This run has ended",
  errored: "This run has ended",
} as const satisfies Record<AiAgentRunStatus, string>;

const formatTimestamp = (value: string | null) => {
  if (value === null) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return format(date, "MMM d, yyyy, h:mm a");
};

const makeAiAgentRunService = (input: { run: AiAgentRun }) => {
  const { run } = input;
  return {
    getStatusDisplayName: () => statusToDisplayName[run.status],
    getStatusBadgeVariant: () => statusToVariant[run.status],
    getEndedReasonDisplayName: () =>
      run.endedReason === null ? null : endedReasonToDisplayName[run.endedReason],
    getComposerHint: () => composerHintByStatus[run.status],
    getStartedAt: () => formatTimestamp(run.startedAt),
    getLastMessageAt: () => formatTimestamp(run.lastMessageAt),
    getEndedAt: () => formatTimestamp(run.endedAt),
    getCreatedAt: () => formatTimestamp(run.createdAt),
  };
};

export { makeAiAgentRunService };
