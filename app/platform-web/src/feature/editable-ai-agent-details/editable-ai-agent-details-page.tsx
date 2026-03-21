"use client";

import { useQueryClient } from "@tanstack/react-query";
import { isNil } from "es-toolkit";
import { useState } from "react";
import { toast } from "sonner";
import { PlatformPageNotFoundError } from "@/component/platform/platform-page-not-found-error";
import { PlatformPageTemplate } from "@/component/platform/platform-page-template";
import { EditAiAgentForm } from "@/feature/editable-ai-agent-details/edit-ai-agent-form";
import type { EditAiAgentFormValues } from "@/feature/editable-ai-agent-details/edit-ai-agent-form-schema";
import { EditableAiAgentDetails } from "@/feature/editable-ai-agent-details/editable-ai-agent-details";
import { useEditAiAgentForm } from "@/feature/editable-ai-agent-details/use-edit-ai-agent-form";
import { useCopyToClipboard } from "@/hook/use-copy-to-clipboard";
import { makeGetAiAgentQueryKey } from "@/lib/query/query-key";
import { useGetAiAgent } from "@/module/ai-agent/use-get-ai-agent";
import { useUpdateAiAgent } from "@/module/ai-agent/use-update-ai-agent";
import { useListProjects } from "@/module/project/use-list-projects";

type EditableAiAgentDetailsPageProps = {
  id: string;
};

export function EditableAiAgentDetailsPage({
  id,
}: EditableAiAgentDetailsPageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [_, copyToClipboard] = useCopyToClipboard();

  const queryClient = useQueryClient();
  const { data, isPending, isError } = useGetAiAgent(id);
  const { data: projects = [] } = useListProjects();
  const { mutateAsync } = useUpdateAiAgent();

  const form = useEditAiAgentForm();

  const handleCopy = async (text: string) => {
    await copyToClipboard(text);
    toast.success("Copied to clipboard");
  };

  const handleEdit = () => {
    if (data) {
      form.reset({
        name: data.name,
        model: data.model,
        projects: data.projects.map((p) => p.id),
      });
    }
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleValidFormSubmit = async (formData: EditAiAgentFormValues) => {
    try {
      await mutateAsync({
        params: { id },
        body: {
          name: formData.name,
          model: formData.model,
          projects: formData.projects.map((projectId) => ({
            id: projectId,
            syncStatus: "idle" as const,
            syncedAt: null,
          })),
        },
      });
      await queryClient.invalidateQueries({
        queryKey: makeGetAiAgentQueryKey(id),
      });
      toast.success("AI Agent updated successfully");
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update AI Agent");
    }
  };

  if (isNil(data) || isError) {
    return (
      <PlatformPageTemplate heading="AI Agent">
        <PlatformPageNotFoundError />
      </PlatformPageTemplate>
    );
  }

  return (
    <PlatformPageTemplate
      heading={data?.name ?? "AI Agent"}
      isPending={isPending}
    >
      <div className="max-w-2xl space-y-6">
        {isEditing ? (
          <EditAiAgentForm
            aiAgent={data}
            form={form}
            projects={projects}
            onCancel={handleCancel}
            onValidFormSubmit={handleValidFormSubmit}
            onInvalidFormSubmit={() => {}}
          />
        ) : (
          <EditableAiAgentDetails
            aiAgent={data}
            onCopy={handleCopy}
            onEdit={handleEdit}
            projects={projects}
          />
        )}
      </div>
    </PlatformPageTemplate>
  );
}
