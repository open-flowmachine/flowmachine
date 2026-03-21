"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PlatformPageTemplate } from "@/component/platform/platform-page-template";
import { NewAiAgentForm } from "@/feature/new-ai-agent/new-ai-agent-form";
import type { NewAiAgentFormValues } from "@/feature/new-ai-agent/new-ai-agent-form-schema";
import { useNewAiAgentForm } from "@/feature/new-ai-agent/use-new-ai-agent-form";
import { useCreateAiAgent } from "@/module/ai-agent/use-create-ai-agent";
import { useListProjects } from "@/module/project/use-list-projects";

export function NewAiAgentPage() {
  const router = useRouter();

  const { data: projects = [] } = useListProjects();
  const { isPending, mutateAsync } = useCreateAiAgent();
  const form = useNewAiAgentForm({ disabled: isPending });

  const handleValidFormSubmit = async (data: NewAiAgentFormValues) => {
    try {
      await mutateAsync({
        body: {
          name: data.name,
          model: data.model,
          projects: data.projects.map((id) => ({
            id,
            syncStatus: "idle" as const,
            syncedAt: null,
          })),
        },
      });
      form.reset();
      toast.success("AI Agent created successfully");
      router.push("/platform/ai-agent");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create AI Agent");
    }
  };

  return (
    <PlatformPageTemplate heading="New AI Agent">
      <NewAiAgentForm
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
