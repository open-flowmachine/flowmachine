import { CopyIcon } from "lucide-react";
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
import type { Project } from "@/module/project/project-type";
import {
  makeProjectService,
  projectProviderToDisplayName,
} from "@/module/project/project-service";

type EditableProjectDetailsProps = {
  project: Project;
  onCopy: (text: string) => void;
  onEdit: () => void;
};

export function EditableProjectDetails({
  project,
  onCopy,
  onEdit,
}: EditableProjectDetailsProps) {
  const projectDomainService = makeProjectService({ project });

  return (
    <>
      <FieldSet>
        <FieldLegend>Basic</FieldLegend>
        <FieldGroup>
          <Field>
            <FieldLabel>ID</FieldLabel>
            <FieldContent className="flex-row items-center gap-x-1">
              <span className="text-sm">{project.id}</span>
              <Button
                size="icon-xs"
                variant="ghost"
                onClick={() => onCopy(project.id)}
              >
                <CopyIcon />
              </Button>
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Name</FieldLabel>
            <FieldContent>
              <span className="text-sm">{project.name}</span>
            </FieldContent>
          </Field>
        </FieldGroup>
      </FieldSet>

      {project.integration && (
        <>
          <Separator />
          <FieldSet>
            <FieldLegend>Integration</FieldLegend>
            <FieldGroup>
              <Field>
                <FieldLabel>Provider</FieldLabel>
                <FieldContent>
                  <Badge variant="secondary" className="w-fit">
                    {projectProviderToDisplayName[project.integration.provider]}
                  </Badge>
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel>Domain</FieldLabel>
                <FieldContent>
                  <span className="text-sm">{project.integration.domain}</span>
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel>Credential ID</FieldLabel>
                <FieldContent>
                  <span className="text-sm">
                    {project.integration.credentialId}
                  </span>
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel>External ID</FieldLabel>
                <FieldContent>
                  <span className="text-sm">
                    {project.integration.externalId}
                  </span>
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel>External Key</FieldLabel>
                <FieldContent>
                  <span className="text-sm">
                    {project.integration.externalKey}
                  </span>
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel>Webhook Secret</FieldLabel>
                <FieldContent>
                  <span className="text-sm">
                    {project.integration.webhookSecret}
                  </span>
                </FieldContent>
              </Field>
            </FieldGroup>
          </FieldSet>
        </>
      )}

      <Separator />

      <FieldSet>
        <FieldGroup>
          <Field>
            <FieldLabel>Created at</FieldLabel>
            <FieldContent>
              <span className="text-sm">
                {projectDomainService.getCreatedAt()}
              </span>
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Updated at</FieldLabel>
            <FieldContent>
              <span className="text-sm">
                {projectDomainService.getUpdatedAt()}
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
