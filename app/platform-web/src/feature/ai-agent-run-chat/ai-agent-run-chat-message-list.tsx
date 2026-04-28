"use client";

import { useEffect, useRef, useState } from "react";

import type { AiAgentRunMessage } from "@/module/ai-agent-run-message/ai-agent-run-message-type";

import { AiAgentRunChatMessage } from "@/feature/ai-agent-run-chat/ai-agent-run-chat-message";

type AiAgentRunChatMessageListProps = {
  messages: AiAgentRunMessage[];
};

const isAtBottom = (element: HTMLElement, threshold = 32) => {
  const distanceFromBottom =
    element.scrollHeight - element.scrollTop - element.clientHeight;
  return distanceFromBottom <= threshold;
};

export function AiAgentRunChatMessageList({
  messages,
}: AiAgentRunChatMessageListProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    const node = containerRef.current;
    if (node === null) {
      return;
    }
    if (!autoScroll) {
      return;
    }
    node.scrollTop = node.scrollHeight;
  }, [autoScroll, messages]);

  const handleScroll = () => {
    const node = containerRef.current;
    if (node === null) {
      return;
    }
    setAutoScroll(isAtBottom(node));
  };

  if (messages.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-1 items-center justify-center text-sm">
        No messages yet. Send the first one to start the conversation.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 space-y-3 overflow-auto px-1 py-2"
    >
      {messages.map((message) => (
        <AiAgentRunChatMessage key={message.id} message={message} />
      ))}
    </div>
  );
}
