#!/usr/bin/env node

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as azdev from "azure-devops-node-api";
import * as fs from 'fs';
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { configurePrompts } from "./prompts.js";
import { configureAllTools } from "./tools.js";
import { UserAgentComposer } from "./useragent.js";
import { packageVersion } from "./version.js";
import { DomainsManager } from "./shared/domains.js";
import { getPatConnection } from "./tools/auth.js";
import { WebApi } from "azure-devops-node-api";

// Parse command line arguments using yargs
const argv = yargs(hideBin(process.argv))
  .scriptName("mcp-server-azuredevops")
  .usage("Usage: $0 <organization> --pat <personal_access_token> [options]")
  .version(packageVersion)
  .command("$0 <organization> <pat> [options]", "Azure DevOps MCP Server", (yargs) => {
    yargs.positional("organization", {
      describe: "Azure DevOps organization name. Can also be set via ADO_ORG_NAME environment variable.",
      type: "string",
    });
    yargs.positional("pat", {
      describe: "Personal Access Token for Azure DevOps",
      type: "string",
      demandOption: true,
    });
  })
  .option("domains", {
    alias: "d",
    describe: "Domain(s) to enable: 'all' for everything, or a list like 'repositories builds work'. Defaults to 'all'.",
    type: "string",
    array: true,
    default: "all",
  })
  .option("pat", {
    describe: "Azure DevOps Personal Access Token. Can also be set via ADO_PAT environment variable.",
    type: "string",
  })
  .help()
  .parseSync();

const orgName = (argv.organization as string) || process.env.ADO_ORG_NAME;
const pat = (argv.pat as string) || process.env.ADO_PAT;

export const orgName = orgName;
const orgUrl = "https://dev.azure.com/" + orgName;
const orgName = (argv.organization as string) || process.env.ADO_ORG_NAME;
const pat = (argv.pat as string) || process.env.ADO_PAT;

export const orgName = orgName;
const orgUrl = "https://dev.azure.com/" + orgName;
const orgUrl = "https://dev.azure.com/" + orgName;

const domainsManager = new DomainsManager(argv.domains);
export const enabledDomains = domainsManager.getEnabledDomains();

function getAzureDevOpsClient(userAgentComposer: UserAgentComposer, pat: string): () => Promise<WebApi> {
  return async () => {
    const connection = getPatConnection(orgName, pat);
    return connection;
  };
}

async function main() {
  const server = new McpServer({
    name: "Azure DevOps MCP Server",
    version: packageVersion,
  });

  const userAgentComposer = new UserAgentComposer(packageVersion);
  server.server.oninitialized = () => {
    userAgentComposer.appendMcpClientInfo(server.server.getClientVersion());
  };

  configurePrompts(server);

  const tokenProvider = async () => {
    // Since we are using PAT, we don't need to get a token from a credential chain.
    // The PAT is directly used by getPatConnection.
    // This dummy AccessToken is just to satisfy the interface.
    return { token: pat, expiresOnTimestamp: Date.now() + 3600 * 1000 };
  };

  configureAllTools(server, tokenProvider, getAzureDevOpsClient(userAgentComposer, pat), () => userAgentComposer.userAgent, enabledDomains, orgName, pat!);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
