import type { CredentialId } from "@/domain/credential/credential-id";

const projectProviders = ["jira", "linear"] as const;
type ProjectProvider = (typeof projectProviders)[number];

type ProjectIntegration = {
  readonly domain: string;
  readonly externalId: string;
  readonly externalKey: string;
  readonly provider: ProjectProvider;
  readonly webhookSecret: string;
  readonly credentialId: CredentialId;
};

const isValidProjectIntegration = (input: {
  domain: string;
  externalId: string;
  externalKey: string;
  provider: ProjectProvider;
  webhookSecret: string;
  credentialId: CredentialId;
}): input is ProjectIntegration =>
  input.domain.length > 0 &&
  input.externalId.length > 0 &&
  input.externalKey.length > 0 &&
  input.webhookSecret.length > 0 &&
  input.credentialId.length > 0;

export { isValidProjectIntegration, projectProviders };
export type { ProjectIntegration, ProjectProvider };
