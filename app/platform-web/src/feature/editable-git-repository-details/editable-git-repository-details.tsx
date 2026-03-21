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
import type { GitRepository } from "@/module/git-repository/git-repository-type";
import { makeGitRepositoryService } from "@/module/git-repository/git-repository-service";
import type { Project } from "@/module/project/project-type";

type EditableGitRepositoryDetailsProps = {
  gitRepository: GitRepository;
  projects: Project[];
  onCopy: (text: string) => void;
  onEdit: () => void;
};

export function EditableGitRepositoryDetails({
  gitRepository,
  projects,
  onCopy,
  onEdit,
}: EditableGitRepositoryDetailsProps) {
  const gitRepositoryService = makeGitRepositoryService({
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

      <Separator />

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

      <Separator />

      <FieldSet>
        <FieldLegend>Integration</FieldLegend>
        <FieldGroup>
          <Field>
            <FieldLabel>Provider</FieldLabel>
            <FieldContent>
              <Badge variant="secondary" className="w-fit">
                {gitRepositoryService.getProviderDisplayName()}
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

      <Separator />

      <FieldSet>
        <FieldLegend>Projects</FieldLegend>
        <FieldGroup>
          <Field>
            <FieldLabel>Assigned projects</FieldLabel>
            <FieldContent>
              {gitRepository.projects.length === 0 ? (
                <span className="text-muted-foreground text-sm">
                  No projects assigned
                </span>
              ) : (
                <ul className="space-y-1">
                  {gitRepository.projects.map((repoProject) => {
                    const project = projects.find(
                      (p) => p.id === repoProject.id,
                    );
                    return (
                      <Badge key={repoProject.id} variant="secondary">
                        <Link
                          href={`/platform/project/${repoProject.id}`}
                          className="hover:underline"
                        >
                          {project?.name ?? repoProject.id}
                        </Link>
                      </Badge>
                    );
                  })}
                </ul>
              )}
            </FieldContent>
          </Field>
        </FieldGroup>
      </FieldSet>

      <Separator />

      <FieldSet>
        <FieldGroup>
          <Field>
            <FieldLabel>Created at</FieldLabel>
            <FieldContent>
              <span className="text-sm">
                {gitRepositoryService.getCreatedAt()}
              </span>
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Updated at</FieldLabel>
            <FieldContent>
              <span className="text-sm">
                {gitRepositoryService.getUpdatedAt()}
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
