const aiAgentSessionMode = ["fireAndForget", "interactive"] as const;
type AiAgentSessionMode = (typeof aiAgentSessionMode)[number];

export { aiAgentSessionMode };
export type { AiAgentSessionMode };
