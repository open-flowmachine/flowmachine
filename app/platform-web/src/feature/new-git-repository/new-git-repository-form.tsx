import {
  Controller,
  type SubmitErrorHandler,
  type SubmitHandler,
  type UseFormReturn,
} from "react-hook-form";
import { Button } from "@/component/ui/button";
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
} from "@/component/ui/combobox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/component/ui/field";
import { Input } from "@/component/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/component/ui/select";
import { Separator } from "@/component/ui/separator";
import { Spinner } from "@/component/ui/spinner";
import type { NewGitRepositoryFormValues } from "@/feature/new-git-repository/new-git-repository-form-schema";
import type { Project } from "@/module/project/project-type";

type NewGitRepositoryFormProps = {
  form: UseFormReturn<NewGitRepositoryFormValues>;
  projects: Project[];
  handleValidFormSubmit: SubmitHandler<NewGitRepositoryFormValues>;
  handleInvalidFormSubmit: SubmitErrorHandler<NewGitRepositoryFormValues>;
};

export function NewGitRepositoryForm({
  form,
  projects,
  handleValidFormSubmit,
  handleInvalidFormSubmit,
}: NewGitRepositoryFormProps) {
  const chipsRef = useComboboxAnchor();

  return (
    <form
      className="max-w-2xl space-y-6"
      onSubmit={form.handleSubmit(
        handleValidFormSubmit,
        handleInvalidFormSubmit,
      )}
    >
      <FieldSet>
        <FieldLegend>Basic details</FieldLegend>
        <FieldDescription>
          Fill in the details below to add a new git repository
        </FieldDescription>
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
                  The clone URL of the git repository
                </FieldDescription>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  autoComplete="off"
                  disabled={form.formState.isSubmitting}
                  id="url"
                  placeholder="https://github.com/owner/repo.git"
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
        <FieldDescription>
          Configure the default branch and git identity
        </FieldDescription>
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
                  The default branch of the repository
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
                  The email address used for git commits
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
                  The username used for git commits
                </FieldDescription>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  autoComplete="off"
                  disabled={form.formState.isSubmitting}
                  id="config.username"
                  placeholder="johndoe"
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
        <FieldDescription>
          Configure the git provider integration
        </FieldDescription>
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
                  <FieldDescription>
                    Select the git hosting provider
                  </FieldDescription>
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
                    <SelectItem value="github">GitHub</SelectItem>
                    <SelectItem value="gitlab">GitLab</SelectItem>
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
        <FieldDescription>
          Assign this git repository to one or more projects
        </FieldDescription>
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
                    onValueChange={(next: Project[]) =>
                      field.onChange(next.map((p) => p.id))
                    }
                  >
                    <ComboboxChips ref={chipsRef}>
                      <ComboboxValue>
                        {(value: Project[]) => (
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
                        {(project: Project) => (
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

      <Field orientation="horizontal">
        <Button
          disabled={form.formState.isSubmitting}
          type="button"
          variant="outline"
          onClick={() => form.reset()}
        >
          Reset
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
