"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  WorkflowJsonEditor,
  type WorkflowJsonEditorData,
} from "@/app/platform/workflow/_component/workflow-json-editor";
import { PlatformPageTemplate } from "@/component/platform/platform-page-template";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/component/ui/tabs";
import { useCreateWorkflowDefinition } from "@/module/workflow/use-create-workflow-definition";

const INITIAL_WORKFLOW_JSON_VALUE = JSON.stringify(
  {
    name: "My Workflow",
    description: "This is my workflow description.",
    actions: [
      {
        id: "00000000-0000-0000-0000-000000000001",
        kind: "start",
        name: "Start Action",
      },
      {
        id: "00000000-0000-0000-0000-000000000002",
        kind: "end",
        name: "End Action",
      },
    ],
    edges: [
      {
        from: "00000000-0000-0000-0000-000000000001",
        to: "00000000-0000-0000-0000-000000000002",
      },
    ],
  },
  null,
  4,
);

export default function Page() {
  const router = useRouter();
  const createWorkflow = useCreateWorkflowDefinition({
    onSuccess: () => {
      toast.success("Workflow created successfully");
      router.push("/platform/workflow");
    },
    onError: () => {
      toast.error("Failed to create workflow");
    },
  });

  const handleSave = (data: WorkflowJsonEditorData) => {
    createWorkflow.mutate({
      body: {
        name: data.name,
        description: data.description,
        projects: [],
        actions: data.actions,
        edges: data.edges,
        isActive: true,
      },
    });
  };

  return (
    <PlatformPageTemplate heading="New Workflow">
      <Tabs defaultValue="json" className="grid h-full grid-rows-[auto_1fr]">
        <TabsList className="w-fit">
          <TabsTrigger disabled value="ui">
            UI Editor
          </TabsTrigger>
          <TabsTrigger value="json">JSON Editor</TabsTrigger>
        </TabsList>
        <TabsContent className="overflow-hidden" value="json">
          <WorkflowJsonEditor
            initialValue={INITIAL_WORKFLOW_JSON_VALUE}
            onSave={handleSave}
            isPending={createWorkflow.isPending}
            saveButtonLabel="Create"
          />
        </TabsContent>
      </Tabs>
    </PlatformPageTemplate>
  );
}
