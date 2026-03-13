import { ok } from "neverthrow";
import type { WorkflowActionDefinitionCrudService } from "@/core/domain/workflow/definition/action/crud-service";
import { WorkflowActionDefinitionEntity } from "@/core/domain/workflow/definition/action/entity";

export class WorkflowSdlcActionDefinitionCrudService implements WorkflowActionDefinitionCrudService {
  async list() {
    return ok([
      WorkflowActionDefinitionEntity.makeNew({
        name: "Research",
        kind: "research",
        handler: async () => {},
      }),
      WorkflowActionDefinitionEntity.makeNew({
        name: "Plan",
        kind: "plan",
        handler: async () => {},
      }),
      WorkflowActionDefinitionEntity.makeNew({
        name: "Code",
        kind: "code",
        handler: async () => {},
      }),
    ]);
  }
}
