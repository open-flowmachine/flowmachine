import z from "zod";
import { Entity } from "@/core/domain/entity";
import { type EntityId, newEntityId } from "@/core/domain/entity";

type WorkflowActionHandler = (...args: unknown[]) => Promise<unknown>;

const workflowActionDefinitionEntityProps = z.object({
  kind: z.string(),
  name: z.string(),
  handler: z.custom<WorkflowActionHandler>(),
});
type WorkflowActionDefinitionEntityProps = z.output<
  typeof workflowActionDefinitionEntityProps
>;

class WorkflowActionDefinitionEntity extends Entity<WorkflowActionDefinitionEntityProps> {
  static makeNew(props: WorkflowActionDefinitionEntityProps) {
    return new WorkflowActionDefinitionEntity(newEntityId(), props);
  }

  static makeExisting(
    id: EntityId,
    createdAt: Date,
    updatedAt: Date,
    props: WorkflowActionDefinitionEntityProps,
  ) {
    return new WorkflowActionDefinitionEntity(id, props, {
      createdAt,
      updatedAt,
    });
  }
}

export {
  WorkflowActionDefinitionEntity,
  type WorkflowActionDefinitionEntityProps,
  workflowActionDefinitionEntityProps,
};
