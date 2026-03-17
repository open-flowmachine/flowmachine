import type { NextRequest } from "next/server";
import { config } from "@/infra/config/config";

async function handler(request: NextRequest) {
  const url = new URL(request.url);
  const path = url.pathname.replace("/api/auth", "");

  const response = await fetch(
    `${config.service.baseUrl}/api/auth${path}${url.search}`,
    {
      method: request.method,
      headers: request.headers,
      body:
        request.method !== "GET" && request.method !== "HEAD"
          ? request.body
          : undefined,
      credentials: "include",
    },
  );

  const responseHeaders = new Headers();
  response.headers.forEach((value, key) => {
    responseHeaders.append(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export const GET = handler;
export const POST = handler;
