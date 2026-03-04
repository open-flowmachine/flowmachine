"use client";

import { useQueryClient } from "@tanstack/react-query";
import { isNil } from "es-toolkit";
import { useState } from "react";
import { toast } from "sonner";
import { PlatformPageNotFoundError } from "@/frontend/component/platform/platform-page-not-found-error";
import { PlatformPageTemplate } from "@/frontend/component/platform/platform-page-template";
import { EditAiAgentForm } from "@/frontend/feature/editable-ai-agent-details/edit-ai-agent-form";
import type { EditAiAgentFormValues } from "@/frontend/feature/editable-ai-agent-details/edit-ai-agent-form-schema";
import { EditableAiAgentDetails } from "@/frontend/feature/editable-ai-agent-details/editable-ai-agent-details";
import { useEditAiAgentForm } from "@/frontend/feature/editable-ai-agent-details/use-edit-ai-agent-form";
import { useGetAiAgent } from "@/frontend/hook/ai-agent/use-get-ai-agent";
import { useUpdateAiAgent } from "@/frontend/hook/ai-agent/use-update-ai-agent";
import { useCopyToClipboard } from "@/frontend/hook/use-copy-to-clipboard";
import { makeGetAiAgentQueryKey } from "@/frontend/lib/query/query-key";

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
  const { mutateAsync } = useUpdateAiAgent();

  const form = useEditAiAgentForm();

  const handleCopy = async (text: string) => {
    await copyToClipboard(text);
    toast.success("Copied to clipboard");
  };

  const handleEdit = () => {
    if (data) {
      form.reset({ name: data.name, model: data.model });
    }
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleValidFormSubmit = async (formData: EditAiAgentFormValues) => {
    try {
      await mutateAsync({ params: { id }, body: formData });
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
            onCancel={handleCancel}
            onValidFormSubmit={handleValidFormSubmit}
            onInvalidFormSubmit={() => {}}
          />
        ) : (
          <EditableAiAgentDetails aiAgent={data} onCopy={handleCopy} onEdit={handleEdit} />
        )}
      </div>
    </PlatformPageTemplate>
  );
}
