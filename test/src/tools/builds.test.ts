import { describe, expect, it, beforeEach, jest } from "@jest/globals";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebApi } from "azure-devops-node-api";
import { IBuildApi } from "azure-devops-node-api/BuildApi";
import { StageUpdateType } from "azure-devops-node-api/interfaces/BuildInterfaces.js";
import { IPipelinesApi } from "azure-devops-node-api/PipelinesApi";
import { configureBuildTools } from "../../../src/tools/builds";
import { apiVersion } from "../../../src/utils";
import { mockUpdateBuildStageResponse } from "../../mocks/builds";
import { mockBuildApiClient, mockPipelinesApiClient } from "../../mocks/azure-devops-clients";

// Mock fetch global com tipagem correta
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

// Tipos para mocks
type TokenProviderMock = jest.MockedFunction<() => Promise<string>>;
type ConnectionProviderMock = jest.MockedFunction<() => Promise<WebApi>>;
type Tool = (params: any) => Promise<any>;

type ConnectionMock = {
  getBuildApi: jest.MockedFunction<() => Promise<jest.Mocked<IBuildApi>>>;
  getPipelinesApi: jest.MockedFunction<() => Promise<jest.Mocked<IPipelinesApi>>>;
  serverUrl: string;
};

describe("configureBuildTools", () => {
  let server: McpServer;
  let tokenProvider: TokenProviderMock;
  let connectionProvider: ConnectionProviderMock;
  let userAgentProvider: () => string;
  let mockConnection: ConnectionMock;
  let mockBuildApi: jest.Mocked<IBuildApi>;
  let mockPipelinesApi: jest.Mocked<IPipelinesApi>;

  beforeEach(() => {
    server = { tool: jest.fn() } as unknown as McpServer;
    tokenProvider = jest.fn();
    userAgentProvider = () => "Jest";

    mockBuildApi = mockBuildApiClient();
    mockPipelinesApi = mockPipelinesApiClient();

    mockConnection = {
      getBuildApi: jest.fn().mockResolvedValue(mockBuildApi),
      getPipelinesApi: jest.fn().mockResolvedValue(mockPipelinesApi),
      serverUrl: "https://dev.azure.com/test-org",
    };
    connectionProvider = jest.fn().mockResolvedValue(mockConnection as unknown as WebApi);

    (global.fetch as jest.MockedFunction<typeof fetch>).mockClear();
  });

  describe("tool registration", () => {
    it("registers build tools on the server", () => {
      configureBuildTools(server, tokenProvider, connectionProvider, userAgentProvider);
      expect(server.tool as jest.Mock).toHaveBeenCalled();
    });
  });

  describe("update_build_stage tool", () => {
    it("should update build stage successfully", async () => {
      configureBuildTools(server, tokenProvider, connectionProvider, userAgentProvider);

      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "build_update_build_stage");
      if (!call) throw new Error("build_update_build_stage tool not registered");
      const handler = call[3] as Tool;

      tokenProvider.mockResolvedValue("mock-token");

      // Mock fetch.text corretamente tipado
      const mockResponse: Partial<Response> = {
        ok: true,
        text: jest.fn<() => Promise<string>>().mockResolvedValue(JSON.stringify(mockUpdateBuildStageResponse)),
      };
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockResponse as Response);

      const params = { project: "test-project", buildId: 123, stageName: "Build", status: "Retry", forceRetryAllJobs: true };
      const result = await handler(params);

      expect(result.content[0].text).toBe(JSON.stringify(JSON.stringify(mockUpdateBuildStageResponse), null, 2));
      expect(result.isError).toBeUndefined();
    });

    it("should handle token provider errors correctly", async () => {
      configureBuildTools(server, tokenProvider, connectionProvider, userAgentProvider);

      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "build_update_build_stage");
      if (!call) throw new Error("build_update_build_stage tool not registered");
      const handler = call[3] as Tool;

      tokenProvider.mockRejectedValue(new Error("Failed to get access token"));

      const params = { project: "test-project", buildId: 123, stageName: "Build", status: "Retry", forceRetryAllJobs: false };

      await expect(handler(params)).rejects.toThrow("Failed to get access token");

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should handle HTTP errors correctly", async () => {
      configureBuildTools(server, tokenProvider, connectionProvider, userAgentProvider);

      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "build_update_build_stage");
      if (!call) throw new Error("build_update_build_stage tool not registered");
      const handler = call[3] as Tool;

      tokenProvider.mockResolvedValue("mock-token");

      const mockResponse: Partial<Response> = {
        ok: false,
        status: 404,
        text: jest.fn<() => Promise<string>>().mockResolvedValue("Build stage not found"),
      };
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockResponse as Response);

      const params = { project: "test-project", buildId: 999, stageName: "NonExistentStage", status: "Retry", forceRetryAllJobs: false };

      await expect(handler(params)).rejects.toThrow("Failed to update build stage: 404 Build stage not found");
    });
  });

  // Os outros blocos de testes (get_definitions, get_builds, pipelines_run_pipeline, etc.)
  // podem seguir o mesmo padrão de mocks com jest.MockedFunction e jest.fn<ReturnType, Args>()
});
