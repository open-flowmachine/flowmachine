const aiAgentSessionModes = ["fireAndForget", "interactive"] as const;
type AiAgentSessionMode = (typeof aiAgentSessionModes)[number];

export { aiAgentSessionModes };
export type { AiAgentSessionMode };
