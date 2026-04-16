const aiModels = [
  "anthropic/claude-opus-4.6",
  "anthropic/claude-sonnet-4.6",
] as const;
type AiModel = (typeof aiModels)[number];

export { aiModels };
export type { AiModel };
