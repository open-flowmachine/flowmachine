import type { Brand } from "@/domain/shared/id";

type CredentialId = Brand<string, "CredentialId">;
const CredentialId = (value: string): CredentialId => value as CredentialId;

export { CredentialId };
