import {
  type UseMutationOptions,
  useMutation,
} from "@tanstack/react-query";

import type { HttpEnvelope } from "@/lib/http/http-schema";
import type { Id } from "@/lib/schema";
import type { HttpClientSendAiAgentRunMessageInput } from "@/module/ai-agent-run-message/ai-agent-run-message-type";

import { useProtectedHttpClient } from "@/hook/use-protected-http-client";
import { makeAiAgentRunMessageHttpClient } from "@/module/ai-agent-run-message/ai-agent-run-message-http-client";

type SendAiAgentRunMessageResult = HttpEnvelope<{ messageId: Id }>;

type UseSendAiAgentRunMessageOptions = Omit<
  UseMutationOptions<
    SendAiAgentRunMessageResult,
    Error,
    HttpClientSendAiAgentRunMessageInput,
    unknown
  >,
  "mutationFn"
>;

export const useSendAiAgentRunMessage = (
  options?: UseSendAiAgentRunMessageOptions,
) => {
  const httpClient = useProtectedHttpClient();

  return useMutation({
    mutationFn: (input: HttpClientSendAiAgentRunMessageInput) =>
      makeAiAgentRunMessageHttpClient({ httpClient }).send(input),
    ...options,
  });
};
