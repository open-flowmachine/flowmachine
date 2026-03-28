"use client";

import { useQueryClient } from "@tanstack/react-query";
import { isNil } from "es-toolkit";
import { useState } from "react";
import { toast } from "sonner";
import { PlatformPageNotFoundError } from "@/component/platform/platform-page-not-found-error";
import { PlatformPageTemplate } from "@/component/platform/platform-page-template";
import { EditWorkflowDefinitionForm } from "@/feature/editable-workflow-definition-details/edit-workflow-definition-form";
import type { EditWorkflowDefinitionFormValues } from "@/feature/editable-workflow-definition-details/edit-workflow-definition-form-schema";
import { EditableWorkflowDefinitionDetails } from "@/feature/editable-workflow-definition-details/editable-workflow-definition-details";
import { useEditWorkflowDefinitionForm } from "@/feature/editable-workflow-definition-details/use-edit-workflow-definition-form";
import { useCopyToClipboard } from "@/hook/use-copy-to-clipboard";
import { makeGetWorkflowDefinitionQueryKey } from "@/lib/query/query-key";
import { useListProjects } from "@/module/project/use-list-projects";
import { useGetWorkflowDefinition } from "@/module/workflow/use-get-workflow-definition";
import { useUpdateWorkflowDefinition } from "@/module/workflow/use-update-workflow-definition";
import type {
  WorkflowAction,
  WorkflowEdge,
} from "@/module/workflow/workflow-definition-type";

type EditableWorkflowDefinitionDetailsPageProps = {
  id: string;
};

export function EditableWorkflowDefinitionDetailsPage({
  id,
}: EditableWorkflowDefinitionDetailsPageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [_, copyToClipboard] = useCopyToClipboard();

  const queryClient = useQueryClient();
  const {
    data: workflowEnvelope,
    isPending,
    isError,
  } = useGetWorkflowDefinition(id);
  const workflowDefinition = workflowEnvelope?.data;
  const { data: projects = [] } = useListProjects();
  const { mutateAsync } = useUpdateWorkflowDefinition();

  const form = useEditWorkflowDefinitionForm();

  const handleCopy = async (text: string) => {
    await copyToClipboard(text);
    toast.success("Copied to clipboard");
  };

  const handleEdit = () => {
    if (workflowDefinition) {
      form.reset({
        name: workflowDefinition.name,
        description: workflowDefinition.description ?? "",
        projects: workflowDefinition.projects.map((p) => p.id),
        isActive: workflowDefinition.isActive,
        actionsJson: JSON.stringify(workflowDefinition.actions, null, 4),
        edgesJson: JSON.stringify(workflowDefinition.edges, null, 4),
      });
    }
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleValidFormSubmit = async (
    formData: EditWorkflowDefinitionFormValues,
  ) => {
    try {
      await mutateAsync({
        params: { id },
        body: {
          name: formData.name,
          description: formData.description,
          projects: formData.projects.map((projectId) => ({ id: projectId })),
          actions: JSON.parse(formData.actionsJson) as WorkflowAction[],
          edges: JSON.parse(formData.edgesJson) as WorkflowEdge[],
          isActive: formData.isActive,
        },
      });
      await queryClient.invalidateQueries({
        queryKey: makeGetWorkflowDefinitionQueryKey(id),
      });
      toast.success("Workflow updated successfully");
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update workflow");
    }
  };

  if (isNil(workflowDefinition) || isError) {
    return (
      <PlatformPageTemplate heading="Workflow">
        <PlatformPageNotFoundError />
      </PlatformPageTemplate>
    );
  }

  return (
    <PlatformPageTemplate
      heading={workflowDefinition?.name ?? "Workflow"}
      isPending={isPending}
    >
      <div className="max-w-2xl space-y-6">
        {isEditing ? (
          <EditWorkflowDefinitionForm
            workflowDefinition={workflowDefinition}
            form={form}
            projects={projects}
            onCancel={handleCancel}
            onValidFormSubmit={handleValidFormSubmit}
            onInvalidFormSubmit={() => {}}
          />
        ) : (
          <EditableWorkflowDefinitionDetails
            workflowDefinition={workflowDefinition}
            onCopy={handleCopy}
            onEdit={handleEdit}
            projects={projects}
          />
        )}
      </div>
    </PlatformPageTemplate>
  );
}
