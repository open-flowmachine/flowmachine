"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PlatformPageTemplate } from "@/component/platform/platform-page-template";
import { NewGitRepositoryForm } from "@/feature/new-git-repository/new-git-repository-form";
import type { NewGitRepositoryFormValues } from "@/feature/new-git-repository/new-git-repository-form-schema";
import { useNewGitRepositoryForm } from "@/feature/new-git-repository/use-new-git-repository-form";
import { useCreateGitRepository } from "@/module/git-repository/use-create-git-repository";
import { useListProjects } from "@/module/project/use-list-projects";

export function NewGitRepositoryPage() {
  const router = useRouter();

  const { data: projects = [] } = useListProjects();
  const { isPending, mutateAsync } = useCreateGitRepository();
  const form = useNewGitRepositoryForm({ disabled: isPending });

  const handleValidFormSubmit = async (data: NewGitRepositoryFormValues) => {
    try {
      await mutateAsync({
        body: {
          name: data.name,
          url: data.url,
          config: data.config,
          integration: data.integration,
          projects: data.projects.map((id) => ({
            id,
            syncStatus: "idle" as const,
            syncedAt: null,
          })),
        },
      });
      form.reset();
      toast.success("Git Repository created successfully");
      router.push("/platform/git-repository");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create Git Repository");
    }
  };

  return (
    <PlatformPageTemplate heading="New Git Repository">
      <NewGitRepositoryForm
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
