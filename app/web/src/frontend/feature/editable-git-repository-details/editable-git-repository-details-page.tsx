"use client";

import { isNil } from "es-toolkit";
import { useState } from "react";
import { toast } from "sonner";
import { PlatformPageNotFoundError } from "@/frontend/component/platform/platform-page-not-found-error";
import { PlatformPageTemplate } from "@/frontend/component/platform/platform-page-template";
import { EditGitRepositoryForm } from "@/frontend/feature/editable-git-repository-details/edit-git-repository-form";
import type { EditGitRepositoryFormValues } from "@/frontend/feature/editable-git-repository-details/edit-git-repository-form-schema";
import { EditableGitRepositoryDetails } from "@/frontend/feature/editable-git-repository-details/editable-git-repository-details";
import { useEditGitRepositoryForm } from "@/frontend/feature/editable-git-repository-details/use-edit-git-repository-form";
import { useGetGitRepository } from "@/frontend/hook/git-repository/use-get-git-repository";
import { useUpdateGitRepository } from "@/frontend/hook/git-repository/use-update-git-repository";
import { useCopyToClipboard } from "@/frontend/hook/use-copy-to-clipboard";

type EditableGitRepositoryDetailsPageProps = {
  id: string;
};

export function EditableGitRepositoryDetailsPage({
  id,
}: EditableGitRepositoryDetailsPageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [_, copyToClipboard] = useCopyToClipboard();

  const { data, isPending, isError } = useGetGitRepository(id);
  const { mutateAsync } = useUpdateGitRepository();

  const form = useEditGitRepositoryForm();

  const handleCopy = async (text: string) => {
    await copyToClipboard(text);
    toast.success("Copied to clipboard");
  };

  const handleEdit = () => {
    if (data) {
      form.reset({
        name: data.name,
        url: data.url,
        config: data.config,
        integration: data.integration,
      });
    }
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleValidFormSubmit = async (
    formData: EditGitRepositoryFormValues,
  ) => {
    try {
      await mutateAsync({ params: { id }, body: formData });
      toast.success("Git repository updated successfully");
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update git repository");
    }
  };

  if (isNil(data) || isError) {
    return (
      <PlatformPageTemplate heading="Git Repository">
        <PlatformPageNotFoundError />
      </PlatformPageTemplate>
    );
  }

  return (
    <PlatformPageTemplate
      heading={data?.name ?? "Git Repository"}
      isPending={isPending}
    >
      <div className="max-w-2xl space-y-6">
        {isEditing ? (
          <EditGitRepositoryForm
            gitRepository={data}
            form={form}
            onCancel={handleCancel}
            onValidFormSubmit={handleValidFormSubmit}
            onInvalidFormSubmit={() => {}}
          />
        ) : (
          <EditableGitRepositoryDetails
            gitRepository={data}
            onCopy={handleCopy}
            onEdit={handleEdit}
          />
        )}
      </div>
    </PlatformPageTemplate>
  );
}
