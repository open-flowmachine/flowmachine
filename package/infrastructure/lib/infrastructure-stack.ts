import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as logs from "aws-cdk-lib/aws-logs";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";

type InfrastructureStackProps = cdk.StackProps & {
  imageTag: string;
};

type ServiceSpec = {
  id: string;
  repoName: string;
  hostname: string;
  containerPort: number;
  healthCheckPath: string;
};

const ROOT_DOMAIN = "flowmachine.io";

const SERVICES: ServiceSpec[] = [
  {
    id: "PlatformWeb",
    repoName: "platform-web",
    hostname: "dev.platform.flowmachine.io",
    containerPort: 3000,
    healthCheckPath: "/",
  },
  {
    id: "PlatformService",
    repoName: "platform-service",
    hostname: "dev.service.platform.flowmachine.io",
    containerPort: 8000,
    healthCheckPath: "/health",
  },
];

class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: InfrastructureStackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "Vpc", {
      maxAzs: 2,
      natGateways: 1,
    });

    const cluster = new ecs.Cluster(this, "Cluster", {
      vpc,
      containerInsightsV2: ecs.ContainerInsights.ENABLED,
    });

    const zone = route53.HostedZone.fromLookup(this, "Zone", {
      domainName: ROOT_DOMAIN,
    });

    for (const service of SERVICES) {
      this.createService({ cluster, zone, imageTag: props.imageTag, service });
    }
  }

  private createService(args: {
    cluster: ecs.ICluster;
    zone: route53.IHostedZone;
    imageTag: string;
    service: ServiceSpec;
  }) {
    const { cluster, zone, imageTag, service } = args;

    const logGroup = new logs.LogGroup(this, `${service.id}LogGroup`, {
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const repo = ecr.Repository.fromRepositoryName(
      this,
      `${service.id}Repo`,
      service.repoName,
    );

    const certificate = new acm.Certificate(this, `${service.id}Cert`, {
      domainName: service.hostname,
      validation: acm.CertificateValidation.fromDns(zone),
    });

    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      `${service.id}TaskDef`,
      {
        cpu: 256,
        memoryLimitMiB: 512,
      },
    );

    taskDefinition.addContainer(`${service.id}Container`, {
      image: ecs.ContainerImage.fromEcrRepository(repo, imageTag),
      portMappings: [{ containerPort: service.containerPort }],
      logging: ecs.LogDrivers.awsLogs({
        logGroup,
        streamPrefix: service.repoName,
      }),
      environment: {
        NODE_ENV: "production",
        PORT: String(service.containerPort),
      },
    });

    const fargateService =
      new ecsPatterns.ApplicationLoadBalancedFargateService(
        this,
        `${service.id}Service`,
        {
          cluster,
          taskDefinition,
          desiredCount: 1,
          publicLoadBalancer: true,
          assignPublicIp: false,
          protocol: elbv2.ApplicationProtocol.HTTPS,
          redirectHTTP: true,
          certificate,
          domainName: service.hostname,
          domainZone: zone,
        },
      );

    fargateService.targetGroup.configureHealthCheck({
      path: service.healthCheckPath,
    });

    new cdk.CfnOutput(this, `${service.id}Url`, {
      value: `https://${service.hostname}`,
    });

    new cdk.CfnOutput(this, `${service.id}AlbDns`, {
      value: fargateService.loadBalancer.loadBalancerDnsName,
    });
  }
}

export { InfrastructureStack };
