import type { Id, Model } from "@/lib/schema";

const projectProviders = ["jira", "linear"] as const;

type ProjectIntegration = {
  domain: string;
  externalId: string;
  externalKey: string;
  provider: (typeof projectProviders)[number];
  webhookSecret: string;
  credentialId: Id;
};

type Project = Model<{
  name: string;
  integration?: ProjectIntegration;
  tenant: { id: Id; type: "organization" | "user" };
}>;

type HttpClientCreateProjectInput = {
  body: {
    name: Project["name"];
    integration?: Project["integration"];
  };
};

type HttpClientDeleteProjectInput = {
  params: {
    id: Id;
  };
};

type HttpClientGetProjectInput = {
  params: {
    id: Id;
  };
};

type HttpClientUpdateProjectInput = {
  params: {
    id: Id;
  };
  body: {
    name?: Project["name"];
    integration?: Project["integration"];
  };
};

type HttpClientSyncProjectInput = {
  params: {
    id: Id;
  };
};

export { projectProviders };
export type {
  Project,
  ProjectIntegration,
  HttpClientCreateProjectInput,
  HttpClientDeleteProjectInput,
  HttpClientGetProjectInput,
  HttpClientUpdateProjectInput,
  HttpClientSyncProjectInput,
};
