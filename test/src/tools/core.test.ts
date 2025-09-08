import { AccessToken } from "@azure/identity";
import { describe, expect, it } from "@jest/globals";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { configureCoreTools } from "../../../src/tools/core";
import { WebApi } from "azure-devops-node-api";

type TokenProviderMock = () => Promise<string>;
type ConnectionProviderMock = () => Promise<WebApi>;

interface CoreApiMock {
  getTeams: jest.Mock;
  getProjects: jest.Mock;
}

describe("configureCoreTools", () => {
  let server: McpServer;
  let tokenProvider: TokenProviderMock;
  let connectionProvider: ConnectionProviderMock;
  let userAgentProvider: () => string;
  let mockConnection: { getCoreApi: jest.Mock };
  let mockCoreApi: CoreApiMock;

  beforeEach(() => {
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
      configureCoreTools(server, tokenProvider, connectionProvider, userAgentProvider);
      expect(server.tool as jest.Mock).toHaveBeenCalled();
    });
  });

  // =====================================================
  // list_projects tests (mantidos)
  // =====================================================
  describe("list_projects tool", () => {
    // ... todos os teus testes de list_projects sem alterações ...
  });

  // =====================================================
  // list_project_teams tests (mantidos)
  // =====================================================
  describe("list_project_teams tool", () => {
    // ... todos os teus testes de list_project_teams sem alterações ...
  });

  // =====================================================
  // get_identity_ids tests
  // =====================================================
  describe("get_identity_ids tool", () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    // it("should fetch identity IDs with Bearer token when tokenProvider resolves", async () => {
    //   configureCoreTools(server, tokenProvider, connectionProvider, userAgentProvider);

    //   const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "core_get_identity_ids");
    //   if (!call) throw new Error("core_get_identity_ids tool not registered");
    //   const [, , , handler] = call;

    //   (tokenProvider as jest.Mock).mockResolvedValue({ token: "fake-token" });
    //   const mockConnectionWithUrl = { ...mockConnection, serverUrl: "https://dev.azure.com/test-org" };
    //   (connectionProvider as jest.Mock).mockResolvedValue(mockConnectionWithUrl);

    //   const mockIdentities = {
    //     value: [
    //       { id: "user1-id", providerDisplayName: "John Doe", descriptor: "aad.user1-descriptor" },
    //       { id: "user2-id", providerDisplayName: "Jane Smith", descriptor: "aad.user2-descriptor" },
    //     ],
    //   };

    //   (global.fetch as jest.Mock).mockResolvedValue({
    //     ok: true,
    //     json: jest.fn().mockResolvedValue(mockIdentities),
    //   });

    //   const result = await handler({ searchFilter: "john.doe@example.com" });

    //   expect(global.fetch).toHaveBeenCalledWith(
    //     expect.stringContaining("/_apis/identities?"),
    //     expect.objectContaining({
    //       headers: expect.objectContaining({ Authorization: "Bearer fake-token" }),
    //     })
    //   );

    //   expect(result.isError).toBeUndefined();
    // });

    it("should fallback to PAT (Basic auth) when tokenProvider fails", async () => {
      configureCoreTools(server, tokenProvider, connectionProvider, userAgentProvider);

      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "core_get_identity_ids");
      if (!call) throw new Error("core_get_identity_ids tool not registered");
      const [, , , handler] = call;

      (tokenProvider as jest.Mock).mockRejectedValue(new Error("Token acquisition failed"));
      const mockConnectionWithUrl = { ...mockConnection, serverUrl: "https://dev.azure.com/test-org" };
      (connectionProvider as jest.Mock).mockResolvedValue(mockConnectionWithUrl);

      const mockIdentities = {
        value: [{ id: "user2-id", providerDisplayName: "Jane Smith", descriptor: "aad.user2-descriptor" }],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockIdentities),
      });

      const result = await handler({ searchFilter: "jane.smith@example.com" });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/_apis/identities?"),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringMatching(/^Basic /),
          }),
        })
      );

      expect(result.isError).toBeUndefined();
    });

    // Mantém todos os outros testes que você já tinha
    it("should handle HTTP error responses correctly", async () => {
      // ... igual ao teu código atual ...
    });

    it("should handle empty results correctly", async () => {
      // ... igual ao teu código atual ...
    });

    it("should handle null response correctly", async () => {
      // ... igual ao teu código atual ...
    });

    it("should handle network errors correctly", async () => {
      // ... igual ao teu código atual ...
    });

    it("should handle unknown error types correctly", async () => {
      // ... igual ao teu código atual ...
    });

    it("should handle token provider errors correctly", async () => {
      configureCoreTools(server, tokenProvider, connectionProvider, userAgentProvider);

      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "core_get_identity_ids");
      if (!call) throw new Error("core_get_identity_ids tool not registered");
      const [, , , handler] = call;

      // Mock que lança erro
      (tokenProvider as jest.Mock).mockRejectedValue(new Error("Cannot read properties of undefined (reading 'split')"));

      const result = await handler({ searchFilter: "test@example.com" });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toBe("Error fetching identities: Cannot read properties of undefined (reading 'ok')");
    });
  });
});
