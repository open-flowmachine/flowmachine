"use client";

import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  WorkflowJsonEditor,
  type WorkflowJsonEditorData,
  workflowToEditorJson,
} from "@/app/platform/workflow/_component/workflow-json-editor";
import { Center } from "@/presentation/component/extended-ui/center";
import { Pending } from "@/presentation/component/extended-ui/pending";
import { PlatformPageTemplate } from "@/presentation/component/platform/platform-page-template";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/presentation/component/ui/tabs";
import { useGetWorkflowDefinition } from "@/presentation/hook/workflow-definition/use-get-workflow-definition";
import { useUpdateWorkflowDefinition } from "@/presentation/hook/workflow-definition/use-update-workflow-definition";

export default function Page() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: workflow, isPending: isLoading } = useGetWorkflowDefinition(
    params.id,
  );
  const updateWorkflow = useUpdateWorkflowDefinition({
    onSuccess: () => {
      toast.success("Workflow updated successfully");
      router.push("/platform/workflow");
    },
    onError: () => {
      toast.error("Failed to update workflow");
    },
  });

  const handleSave = (data: WorkflowJsonEditorData) => {
    updateWorkflow.mutate({
      params: { id: params.id },
      body: {
        name: data.name,
        description: data.description,
        projectId: workflow?.projectId ?? null,
        actions: data.actions,
        edges: data.edges,
      },
    });
  };

  if (isLoading) {
    return (
      <PlatformPageTemplate heading="Edit Workflow">
        <Center>
          <Pending />
        </Center>
      </PlatformPageTemplate>
    );
  }

  if (!workflow) {
    return (
      <PlatformPageTemplate heading="Edit Workflow">
        <Center>
          <p className="text-muted-foreground">Workflow not found</p>
        </Center>
      </PlatformPageTemplate>
    );
  }

  return (
    <PlatformPageTemplate heading={`Edit: ${workflow.name}`}>
      <Tabs defaultValue="json" className="grid h-full grid-rows-[auto_1fr]">
        <TabsList className="w-fit">
          <TabsTrigger disabled value="ui">
            UI Editor
          </TabsTrigger>
          <TabsTrigger value="json">JSON Editor</TabsTrigger>
        </TabsList>
        <TabsContent className="overflow-hidden" value="json">
          <WorkflowJsonEditor
            key={params.id}
            initialValue={workflowToEditorJson(workflow)}
            onSave={handleSave}
            isPending={updateWorkflow.isPending}
            saveButtonLabel="Save"
          />
        </TabsContent>
      </Tabs>
    </PlatformPageTemplate>
  );
}
