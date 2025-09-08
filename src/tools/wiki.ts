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
      try {
        const connection = await connectionProvider();
        const wikiApi = await connection.getWikiApi();
        const wiki = await wikiApi.getWiki(wikiIdentifier, project);
        if (!wiki) {
          return {
            isError: true,
            content: [{ type: "text", text: "No wiki found" }],
          };
        }
        return {
          content: [{ type: "text", text: JSON.stringify(wiki, null, 2) }],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return {
          isError: true,
          content: [{ type: "text", text: `Error fetching wiki: ${errorMessage}` }],
        };
      }
    }
  );

  server.tool(
    WIKI_TOOLS.list_wikis,
    "Retrieve a list of wikis for an organization or project.",
    {
      project: z.string().optional().describe("Project ID or project name"),
    },
    async ({ project }) => {
      try {
        const connection = await connectionProvider();
        const wikiApi = await connection.getWikiApi();
        const wikis = await wikiApi.getAllWikis(project);
        if (!wikis) {
          return {
            isError: true,
            content: [{ type: "text", text: "No wikis found" }],
          };
        }
        return {
          content: [{ type: "text", text: JSON.stringify(wikis, null, 2) }],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return {
          isError: true,
          content: [{ type: "text", text: `Error fetching wikis: ${errorMessage}` }],
        };
      }
    }
  );

  server.tool(
    WIKI_TOOLS.list_pages,
    "Retrieve a list of wiki pages for a specific wiki and project.",
    {
      project: z.string().describe("The name or ID of the Azure DevOps project."),
      wikiIdentifier: z.string().describe("The ID or name of the wiki."),
      top: z.number().optional().default(20),
      continuationToken: z.string().optional(),
      pageViewsForDays: z.number().optional(),
    },
    async ({ project, wikiIdentifier, top = 20, continuationToken, pageViewsForDays }) => {
      try {
        const connection = await connectionProvider();
        const wikiApi = await connection.getWikiApi();
        const pages = await wikiApi.getPagesBatch(
          {
            top,
            continuationToken,
            pageViewsForDays,
          },
          project,
          wikiIdentifier
        );
        if (!pages) {
          return {
            isError: true,
            content: [{ type: "text", text: "No wiki pages found" }],
          };
        }
        return {
          content: [{ type: "text", text: JSON.stringify(pages, null, 2) }],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return {
          isError: true,
          content: [{ type: "text", text: `Error fetching wiki pages: ${errorMessage}` }],
        };
      }
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
