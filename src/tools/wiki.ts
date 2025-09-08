// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebApi } from "azure-devops-node-api";
import { z } from "zod";

const WIKI_TOOLS = {
  list_wikis: "wiki_list_wikis",
  get_wiki: "wiki_get_wiki",
  list_pages: "wiki_list_pages",
  get_page_content: "wiki_get_page_content",
  create_wiki: "wiki_create_wiki",
};

function configureWikiTools(server: McpServer, tokenProvider: () => Promise<string>, connectionProvider: () => Promise<WebApi>) {
  server.tool(
    WIKI_TOOLS.get_wiki,
    "Get the wiki by wikiIdentifier",
    {
      project: z.string().optional().describe("Project ID or project name"),
      wikiIdentifier: z.string().describe("Wiki ID or wiki name"),
    },
    async ({ project, wikiIdentifier }) => {
      return {
        content: [{ type: "text", text: "This tool is temporarily disabled due to a build error." }],
        isError: true,
      };
    }
  );

  server.tool(
    WIKI_TOOLS.list_wikis,
    "Retrieve a list of wikis for an organization or project.",
    {
      project: z.string().optional().describe("Project ID or project name"),
    },
    async ({ project }) => {
      const connection = await connectionProvider();
      const wikiApi = await connection.getWikiApi();
      const wikis = await wikiApi.getAllWikis(project);
      return {
        content: [{ type: "text", text: JSON.stringify(wikis, null, 2) }],
      };
    }
  );

  server.tool(
    WIKI_TOOLS.list_pages,
    "Retrieve a list of wiki pages for a specific wiki and project.",
    {
      project: z.string().describe("The name or ID of the Azure DevOps project."),
      wikiIdentifier: z.string().describe("The ID or name of the wiki."),
      path: z.string().optional().describe("The path to the folder to retrieve pages from. Optional, defaults to the root."),
      recursionLevel: z.enum(["none", "full"]).optional().default("none").describe("The recursion level for retrieving pages. Optional, defaults to 'none'."),
      includeContent: z.boolean().optional().default(false).describe("Whether to include the content of the pages. Optional, defaults to false."),
    },
    async ({ project, wikiIdentifier, path, recursionLevel, includeContent }) => {
      return {
        content: [{ type: "text", text: "This tool is temporarily disabled due to a build error." }],
        isError: true,
      };
    }
  );

  server.tool(
    WIKI_TOOLS.get_page_content,
    "Retrieve wiki page content by wikiIdentifier and path.",
    {
      project: z.string().describe("The name or ID of the Azure DevOps project."),
      wikiIdentifier: z.string().describe("The ID or name of the wiki."),
      path: z.string().describe("The path to the page to retrieve content from."),
      includeContent: z.boolean().optional().default(true).describe("Whether to include the content of the pages. Optional, defaults to true."),
    },
    async ({ project, wikiIdentifier, path, includeContent }) => {
      return {
        content: [{ type: "text", text: "This tool is temporarily disabled due to a build error." }],
        isError: true,
      };
    }
  );

  server.tool(
    WIKI_TOOLS.create_wiki,
    "Creates a new wiki in a project.",
    {
      project: z.string().describe("The name or ID of the Azure DevOps project in which the wiki is to be created."),
      name: z.string().describe("The name for the new wiki."),
      type: z.enum(["projectWiki", "codeWiki"]).describe("The type of the wiki."),
    },
    async ({ project, name, type }) => {
      return {
        content: [{ type: "text", text: "This tool is temporarily disabled due to a build error." }],
        isError: true,
      };
    }
  );
}

export { WIKI_TOOLS, configureWikiTools };
