// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebApi } from "azure-devops-node-api";
import { z } from "zod";

const ADVSEC_TOOLS = {
  get_alerts: "advsec_get_alerts",
  get_alert_details: "advsec_get_alert_details",
};

function configureAdvSecTools(server: McpServer, tokenProvider: () => Promise<string>, connectionProvider: () => Promise<WebApi>) {
  server.tool(
    ADVSEC_TOOLS.get_alerts,
    "Retrieve Advanced Security alerts for a repository.",
    {
      project: z.string().describe("The name or ID of the Azure DevOps project."),
      repository: z.string().describe("The name or ID of the repository."),
      top: z.number().optional().default(10).describe("The maximum number of alerts to return."),
      states: z.string().optional().describe("A comma-separated list of alert states to filter by (e.g., 'Active,Dismissed')."),
      severities: z.string().optional().describe("A comma-separated list of alert severities to filter by (e.g., 'High,Medium')."),
    },
    async ({ project, repository, top, states, severities }) => {
      return {
        content: [{ type: "text", text: "This tool is temporarily disabled due to build errors." }],
        isError: true,
      };
    }
  );

  server.tool(
    ADVSEC_TOOLS.get_alert_details,
    "Get detailed information about a specific Advanced Security alert.",
    {
      project: z.string().describe("The name or ID of the Azure DevOps project."),
      alertId: z.number().describe("The ID of the alert to retrieve."),
    },
    async ({ project, alertId }) => {
      return {
        content: [{ type: "text", text: "This tool is temporarily disabled due to build errors." }],
        isError: true,
      };
    }
  );
}

export { ADVSEC_TOOLS, configureAdvSecTools };
