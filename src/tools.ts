// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebApi } from "azure-devops-node-api";

import { Domain } from "./shared/domains.js";
// import { configureAdvSecTools } from "./tools/advanced-security.js";
import { configureBuildTools } from "./tools/builds.js";
import { configureCoreTools } from "./tools/core.js";
import { configureReleaseTools } from "./tools/releases.js";
import { configureRepoTools } from "./tools/repositories.js";
import { configureTestPlanTools } from "./tools/test-plans.js";
import { configureWikiTools } from "./tools/wiki.js";
import { configureWorkTools } from "./tools/work.js";
import { configureWorkItemTools } from "./tools/work-items.js";
import { AccessToken as AzureAccessToken } from "@azure/identity";

function configureAllTools(
  server: McpServer,
  tokenProvider: () => Promise<AzureAccessToken>,
  connectionProvider: () => Promise<WebApi>,
  userAgentProvider: () => string,
  enabledDomains: Set<string>,
  ado_org: string,
  pat: string
) {
  const stringTokenProvider = async () => {
    const accessToken = await tokenProvider();
    return accessToken.token;
  };

  const configureIfDomainEnabled = (domain: string, configureFn: () => void) => {
    if (enabledDomains.has(domain)) {
      configureFn();
    }
  };

  configureIfDomainEnabled(Domain.CORE, () => configureCoreTools(server, stringTokenProvider, connectionProvider, userAgentProvider));
  configureIfDomainEnabled(Domain.WORK, () => configureWorkTools(server, stringTokenProvider, connectionProvider));
  configureIfDomainEnabled(Domain.BUILDS, () => configureBuildTools(server, stringTokenProvider, connectionProvider, userAgentProvider));
  configureIfDomainEnabled(Domain.RELEASES, () => configureReleaseTools(server, stringTokenProvider, connectionProvider));
  configureIfDomainEnabled(Domain.WIKI, () => configureWikiTools(server, stringTokenProvider, connectionProvider));
  configureIfDomainEnabled(Domain.TEST_PLANS, () => configureTestPlanTools(server, stringTokenProvider, connectionProvider));
  // configureIfDomainEnabled(Domain.ADVANCED_SECURITY, () => configureAdvSecTools(server, stringTokenProvider, connectionProvider));

  configureIfDomainEnabled(Domain.REPOSITORIES, () => configureRepoTools(server, tokenProvider, connectionProvider, userAgentProvider, ado_org, pat));

  configureIfDomainEnabled(Domain.WORK_ITEMS, () => configureWorkItemTools(server, tokenProvider, connectionProvider, userAgentProvider));
}

export { configureAllTools };
