import { CopyIcon } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/component/ui/badge";
import { Button } from "@/component/ui/button";
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/component/ui/field";
import { Separator } from "@/component/ui/separator";
import { makeAiAgentService } from "@/module/ai-agent/ai-agent-service";
import type { AiAgent } from "@/module/ai-agent/ai-agent-type";
import type { Project } from "@/module/project/project-type";

type EditableAiAgentDetailsProps = {
  aiAgent: AiAgent;
  onCopy: (text: string) => void;
  onEdit: () => void;
  projects: Project[];
};

export function EditableAiAgentDetails({
  aiAgent,
  onCopy,
  onEdit,
  projects,
}: EditableAiAgentDetailsProps) {
  const aiAgentDomainService = makeAiAgentService({ aiAgent });

  return (
    <>
      <FieldSet>
        <FieldLegend>Basic</FieldLegend>
        <FieldGroup>
          <Field>
            <FieldLabel>ID</FieldLabel>
            <FieldContent className="flex-row items-center gap-x-1">
              <span className="text-sm">{aiAgent.id}</span>
              <Button
                size="icon-xs"
                variant="ghost"
                onClick={() => onCopy(aiAgent.id)}
              >
                <CopyIcon />
              </Button>
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Name</FieldLabel>
            <FieldContent>
              <span className="text-sm">{aiAgent.name}</span>
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Model</FieldLabel>
            <FieldContent>
              <Badge variant="secondary" className="w-fit">
                {aiAgentDomainService.getModelDisplayName()}
              </Badge>
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Assigned projects</FieldLabel>
            <FieldContent>
              {aiAgent.projects.length === 0 ? (
                <span className="text-muted-foreground text-sm">
                  No projects assigned
                </span>
              ) : (
                <ul className="space-y-1">
                  {aiAgent.projects.map((agentProject) => {
                    const project = projects.find(
                      (p) => p.id === agentProject.id,
                    );
                    return (
                      <Badge key={agentProject.id} variant="secondary">
                        <Link
                          href={`/platform/project/${agentProject.id}`}
                          className="hover:underline"
                        >
                          {project?.name ?? agentProject.id}
                        </Link>
                      </Badge>
                    );
                  })}
                </ul>
              )}
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Created at</FieldLabel>
            <FieldContent>
              <span className="text-sm">
                {aiAgentDomainService.getCreatedAt()}
              </span>
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Updated at</FieldLabel>
            <FieldContent>
              <span className="text-sm">
                {aiAgentDomainService.getUpdatedAt()}
              </span>
            </FieldContent>
          </Field>
        </FieldGroup>
      </FieldSet>

      <Separator />

      <Field orientation="horizontal">
        <Button type="button" variant="outline" onClick={onEdit}>
          Edit
        </Button>
      </Field>
    </>
  );
}
