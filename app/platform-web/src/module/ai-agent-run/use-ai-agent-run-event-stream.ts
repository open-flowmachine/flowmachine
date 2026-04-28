import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

import { getEnv } from "@/lib/env/env";
import {
  makeGetAiAgentRunQueryKey,
  makeListAiAgentRunMessagesQueryKey,
} from "@/lib/query/query-key";

const aiAgentRunEventStreamConnectionStatuses = [
  "connecting",
  "connected",
  "disconnected",
] as const;
type AiAgentRunEventStreamConnectionStatus =
  (typeof aiAgentRunEventStreamConnectionStatuses)[number];

const messageEventNames = ["message.appended"] as const;
const runEventNames = [
  "run.idle",
  "run.processing",
  "run.errored",
  "run.stopped",
  "turn.started",
  "turn.finished",
] as const;

type UseAiAgentRunEventStreamReturn = {
  connectionStatus: AiAgentRunEventStreamConnectionStatus;
  reconnect: () => void;
};

export const useAiAgentRunEventStream = (
  aiAgentId: string,
  runId: string,
): UseAiAgentRunEventStreamReturn => {
  const queryClient = useQueryClient();
  const [connectionStatus, setConnectionStatus] =
    useState<AiAgentRunEventStreamConnectionStatus>("connecting");
  const eventSourceRef = useRef<EventSource | null>(null);
  const [reconnectNonce, setReconnectNonce] = useState(0);

  const reconnect = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: makeListAiAgentRunMessagesQueryKey(aiAgentId, runId),
    });
    void queryClient.invalidateQueries({
      queryKey: makeGetAiAgentRunQueryKey(aiAgentId, runId),
    });
    setReconnectNonce((n) => n + 1);
  }, [aiAgentId, queryClient, runId]);

  useEffect(() => {
    const url = `${getEnv().NEXT_PUBLIC_SERVICE_BASE_URL}/api/v1/ai-agent/${aiAgentId}/run/${runId}/events`;
    const source = new EventSource(url, { withCredentials: true });
    eventSourceRef.current = source;
    setConnectionStatus("connecting");

    const handleOpen = () => {
      setConnectionStatus("connected");
    };

    const handleMessageAppended = () => {
      void queryClient.invalidateQueries({
        queryKey: makeListAiAgentRunMessagesQueryKey(aiAgentId, runId),
      });
    };

    const handleRunStateChange = () => {
      void queryClient.invalidateQueries({
        queryKey: makeGetAiAgentRunQueryKey(aiAgentId, runId),
      });
    };

    const handleError = () => {
      setConnectionStatus("disconnected");
      source.close();
    };

    source.addEventListener("open", handleOpen);
    source.addEventListener("error", handleError);
    for (const name of messageEventNames) {
      source.addEventListener(name, handleMessageAppended);
    }
    for (const name of runEventNames) {
      source.addEventListener(name, handleRunStateChange);
    }

    return () => {
      source.removeEventListener("open", handleOpen);
      source.removeEventListener("error", handleError);
      for (const name of messageEventNames) {
        source.removeEventListener(name, handleMessageAppended);
      }
      for (const name of runEventNames) {
        source.removeEventListener(name, handleRunStateChange);
      }
      source.close();
      eventSourceRef.current = null;
    };
  }, [aiAgentId, queryClient, reconnectNonce, runId]);

  return { connectionStatus, reconnect };
};
