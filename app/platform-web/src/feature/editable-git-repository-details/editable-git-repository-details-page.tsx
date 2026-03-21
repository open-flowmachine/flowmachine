"use client";

import { useQueryClient } from "@tanstack/react-query";
import { isNil } from "es-toolkit";
import { useState } from "react";
import { toast } from "sonner";
import { PlatformPageNotFoundError } from "@/component/platform/platform-page-not-found-error";
import { PlatformPageTemplate } from "@/component/platform/platform-page-template";
import { EditGitRepositoryForm } from "@/feature/editable-git-repository-details/edit-git-repository-form";
import type { EditGitRepositoryFormValues } from "@/feature/editable-git-repository-details/edit-git-repository-form-schema";
import { EditableGitRepositoryDetails } from "@/feature/editable-git-repository-details/editable-git-repository-details";
import { useEditGitRepositoryForm } from "@/feature/editable-git-repository-details/use-edit-git-repository-form";
import { useCopyToClipboard } from "@/hook/use-copy-to-clipboard";
import { makeGetGitRepositoryQueryKey } from "@/lib/query/query-key";
import { useGetGitRepository } from "@/module/git-repository/use-get-git-repository";
import { useUpdateGitRepository } from "@/module/git-repository/use-update-git-repository";
import { useListProjects } from "@/module/project/use-list-projects";

type EditableGitRepositoryDetailsPageProps = {
  id: string;
};

export function EditableGitRepositoryDetailsPage({
  id,
}: EditableGitRepositoryDetailsPageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [_, copyToClipboard] = useCopyToClipboard();

  const queryClient = useQueryClient();
  const { data, isPending, isError } = useGetGitRepository(id);
  const { data: projects = [] } = useListProjects();
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
        projects: data.projects.map((p) => p.id),
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
      await mutateAsync({
        params: { id },
        body: {
          name: formData.name,
          url: formData.url,
          config: formData.config,
          integration: formData.integration,
          projects: formData.projects.map((projectId) => ({
            id: projectId,
            syncStatus: "idle" as const,
            syncedAt: null,
          })),
        },
      });
      await queryClient.invalidateQueries({
        queryKey: makeGetGitRepositoryQueryKey(id),
      });
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
            projects={projects}
            onCancel={handleCancel}
            onValidFormSubmit={handleValidFormSubmit}
            onInvalidFormSubmit={() => {}}
          />
        ) : (
          <EditableGitRepositoryDetails
            gitRepository={data}
            projects={projects}
            onCopy={handleCopy}
            onEdit={handleEdit}
          />
        )}
      </div>
    </PlatformPageTemplate>
  );
}
