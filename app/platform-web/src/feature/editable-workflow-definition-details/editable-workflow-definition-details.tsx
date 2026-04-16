import { CopyIcon } from "lucide-react";
import Link from "next/link";

import type { Project } from "@/module/project/project-type";
import type { WorkflowDefinition } from "@/module/workflow/workflow-definition-type";

import { Badge } from "@/component/ui/badge";
import { Button } from "@/component/ui/button";
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/component/ui/field";
import { Separator } from "@/component/ui/separator";
import { makeWorkflowDefinitionService } from "@/module/workflow/workflow-definition-service";

type EditableWorkflowDefinitionDetailsProps = {
  workflowDefinition: WorkflowDefinition;
  onCopy: (text: string) => void;
  onEdit: () => void;
  projects: Project[];
};

export function EditableWorkflowDefinitionDetails({
  workflowDefinition,
  onCopy,
  onEdit,
  projects,
}: EditableWorkflowDefinitionDetailsProps) {
  const workflowDefinitionDomainService = makeWorkflowDefinitionService({
    workflowDefinition,
  });

  return (
    <>
      <FieldSet>
        <FieldLegend>Basic</FieldLegend>
        <FieldGroup>
          <Field>
            <FieldLabel>ID</FieldLabel>
            <FieldContent className="flex-row items-center gap-x-1">
              <span className="text-sm">{workflowDefinition.id}</span>
              <Button
                size="icon-xs"
                variant="ghost"
                onClick={() => onCopy(workflowDefinition.id)}
              >
                <CopyIcon />
              </Button>
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Name</FieldLabel>
            <FieldContent>
              <span className="text-sm">{workflowDefinition.name}</span>
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Description</FieldLabel>
            <FieldContent>
              <span className="text-sm">
                {workflowDefinition.description ?? (
                  <span className="text-muted-foreground">No description</span>
                )}
              </span>
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Status</FieldLabel>
            <FieldContent>
              <Badge
                variant={workflowDefinition.isActive ? "default" : "secondary"}
                className="w-fit"
              >
                {workflowDefinitionDomainService.getStatusLabel()}
              </Badge>
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Assigned projects</FieldLabel>
            <FieldContent>
              {workflowDefinition.projects.length === 0 ? (
                <span className="text-muted-foreground text-sm">
                  No projects assigned
                </span>
              ) : (
                <ul className="space-y-1">
                  {workflowDefinition.projects.map((workflowProject) => {
                    const project = projects.find(
                      (p) => p.id === workflowProject.id,
                    );
                    return (
                      <Badge key={workflowProject.id} variant="secondary">
                        <Link
                          href={`/platform/project/${workflowProject.id}`}
                          className="hover:underline"
                        >
                          {project?.name ?? workflowProject.id}
                        </Link>
                      </Badge>
                    );
                  })}
                </ul>
              )}
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Actions</FieldLabel>
            <FieldContent>
              <span className="text-sm">
                {workflowDefinition.actions.length}
              </span>
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Edges</FieldLabel>
            <FieldContent>
              <span className="text-sm">{workflowDefinition.edges.length}</span>
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Created at</FieldLabel>
            <FieldContent>
              <span className="text-sm">
                {workflowDefinitionDomainService.getCreatedAt()}
              </span>
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Updated at</FieldLabel>
            <FieldContent>
              <span className="text-sm">
                {workflowDefinitionDomainService.getUpdatedAt()}
              </span>
            </FieldContent>
          </Field>
        </FieldGroup>
      </FieldSet>

      <Separator />

      <Field orientation="horizontal">
        <Button type="button" variant="outline" onClick={onEdit}>
          Edit
        </Button>
      </Field>
    </>
  );
}
