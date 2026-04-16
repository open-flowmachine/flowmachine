const credentialTypes = ["apiKey", "basic"] as const;
type CredentialType = (typeof credentialTypes)[number];

type ApiKeySecret = {
  readonly type: "apiKey";
  readonly name: string;
  readonly apiKey: string;
  readonly expiredAt: Date;
};

type BasicAuthSecret = {
  readonly type: "basic";
  readonly name: string;
  readonly username: string;
  readonly password: string;
  readonly expiredAt: Date;
};

type CredentialSecret = ApiKeySecret | BasicAuthSecret;

export { credentialTypes };
export type { ApiKeySecret, BasicAuthSecret, CredentialSecret, CredentialType };
