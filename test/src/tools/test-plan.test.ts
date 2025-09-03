import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebApi } from "azure-devops-node-api";
import { configureTestPlanTools } from "../../../src/tools/test-plans";
import { ITestPlanApi } from "azure-devops-node-api/TestPlanApi";
import { ITestResultsApi } from "azure-devops-node-api/TestResultsApi";
import { IWorkItemTrackingApi } from "azure-devops-node-api/WorkItemTrackingApi";
import { ITestApi } from "azure-devops-node-api/TestApi";
import { jest, describe, expect, it, beforeEach } from "@jest/globals";
import { ToolResponse } from "../../../src/shared/tool-response";

describe("configureTestPlanTools", () => {
  let server: McpServer;
  let tokenProvider: jest.Mock;
  let connectionProvider: jest.Mock;
  let mockTestPlanApi: jest.Mocked<ITestPlanApi>;
  let mockTestResultsApi: jest.Mocked<ITestResultsApi>;
  let mockWitApi: jest.Mocked<IWorkItemTrackingApi>;
  let mockTestApi: jest.Mocked<ITestApi>;

  beforeEach(() => {
    server = { tool: jest.fn() } as unknown as McpServer;
    tokenProvider = jest.fn();
    mockTestPlanApi = {
      getTestPlans: jest.fn(),
      createTestPlan: jest.fn(),
      getTestCaseList: jest.fn(),
    } as any;
    mockTestResultsApi = {
      getTestResultDetailsForBuild: jest.fn(),
    } as any;
    mockWitApi = {
      createWorkItem: jest.fn(),
    } as any;
    mockTestApi = {
      addTestCasesToSuite: jest.fn(),
    } as any;

    const mockConnection = {
      getTestPlanApi: jest.fn().mockResolvedValue(mockTestPlanApi),
      getTestResultsApi: jest.fn().mockResolvedValue(mockTestResultsApi),
      getWorkItemTrackingApi: jest.fn().mockResolvedValue(mockWitApi),
      getTestApi: jest.fn().mockResolvedValue(mockTestApi),
    };
    connectionProvider = jest.fn().mockResolvedValue(mockConnection);
    configureTestPlanTools(server, tokenProvider as () => Promise<string>, connectionProvider as () => Promise<WebApi>);
  });

  const getToolHandler = (toolName: string) => {
    const call = (server.tool as jest.Mock).mock.calls.find(([name]) => name === toolName);
    if (!call) throw new Error(`${toolName} tool not registered`);
    return call[3];
  };

  describe("list_test_plans", () => {
    it("should list test plans", async () => {
      const handler = getToolHandler("testplan_list_test_plans");
      const mockPlans = [{ id: 1, name: "Plan 1" }];
      mockTestPlanApi.getTestPlans.mockResolvedValue(mockPlans);
      const result = await handler({ project: "p1" });
      expect(result.content[0].text).toBe(JSON.stringify(mockPlans, null, 2));
    });

    it("should handle no test plans found", async () => {
      const handler = getToolHandler("testplan_list_test_plans");
      mockTestPlanApi.getTestPlans.mockResolvedValue([]);
      const result = await handler({ project: "p1" });
      expect(result.content[0].text).toBe("No test plans found for the specified criteria.");
    });

    it("should handle errors", async () => {
      const handler = getToolHandler("testplan_list_test_plans");
      mockTestPlanApi.getTestPlans.mockRejectedValue(new Error("API Error"));
      const result = await handler({ project: "p1" });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Error listing test plans for project 'p1': API Error");
    });
  });

  describe("create_test_plan", () => {
    it("should create a test plan", async () => {
      const handler = getToolHandler("testplan_create_test_plan");
      const mockPlan = { id: 1, name: "New Plan" };
      mockTestPlanApi.createTestPlan.mockResolvedValue(mockPlan);
      const result = await handler({ project: "p1", name: "New Plan", iteration: "Sprint 1" });
      expect(result.content[0].text).toBe(JSON.stringify(mockPlan, null, 2));
    });
  });

  describe("add_test_cases_to_suite", () => {
    it("should add test cases", async () => {
      const handler = getToolHandler("testplan_add_test_cases_to_suite");
      const mockCases = [{ id: 1 }];
      mockTestApi.addTestCasesToSuite.mockResolvedValue(mockCases);
      const result = await handler({ project: "p1", planId: 1, suiteId: 2, testCaseIds: "123" });
      expect(result.content[0].text).toBe(JSON.stringify(mockCases, null, 2));
    });
  });

  describe("create_test_case", () => {
    it("should create a test case", async () => {
      const handler = getToolHandler("testplan_create_test_case");
      const mockCase = { id: 1, name: "New Case" };
      mockWitApi.createWorkItem.mockResolvedValue(mockCase);
      const result = await handler({ project: "p1", title: "New Case" });
      expect(result.content[0].text).toBe(JSON.stringify(mockCase, null, 2));
    });
  });

  describe("list_test_cases", () => {
    it("should list test cases", async () => {
      const handler = getToolHandler("testplan_list_test_cases");
      const mockCases = [{ id: 1, name: "Case 1" }];
      mockTestPlanApi.getTestCaseList.mockResolvedValue(mockCases);
      const result = await handler({ project: "p1", planId: 1, suiteId: 2 });
      expect(result.content[0].text).toBe(JSON.stringify(mockCases, null, 2));
    });

    it("should handle no test cases found", async () => {
        const handler = getToolHandler("testplan_list_test_cases");
        mockTestPlanApi.getTestCaseList.mockResolvedValue([]);
        const result = await handler({ project: "p1", planId: 1, suiteId: 2 });
        expect(result.content[0].text).toBe("No test cases found for suite 2 in plan 1.");
      });
  });

  describe("test_results_from_build_id", () => {
    it("should show test results", async () => {
      const handler = getToolHandler("testplan_show_test_results_from_build_id");
      const mockResults = { resultsForGroup: [{ outcome: "Passed" }] };
      mockTestResultsApi.getTestResultDetailsForBuild.mockResolvedValue(mockResults as any);
      const result = await handler({ project: "p1", buildId: 123 });
      expect(result.content[0].text).toBe(JSON.stringify(mockResults, null, 2));
    });

    it("should handle no test results found", async () => {
        const handler = getToolHandler("testplan_show_test_results_from_build_id");
        mockTestResultsApi.getTestResultDetailsForBuild.mockResolvedValue({ resultsForGroup: [] } as any);
        const result = await handler({ project: "p1", buildId: 123 });
        expect(result.content[0].text).toBe("No test results found for build ID 123.");
      });
  });
});
