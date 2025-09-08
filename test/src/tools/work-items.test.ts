import { AccessToken } from "@azure/identity";
import { describe, expect, it, beforeEach, jest } from "@jest/globals";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebApi } from "azure-devops-node-api";
import { IWorkItemTrackingApi } from "azure-devops-node-api/WorkItemTrackingApi.js";
import { WorkItemExpand, QueryExpand, QueryHierarchyItem } from "azure-devops-node-api/interfaces/WorkItemTrackingInterfaces.js";
import { configureWorkItemTools } from "../../../src/tools/work-items";
import { _mockWorkItem, _mockQuery } from "../../mocks/work-items";

// Mock fetch globally
const mockFetch = jest.fn<typeof fetch>();
global.fetch = mockFetch;

type TokenProviderMock = () => Promise<AccessToken>;
type ConnectionProviderMock = () => Promise<WebApi>;

describe("configureWorkItemTools", () => {
  let server: McpServer;
  let tokenProvider: TokenProviderMock;
  let connectionProvider: ConnectionProviderMock;
  let userAgentProvider: () => string;
  let mockWorkItemTrackingApi: jest.Mocked<IWorkItemTrackingApi>;
  let mockWebApi: WebApi;

  beforeEach(() => {
    server = { tool: jest.fn() } as unknown as McpServer;
    tokenProvider = jest.fn<() => Promise<AccessToken>>().mockResolvedValue({ token: "fake-token", expiresOnTimestamp: Date.now() + 3600 * 1000 });
    userAgentProvider = () => "Jest";
    mockWorkItemTrackingApi = {
      getWorkItem: jest.fn(),
      updateWorkItem: jest.fn(),
      createWorkItem: jest.fn(),
      getQuery: jest.fn(),
      getWorkItemType: jest.fn(),
      getComments: jest.fn(),
      getBacklogs: jest.fn(),
      getBacklogLevelWorkItems: jest.fn(),
      getPredefinedQueryResults: jest.fn(),
      getWorkItemsBatch: jest.fn(),
      getIterationWorkItems: jest.fn(),
      queryById: jest.fn(),
    } as any;

    const getWorkItemTrackingApi = jest.fn<() => Promise<IWorkItemTrackingApi>>().mockResolvedValue(mockWorkItemTrackingApi);
    mockWebApi = { getWorkItemTrackingApi } as unknown as WebApi;
    connectionProvider = jest.fn<() => Promise<WebApi>>().mockResolvedValue(mockWebApi);
    mockFetch.mockClear();
  });

  describe("get_work_item tool", () => {
    it("should call workItemApi.getWorkItem API with the correct parameters and return the expected result", async () => {
      configureWorkItemTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "wit_get_work_item");
      if (!call) throw new Error("Tool not found");
      const handler = call[3] as (params: any) => Promise<any>;

      mockWorkItemTrackingApi.getWorkItem.mockResolvedValue(_mockWorkItem);

      const params = {
        id: 12,
        project: "Contoso",
        expand: "none" as const,
      };

      const result = await handler(params);

      expect(mockWorkItemTrackingApi.getWorkItem).toHaveBeenCalledWith(params.id, undefined, undefined, WorkItemExpand.None, params.project);
      expect(result.content[0].text).toBe(JSON.stringify([_mockWorkItem], null, 2));
    });
  });

  describe("update_work_item tool", () => {
    it("should call workItemApi.updateWorkItem API with the correct parameters and return the expected result", async () => {
      configureWorkItemTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "wit_update_work_item");
      if (!call) throw new Error("Tool not found");
      const handler = call[3] as (params: any) => Promise<any>;
      mockWorkItemTrackingApi.updateWorkItem.mockResolvedValue(_mockWorkItem);
      const params = {
        id: 131489,
        updates: [
          { op: "Add", path: "/fields/System.Title", value: "Updated Sample Task" },
          { op: "Replace", path: "/fields/System.Description", value: "Updated Description" },
        ],
      };
      const result = await handler(params);
      const expectedUpdates = params.updates;
      expect(mockWorkItemTrackingApi.updateWorkItem).toHaveBeenCalledWith(null, expectedUpdates, params.id, undefined);
      expect(result.content[0].text).toBe(JSON.stringify([_mockWorkItem], null, 2));
    });
  });

  describe("create_work_item tool", () => {
    it("should call workItemApi.createWorkItem API with the correct parameters and return the expected result", async () => {
      configureWorkItemTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "wit_create_work_item");
      if (!call) throw new Error("Tool not found");
      const handler = call[3] as (params: any) => Promise<any>;
      mockWorkItemTrackingApi.createWorkItem.mockResolvedValue(_mockWorkItem);
      const params = {
        project: "Contoso",
        workItemType: "Task",
        fields: [
          { name: "System.Title", value: "Hello World!" },
          { name: "System.Description", value: "This is a sample task" },
          { name: "System.AreaPath", value: "Contoso\\Development" },
        ],
      };
      const result = await handler(params);
      const expectedDocument = [
        { op: "add", path: "/fields/System.Title", value: "Hello World!" },
        { op: "add", path: "/fields/System.Description", value: "This is a sample task" },
        { op: "add", path: "/fields/System.AreaPath", value: "Contoso\\Development" },
      ];
      expect(mockWorkItemTrackingApi.createWorkItem).toHaveBeenCalledWith(null, expectedDocument, params.project, params.workItemType);
      expect(result.content[0].text).toBe(JSON.stringify(_mockWorkItem, null, 2));
    });

    it("should handle Markdown format for long fields", async () => {
      configureWorkItemTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "wit_create_work_item");
      if (!call) throw new Error("Tool not found");
      const handler = call[3] as (params: any) => Promise<any>;
      mockWorkItemTrackingApi.createWorkItem.mockResolvedValue(_mockWorkItem);
      const params = {
        project: "Contoso",
        workItemType: "Task",
        fields: [
          { name: "System.Title", value: "Hello World!" },
          { name: "System.Description", value: "This is a very long description that is definitely more than 50 characters long and should trigger Markdown formatting", format: "Markdown" },
        ],
      };
      const result = await handler(params);
      const expectedDocument = [
        { op: "add", path: "/fields/System.Title", value: "Hello World!" },
        { op: "add", path: "/fields/System.Description", value: "This is a very long description that is definitely more than 50 characters long and should trigger Markdown formatting" },
        { op: "add", path: "/multilineFieldsFormat/System.Description", value: "Markdown" },
      ];
      expect(mockWorkItemTrackingApi.createWorkItem).toHaveBeenCalledWith(null, expectedDocument, params.project, params.workItemType);
      expect(result.content[0].text).toBe(JSON.stringify(_mockWorkItem, null, 2));
    });
  });

  describe("get_query tool", () => {
    it("should call workItemApi.getQuery API with the correct parameters and return the expected result", async () => {
      configureWorkItemTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "wit_get_query");
      if (!call) throw new Error("Tool not found");
      const handler = call[3] as (params: any) => Promise<any>;

      const mockQueryWithDate: QueryHierarchyItem = {
        ..._mockQuery,
        createdDate: new Date(_mockQuery.createdDate),
        lastModifiedDate: new Date(_mockQuery.lastModifiedDate),
        lastExecutedDate: new Date(_mockQuery.lastExecutedDate),
      };
      mockWorkItemTrackingApi.getQuery.mockResolvedValue(mockQueryWithDate);
      const params = {
        project: "Contoso",
        query: "Shared Queries/Features",
        expand: "none" as const,
        depth: 2,
        includeDeleted: true,
        useIsoDateFormat: true,
      };
      const result = await handler(params);
      expect(mockWorkItemTrackingApi.getQuery).toHaveBeenCalledWith(params.project, params.query, QueryExpand.None, params.depth, params.includeDeleted, params.useIsoDateFormat);
      expect(result.content[0].text).toBe(JSON.stringify(mockQueryWithDate, null, 2));
    });
  });

  describe("getLinkTypeFromName function coverage", () => {
    it("should throw error for unknown link type", async () => {
      configureWorkItemTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "wit_work_items_link");
      if (!call) throw new Error("Tool not found");
      const handler = call[3] as (params: any) => Promise<any>;
      const params = {
        project: "TestProject",
        updates: [{ id: 1, linkToId: 2, type: "unknown_type" }],
      };
      await expect(handler(params)).rejects.toThrow("Unknown link type: unknown_type");
    });
  });

  describe("update_work_items_batch tool", () => {
    it("should update work items in batch successfully", async () => {
      configureWorkItemTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "wit_update_work_items_batch");
      if (!call) throw new Error("Tool not found");
      const handler = call[3] as (params: any) => Promise<any>;
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ value: [] }) } as Response);
      const params = {
        project: "Contoso",
        updates: [
          { op: "replace", id: 1, path: "/fields/System.Title", value: "Updated Title" },
          { op: "add", id: 2, path: "/fields/System.Description", value: "New Description" },
        ],
      };
      await handler(params);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("Contoso/_apis/wit/$batch?api-version="),
        expect.objectContaining({
          method: "PATCH",
          body: expect.stringContaining(`"uri":"/_apis/wit/workitems/1?api-version=5.0"`),
        })
      );
    });

    it("should handle Markdown format for large text fields", async () => {
      configureWorkItemTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "wit_update_work_items_batch");
      if (!call) throw new Error("Tool not found");
      const handler = call[3] as (params: any) => Promise<any>;
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ value: [] }) } as Response);
      const params = {
        project: "Contoso",
        updates: [
          {
            op: "Add",
            id: 1,
            path: "/fields/System.Description",
            value: "This is a very long description that is definitely more than 50 characters long and should trigger Markdown formatting",
            format: "Markdown",
          },
          { op: "Add", id: 1, path: "/fields/System.Title", value: "Simple Title" },
        ],
      };
      await handler(params);
      const fetchCall = (fetch as jest.Mock).mock.calls[0] as [RequestInfo | URL, RequestInit | undefined];
      const body = JSON.parse(fetchCall[1]?.body as string);
      const patchDoc = body[0].body;
      expect(patchDoc).toContainEqual({ op: "add", path: "/multilineFieldsFormat/System.Description", value: "Markdown" });
    });
  });

  describe("work_items_link tool", () => {
    it("should link work items successfully", async () => {
      configureWorkItemTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "wit_work_items_link");
      if (!call) throw new Error("Tool not found");
      const handler = call[3] as (params: any) => Promise<any>;
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ value: [] }) } as Response);
      const params = {
        project: "TestProject",
        updates: [{ id: 1, linkToId: 2, type: "related", comment: "Related work item" }],
      };
      await handler(params);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/TestProject/_apis/wit/$batch?api-version="),
        expect.objectContaining({
          method: "PATCH",
          body: expect.stringContaining(`"rel":"System.LinkTypes.Related"`),
        })
      );
    });
  });

  describe("work_item_unlink tool", () => {
    it("should unlink work items successfully", async () => {
      configureWorkItemTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "wit_work_item_unlink");
      if (!call) throw new Error("Tool not found");
      const handler = call[3] as (params: any) => Promise<any>;
      mockWorkItemTrackingApi.getWorkItem.mockResolvedValue({ relations: [{ rel: "System.LinkTypes.Related", url: "http://test.com/2" }] } as any);
      mockWorkItemTrackingApi.updateWorkItem.mockResolvedValue(_mockWorkItem);
      const params = {
        project: "TestProject",
        id: 1,
        type: "related",
        url: "http://test.com/2",
      };
      const result = await handler(params);
      expect(mockWorkItemTrackingApi.updateWorkItem).toHaveBeenCalledWith(null, [{ op: "remove", path: "/relations/0" }], 1, "TestProject");
      expect(result.content[0].text).toContain("Removed 1 link(s) of type 'related':");
    });

    it("should unlink all links of a specific type when no URL is provided", async () => {
      configureWorkItemTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "wit_work_item_unlink");
      if (!call) throw new Error("Tool not found");
      const handler = call[3] as (params: any) => Promise<any>;
      mockWorkItemTrackingApi.getWorkItem.mockResolvedValue({ relations: [{ rel: "System.LinkTypes.Related" }, { rel: "System.LinkTypes.Related" }] } as any);
      mockWorkItemTrackingApi.updateWorkItem.mockResolvedValue(_mockWorkItem);
      const params = {
        project: "TestProject",
        id: 1,
        type: "related",
      };
      await handler(params);
      expect(mockWorkItemTrackingApi.updateWorkItem).toHaveBeenCalledWith(
        null,
        [
          { op: "remove", path: "/relations/1" },
          { op: "remove", path: "/relations/0" },
        ],
        1,
        "TestProject"
      );
    });

    it("should handle artifact link removal", async () => {
      configureWorkItemTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "wit_work_item_unlink");
      if (!call) throw new Error("Tool not found");
      const handler = call[3] as (params: any) => Promise<any>;
      mockWorkItemTrackingApi.getWorkItem.mockResolvedValue({ relations: [{ rel: "ArtifactLink", url: "vstfs:///..." }] } as any);
      mockWorkItemTrackingApi.updateWorkItem.mockResolvedValue(_mockWorkItem);
      const params = {
        project: "TestProject",
        id: 1,
        type: "artifact",
        url: "vstfs:///...",
      };
      const result = await handler(params);
      expect(mockWorkItemTrackingApi.updateWorkItem).toHaveBeenCalledWith(null, [{ op: "remove", path: "/relations/0" }], 1, "TestProject");
    });

    it("should handle specific URL matching correctly", async () => {
      configureWorkItemTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "wit_work_item_unlink");
      if (!call) throw new Error("Tool not found");
      const handler = call[3] as (params: any) => Promise<any>;
      mockWorkItemTrackingApi.getWorkItem.mockResolvedValue({
        relations: [
          { rel: "System.LinkTypes.Related", url: "http://test.com/2" },
          { rel: "System.LinkTypes.Related", url: "http://test.com/3" },
        ],
      } as any);
      mockWorkItemTrackingApi.updateWorkItem.mockResolvedValue(_mockWorkItem);
      const params = {
        project: "TestProject",
        id: 1,
        type: "related",
        url: "http://test.com/2",
      };
      await handler(params);
      expect(mockWorkItemTrackingApi.updateWorkItem).toHaveBeenCalledWith(null, [{ op: "remove", path: "/relations/0" }], 1, "TestProject");
    });
  });

  describe("add_child_work_items tool", () => {
    it("should handle add_child_work_item with optional parameters", async () => {
      configureWorkItemTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "wit_add_child_work_items");
      if (!call) throw new Error("Tool not found");
      const handler = call[3] as (params: any) => Promise<any>;
      mockWorkItemTrackingApi.createWorkItem.mockResolvedValue(_mockWorkItem);
      const params = {
        parentId: 1,
        project: "TestProject",
        workItemType: "Task",
        items: [{ title: "Child Task", areaPath: "TestProject\\Area1", iterationPath: "TestProject\\Sprint1" }],
      };
      await handler(params);
      expect(mockWorkItemTrackingApi.createWorkItem).toHaveBeenCalledWith(
        {},
        expect.arrayContaining([
          expect.objectContaining({ path: "/fields/System.AreaPath", value: "TestProject\\Area1" }),
          expect.objectContaining({ path: "/fields/System.IterationPath", value: "TestProject\\Sprint1" }),
        ]),
        "TestProject",
        "Task"
      );
    });

    it("should handle add_child_work_item with empty optional parameters", async () => {
      configureWorkItemTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "wit_add_child_work_items");
      if (!call) throw new Error("Tool not found");
      const handler = call[3] as (params: any) => Promise<any>;
      mockWorkItemTrackingApi.createWorkItem.mockResolvedValue(_mockWorkItem);
      const params = {
        parentId: 1,
        project: "TestProject",
        workItemType: "Task",
        items: [{ title: "Child Task", areaPath: " ", iterationPath: "" }],
      };
      await handler(params);
      const patchDoc = mockWorkItemTrackingApi.createWorkItem.mock.calls[0][1];
      expect(patchDoc).not.toContainEqual(expect.objectContaining({ path: "/fields/System.AreaPath" }));
      expect(patchDoc).not.toContainEqual(expect.objectContaining({ path: "/fields/System.IterationPath" }));
    });

    it("should handle Markdown format correctly", async () => {
      configureWorkItemTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "wit_add_child_work_items");
      if (!call) throw new Error("Tool not found");
      const handler = call[3] as (params: any) => Promise<any>;
      mockWorkItemTrackingApi.createWorkItem.mockResolvedValue(_mockWorkItem);
      const params = {
        parentId: 1,
        project: "TestProject",
        workItemType: "Task",
        items: [{ title: "Child Task", description: "a".repeat(51), format: "Markdown" as const }],
      };
      await handler(params);
      const patchDoc = mockWorkItemTrackingApi.createWorkItem.mock.calls[0][1];
      expect(patchDoc).toContainEqual({ op: "add", path: "/multilineFieldsFormat/System.Description", value: "Markdown" });
    });

    it("should handle fetch failure response", async () => {
      configureWorkItemTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "wit_add_child_work_items");
      if (!call) throw new Error("Tool not found");
      const handler = call[3] as (params: any) => Promise<any>;
      mockWorkItemTrackingApi.createWorkItem.mockRejectedValue(new Error("Internal Server Error"));
      const params = {
        parentId: 1,
        project: "TestProject",
        workItemType: "Task",
        items: [{ title: "Child Task" }],
      };
      const result = await handler(params);
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toBe("Error creating child work items: Internal Server Error");
    });

    it("should handle unknown error types in add_child_work_items", async () => {
      configureWorkItemTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "wit_add_child_work_items");
      if (!call) throw new Error("Tool not found");
      const handler = call[3] as (params: any) => Promise<any>;
      mockWorkItemTrackingApi.createWorkItem.mockRejectedValue("unknown error");
      const params = {
        parentId: 1,
        project: "TestProject",
        workItemType: "Task",
        items: [{ title: "Child Task" }],
      };
      const result = await handler(params);
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toBe("Error creating child work items: Unknown error occurred");
    });
  });
});
