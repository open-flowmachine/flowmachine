const actionKinds = ["agentic-loop", "code-review-request"] as const;
type ActionKind = (typeof actionKinds)[number];

type WorkflowAction = {
  readonly id: string;
  readonly kind: ActionKind;
  readonly name: string;
  readonly inputs?: Readonly<Record<string, unknown>>;
};

type WorkflowEdge = {
  readonly from: string;
  readonly to: string;
};

export { actionKinds };
export type { ActionKind, WorkflowAction, WorkflowEdge };
