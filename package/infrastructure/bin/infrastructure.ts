#!/usr/bin/env bun
import * as cdk from "aws-cdk-lib/core";
import z from "zod";

import { InfrastructureStack } from "../lib/infrastructure-stack";

const env = z
  .object({
    CDK_DEFAULT_ACCOUNT: z.string(),
    CDK_DEFAULT_REGION: z.string(),
    IMAGE_TAG: z.string(),
  })
  .parse(process.env);

const app = new cdk.App();

new InfrastructureStack(app, "Flowmachine-Dev", {
  env: {
    account: env.CDK_DEFAULT_ACCOUNT,
    region: env.CDK_DEFAULT_REGION,
  },
  imageTag: env.IMAGE_TAG,
});
