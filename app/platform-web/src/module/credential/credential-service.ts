import { format } from "date-fns";
import type { Credential } from "@/module/credential/credential-type";

const typeToDisplayName = {
  apiKey: "API Key",
  basic: "Basic",
} as const satisfies Record<Credential["type"], string>;

const makeCredentialService = (input: { credential: Credential }) => {
  const { credential } = input;
  return {
    getName: () => credential.name,
    getTypeDisplayName: () => typeToDisplayName[credential.type],
    getCreatedAt: () => format(credential.createdAt, "MMM d, yyyy, h:mm a"),
    getUpdatedAt: () => format(credential.updatedAt, "MMM d, yyyy, h:mm a"),
    getExpiredAt: () => format(credential.expiredAt, "MMM d, yyyy, h:mm a"),
    getMaskedValue: () => {
      if (credential.type === "apiKey") {
        const key = credential.apiKey;
        if (key.length <= 8) return "••••••••";
        return `${key.slice(0, 4)}${"•".repeat(key.length - 8)}${key.slice(-4)}`;
      }
      return credential.username;
    },
  };
};

export { makeCredentialService };
