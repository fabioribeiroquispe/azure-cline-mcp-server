// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebApi } from "azure-devops-node-api";
import { z } from "zod";

const RELEASE_TOOLS = {
  get_release_definitions: "release_get_definitions",
  get_releases: "release_get_releases",
};

function configureReleaseTools(server: McpServer, tokenProvider: () => Promise<string>, connectionProvider: () => Promise<WebApi>) {
  server.tool(
    RELEASE_TOOLS.get_release_definitions,
    "Retrieves list of release definitions for a given project.",
    {
      project: z.string().describe("The name or ID of the Azure DevOps project."),
      searchText: z.string().optional().describe("A filter to return only release definitions with this text in the name."),
    },
    async ({ project, searchText }) => {
      const connection = await connectionProvider();
      const releaseApi = await connection.getReleaseApi();
      const definitions = await releaseApi.getReleaseDefinitions(project, searchText);
      return {
        content: [{ type: "text", text: JSON.stringify(definitions, null, 2) }],
      };
    }
  );

  server.tool(
    RELEASE_TOOLS.get_releases,
    "Retrieves a list of releases for a given project.",
    {
      project: z.string().describe("The name or ID of the Azure DevOps project."),
      definitionId: z.number().optional().describe("A filter to return only releases for this definition ID."),
    },
    async ({ project, definitionId }) => {
      const connection = await connectionProvider();
      const releaseApi = await connection.getReleaseApi();
      const releases = await releaseApi.getReleases(project, definitionId);
      return {
        content: [{ type: "text", text: JSON.stringify(releases, null, 2) }],
      };
    }
  );
}

export { RELEASE_TOOLS, configureReleaseTools };
