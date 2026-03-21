"use client";

import { BrushCleaningIcon } from "lucide-react";
import type { z } from "zod/v4";
import { workflowJsonEditorSchema } from "@/app/platform/workflow/_schema/workflow-editor-schema";
import { JsonEditorTextarea } from "@/component/extended-ui/json-editor-textarea";
import { Button } from "@/component/ui/button";
import { ButtonGroup } from "@/component/ui/button-group";
import { useJsonEditor } from "@/hook/use-json-editor";
import type { WorkflowDefinition } from "@/module/workflow/workflow-definition-type";

export type WorkflowJsonEditorData = z.output<typeof workflowJsonEditorSchema>;

type WorkflowJsonEditorProps = {
  initialValue: string;
  onSave: (data: WorkflowJsonEditorData) => void;
  isPending?: boolean;
  saveButtonLabel?: string;
};

export function WorkflowJsonEditor({
  initialValue,
  onSave,
  isPending = false,
  saveButtonLabel = "Save",
}: WorkflowJsonEditorProps) {
  const jsonEditor = useJsonEditor({
    initialValue,
    schema: workflowJsonEditorSchema,
  });

  const handleSave = jsonEditor.withValidation(onSave);

  return (
    <div className="relative grid h-full grid-rows-[1fr_auto] gap-2">
      <ButtonGroup className="absolute top-2 right-2 z-10">
        <Button
          onClick={jsonEditor.onFormat}
          size="icon-xs"
          variant="outline"
          disabled={isPending}
        >
          <BrushCleaningIcon />
        </Button>
      </ButtonGroup>
      <JsonEditorTextarea
        value={jsonEditor.value}
        onChange={(e) => jsonEditor.onChange(e.target.value)}
        onKeyDown={jsonEditor.onKeyDown}
        disabled={isPending}
      />
      <Button
        className="justify-self-end"
        variant="default"
        onClick={handleSave}
        disabled={isPending}
      >
        {isPending ? "Saving..." : saveButtonLabel}
      </Button>
    </div>
  );
}

export function workflowToEditorJson(
  workflow: WorkflowDefinition,
): string {
  return JSON.stringify(
    {
      name: workflow.name,
      description: workflow.description ?? "",
      actions: workflow.actions,
      edges: workflow.edges,
    },
    null,
    4,
  );
}
