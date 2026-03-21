"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PlatformPageTemplate } from "@/component/platform/platform-page-template";
import { NewProjectForm } from "@/feature/new-project/new-project-form";
import type { NewProjectFormValues } from "@/feature/new-project/new-project-form-schema";
import { useNewProjectForm } from "@/feature/new-project/use-new-project-form";
import { useCreateProject } from "@/module/project/use-create-project";

export function NewProjectPage() {
  const router = useRouter();

  const { isPending, mutateAsync } = useCreateProject();
  const form = useNewProjectForm({ disabled: isPending });

  const handleValidFormSubmit = async (data: NewProjectFormValues) => {
    try {
      await mutateAsync({
        body: {
          name: data.name,
          integration: {
            credentialId: data.integrationCredentialId,
            domain: data.integrationDomain,
            externalId: data.integrationExternalId,
            externalKey: data.integrationExternalKey,
            provider: data.integrationProvider,
            webhookSecret: data.integrationWebhookSecret,
          },
        },
      });
      form.reset();
      toast.success("Project created successfully");
      router.push("/platform/project");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create project");
    }
  };

  return (
    <PlatformPageTemplate heading="New Project">
      <NewProjectForm
        form={form}
        handleValidFormSubmit={handleValidFormSubmit}
        handleInvalidFormSubmit={() => {
          toast.error("Please fix the errors in the form");
        }}
      />
    </PlatformPageTemplate>
  );
}
