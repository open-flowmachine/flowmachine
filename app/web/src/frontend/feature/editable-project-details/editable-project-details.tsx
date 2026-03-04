import { CopyIcon } from "lucide-react";
import type { ProjectDomain } from "@/domain/entity/project/project-domain-schema";
import { makeProjectDomainService } from "@/domain/entity/project/project-domain-service";
import { Button } from "@/frontend/component/ui/button";
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/frontend/component/ui/field";

type EditableProjectDetailsProps = {
  project: ProjectDomain;
  onCopy: (text: string) => void;
  onEdit: () => void;
};

export function EditableProjectDetails({
  project,
  onCopy,
  onEdit,
}: EditableProjectDetailsProps) {
  const projectDomainService = makeProjectDomainService({ project });

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
      <Field orientation="horizontal">
        <Button type="button" variant="outline" onClick={onEdit}>
          Edit
        </Button>
      </Field>
    </>
  );
}
