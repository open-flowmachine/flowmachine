import { describe, expect, test } from "bun:test";

import { newId } from "@/domain/shared/id";
import { TenantId, type Tenant } from "@/domain/shared/tenant";

import { CredentialId } from "@/domain/credential/credential-id";
import { Project } from "@/domain/project/project";
import { InvalidProjectIntegrationError } from "@/domain/project/project-errors";
import { ProjectId } from "@/domain/project/project-id";
import type { ProjectIntegration } from "@/domain/project/project-value-objects";

const makeTenant = (): Tenant => ({
  id: TenantId(newId()),
  type: "organization",
});

const makeIntegration = (): ProjectIntegration => ({
  domain: "acme.atlassian.net",
  externalId: "10001",
  externalKey: "ACME",
  provider: "jira",
  webhookSecret: "whsec_test",
  credentialId: CredentialId(newId()),
});

describe("Project aggregate", () => {
  test("create emits ProjectCreated without integration", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const project = Project.create({
      id: ProjectId(newId()),
      tenant: makeTenant(),
      name: "Acme",
      integration: null,
      now,
    });

    expect(project.name).toBe("Acme");
    expect(project.integration).toBeNull();
    expect(project.version).toBe(1);

    const events = project.pullDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]?.name).toBe("ProjectCreated");
    expect(project.pullDomainEvents()).toHaveLength(0);
  });

  test("create with integration emits two events", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const project = Project.create({
      id: ProjectId(newId()),
      tenant: makeTenant(),
      name: "Acme",
      integration: makeIntegration(),
      now,
    });
    const events = project.pullDomainEvents();
    expect(events.map((e) => e.name)).toEqual([
      "ProjectCreated",
      "ProjectIntegrationConfigured",
    ]);
  });

  test("create throws on invalid integration (empty field)", () => {
    const badIntegration: ProjectIntegration = {
      ...makeIntegration(),
      domain: "",
    };
    expect(() =>
      Project.create({
        id: ProjectId(newId()),
        tenant: makeTenant(),
        name: "Acme",
        integration: badIntegration,
        now: new Date(),
      }),
    ).toThrow(InvalidProjectIntegrationError);
  });

  test("configureIntegration then removeIntegration transitions state and raises events", () => {
    const now1 = new Date("2026-01-01T00:00:00Z");
    const project = Project.create({
      id: ProjectId(newId()),
      tenant: makeTenant(),
      name: "Acme",
      integration: null,
      now: now1,
    });
    project.pullDomainEvents();

    const now2 = new Date("2026-01-01T00:01:00Z");
    project.configureIntegration({ integration: makeIntegration(), now: now2 });
    expect(project.integration).not.toBeNull();
    expect(project.version).toBe(2);

    const now3 = new Date("2026-01-01T00:02:00Z");
    project.removeIntegration(now3);
    expect(project.integration).toBeNull();
    expect(project.version).toBe(3);

    const events = project.pullDomainEvents();
    expect(events.map((e) => e.name)).toEqual([
      "ProjectIntegrationConfigured",
      "ProjectIntegrationRemoved",
    ]);
  });

  test("removeIntegration on project without integration is a no-op", () => {
    const project = Project.create({
      id: ProjectId(newId()),
      tenant: makeTenant(),
      name: "Acme",
      integration: null,
      now: new Date(),
    });
    project.pullDomainEvents();
    const versionBefore = project.version;
    project.removeIntegration(new Date());
    expect(project.version).toBe(versionBefore);
    expect(project.pullDomainEvents()).toHaveLength(0);
  });

  test("rename raises event only on actual change", () => {
    const project = Project.create({
      id: ProjectId(newId()),
      tenant: makeTenant(),
      name: "Acme",
      integration: null,
      now: new Date(),
    });
    project.pullDomainEvents();

    project.rename("Acme", new Date());
    expect(project.pullDomainEvents()).toHaveLength(0);

    project.rename("Acme Corp", new Date());
    const events = project.pullDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]?.name).toBe("ProjectRenamed");
    expect(project.name).toBe("Acme Corp");
  });
});
