import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env/env";

export const GET = () => {
  return NextResponse.json({
    status: "ok",
    version: getEnv().APP_VERSION,
    environment: getEnv().APP_ENV,
  });
};
