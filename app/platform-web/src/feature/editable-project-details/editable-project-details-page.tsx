"use client";

import { useQueryClient } from "@tanstack/react-query";
import { isNil } from "es-toolkit";
import { useState } from "react";
import { toast } from "sonner";
import { PlatformPageNotFoundError } from "@/component/platform/platform-page-not-found-error";
import { PlatformPageTemplate } from "@/component/platform/platform-page-template";
import { EditProjectForm } from "@/feature/editable-project-details/edit-project-form";
import type { EditProjectFormValues } from "@/feature/editable-project-details/edit-project-form-schema";
import { EditableProjectDetails } from "@/feature/editable-project-details/editable-project-details";
import { useEditProjectForm } from "@/feature/editable-project-details/use-edit-project-form";
import { useCopyToClipboard } from "@/hook/use-copy-to-clipboard";
import { makeGetProjectQueryKey } from "@/lib/query/query-key";
import { useGetProject } from "@/module/project/use-get-project";
import { useUpdateProject } from "@/module/project/use-update-project";

type EditableProjectDetailsPageProps = {
  id: string;
};

export function EditableProjectDetailsPage({
  id,
}: EditableProjectDetailsPageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [_, copyToClipboard] = useCopyToClipboard();

  const queryClient = useQueryClient();
  const { data, isPending, isError } = useGetProject(id);
  const { mutateAsync } = useUpdateProject();

  const form = useEditProjectForm();

  const handleCopy = async (text: string) => {
    await copyToClipboard(text);
    toast.success("Copied to clipboard");
  };

  const handleEdit = () => {
    if (data) {
      form.reset({
        name: data.name,
        integrationProvider: data.integration?.provider ?? "jira",
        integrationDomain: data.integration?.domain ?? "",
        integrationCredentialId: data.integration?.credentialId ?? "",
        integrationExternalId: data.integration?.externalId ?? "",
        integrationExternalKey: data.integration?.externalKey ?? "",
        integrationWebhookSecret: data.integration?.webhookSecret ?? "",
      });
    }
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleValidFormSubmit = async (formData: EditProjectFormValues) => {
    try {
      await mutateAsync({
        params: { id },
        body: {
          name: formData.name,
          integration: {
            provider: formData.integrationProvider,
            domain: formData.integrationDomain,
            credentialId: formData.integrationCredentialId,
            externalId: formData.integrationExternalId,
            externalKey: formData.integrationExternalKey,
            webhookSecret: formData.integrationWebhookSecret,
          },
        },
      });
      await queryClient.invalidateQueries({
        queryKey: makeGetProjectQueryKey(id),
      });
      toast.success("Project updated successfully");
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update project");
    }
  };

  if (isNil(data) || isError) {
    return (
      <PlatformPageTemplate heading="Project">
        <PlatformPageNotFoundError />
      </PlatformPageTemplate>
    );
  }

  return (
    <PlatformPageTemplate
      heading={data?.name ?? "Project"}
      isPending={isPending}
    >
      <div className="max-w-2xl space-y-6">
        {isEditing ? (
          <EditProjectForm
            project={data}
            form={form}
            onCancel={handleCancel}
            onValidFormSubmit={handleValidFormSubmit}
            onInvalidFormSubmit={() => {}}
          />
        ) : (
          <EditableProjectDetails
            project={data}
            onCopy={handleCopy}
            onEdit={handleEdit}
          />
        )}
      </div>
    </PlatformPageTemplate>
  );
}
