import { NextRequest, NextResponse } from "next/server";
import type { ProjectHttpClient } from "@/backend/http-client/project/project-http-client";
import { projectDomainCodec } from "@/backend/http-route-handler/project/project-route-handler-codec";
import type { ProjectDomain } from "@/domain/entity/project/project-domain-schema";
import {
  createProjectServicePortInSchema,
  deleteProjectServicePortInSchema,
  getProjectServicePortInSchema,
  syncProjectServicePortInSchema,
  updateProjectServicePortInSchema,
} from "@/domain/port/project/project-service-port";
import { type HttpEnvelope, okHttpEnvelope } from "@/lib/http/http-schema";

type MakeProjectRouteHandlerIn = {
  projectHttpClient: ProjectHttpClient;
};

export const makeProjectRouteHandler = ({
  projectHttpClient,
}: MakeProjectRouteHandlerIn) => ({
  create: async (request: NextRequest) => {
    const body = await request.json();

    const { body: payload } = createProjectServicePortInSchema.parse({ body });

    await projectHttpClient.create({ payload });

    return NextResponse.json(okHttpEnvelope());
  },

  deleteById: async (
    _: NextRequest,
    ctx: RouteContext<"/api/v1/project/[id]">,
  ) => {
    const params = await ctx.params;

    const validatedInput = deleteProjectServicePortInSchema.parse({ params });

    await projectHttpClient.deleteById({
      payload: { id: validatedInput.params.id },
    });

    return NextResponse.json(okHttpEnvelope());
  },

  getById: async (
    _: NextRequest,
    ctx: RouteContext<"/api/v1/project/[id]">,
  ): Promise<NextResponse<HttpEnvelope<ProjectDomain>>> => {
    const params = await ctx.params;

    const validatedInput = getProjectServicePortInSchema.parse({ params });

    const response = await projectHttpClient.getById({
      payload: { id: validatedInput.params.id },
    });
    const data = projectDomainCodec.decode(response.data);

    return NextResponse.json(okHttpEnvelope({ data }));
  },

  list: async (): Promise<NextResponse<HttpEnvelope<ProjectDomain[]>>> => {
    const listProjectsClientResponse = await projectHttpClient.list();

    const data = listProjectsClientResponse.data.map((item) =>
      projectDomainCodec.decode(item),
    );

    return NextResponse.json(okHttpEnvelope({ data }));
  },

  syncById: async (
    _: NextRequest,
    ctx: { params: Promise<{ id: string }> },
  ) => {
    const params = await ctx.params;

    const validatedInput = syncProjectServicePortInSchema.parse({ params });

    await projectHttpClient.syncById({
      payload: { id: validatedInput.params.id },
    });

    return NextResponse.json(okHttpEnvelope());
  },

  updateById: async (
    request: NextRequest,
    ctx: RouteContext<"/api/v1/project/[id]">,
  ) => {
    const body = await request.json();
    const params = await ctx.params;

    const validatedInput = updateProjectServicePortInSchema.parse({
      body,
      params,
    });
    await projectHttpClient.updateById({
      payload: {
        id: validatedInput.params.id,
        body: validatedInput.body,
      },
    });

    return NextResponse.json(okHttpEnvelope());
  },
});
