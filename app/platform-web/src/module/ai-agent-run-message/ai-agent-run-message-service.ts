import type {
  AiAgentRunMessage,
  AiAgentRunMessageRole,
} from "@/module/ai-agent-run-message/ai-agent-run-message-type";

const roleToDisplayName = {
  user: "You",
  assistant: "Agent",
  tool_use: "Tool",
  tool_result: "Tool result",
  system: "System",
} as const satisfies Record<AiAgentRunMessageRole, string>;

const collapsibleRoles: readonly AiAgentRunMessageRole[] = [
  "tool_use",
  "tool_result",
];

const makeAiAgentRunMessageService = (input: {
  message: AiAgentRunMessage;
}) => {
  const { message } = input;

  const getToolLabel = () => {
    if (message.toolName === null) {
      return roleToDisplayName[message.role];
    }
    return message.toolName;
  };

  const getToolPayload = () => {
    if (message.role === "tool_use") {
      return message.toolInput;
    }
    if (message.role === "tool_result") {
      return message.toolResult;
    }
    return null;
  };

  return {
    getRoleDisplayName: () => roleToDisplayName[message.role],
    getToolLabel,
    getToolPayload,
    isCollapsible: () => collapsibleRoles.includes(message.role),
  };
};

export { makeAiAgentRunMessageService };
