"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PlatformPageTemplate } from "@/component/platform/platform-page-template";
import { NewWorkflowDefinitionForm } from "@/feature/new-workflow-definition/new-workflow-definition-form";
import type { NewWorkflowDefinitionFormValues } from "@/feature/new-workflow-definition/new-workflow-definition-form-schema";
import { useNewWorkflowDefinitionForm } from "@/feature/new-workflow-definition/use-new-workflow-definition-form";
import { useListProjects } from "@/module/project/use-list-projects";
import { useCreateWorkflowDefinition } from "@/module/workflow/use-create-workflow-definition";
import type {
  WorkflowAction,
  WorkflowEdge,
} from "@/module/workflow/workflow-definition-type";

export function NewWorkflowDefinitionPage() {
  const router = useRouter();

  const { data: projects = [] } = useListProjects();
  const { isPending, mutateAsync } = useCreateWorkflowDefinition();
  const form = useNewWorkflowDefinitionForm({ disabled: isPending });

  const handleValidFormSubmit = async (
    data: NewWorkflowDefinitionFormValues,
  ) => {
    try {
      await mutateAsync({
        body: {
          name: data.name,
          description: data.description,
          projects: data.projects.map((id) => ({ id })),
          actions: JSON.parse(data.actionsJson) as WorkflowAction[],
          edges: JSON.parse(data.edgesJson) as WorkflowEdge[],
          isActive: data.isActive,
        },
      });
      form.reset();
      toast.success("Workflow created successfully");
      router.push("/platform/workflow");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create workflow");
    }
  };

  return (
    <PlatformPageTemplate heading="New Workflow">
      <NewWorkflowDefinitionForm
        form={form}
        projects={projects}
        handleValidFormSubmit={handleValidFormSubmit}
        handleInvalidFormSubmit={() => {
          toast.error("Please fix the errors in the form");
        }}
      />
    </PlatformPageTemplate>
  );
}
