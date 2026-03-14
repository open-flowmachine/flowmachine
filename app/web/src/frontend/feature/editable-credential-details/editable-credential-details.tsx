import { CopyIcon } from "lucide-react";
import type { CredentialDomain } from "@/domain/entity/credential/credential-domain-schema";
import { makeCredentialDomainService } from "@/domain/entity/credential/credential-domain-service";
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
import { Separator } from "@/frontend/component/ui/separator";

type EditableCredentialDetailsProps = {
  credential: CredentialDomain;
  onCopy: (text: string) => void;
  onEdit: () => void;
};

export function EditableCredentialDetails({
  credential,
  onCopy,
  onEdit,
}: EditableCredentialDetailsProps) {
  const credentialDomainService = makeCredentialDomainService({ credential });

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
                {credentialDomainService.getTypeDisplayName()}
              </Badge>
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>
              {credential.type === "apiKey" ? "API Key" : "Username"}
            </FieldLabel>
            <FieldContent>
              <span className="font-mono text-sm">
                {credentialDomainService.getMaskedValue()}
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
                {credentialDomainService.getExpiredAt()}
              </span>
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Created at</FieldLabel>
            <FieldContent>
              <span className="text-sm">
                {credentialDomainService.getCreatedAt()}
              </span>
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Updated at</FieldLabel>
            <FieldContent>
              <span className="text-sm">
                {credentialDomainService.getUpdatedAt()}
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
