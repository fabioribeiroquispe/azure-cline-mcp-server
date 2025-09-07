// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebApi } from "azure-devops-node-api";
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
      const connection = await connectionProvider();
      const workApi = await connection.getWorkApi();
      const iterations = await workApi.getTeamIterations(
        {
          project: project,
          team: team,
        },
        timeframe
      );
      return {
        content: [{ type: "text", text: JSON.stringify(iterations, null, 2) }],
      };
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
      const connection = await connectionProvider();
      const workApi = await connection.getWorkApi();
      const iteration = await workApi.postTeamIteration(
        {
          name: iterationName,
          attributes: {
            startDate: startDate ? new Date(startDate) : undefined,
            finishDate: finishDate ? new Date(finishDate) : undefined,
          },
        },
        {
          project: project,
          team: "", // Team is not required for creating iterations at project level
        }
      );
      return {
        content: [{ type: "text", text: JSON.stringify(iteration, null, 2) }],
      };
    }
  );

  server.tool(
    WORK_TOOLS.assign_iterations,
    "Assign existing iterations to a specific team in a project.",
    {
      project: z.string().describe("The name or ID of the Azure DevOps project."),
      team: z.string().describe("The name or ID of the team."),
      iterationId: z.string().describe("The ID of the iteration to assign."),
    },
    async ({ project, team, iterationId }) => {
      const connection = await connectionProvider();
      const workApi = await connection.getWorkApi();
      await workApi.postTeamIteration(
        {
          id: iterationId,
        },
        {
          project: project,
          team: team,
        }
      );
      return {
        content: [{ type: "text", text: `Iteration ${iterationId} assigned to team ${team}.` }],
      };
    }
  );
}

export { WORK_TOOLS, configureWorkTools };
