import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebApi } from "azure-devops-node-api";
import { IBuildApi } from "azure-devops-node-api/BuildApi";
import { IPipelinesApi } from "azure-devops-node-api/PipelinesApi";
import { IWorkApi } from "azure-devops-node-api/WorkApi.js";
import { IWorkItemTrackingApi } from "azure-devops-node-api/WorkItemTrackingApi.js";
import { jest } from "@jest/globals";
import { configureBuildTools } from "../../../src/tools/builds";
import { mockBuildApiClient, mockPipelinesApiClient } from "../../mocks/azure-devops-clients";

export const setupBuildToolsTest = () => {
  const server = { tool: jest.fn() } as unknown as McpServer;
  const tokenProvider = jest.fn().mockResolvedValue("mock-token");
  const userAgentProvider = () => "Jest";

  const buildApi = mockBuildApiClient();
  const pipelinesApi = mockPipelinesApiClient();

  const connectionProvider = jest.fn().mockResolvedValue({
    getBuildApi: jest.fn().mockResolvedValue(buildApi),
    getPipelinesApi: jest.fn().mockResolvedValue(pipelinesApi),
    serverUrl: "https://dev.azure.com/test-org",
  } as unknown as WebApi);

  configureBuildTools(server, tokenProvider, connectionProvider, userAgentProvider);

  return { server, tokenProvider, buildApi, pipelinesApi, connectionProvider };
};
