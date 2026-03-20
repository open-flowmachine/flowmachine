import type { Model } from "@/shared/model/model";

const credentialTypes = ["apiKey", "basic"] as const;
type CredentialType = (typeof credentialTypes)[number];

type Credential = Model<
  | {
      type: Extract<CredentialType, "apiKey">;
      name: string;
      apiKey: string;
      expiredAt: Date;
    }
  | {
      type: Extract<CredentialType, "basic">;
      name: string;
      username: string;
      password: string;
      expiredAt: Date;
    }
>;

export { credentialTypes };
export type { Credential, CredentialType };
