"use client";

import { SendIcon, SquareIcon } from "lucide-react";
import Link from "next/link";
import { type FormEvent, type KeyboardEvent, useState } from "react";
import { toast } from "sonner";

import type { AiAgentRun } from "@/module/ai-agent-run/ai-agent-run-type";

import { Button } from "@/component/ui/button";
import { Spinner } from "@/component/ui/spinner";
import { Textarea } from "@/component/ui/textarea";
import { useSendAiAgentRunMessage } from "@/module/ai-agent-run-message/use-send-ai-agent-run-message";
import { makeAiAgentRunService } from "@/module/ai-agent-run/ai-agent-run-service";
import { isAiAgentRunTerminal } from "@/module/ai-agent-run/ai-agent-run-type";
import { useStopAiAgentRun } from "@/module/ai-agent-run/use-stop-ai-agent-run";

type AiAgentRunChatComposerProps = {
  aiAgentId: string;
  run: AiAgentRun;
};

export function AiAgentRunChatComposer({
  aiAgentId,
  run,
}: AiAgentRunChatComposerProps) {
  const [content, setContent] = useState("");
  const { mutateAsync: sendMessage, isPending: isSending } =
    useSendAiAgentRunMessage();
  const { mutateAsync: stopRun, isPending: isStopping } = useStopAiAgentRun();

  const service = makeAiAgentRunService({ run });
  const isTerminal = isAiAgentRunTerminal(run.status);
  const isProcessing = run.status === "processing";
  const isProvisioning = run.status === "provisioning";
  const canSend = run.status === "idle";

  const handleSend = async () => {
    const trimmed = content.trim();
    if (trimmed === "") {
      return;
    }
    if (!canSend) {
      return;
    }
    try {
      await sendMessage({
        params: { aiAgentId, runId: run.id },
        body: { content: trimmed },
      });
      setContent("");
    } catch {
      toast.error("Failed to send message");
    }
  };

  const handleStop = async () => {
    try {
      await stopRun({ params: { aiAgentId, runId: run.id } });
    } catch {
      toast.error("Failed to stop run");
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleSend();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  if (isTerminal) {
    const endedReason = service.getEndedReasonDisplayName();
    return (
      <div className="text-muted-foreground border-t pt-3 text-center text-sm">
        <p>
          {service.getComposerHint()}
          {endedReason !== null ? ` — ${endedReason}` : ""}
        </p>
        <Button
          variant="link"
          size="sm"
          nativeButton={false}
          render={<Link href={`/platform/ai-agent/${aiAgentId}/run`} />}
        >
          Start a new chat
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border-t pt-3">
      <Textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        onKeyDown={handleKeyDown}
        disabled={!canSend}
        placeholder={service.getComposerHint()}
        rows={3}
        className="resize-none"
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs">
          {isProvisioning || isProcessing
            ? service.getComposerHint()
            : "Press Enter to send, Shift+Enter for newline"}
        </p>
        {isProcessing ? (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleStop}
            disabled={isStopping}
          >
            {isStopping ? <Spinner /> : <SquareIcon />}
            Stop
          </Button>
        ) : (
          <Button
            type="submit"
            size="sm"
            disabled={!canSend || isSending || content.trim() === ""}
          >
            {isSending ? <Spinner /> : <SendIcon />}
            Send
          </Button>
        )}
      </div>
    </form>
  );
}
