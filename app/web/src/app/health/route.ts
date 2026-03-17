import { NextResponse } from "next/server";
import { config } from "@/infra/config/config";

export const GET = () => {
  return NextResponse.json({
    status: "ok",
    version: config.app.version,
    environment: config.app.env,
  });
};
