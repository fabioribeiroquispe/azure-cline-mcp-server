// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { ITestPlanApi } from "azure-devops-node-api/TestPlanApi";
import { ITestResultsApi } from "azure-devops-node-api/TestResultsApi";
import { WebApi } from "azure-devops-node-api";
import { TestPlanCreateParams } from "azure-devops-node-api/interfaces/TestPlanInterfaces";
import { z } from "zod";
import { ToolResponse } from "../shared/tool-response";
import { JsonPatchOperation } from "azure-devops-node-api/interfaces/common/VSSInterfaces";

const TEST_PLAN_TOOLS = {
  create_test_plan: "testplan_create_test_plan",
  create_test_case: "testplan_create_test_case",
  add_test_cases_to_suite: "testplan_add_test_cases_to_suite",
  test_results_from_build_id: "testplan_show_test_results_from_build_id",
  list_test_cases: "testplan_list_test_cases",
  list_test_plans: "testplan_list_test_plans",
};

const listTestPlansSchema = z.object({
    project: z.string().describe("The unique identifier (ID or name) of the Azure DevOps project."),
    filterActivePlans: z.boolean().default(true).describe("Filter to include only active test plans. Defaults to true."),
    includePlanDetails: z.boolean().default(false).describe("Include detailed information about each test plan."),
    continuationToken: z.string().optional().describe("Token to continue fetching test plans from a previous request."),
});
type ListTestPlansParams = z.infer<typeof listTestPlansSchema>;

const createTestPlanSchema = z.object({
    project: z.string().describe("The unique identifier (ID or name) of the Azure DevOps project where the test plan will be created."),
    name: z.string().describe("The name of the test plan to be created."),
    iteration: z.string().describe("The iteration path for the test plan"),
    description: z.string().optional().describe("The description of the test plan"),
    startDate: z.string().optional().describe("The start date of the test plan"),
    endDate: z.string().optional().describe("The end date of the test plan"),
    areaPath: z.string().optional().describe("The area path for the test plan"),
});
type CreateTestPlanParams = z.infer<typeof createTestPlanSchema>;

const addTestCasesToSuiteSchema = z.object({
    project: z.string().describe("The unique identifier (ID or name) of the Azure DevOps project."),
    planId: z.number().describe("The ID of the test plan."),
    suiteId: z.number().describe("The ID of the test suite."),
    testCaseIds: z.string().or(z.array(z.string())).describe("The ID(s) of the test case(s) to add."),
});
type AddTestCasesToSuiteParams = z.infer<typeof addTestCasesToSuiteSchema>;

const createTestCaseSchema = z.object({
    project: z.string().describe("The unique identifier (ID or name) of the Azure DevOps project."),
    title: z.string().describe("The title of the test case."),
    steps: z.string().optional().describe("The steps to reproduce the test case. Make sure to format each step as '1. Step one|Expected result one\n2. Step two|Expected result two. USE '|' as the delimiter between step and expected result. DO NOT use '|' in the description of the step or expected result."),
    priority: z.number().optional().describe("The priority of the test case."),
    areaPath: z.string().optional().describe("The area path for the test case."),
    iterationPath: z.string().optional().describe("The iteration path for the test case."),
});
type CreateTestCaseParams = z.infer<typeof createTestCaseSchema>;

const listTestCasesSchema = z.object({
    project: z.string().describe("The unique identifier (ID or name) of the Azure DevOps project."),
    planId: z.number().describe("The ID of the test plan."),
    suiteId: z.number().describe("The ID of the test suite."),
});
type ListTestCasesParams = z.infer<typeof listTestCasesSchema>;

const testResultsFromBuildIdSchema = z.object({
    project: z.string().describe("The unique identifier (ID or name) of the Azure DevOps project."),
    buildId: z.number().describe("The ID of the build."),
});
type TestResultsFromBuildIdParams = z.infer<typeof testResultsFromBuildIdSchema>;


