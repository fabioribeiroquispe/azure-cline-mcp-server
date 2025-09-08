import { AccessToken } from "@azure/identity";
import { describe, expect, it, beforeEach } from "@jest/globals";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebApi } from "azure-devops-node-api";
import { StageUpdateType } from "azure-devops-node-api/interfaces/BuildInterfaces.js";
import { configureBuildTools } from "../../../src/tools/builds";
import { apiVersion } from "../../../src/utils.js";
import { mockUpdateBuildStageResponse } from "../../mocks/builds";

// Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

type TokenProviderMock = () => Promise<string>;
type ConnectionProviderMock = () => Promise<WebApi>;

describe("configureBuildTools", () => {
  let server: McpServer;
  let tokenProvider: TokenProviderMock;
  let connectionProvider: ConnectionProviderMock;
  let userAgentProvider: () => string;
  let mockConnection: { getBuildApi: jest.Mock; getPipelinesApi: jest.Mock; serverUrl: string };
  let mockBuildApi: {
    getDefinitions: jest.Mock;
    getDefinitionRevisions: jest.Mock;
    getBuilds: jest.Mock;
    getBuildLogs: jest.Mock;
    getBuildLogLines: jest.Mock;
    getBuildChanges: jest.Mock;
    getBuild: jest.Mock;
  };
  let mockPipelinesApi: {
    getRun: jest.Mock;
    listRuns: jest.Mock;
    runPipeline: jest.Mock;
  };

  beforeEach(() => {
    server = { tool: jest.fn() } as unknown as McpServer;
    tokenProvider = jest.fn();
    userAgentProvider = () => "Jest";

    mockBuildApi = {
      getDefinitions: jest.fn(),
      getDefinitionRevisions: jest.fn(),
      getBuilds: jest.fn(),
      getBuildLogs: jest.fn(),
      getBuildLogLines: jest.fn(),
      getBuildChanges: jest.fn(),
      getBuild: jest.fn(),
    };

    mockPipelinesApi = {
      getRun: jest.fn(),
      listRuns: jest.fn(),
      runPipeline: jest.fn(),
    };

    mockConnection = {
      getBuildApi: jest.fn().mockResolvedValue(mockBuildApi),
      getPipelinesApi: jest.fn().mockResolvedValue(mockPipelinesApi),
      serverUrl: "https://dev.azure.com/test-org",
    };
    connectionProvider = jest.fn().mockResolvedValue(mockConnection);
    (global.fetch as jest.MockedFunction<typeof fetch>).mockClear();
  });

  describe("tool registration", () => {
    it("registers build tools on the server", () => {
      configureBuildTools(server, tokenProvider, connectionProvider, userAgentProvider);
      expect(server.tool as jest.Mock).toHaveBeenCalled();
    });
  });

  describe.skip("update_build_stage tool", () => {
    // ... tests for update_build_stage
  });

  describe("get_definitions tool", () => {
    it("should call getDefinitions with correct parameters and return expected result", async () => {
      configureBuildTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "build_get_definitions");
      if (!call) throw new Error("build_get_definitions tool not registered");
      const [, , , handler] = call;

      mockBuildApi.getDefinitions.mockResolvedValue([
        { id: 1, name: "Build Definition 1" },
        { id: 2, name: "Build Definition 2" },
      ]);

      const params = {
        project: "test-project",
        repositoryId: "repo-123",
        repositoryType: "TfsGit" as const,
        name: "test-build",
        top: 10,
      };

      const result = await handler(params);

      expect(mockBuildApi.getDefinitions).toHaveBeenCalledWith(
        "test-project",
        "test-build",
        "repo-123",
        "TfsGit",
        undefined,
        10
      );

      expect(result.content[0].text).toBe(
        JSON.stringify(
          [
            { id: 1, name: "Build Definition 1" },
            { id: 2, name: "Build Definition 2" },
          ],
          null,
          2
        )
      );
    });
  });

  describe("get_log tool", () => {
    it("should call getBuildLogs with correct parameters", async () => {
      configureBuildTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "build_get_log");
      if (!call) throw new Error("build_get_log tool not registered");
      const [, , , handler] = call;

      mockBuildApi.getBuildLogs.mockResolvedValue([
        { id: 1, lineCount: 100 },
        { id: 2, lineCount: 50 },
      ]);

      const params = {
        project: "test-project",
        buildId: 123,
      };

      const result = await handler(params);

      expect(mockBuildApi.getBuildLogs).toHaveBeenCalledWith("test-project", 123);
      expect(result.content[0].text).toBe(
        JSON.stringify(
          [
            { id: 1, lineCount: 100 },
            { id: 2, lineCount: 50 },
          ],
          null,
          2
        )
      );
    });
  });

  describe("get_log_by_id tool", () => {
    it("should call getBuildLogLines with correct parameters", async () => {
      configureBuildTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "build_get_log_by_id");
      if (!call) throw new Error("build_get_log_by_id tool not registered");
      const [, , , handler] = call;

      mockBuildApi.getBuildLogLines.mockResolvedValue(["line 1", "line 2"]);

      const params = {
        project: "test-project",
        buildId: 123,
        logId: 1,
        startLine: 10,
        endLine: 20,
      };

      const result = await handler(params);

      expect(mockBuildApi.getBuildLogLines).toHaveBeenCalledWith("test-project", 123, 1, 10, 20);
      expect(result.content[0].text).toBe(JSON.stringify(["line 1", "line 2"], null, 2));
    });
  });

  describe("get_changes tool", () => {
    it("should call getBuildChanges with correct parameters", async () => {
      configureBuildTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "build_get_changes");
      if (!call) throw new Error("build_get_changes tool not registered");
      const [, , , handler] = call;

      mockBuildApi.getBuildChanges.mockResolvedValue([
        { id: "abc123", message: "Fixed bug" },
      ]);

      const params = {
        project: "test-project",
        buildId: 123,
        continuationToken: "token123",
        top: 50,
        includeSourceChange: true,
      };

      const result = await handler(params);

      expect(mockBuildApi.getBuildChanges).toHaveBeenCalledWith("test-project", 123, "token123", 50, true);
    });
  });

  describe("pipelines_get_run tool", () => {
    it("should call getRun with correct parameters", async () => {
      configureBuildTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "pipelines_get_run");
      if (!call) throw new Error("Tool not found");
      const [, , , handler] = call;

      mockPipelinesApi.getRun.mockResolvedValue({ id: 1, name: "run-1" });

      const params = {
        project: "test-project",
        pipelineId: 123,
        runId: 456,
      };

      const result = await handler(params);

      expect(mockPipelinesApi.getRun).toHaveBeenCalledWith("test-project", 123, 456);
      expect(result.content[0].text).toBe(JSON.stringify({ id: 1, name: "run-1" }, null, 2));
    });
  });

  describe("pipelines_list_runs tool", () => {
    it("should call listRuns with correct parameters", async () => {
      configureBuildTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "pipelines_list_runs");
      if (!call) throw new Error("Tool not found");
      const [, , , handler] = call;

      mockPipelinesApi.listRuns.mockResolvedValue([{ id: 1, name: "run-1" }]);

      const params = {
        project: "test-project",
        pipelineId: 123,
      };

      const result = await handler(params);

      expect(mockPipelinesApi.listRuns).toHaveBeenCalledWith("test-project", 123);
      expect(result.content[0].text).toBe(JSON.stringify([{ id: 1, name: "run-1" }], null, 2));
    });
  });

  describe("pipelines_run_pipeline tool", () => {
    it("should trigger pipeline with correct parameters", async () => {
      configureBuildTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "pipelines_run_pipeline");
      if (!call) throw new Error("Tool not found");
      const [, , , handler] = call;

      mockPipelinesApi.runPipeline.mockResolvedValue({ id: 456 });

      const params = {
        project: "test-project",
        pipelineId: 123,
        resources: { repositories: { self: { refName: "refs/heads/feature/new-feature" } } },
        templateParameters: { key1: "value1" },
      };

      const result = await handler(params);

      expect(mockPipelinesApi.runPipeline).toHaveBeenCalledWith(
        {
          previewRun: undefined,
          resources: { repositories: { self: { refName: "refs/heads/feature/new-feature" } } },
          stagesToSkip: undefined,
          templateParameters: { key1: "value1" },
          variables: undefined,
          yamlOverride: undefined,
        },
        "test-project",
        123
      );
      expect(result.content[0].text).toBe(JSON.stringify({ id: 456 }, null, 2));
    });

    it("should throw error for previewRun and yamlOverride", async () => {
      configureBuildTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "pipelines_run_pipeline");
      if (!call) throw new Error("Tool not found");
      const [, , , handler] = call;

      const params = {
        project: "test-project",
        pipelineId: 123,
        previewRun: false,
        yamlOverride: "some yaml",
      };

      await expect(handler(params)).rejects.toThrow("Parameter 'yamlOverride' can only be specified together with parameter 'previewRun'.");
    });

    it("should handle missing build ID from pipeline run", async () => {
      configureBuildTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "pipelines_run_pipeline");
      if (!call) throw new Error("Tool not found");
      const [, , , handler] = call;

      mockPipelinesApi.runPipeline.mockResolvedValue({});

      const params = {
        project: "test-project",
        pipelineId: 123,
      };

      await expect(handler(params)).rejects.toThrow("Failed to get build ID from pipeline run");
    });
  });
});
