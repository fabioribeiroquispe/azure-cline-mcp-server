// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebApi } from "azure-devops-node-api";
import { BuildResult, BuildStatus, DefinitionQueryOrder } from "azure-devops-node-api/interfaces/BuildInterfaces.js";
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
  pipelines_get_run: "pipelines_get_run",
  pipelines_list_runs: "pipelines_list_runs",
  pipelines_run_pipeline: "pipelines_run_pipeline",
};

function configureBuildTools(server: McpServer, tokenProvider: () => Promise<string>, connectionProvider: () => Promise<WebApi>, userAgentProvider: () => string) {
  server.tool(
    BUILD_TOOLS.get_definitions,
    "Retrieves a list of build definitions for a given project.",
    {
      project: z.string().describe("The name or ID of the Azure DevOps project."),
      name: z.string().optional().describe("A filter to return only build definitions with this name."),
      repositoryId: z.string().optional().describe("The repository ID."),
      repositoryType: z.string().optional().describe("The repository type."),
      top: z.number().optional().describe("The maximum number of definitions to return."),
    },
    async ({ project, name, repositoryId, repositoryType, top }) => {
      const connection = await connectionProvider();
      const buildApi = await connection.getBuildApi();
      const definitions = await buildApi.getDefinitions(
        project,
        name,
        repositoryId,
        repositoryType,
        undefined,
        top
      );
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
      const connection = await connectionProvider();
      const buildApi = await connection.getBuildApi();
      const builds = await buildApi.getBuilds(
        project,
        definitions,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        statusFilter ? BuildStatus[statusFilter as keyof typeof BuildStatus] : undefined,
        resultFilter ? BuildResult[resultFilter as keyof typeof BuildResult] : undefined
      );
      return {
        content: [{ type: "text", text: JSON.stringify(builds, null, 2) }],
      };
    }
  );

  server.tool(
    BUILD_TOOLS.get_log,
    "Retrieves the logs for a specific build.",
    {
      project: z.string().describe("The name or ID of the Azure DevOps project."),
      buildId: z.number().describe("The ID of the build."),
    },
    async ({ project, buildId }) => {
      const connection = await connectionProvider();
      const buildApi = await connection.getBuildApi();
      const logs = await buildApi.getBuildLogs(project, buildId);
      return {
        content: [{ type: "text", text: JSON.stringify(logs, null, 2) }],
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
      startLine: z.number().optional(),
      endLine: z.number().optional(),
    },
    async ({ project, buildId, logId, startLine, endLine }) => {
      const connection = await connectionProvider();
      const buildApi = await connection.getBuildApi();
      const logLines = await buildApi.getBuildLogLines(project, buildId, logId, startLine, endLine);
      return {
        content: [{ type: "text", text: JSON.stringify(logLines, null, 2) }],
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
      continuationToken: z.string().optional(),
      includeSourceChange: z.boolean().optional(),
    },
    async ({ project, buildId, top, continuationToken, includeSourceChange }) => {
      const connection = await connectionProvider();
      const buildApi = await connection.getBuildApi();
      const changes = await buildApi.getBuildChanges(project, buildId, continuationToken, top, includeSourceChange);
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

  server.tool(
    BUILD_TOOLS.pipelines_get_run,
    "Get a specific run of a pipeline.",
    {
      project: z.string().describe("The name or ID of the project."),
      pipelineId: z.number().describe("The ID of the pipeline."),
      runId: z.number().describe("The ID of the run."),
    },
    async ({ project, pipelineId, runId }) => {
      const connection = await connectionProvider();
      const pipelinesApi = await connection.getPipelinesApi();
      const run = await pipelinesApi.getRun(project, pipelineId, runId);
      return {
        content: [{ type: "text", text: JSON.stringify(run, null, 2) }],
      };
    }
  );

  server.tool(
    BUILD_TOOLS.pipelines_list_runs,
    "Get a list of runs for a pipeline.",
    {
      project: z.string().describe("The name or ID of the project."),
      pipelineId: z.number().describe("The ID of the pipeline."),
    },
    async ({ project, pipelineId }) => {
      const connection = await connectionProvider();
      const pipelinesApi = await connection.getPipelinesApi();
      const runs = await pipelinesApi.listRuns(project, pipelineId);
      return {
        content: [{ type: "text", text: JSON.stringify(runs, null, 2) }],
      };
    }
  );

  server.tool(
    BUILD_TOOLS.pipelines_run_pipeline,
    "Run a pipeline.",
    {
      project: z.string().describe("The name or ID of the project."),
      pipelineId: z.number().describe("The ID of the pipeline."),
      resources: z.any().optional().describe("The resources to use for the run."),
      templateParameters: z.any().optional().describe("The template parameters to use for the run."),
      previewRun: z.boolean().optional().describe("Whether to do a preview run."),
      yamlOverride: z.string().optional().describe("YAML to override the pipeline definition."),
      stagesToSkip: z.array(z.string()).optional().describe("Stages to skip."),
      variables: z.any().optional().describe("Variables to use for the run."),
    },
    async ({ project, pipelineId, resources, templateParameters, previewRun, yamlOverride, stagesToSkip, variables }) => {
      if (yamlOverride && !previewRun) {
        throw new Error("Parameter 'yamlOverride' can only be specified together with parameter 'previewRun'.");
      }
      const connection = await connectionProvider();
      const pipelinesApi = await connection.getPipelinesApi();
      const run = await pipelinesApi.runPipeline(
        {
          previewRun,
          resources,
          stagesToSkip,
          templateParameters,
          variables,
          yamlOverride,
        },
        project,
        pipelineId
      );
      if (!run.id) {
        throw new Error("Failed to get build ID from pipeline run");
      }
      return {
        content: [{ type: "text", text: JSON.stringify(run, null, 2) }],
      };
    }
  );
}

export { BUILD_TOOLS, configureBuildTools };
