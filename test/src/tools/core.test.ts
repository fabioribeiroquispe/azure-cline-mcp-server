import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebApi } from "azure-devops-node-api";
import { configureCoreTools } from "../../../src/tools/core";
import { searchIdentities } from "../../../src/tools/auth";
import { jest, describe, expect, it, beforeEach } from "@jest/globals";
import { ToolResponse } from "../../../src/shared/tool-response";

jest.mock("../../../src/tools/auth", () => ({
  searchIdentities: jest.fn(),
}));

type ConnectionProviderMock = () => Promise<WebApi>;

interface CoreApiMock {
  getTeams: jest.Mock;
  getProjects: jest.Mock;
}

describe("configureCoreTools", () => {
  let server: McpServer;
  let tokenProvider: jest.Mock;
  let connectionProvider: ConnectionProviderMock;
  let userAgentProvider: () => string;
  let mockConnection: { getCoreApi: jest.Mock };
  let mockCoreApi: CoreApiMock;
  const mockedSearchIdentities = searchIdentities as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    server = { tool: jest.fn() } as unknown as McpServer;
    tokenProvider = jest.fn();
    userAgentProvider = () => "Jest";

    mockCoreApi = {
      getProjects: jest.fn(),
      getTeams: jest.fn(),
    };

    mockConnection = {
      getCoreApi: jest.fn().mockResolvedValue(mockCoreApi),
    };

    connectionProvider = jest.fn().mockResolvedValue(mockConnection);
  });

  describe("tool registration", () => {
    it("registers core tools on the server", () => {
      configureCoreTools(server, tokenProvider as () => Promise<string>, connectionProvider, userAgentProvider);
      expect(server.tool as jest.Mock).toHaveBeenCalledTimes(3);
      expect((server.tool as jest.Mock).mock.calls[0][0]).toBe("core_list_project_teams");
      expect((server.tool as jest.Mock).mock.calls[1][0]).toBe("core_list_projects");
      expect((server.tool as jest.Mock).mock.calls[2][0]).toBe("core_get_identity_ids");
    });
  });

  describe("list_projects tool", () => {
    it("should return projects", async () => {
      configureCoreTools(server, tokenProvider as () => Promise<string>, connectionProvider, userAgentProvider);
      const handler = (server.tool as jest.Mock).mock.calls.find(call => call[0] === 'core_list_projects')[3];
      const mockProjects = [{ id: "1", name: "Project1" }];
      mockCoreApi.getProjects.mockResolvedValue(mockProjects);

      const result = await handler({ stateFilter: "wellFormed" });
      expect(result.content[0].text).toBe(JSON.stringify(mockProjects, null, 2));
    });

    it("should handle no projects found", async () => {
        configureCoreTools(server, tokenProvider as () => Promise<string>, connectionProvider, userAgentProvider);
        const handler = (server.tool as jest.Mock).mock.calls.find(call => call[0] === 'core_list_projects')[3];
        mockCoreApi.getProjects.mockResolvedValue([]);

        const result = await handler({ stateFilter: "wellFormed" });
        expect(result.content[0].text).toBe("No projects found in the organization.");
    });

    it("should handle no projects found with filter", async () => {
        configureCoreTools(server, tokenProvider as () => Promise<string>, connectionProvider, userAgentProvider);
        const handler = (server.tool as jest.Mock).mock.calls.find(call => call[0] === 'core_list_projects')[3];
        const mockProjects = [{ id: "1", name: "Project1" }];
        mockCoreApi.getProjects.mockResolvedValue(mockProjects);

        const result = await handler({ stateFilter: "wellFormed", projectNameFilter: "Test" });
        expect(result.content[0].text).toBe("No projects found with the name filter 'Test'.");
    });
  });

  describe("list_project_teams tool", () => {
    it("should return teams", async () => {
      configureCoreTools(server, tokenProvider as () => Promise<string>, connectionProvider, userAgentProvider);
      const handler = (server.tool as jest.Mock).mock.calls.find(call => call[0] === 'core_list_project_teams')[3];
      const mockTeams = [{ id: "1", name: "Team1" }];
      mockCoreApi.getTeams.mockResolvedValue(mockTeams);

      const result = await handler({ project: "project1" });
      expect(result.content[0].text).toBe(JSON.stringify(mockTeams, null, 2));
    });

    it("should handle no teams found", async () => {
        configureCoreTools(server, tokenProvider as () => Promise<string>, connectionProvider, userAgentProvider);
        const handler = (server.tool as jest.Mock).mock.calls.find(call => call[0] === 'core_list_project_teams')[3];
        mockCoreApi.getTeams.mockResolvedValue([]);

        const result = await handler({ project: "project1" });
        expect(result.content[0].text).toBe("No teams found for the specified criteria.");
    });
  });

  describe("get_identity_ids tool", () => {
    it("should return identity IDs", async () => {
      configureCoreTools(server, tokenProvider as () => Promise<string>, connectionProvider, userAgentProvider);
      const handler = (server.tool as jest.Mock).mock.calls.find(call => call[0] === 'core_get_identity_ids')[3];
      const mockIdentities = {
        value: [{ id: "1", providerDisplayName: "User1", descriptor: "desc1" }],
      };
      const mockResponse: ToolResponse = {
        content: [{ type: "text", text: JSON.stringify(mockIdentities) }],
      };
      mockedSearchIdentities.mockResolvedValue(mockResponse);

      const result = await handler({ searchFilter: "user1" });
      const expected = [{ id: "1", displayName: "User1", descriptor: "desc1" }];
      expect(result.content[0].text).toBe(JSON.stringify(expected, null, 2));
    });

    it("should handle no identities found", async () => {
        configureCoreTools(server, tokenProvider as () => Promise<string>, connectionProvider, userAgentProvider);
        const handler = (server.tool as jest.Mock).mock.calls.find(call => call[0] === 'core_get_identity_ids')[3];
        const mockIdentities = {
          value: [],
        };
        const mockResponse: ToolResponse = {
          content: [{ type: "text", text: JSON.stringify(mockIdentities) }],
        };
        mockedSearchIdentities.mockResolvedValue(mockResponse);

        const result = await handler({ searchFilter: "user1" });
        expect(result.content[0].text).toBe("No identities found for search filter 'user1'.");
    });

    it("should handle error from searchIdentities", async () => {
        configureCoreTools(server, tokenProvider as () => Promise<string>, connectionProvider, userAgentProvider);
        const handler = (server.tool as jest.Mock).mock.calls.find(call => call[0] === 'core_get_identity_ids')[3];
        const mockErrorResponse: ToolResponse = {
          content: [{ type: "text", text: "Error" }],
          isError: true,
        };
        mockedSearchIdentities.mockResolvedValue(mockErrorResponse);

        const result = await handler({ searchFilter: "user1" });
        expect(result.isError).toBe(true);
        expect(result.content[0].text).toBe("Error");
    });
  });
});
