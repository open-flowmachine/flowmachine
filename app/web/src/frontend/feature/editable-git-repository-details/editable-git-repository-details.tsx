import { CopyIcon } from "lucide-react";
import type { GitRepositoryDomain } from "@/domain/entity/git-repository/git-repository-domain-schema";
import { makeGitRepositoryDomainService } from "@/domain/entity/git-repository/git-repository-domain-service";
import { Badge } from "@/frontend/component/ui/badge";
import { Button } from "@/frontend/component/ui/button";
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/frontend/component/ui/field";

type EditableGitRepositoryDetailsProps = {
  gitRepository: GitRepositoryDomain;
  onCopy: (text: string) => void;
  onEdit: () => void;
};

export function EditableGitRepositoryDetails({
  gitRepository,
  onCopy,
  onEdit,
}: EditableGitRepositoryDetailsProps) {
  const gitRepositoryDomainService = makeGitRepositoryDomainService({
    gitRepository,
  });

  return (
    <>
      <FieldSet>
        <FieldLegend>Basic</FieldLegend>
        <FieldGroup>
          <Field>
            <FieldLabel>ID</FieldLabel>
            <FieldContent className="flex-row items-center gap-x-1">
              <span className="text-sm">{gitRepository.id}</span>
              <Button
                size="icon-xs"
                variant="ghost"
                onClick={() => onCopy(gitRepository.id)}
              >
                <CopyIcon />
              </Button>
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Name</FieldLabel>
            <FieldContent>
              <span className="text-sm">{gitRepository.name}</span>
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>URL</FieldLabel>
            <FieldContent>
              <span className="text-sm">{gitRepository.url}</span>
            </FieldContent>
          </Field>
        </FieldGroup>
      </FieldSet>
      <FieldSet>
        <FieldLegend>Configuration</FieldLegend>
        <FieldGroup>
          <Field>
            <FieldLabel>Default Branch</FieldLabel>
            <FieldContent>
              <span className="text-sm">
                {gitRepository.config.defaultBranch}
              </span>
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Email</FieldLabel>
            <FieldContent>
              <span className="text-sm">{gitRepository.config.email}</span>
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Username</FieldLabel>
            <FieldContent>
              <span className="text-sm">{gitRepository.config.username}</span>
            </FieldContent>
          </Field>
        </FieldGroup>
      </FieldSet>
      <FieldSet>
        <FieldLegend>Integration</FieldLegend>
        <FieldGroup>
          <Field>
            <FieldLabel>Provider</FieldLabel>
            <FieldContent>
              <Badge variant="secondary" className="w-fit">
                {gitRepositoryDomainService.getProviderDisplayName()}
              </Badge>
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Credential ID</FieldLabel>
            <FieldContent>
              <span className="text-sm">
                {gitRepository.integration.credentialId}
              </span>
            </FieldContent>
          </Field>
        </FieldGroup>
      </FieldSet>
      <FieldSet>
        <FieldGroup>
          <Field>
            <FieldLabel>Created at</FieldLabel>
            <FieldContent>
              <span className="text-sm">
                {gitRepositoryDomainService.getCreatedAt()}
              </span>
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Updated at</FieldLabel>
            <FieldContent>
              <span className="text-sm">
                {gitRepositoryDomainService.getUpdatedAt()}
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
