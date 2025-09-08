import { AccessToken } from "@azure/identity";
import { describe, expect, it, beforeEach } from "@jest/globals";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebApi } from "azure-devops-node-api";
import { configureWorkTools } from "../../../src/tools/work";
import { TeamSettingsIteration } from "azure-devops-node-api/interfaces/WorkInterfaces";
import { WorkItemClassificationNode, TreeNodeStructureType, TreeStructureGroup } from "azure-devops-node-api/interfaces/WorkItemTrackingInterfaces";

type TokenProviderMock = () => Promise<string>;
type ConnectionProviderMock = () => Promise<WebApi>;

describe("configureWorkTools", () => {
  let server: McpServer;
  let tokenProvider: TokenProviderMock;
  let connectionProvider: ConnectionProviderMock;
  let mockWorkApi: {
    getTeamIterations: jest.Mock;
    postTeamIteration: jest.Mock;
  };
  let mockWorkItemTrackingApi: {
    createOrUpdateClassificationNode: jest.Mock;
  };
  let mockConnection: {
    getWorkApi: jest.Mock;
    getWorkItemTrackingApi: jest.Mock;
  };

  beforeEach(() => {
    server = { tool: jest.fn() } as unknown as McpServer;
    tokenProvider = jest.fn();
    mockWorkApi = {
      getTeamIterations: jest.fn(),
      postTeamIteration: jest.fn(),
    };
    mockWorkItemTrackingApi = {
      createOrUpdateClassificationNode: jest.fn(),
    };
    mockConnection = {
      getWorkApi: jest.fn().mockResolvedValue(mockWorkApi),
      getWorkItemTrackingApi: jest.fn().mockResolvedValue(mockWorkItemTrackingApi),
    };
    connectionProvider = jest.fn().mockResolvedValue(mockConnection);
  });

  describe("tool registration", () => {
    it("registers core tools on the server", () => {
      configureWorkTools(server, tokenProvider, connectionProvider);
      expect(server.tool as jest.Mock).toHaveBeenCalled();
    });
  });

  describe("list_team_iterations tool", () => {
    it("should call getTeamIterations API with the correct parameters and return the expected result", async () => {
      configureWorkTools(server, tokenProvider, connectionProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "work_list_team_iterations");
      if (!call) throw new Error("Tool not found");
      const [, , , handler] = call;

      const mockIterations: TeamSettingsIteration[] = [{ id: "1", name: "Sprint 1", path: "Project\\Sprint 1", attributes: { timeFrame: 0 }, url: "" }];
      (mockWorkApi.getTeamIterations as jest.Mock).mockResolvedValue(mockIterations);

      const params = {
        project: "test-project",
        team: "test-team",
        timeframe: "current",
      };

      const result = await handler(params);

      expect(mockWorkApi.getTeamIterations).toHaveBeenCalledWith({ project: "test-project", team: "test-team" }, "current");
      expect(result.content[0].text).toBe(JSON.stringify(mockIterations, null, 2));
    });

    it("should handle API errors correctly", async () => {
      configureWorkTools(server, tokenProvider, connectionProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "work_list_team_iterations");
      if (!call) throw new Error("Tool not found");
      const [, , , handler] = call;

      const testError = new Error("Failed to retrieve iterations");
      (mockWorkApi.getTeamIterations as jest.Mock).mockRejectedValue(testError);

      const params = { project: "test-project", team: "test-team" };
      const result = await handler(params);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Failed to retrieve iterations: Failed to retrieve iterations");
    });

    it("should handle null API results correctly", async () => {
      configureWorkTools(server, tokenProvider, connectionProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "work_list_team_iterations");
      if (!call) throw new Error("Tool not found");
      const [, , , handler] = call;

      (mockWorkApi.getTeamIterations as jest.Mock).mockResolvedValue(null);

      const params = { project: "test-project", team: "test-team" };
      const result = await handler(params);

      expect(mockWorkApi.getTeamIterations).toHaveBeenCalled();
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toBe("No iterations found");
    });

    it("should handle unknown error type correctly", async () => {
        configureWorkTools(server, tokenProvider, connectionProvider);
        const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "work_list_team_iterations");
        if (!call) throw new Error("Tool not found");
        const [, , , handler] = call;

        (mockWorkApi.getTeamIterations as jest.Mock).mockRejectedValue("string error");

        const params = { project: "test-project", team: "test-team" };
        const result = await handler(params);

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain("Failed to retrieve iterations: string error");
      });
  });

  describe("assign_iterations", () => {
    it("should call postTeamIteration API with the correct parameters and return the expected result", async () => {
      configureWorkTools(server, tokenProvider, connectionProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "work_assign_iterations");
      if (!call) throw new Error("Tool not found");
      const [, , , handler] = call;

      const mockResult = { id: "a589a806-bf11-4d4f-a031-c19813331553" };
      (mockWorkApi.postTeamIteration as jest.Mock).mockResolvedValue(mockResult);

      const params = {
        project: "Fabrikam",
        team: "Fabrikam Team",
        iterationId: "a589a806-bf11-4d4f-a031-c19813331553",
        path: "Fabrikam-Fiber\\Release 1\\Sprint 2",
      };

      const result = await handler(params);

      expect(mockWorkApi.postTeamIteration).toHaveBeenCalledWith(
        {
          id: "a589a806-bf11-4d4f-a031-c19813331553",
          name: "",
          path: "Fabrikam-Fiber\\Release 1\\Sprint 2",
          attributes: { timeFrame: 0 },
          url: ""
        },
        { project: "Fabrikam", team: "Fabrikam Team" }
      );
      expect(result.content[0].text).toBe(`Iteration ${params.iterationId} assigned to team ${params.team}.`);
    });

    it("should handle API errors correctly", async () => {
        configureWorkTools(server, tokenProvider, connectionProvider);
        const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "work_assign_iterations");
        if (!call) throw new Error("Tool not found");
        const [, , , handler] = call;

        const testError = new Error("Failed to assign iteration");
        (mockWorkApi.postTeamIteration as jest.Mock).mockRejectedValue(testError);

        const params = {
          project: "test-project",
          team: "test-team",
          iterationId: "test-id",
        };
        const result = await handler(params);

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain("Failed to assign iteration: Failed to assign iteration");
      });

      it("should handle null API results correctly", async () => {
        configureWorkTools(server, tokenProvider, connectionProvider);
        const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "work_assign_iterations");
        if (!call) throw new Error("Tool not found");
        const [, , , handler] = call;

        (mockWorkApi.postTeamIteration as jest.Mock).mockResolvedValue(null);

        const params = {
          project: "test-project",
          team: "test-team",
          iterationId: "test-id",
        };
        const result = await handler(params);

        expect(mockWorkApi.postTeamIteration).toHaveBeenCalled();
        expect(result.isError).toBe(true);
        expect(result.content[0].text).toBe("No iterations were assigned to the team");
      });

      it("should handle unknown error type correctly", async () => {
        configureWorkTools(server, tokenProvider, connectionProvider);
        const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "work_assign_iterations");
        if (!call) throw new Error("Tool not found");
        const [, , , handler] = call;

        (mockWorkApi.postTeamIteration as jest.Mock).mockRejectedValue("string error");

        const params = {
            project: "test-project",
            team: "test-team",
            iterationId: "test-id",
          };
        const result = await handler(params);

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain("Failed to assign iteration: string error");
      });
  });

  describe("create_iterations", () => {
    it("should call createOrUpdateClassificationNode API with the correct parameters and return the expected result", async () => {
      configureWorkTools(server, tokenProvider, connectionProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "work_create_iterations");
      if (!call) throw new Error("Tool not found");
      const [, , , handler] = call;

      const mockIteration: WorkItemClassificationNode = {
        id: 126391,
        identifier: "a5c68379-3258-4d62-971c-71c1c459336e",
        name: "Web",
        structureType: TreeNodeStructureType.Area,
        hasChildren: false,
        path: "\\fabrikam\\fiber\\tfvc\\area",
        url: "https://dev.azure.com/fabrikam/6ce954b1-ce1f-45d1-b94d-e6bf2464ba2c/_apis/wit/classificationNodes/Areas/Web",
      };
      (mockWorkItemTrackingApi.createOrUpdateClassificationNode as jest.Mock).mockResolvedValue(mockIteration);

      const params = {
        project: "test-project",
        iterationName: "Sprint 3",
        startDate: "2024-01-01",
        finishDate: "2024-01-14",
      };

      const result = await handler(params);

      expect(mockWorkItemTrackingApi.createOrUpdateClassificationNode).toHaveBeenCalled();
      expect(result.content[0].text).toBe(JSON.stringify([mockIteration], null, 2));
    });

    it("should handle API errors correctly", async () => {
        configureWorkTools(server, tokenProvider, connectionProvider);
        const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "work_create_iterations");
        if (!call) throw new Error("Tool not found");
        const [, , , handler] = call;

        const testError = new Error("Failed to create iteration");
        (mockWorkItemTrackingApi.createOrUpdateClassificationNode as jest.Mock).mockRejectedValue(testError);

        const params = {
          project: "test-project",
          iterationName: "Sprint 4",
        };
        const result = await handler(params);

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain("Failed to create iteration: Failed to create iteration");
      });

      it("should handle null API results correctly", async () => {
        configureWorkTools(server, tokenProvider, connectionProvider);
        const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "work_create_iterations");
        if (!call) throw new Error("Tool not found");
        const [, , , handler] = call;

        (mockWorkItemTrackingApi.createOrUpdateClassificationNode as jest.Mock).mockResolvedValue(null);

        const params = {
            project: "test-project",
            iterationName: "Sprint 4",
          };
        const result = await handler(params);

        expect(mockWorkItemTrackingApi.createOrUpdateClassificationNode).toHaveBeenCalled();
        expect(result.isError).toBe(true);
        expect(result.content[0].text).toBe("No iterations were created");
      });

      it("should handle unknown error type correctly", async () => {
        configureWorkTools(server, tokenProvider, connectionProvider);
        const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "work_create_iterations");
        if (!call) throw new Error("Tool not found");
        const [, , , handler] = call;

        (mockWorkItemTrackingApi.createOrUpdateClassificationNode as jest.Mock).mockRejectedValue("string error");

        const params = {
            project: "test-project",
            iterationName: "Sprint 4",
          };
        const result = await handler(params);

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain("Failed to create iteration: string error");
      });

    it("should handle iterations without start and finish dates", async () => {
        configureWorkTools(server, tokenProvider, connectionProvider);
        const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "work_create_iterations");
        if (!call) throw new Error("Tool not found");
        const [, , , handler] = call;

        const mockIteration: WorkItemClassificationNode = {
            id: 126391,
            identifier: "a5c68379-3258-4d62-971c-71c1c459336e",
            name: "Sprint 3",
            structureType: TreeNodeStructureType.Iteration,
            hasChildren: false,
            path: "\\fabrikam\\fiber\\tfvc\\iteration",
          };
        (mockWorkItemTrackingApi.createOrUpdateClassificationNode as jest.Mock).mockResolvedValue(mockIteration);

        const params = {
          project: "test-project",
          iterationName: "Sprint 3",
        };

        const result = await handler(params);

        expect(mockWorkItemTrackingApi.createOrUpdateClassificationNode).toHaveBeenCalledWith(
          {
            name: "Sprint 3",
            attributes: {
              startDate: undefined,
              finishDate: undefined,
            },
          },
          "test-project",
          TreeStructureGroup.Iterations
        );
        expect(result.content[0].text).toBe(JSON.stringify([mockIteration], null, 2));
      });
  });
});
