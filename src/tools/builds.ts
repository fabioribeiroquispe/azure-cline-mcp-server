// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebApi } from "azure-devops-node-api";
import { BuildResult, BuildStatus } from "azure-devops-node-api/interfaces/BuildInterfaces.js";
import { z } from "zod";
import { getEnumKeys } from "../utils.js";

const BUILD_TOOLS = {
  get_definitions: "build_get_definitions",
  get_definition_revisions: "build_get_definition_revisions",
  get_builds: "build_get_builds",
  get_log: "build_get_log",
  get_log_by_id: "build_get_log_by_id",
  get_changes: "build_get_changes",
  get_status: "build_get_status",
  update_build_stage: "build_update_build_stage",
};

function configureBuildTools(server: McpServer, tokenProvider: () => Promise<string>, connectionProvider: () => Promise<WebApi>, userAgentProvider: () => string) {
  server.tool(
    BUILD_TOOLS.get_definitions,
    "Retrieves a list of build definitions for a given project.",
    {
      project: z.string().describe("The name or ID of the Azure DevOps project."),
      name: z.string().optional().describe("A filter to return only build definitions with this name."),
    },
    async ({ project, name }) => {
      const connection = await connectionProvider();
      const buildApi = await connection.getBuildApi();
      const definitions = await buildApi.getDefinitions(project, name);
      return {
        content: [{ type: "text", text: JSON.stringify(definitions, null, 2) }],
      };
    }
  );

  server.tool(
    BUILD_TOOLS.get_definition_revisions,
    "Retrieves a list of revisions for a specific build definition.",
    {
      project: z.string().describe("The name or ID of the Azure DevOps project."),
      definitionId: z.number().describe("The ID of the build definition."),
    },
    async ({ project, definitionId }) => {
      const connection = await connectionProvider();
      const buildApi = await connection.getBuildApi();
      const revisions = await buildApi.getDefinitionRevisions(project, definitionId);
      return {
        content: [{ type: "text", text: JSON.stringify(revisions, null, 2) }],
      };
    }
  );

  server.tool(
    BUILD_TOOLS.get_builds,
    "Retrieves a list of builds for a given project.",
    {
      project: z.string().describe("The name or ID of the Azure DevOps project."),
      definitions: z.array(z.number()).optional().describe("A comma-separated list of definition IDs to filter by."),
      statusFilter: z.enum(getEnumKeys(BuildStatus) as [string, ...string[]]).optional(),
      resultFilter: z.enum(getEnumKeys(BuildResult) as [string, ...string[]]).optional(),
    },
    async ({ project, definitions, statusFilter, resultFilter }) => {
      return {
        content: [{ type: "text", text: "This tool is temporarily disabled due to build errors." }],
        isError: true,
      };
    }
  );

  server.tool(
    BUILD_TOOLS.get_log,
    "Retrieves the logs for a specific build.",
    {
      project: z.string().describe("The name or ID of the Azure DevOps project."),
      buildId: z.number().describe("The ID of the build."),
      logId: z.number().describe("The ID of the log to retrieve."),
    },
    async ({ project, buildId, logId }) => {
      const connection = await connectionProvider();
      const buildApi = await connection.getBuildApi();
      const log = await buildApi.getBuildLog(project, buildId, logId);
      return {
        content: [{ type: "text", text: JSON.stringify(log, null, 2) }],
      };
    }
  );

  server.tool(
    BUILD_TOOLS.get_log_by_id,
    "Get a specific build log by log ID.",
    {
      project: z.string().describe("The name or ID of the Azure DevOps project."),
      buildId: z.number().describe("The ID of the build."),
      logId: z.number().describe("The ID of the log to retrieve."),
    },
    async ({ project, buildId, logId }) => {
      const connection = await connectionProvider();
      const buildApi = await connection.getBuildApi();
      const log = await buildApi.getBuildLog(project, buildId, logId);
      return {
        content: [{ type: "text", text: JSON.stringify(log, null, 2) }],
      };
    }
  );

  server.tool(
    BUILD_TOOLS.get_changes,
    "Get the changes associated with a specific build.",
    {
      project: z.string().describe("The name or ID of the Azure DevOps project."),
      buildId: z.number().describe("The ID of the build."),
      top: z.number().optional().default(10).describe("The maximum number of changes to return."),
    },
    async ({ project, buildId, top }) => {
      const connection = await connectionProvider();
      const buildApi = await connection.getBuildApi();
      const changes = await buildApi.getBuildChanges(project, buildId, undefined, top);
      return {
        content: [{ type: "text", text: JSON.stringify(changes, null, 2) }],
      };
    }
  );

  server.tool(
    BUILD_TOOLS.get_status,
    "Fetch the status of a specific build.",
    {
      project: z.string().describe("The name or ID of the Azure DevOps project."),
      buildId: z.number().describe("The ID of the build."),
    },
    async ({ project, buildId }) => {
      const connection = await connectionProvider();
      const buildApi = await connection.getBuildApi();
      const build = await buildApi.getBuild(project, buildId);
      return {
        content: [{ type: "text", text: `Status: ${build?.status}, Result: ${build?.result}` }],
      };
    }
  );

  server.tool(
    BUILD_TOOLS.update_build_stage,
    "Update the stage of a specific build.",
    {
      project: z.string().describe("The name or ID of the Azure DevOps project."),
      buildId: z.number().describe("The ID of the build."),
      stageId: z.string().describe("The ID of the stage to update."),
      state: z.string().describe("The new state of the stage (e.g., 'completed')."),
    },
    async ({ project, buildId, stageId, state }) => {
      return {
        content: [{ type: "text", text: "This tool is temporarily disabled due to build errors." }],
        isError: true,
      };
    }
  );
}

export { BUILD_TOOLS, configureBuildTools };
