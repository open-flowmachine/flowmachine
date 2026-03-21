import type { DateTime, Id, Model } from "@/lib/schema";

const credentialTypes = ["apiKey", "basic"] as const;

type Credential = Model<
  | {
      type: "apiKey";
      name: string;
      apiKey: string;
      expiredAt: DateTime;
      tenant: { id: Id; type: "organization" | "user" };
    }
  | {
      type: "basic";
      name: string;
      username: string;
      password: string;
      expiredAt: DateTime;
      tenant: { id: Id; type: "organization" | "user" };
    }
>;

type HttpClientCreateCredentialInput = {
  body:
    | {
        type: "apiKey";
        name: string;
        apiKey: string;
        expiredAt: string;
      }
    | {
        type: "basic";
        name: string;
        username: string;
        password: string;
        expiredAt: string;
      };
};

type HttpClientDeleteCredentialInput = {
  params: {
    id: Id;
  };
};

type HttpClientGetCredentialInput = {
  params: {
    id: Id;
  };
};

type HttpClientUpdateCredentialInput = {
  params: {
    id: Id;
  };
  body:
    | {
        type: "apiKey";
        name?: string;
        apiKey?: string;
        expiredAt?: string;
      }
    | {
        type: "basic";
        name?: string;
        username?: string;
        password?: string;
        expiredAt?: string;
      };
};

export { credentialTypes };
export type {
  Credential,
  HttpClientCreateCredentialInput,
  HttpClientDeleteCredentialInput,
  HttpClientGetCredentialInput,
  HttpClientUpdateCredentialInput,
};
