"use client";

import { ChevronRightIcon, WrenchIcon } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import type { AiAgentRunMessage } from "@/module/ai-agent-run-message/ai-agent-run-message-type";

import { Badge } from "@/component/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/component/ui/collapsible";
import { cn } from "@/lib/util";
import { makeAiAgentRunMessageService } from "@/module/ai-agent-run-message/ai-agent-run-message-service";

type AiAgentRunChatMessageProps = {
  message: AiAgentRunMessage;
};

type ToolMessageProps = {
  message: AiAgentRunMessage;
};

function ToolMessage({ message }: ToolMessageProps) {
  const [open, setOpen] = useState(false);
  const service = makeAiAgentRunMessageService({ message });
  const payload = service.getToolPayload();
  const isToolUse = message.role === "tool_use";

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className={cn(
          "flex w-full items-center gap-2 rounded-md border px-3 py-1.5 text-left text-sm",
          "hover:bg-muted/60 transition-colors",
        )}
      >
        <ChevronRightIcon
          className={cn("size-4 transition-transform", open && "rotate-90")}
        />
        <WrenchIcon className="size-3.5" />
        <Badge variant="outline" className="font-mono text-xs">
          {isToolUse ? "tool_use" : "tool_result"}
        </Badge>
        <span className="font-medium">{service.getToolLabel()}</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="bg-muted/50 mt-1 overflow-auto rounded-md border p-3 text-xs">
          {message.content !== "" && (
            <div className="mb-2 whitespace-pre-wrap">{message.content}</div>
          )}
          {payload !== null && (
            <pre className="font-mono">
              <code>{JSON.stringify(payload, null, 2)}</code>
            </pre>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function AiAgentRunChatMessage({ message }: AiAgentRunChatMessageProps) {
  if (message.role === "system") {
    return (
      <div className="text-muted-foreground py-1 text-center text-xs">
        {message.content}
      </div>
    );
  }

  if (message.role === "tool_use" || message.role === "tool_result") {
    return <ToolMessage message={message} />;
  }

  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-primary text-primary-foreground max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="bg-muted text-foreground [&_code]:bg-background/60 [&_pre]:bg-background/80 max-w-[90%] space-y-2 rounded-lg px-3 py-2 text-sm leading-relaxed [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold [&_h4]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_pre]:overflow-auto [&_pre]:rounded-md [&_pre]:p-3 [&_pre]:text-xs [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_ul]:list-disc [&_ul]:pl-5">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {message.content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