async function getTestPlanApi(connectionProvider: () => Promise<WebApi>): Promise<ITestPlanApi> {
  const connection = await connectionProvider();
  return connection.getTestPlanApi();
}

async function getTestResultsApi(connectionProvider: () => Promise<WebApi>): Promise<ITestResultsApi> {
  const connection = await connectionProvider();
  return connection.getTestResultsApi();
}

function buildPatchDocument(
  title: string,
  steps: string | undefined,
  priority: number | undefined,
  areaPath: string | undefined,
  iterationPath: string | undefined
): JsonPatchOperation[] {
  const patchDocument: JsonPatchOperation[] = [];

  patchDocument.push({
    op: "add",
    path: "/fields/System.Title",
    value: title,
  });

  if (steps) {
    const stepsXml = convertStepsToXml(steps);
    patchDocument.push({
      op: "add",
      path: "/fields/Microsoft.VSTS.TCM.Steps",
      value: stepsXml,
    });
  }

  if (priority) {
    patchDocument.push({
      op: "add",
      path: "/fields/Microsoft.VSTS.Common.Priority",
      value: priority,
    });
  }

  if (areaPath) {
    patchDocument.push({
      op: "add",
      path: "/fields/System.AreaPath",
      value: areaPath,
    });
  }

  if (iterationPath) {
    patchDocument.push({
      op: "add",
      path: "/fields/System.IterationPath",
      value: iterationPath,
    });
  }

  return patchDocument;
}

