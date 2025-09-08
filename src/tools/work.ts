// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebApi } from "azure-devops-node-api";
import { TeamContext } from "azure-devops-node-api/interfaces/CoreInterfaces.js";
import { TeamSettingsIteration } from "azure-devops-node-api/interfaces/WorkInterfaces.js";
import { TreeStructureGroup, WorkItemClassificationNode } from "azure-devops-node-api/interfaces/WorkItemTrackingInterfaces.js";
import { z } from "zod";

const WORK_TOOLS = {
  list_team_iterations: "work_list_team_iterations",
  create_iterations: "work_create_iterations",
  assign_iterations: "work_assign_iterations",
};

function configureWorkTools(server: McpServer, tokenProvider: () => Promise<string>, connectionProvider: () => Promise<WebApi>) {
  server.tool(
    WORK_TOOLS.list_team_iterations,
    "Retrieve a list of iterations for a specific team in a project.",
    {
      project: z.string().describe("The name or ID of the Azure DevOps project."),
      team: z.string().describe("The name or ID of the team."),
      timeframe: z.string().optional().describe("A filter for a specific timeframe, e.g., 'current'."),
    },
    async ({ project, team, timeframe }) => {
      try {
        const connection = await connectionProvider();
        const workApi = await connection.getWorkApi();
        const iterations = await workApi.getTeamIterations(
          {
            project: project,
            team: team,
          },
          timeframe
        );
        if (!iterations || iterations.length === 0) {
          return {
            isError: true,
            content: [{ type: "text", text: "No iterations found" }],
          };
        }
        return {
          content: [{ type: "text", text: JSON.stringify(iterations, null, 2) }],
        };
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to retrieve iterations: ${errorMessage}` }],
        };
      }
    }
  );

  server.tool(
    WORK_TOOLS.create_iterations,
    "Create new iterations in a specified Azure DevOps project.",
    {
      project: z.string().describe("The name or ID of the Azure DevOps project."),
      iterationName: z.string().describe("The name of the iteration to create."),
      startDate: z.string().optional().describe("The start date of the iteration (YYYY-MM-DD)."),
      finishDate: z.string().optional().describe("The finish date of the iteration (YYYY-MM-DD)."),
    },
    async ({ project, iterationName, startDate, finishDate }) => {
      try {
        const connection = await connectionProvider();
        const witApi = await connection.getWorkItemTrackingApi();
        const iteration: WorkItemClassificationNode = await witApi.createOrUpdateClassificationNode(
          {
            name: iterationName,
            attributes: {
              startDate: startDate ? new Date(startDate) : undefined,
              finishDate: finishDate ? new Date(finishDate) : undefined,
            },
          },
          project,
          TreeStructureGroup.Iterations
        );
        if (!iteration) {
          return {
            isError: true,
            content: [{ type: "text", text: "No iterations were created" }],
          };
        }
        return {
          content: [{ type: "text", text: JSON.stringify([iteration], null, 2) }],
        };
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to create iteration: ${errorMessage}` }],
        };
      }
    }
  );

  server.tool(
    WORK_TOOLS.assign_iterations,
    "Assign existing iterations to a specific team in a project.",
    {
      project: z.string().describe("The name or ID of the Azure DevOps project."),
      team: z.string().describe("The name or ID of the team."),
      iterationId: z.string().describe("The ID of the iteration to assign."),
      path: z.string().optional().describe("The path of the iteration to assign."),
    },
    async ({ project, team, iterationId, path }) => {
      try {
        const connection = await connectionProvider();
        const workApi = await connection.getWorkApi();
        const iteration: TeamSettingsIteration = { id: iterationId, name: "", path: path || "", attributes: { timeFrame: 0 }, url: "" };
        const teamContext: TeamContext = { project, team };
        const result = await workApi.postTeamIteration(iteration, teamContext);
        if (!result) {
          return {
            isError: true,
            content: [{ type: "text", text: "No iterations were assigned to the team" }],
          };
        }
        return {
          content: [{ type: "text", text: `Iteration ${iterationId} assigned to team ${team}.` }],
        };
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to assign iteration: ${errorMessage}` }],
        };
      }
    }
  );
}

export { WORK_TOOLS, configureWorkTools };
