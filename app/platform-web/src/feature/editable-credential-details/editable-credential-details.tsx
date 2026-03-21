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
import type { Credential } from "@/module/credential/credential-type";
import { makeCredentialService } from "@/module/credential/credential-service";

type EditableCredentialDetailsProps = {
  credential: Credential;
  onCopy: (text: string) => void;
  onEdit: () => void;
};

export function EditableCredentialDetails({
  credential,
  onCopy,
  onEdit,
}: EditableCredentialDetailsProps) {
  const credentialService = makeCredentialService({ credential });

  return (
    <>
      <FieldSet>
        <FieldLegend>Basic</FieldLegend>
        <FieldGroup>
          <Field>
            <FieldLabel>ID</FieldLabel>
            <FieldContent className="flex-row items-center gap-x-1">
              <span className="text-sm">{credential.id}</span>
              <Button
                size="icon-xs"
                variant="ghost"
                onClick={() => onCopy(credential.id)}
              >
                <CopyIcon />
              </Button>
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Name</FieldLabel>
            <FieldContent>
              <span className="text-sm">{credential.name}</span>
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Type</FieldLabel>
            <FieldContent>
              <Badge variant="secondary" className="w-fit">
                {credentialService.getTypeDisplayName()}
              </Badge>
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>
              {credential.type === "apiKey" ? "API Key" : "Username"}
            </FieldLabel>
            <FieldContent>
              <span className="font-mono text-sm">
                {credentialService.getMaskedValue()}
              </span>
            </FieldContent>
          </Field>
          {credential.type === "basic" && (
            <Field>
              <FieldLabel>Password</FieldLabel>
              <FieldContent>
                <span className="font-mono text-sm">••••••••</span>
              </FieldContent>
            </Field>
          )}
          <Field>
            <FieldLabel>Expired at</FieldLabel>
            <FieldContent>
              <span className="text-sm">
                {credentialService.getExpiredAt()}
              </span>
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Created at</FieldLabel>
            <FieldContent>
              <span className="text-sm">
                {credentialService.getCreatedAt()}
              </span>
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Updated at</FieldLabel>
            <FieldContent>
              <span className="text-sm">
                {credentialService.getUpdatedAt()}
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