function configureTestPlanTools(server: McpServer, tokenProvider: () => Promise<string>, connectionProvider: () => Promise<WebApi>) {
  server.tool(
    TEST_PLAN_TOOLS.list_test_plans,
    "Retrieve a paginated list of test plans from an Azure DevOps project. Allows filtering for active plans and toggling detailed information.",
    listTestPlansSchema,
    async ({ project, filterActivePlans, includePlanDetails, continuationToken }: ListTestPlansParams): Promise<ToolResponse> => {
      try {
        const owner = ""; //making owner an empty string untill we can figure out how to get owner id
        const testPlanApi = await getTestPlanApi(connectionProvider);
        const testPlans = await testPlanApi.getTestPlans(project, owner, continuationToken, includePlanDetails, filterActivePlans);

        if (!testPlans || testPlans.length === 0) {
          return { content: [{ type: "text", text: "No test plans found for the specified criteria." }] };
        }

        return {
          content: [{ type: "text", text: JSON.stringify(testPlans, null, 2) }],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return {
          content: [{ type: "text", text: `Error listing test plans for project '${project}': ${errorMessage}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    TEST_PLAN_TOOLS.create_test_plan,
    "Creates a new test plan in the project.",
    createTestPlanSchema,
    async ({ project, name, iteration, description, startDate, endDate, areaPath }: CreateTestPlanParams): Promise<ToolResponse> => {
      try {
        const testPlanApi = await getTestPlanApi(connectionProvider);
        const testPlanToCreate: TestPlanCreateParams = {
          name,
          iteration,
          description,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
          areaPath,
        };

        const createdTestPlan = await testPlanApi.createTestPlan(testPlanToCreate, project);

        return {
          content: [{ type: "text", text: JSON.stringify(createdTestPlan, null, 2) }],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return {
          content: [{ type: "text", text: `Error creating test plan '${name}' in project '${project}': ${errorMessage}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    TEST_PLAN_TOOLS.add_test_cases_to_suite,
    "Adds existing test cases to a test suite.",
    addTestCasesToSuiteSchema,
    async ({ project, planId, suiteId, testCaseIds }: AddTestCasesToSuiteParams): Promise<ToolResponse> => {
      try {
        const connection = await connectionProvider();
        const testApi = await connection.getTestApi();
        const testCaseIdsString = Array.isArray(testCaseIds) ? testCaseIds.join(",") : testCaseIds;
        const addedTestCases = await testApi.addTestCasesToSuite(project, planId, suiteId, testCaseIdsString);

        return {
          content: [{ type: "text", text: JSON.stringify(addedTestCases, null, 2) }],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return {
          content: [{ type: "text", text: `Error adding test cases to suite ${suiteId} in plan ${planId}: ${errorMessage}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    TEST_PLAN_TOOLS.create_test_case,
    "Creates a new test case work item.",
    createTestCaseSchema,
    async ({ project, title, steps, priority, areaPath, iterationPath }: CreateTestCaseParams): Promise<ToolResponse> => {
      try {
        const connection = await connectionProvider();
        const witClient = await connection.getWorkItemTrackingApi();
        const patchDocument = buildPatchDocument(title, steps, priority, areaPath, iterationPath);
        const workItem = await witClient.createWorkItem({}, patchDocument, project, "Test Case");

        return {
          content: [{ type: "text", text: JSON.stringify(workItem, null, 2) }],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return {
          content: [{ type: "text", text: `Error creating test case '${title}' in project '${project}': ${errorMessage}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    TEST_PLAN_TOOLS.list_test_cases,
    "Gets a list of test cases in the test plan.",
    listTestCasesSchema,
    async ({ project, planId, suiteId }: ListTestCasesParams): Promise<ToolResponse> => {
      try {
        const testPlanApi = await getTestPlanApi(connectionProvider);
        const testcases = await testPlanApi.getTestCaseList(project, planId, suiteId);

        if (!testcases || testcases.length === 0) {
          return { content: [{ type: "text", text: `No test cases found for suite ${suiteId} in plan ${planId}.` }] };
        }

        return {
          content: [{ type: "text", text: JSON.stringify(testcases, null, 2) }],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return {
          content: [{ type: "text", text: `Error listing test cases for suite ${suiteId} in plan ${planId}: ${errorMessage}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    TEST_PLAN_TOOLS.test_results_from_build_id,
    "Gets a list of test results for a given project and build ID.",
    testResultsFromBuildIdSchema,
    async ({ project, buildId }: TestResultsFromBuildIdParams): Promise<ToolResponse> => {
      try {
        const testResultsApi = await getTestResultsApi(connectionProvider);
        const testResults = await testResultsApi.getTestResultDetailsForBuild(project, buildId);

        if (!testResults.resultsForGroup || testResults.resultsForGroup.length === 0) {
          return { content: [{ type: "text", text: `No test results found for build ID ${buildId}.` }] };
        }

        return {
          content: [{ type: "text", text: JSON.stringify(testResults, null, 2) }],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return {
          content: [{ type: "text", text: `Error fetching test results for build ID ${buildId}: ${errorMessage}` }],
          isError: true,
        };
      }
    }
  );
}

function convertStepsToXml(steps: string): string {
  const stepsLines = steps.split("\n").filter((line) => line.trim() !== "");

  let xmlSteps = `<steps id="0" last="${stepsLines.length}">`;

  for (let i = 0; i < stepsLines.length; i++) {
    const stepLine = stepsLines[i].trim();
    if (stepLine) {
      const [stepPart, expectedPart] = stepLine.split("|").map((s) => s.trim());
      const stepMatch = stepPart.match(/^(\d+)\.\s*(.+)$/);
      const stepText = stepMatch ? stepMatch[2] : stepPart;
      const expectedText = expectedPart || "Verify step completes successfully";

      xmlSteps += `
                <step id="${i + 1}" type="ActionStep">
                    <parameterizedString isformatted="true">${escapeXml(stepText)}</parameterizedString>
                    <parameterizedString isformatted="true">${escapeXml(expectedText)}</parameterizedString>
                </step>`;
    }
  }

  xmlSteps += "</steps>";
  return xmlSteps;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}

export { TEST_PLAN_TOOLS as Test_Plan_Tools, configureTestPlanTools };
