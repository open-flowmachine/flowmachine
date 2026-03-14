import { Separator } from "@base-ui/react/separator";
import {
  Controller,
  type FieldErrors,
  type UseFormReturn,
} from "react-hook-form";
import type { GitRepositoryDomain } from "@/domain/entity/git-repository/git-repository-domain-schema";
import { makeGitRepositoryDomainService } from "@/domain/entity/git-repository/git-repository-domain-service";
import type { ProjectDomain } from "@/domain/entity/project/project-domain-schema";
import { Button } from "@/frontend/component/ui/button";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/frontend/component/ui/combobox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/frontend/component/ui/field";
import { Input } from "@/frontend/component/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/frontend/component/ui/select";
import { Spinner } from "@/frontend/component/ui/spinner";
import type { EditGitRepositoryFormValues } from "@/frontend/feature/editable-git-repository-details/edit-git-repository-form-schema";

type EditGitRepositoryFormProps = {
  gitRepository: GitRepositoryDomain;
  form: UseFormReturn<EditGitRepositoryFormValues>;
  projects: ProjectDomain[];
  onCancel: () => void;
  onValidFormSubmit: (values: EditGitRepositoryFormValues) => Promise<void>;
  onInvalidFormSubmit: (
    values: FieldErrors<EditGitRepositoryFormValues>,
  ) => void;
};

const gitProviderOptions = [
  { value: "github", label: "GitHub" },
  { value: "gitlab", label: "GitLab" },
] as const;

export function EditGitRepositoryForm({
  gitRepository,
  form,
  projects,
  onCancel,
  onValidFormSubmit,
  onInvalidFormSubmit,
}: EditGitRepositoryFormProps) {
  const gitRepositoryDomainService = makeGitRepositoryDomainService({
    gitRepository,
  });
  const chipsRef = useComboboxAnchor();

  return (
    <form
      className="space-y-6"
      onSubmit={form.handleSubmit(onValidFormSubmit, onInvalidFormSubmit)}
    >
      <FieldSet>
        <FieldLegend>Basic</FieldLegend>
        <FieldGroup>
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <FieldDescription>
                  A memorable name for your git repository
                </FieldDescription>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  autoComplete="off"
                  disabled={form.formState.isSubmitting}
                  id="name"
                  placeholder="my-repository"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="url"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="url">URL</FieldLabel>
                <FieldDescription>
                  The clone URL for the repository
                </FieldDescription>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  autoComplete="off"
                  disabled={form.formState.isSubmitting}
                  id="url"
                  placeholder="https://github.com/org/repo.git"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>
      </FieldSet>

      <Separator />

      <FieldSet>
        <FieldLegend>Configuration</FieldLegend>
        <FieldGroup>
          <Controller
            name="config.defaultBranch"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="config.defaultBranch">
                  Default Branch
                </FieldLabel>
                <FieldDescription>
                  The default branch for this repository
                </FieldDescription>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  autoComplete="off"
                  disabled={form.formState.isSubmitting}
                  id="config.defaultBranch"
                  placeholder="main"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="config.email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="config.email">Email</FieldLabel>
                <FieldDescription>
                  The email address for git commits
                </FieldDescription>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  autoComplete="off"
                  disabled={form.formState.isSubmitting}
                  id="config.email"
                  placeholder="user@example.com"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="config.username"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="config.username">Username</FieldLabel>
                <FieldDescription>
                  The username for git commits
                </FieldDescription>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  autoComplete="off"
                  disabled={form.formState.isSubmitting}
                  id="config.username"
                  placeholder="username"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>
      </FieldSet>

      <Separator />

      <FieldSet>
        <FieldLegend>Integration</FieldLegend>
        <FieldGroup>
          <Controller
            name="integration.provider"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field orientation="responsive" data-invalid={fieldState.invalid}>
                <FieldContent>
                  <FieldLabel htmlFor="integration.provider">
                    Provider
                  </FieldLabel>
                  <FieldDescription>The git hosting provider</FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </FieldContent>
                <Select
                  disabled={form.formState.isSubmitting}
                  name={field.name}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    id="integration.provider"
                    aria-invalid={fieldState.invalid}
                    className="min-w-[120px]"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
                    align="end"
                    side="bottom"
                    alignItemWithTrigger={false}
                  >
                    {gitProviderOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
          <Controller
            name="integration.credentialId"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="integration.credentialId">
                  Credential ID
                </FieldLabel>
                <FieldDescription>
                  The credential used to authenticate with the provider
                </FieldDescription>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  autoComplete="off"
                  disabled={form.formState.isSubmitting}
                  id="integration.credentialId"
                  placeholder="credential-id"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>
      </FieldSet>

      <Separator />

      <FieldSet>
        <FieldLegend>Projects</FieldLegend>
        <FieldGroup>
          <Controller
            name="projects"
            control={form.control}
            render={({ field, fieldState }) => {
              const selectedProjects = projects.filter((p) =>
                field.value.includes(p.id),
              );
              return (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Assigned projects</FieldLabel>
                  <FieldDescription>
                    Select which projects this git repository belongs to. You
                    can assign it to multiple projects.
                  </FieldDescription>
                  <Combobox
                    multiple
                    items={projects}
                    value={selectedProjects}
                    onValueChange={(next: ProjectDomain[]) =>
                      field.onChange(next.map((p) => p.id))
                    }
                  >
                    <ComboboxChips ref={chipsRef}>
                      <ComboboxValue>
                        {(value: ProjectDomain[]) => (
                          <>
                            {value.map((project) => (
                              <ComboboxChip
                                key={project.id}
                                aria-label={project.name}
                              >
                                {project.name}
                              </ComboboxChip>
                            ))}
                            <ComboboxChipsInput
                              disabled={form.formState.isSubmitting}
                              placeholder={
                                value.length > 0 ? "" : "Search projects..."
                              }
                            />
                          </>
                        )}
                      </ComboboxValue>
                    </ComboboxChips>
                    <ComboboxContent anchor={chipsRef}>
                      <ComboboxList>
                        {(project: ProjectDomain) => (
                          <ComboboxItem key={project.id} value={project}>
                            {project.name}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                      <ComboboxEmpty>No projects found</ComboboxEmpty>
                    </ComboboxContent>
                  </Combobox>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              );
            }}
          />
        </FieldGroup>
      </FieldSet>

      <Separator />

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

      <Separator />

      <Field orientation="horizontal">
        <Button
          disabled={form.formState.isSubmitting}
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button disabled={form.formState.isSubmitting} type="submit">
          {form.formState.isSubmitting ? (
            <>
              <Spinner />
              Saving...
            </>
          ) : (
            "Save"
          )}
        </Button>
      </Field>
    </form>
  );
}
