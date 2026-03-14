import {
  workflowActionDefinitionBasicCrudService,
  workflowDefinitionBasicCrudService,
} from "@/di/app";
import { inngestClient } from "@/di/infra";
import { logger } from "@/infra/pino/logger";
import { WorkflowSdlcEngineFactory } from "@/orchestrator/workflow/sdlc/engine-factory";
import { WorkflowSdlcFunctionFactory } from "@/orchestrator/workflow/sdlc/function-factory";

const workflowSdlcEngineFactory = new WorkflowSdlcEngineFactory(
  workflowDefinitionBasicCrudService,
  logger,
);
const workflowSdlcFunctionFactory = new WorkflowSdlcFunctionFactory(
  inngestClient,
  workflowSdlcEngineFactory,
  workflowActionDefinitionBasicCrudService,
);

export { workflowSdlcEngineFactory, workflowSdlcFunctionFactory };
