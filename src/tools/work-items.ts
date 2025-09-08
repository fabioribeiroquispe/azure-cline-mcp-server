// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebApi } from "azure-devops-node-api";
import { IWorkItemTrackingApi } from "azure-devops-node-api/WorkItemTrackingApi.js";
import { JsonPatchDocument, JsonPatchOperation, Operation } from "azure-devops-node-api/interfaces/common/VSSInterfaces.js";
import { WorkItem, WorkItemBatchGetRequest, WorkItemExpand, WorkItemQueryResult, WorkItemType, QueryExpand } from "azure-devops-node-api/interfaces/WorkItemTrackingInterfaces.js";
import { z } from "zod";
import { batchApiVersion } from "../utils.js";
import type { AccessToken } from "@azure/identity";

const WORKITEM_TOOLS = {
  my_work_items: "wit_my_work_items",
  list_backlogs: "wit_list_backlogs",
  list_backlog_work_items: "wit_list_backlog_work_items",
  get_work_item: "wit_get_work_item",
  get_work_items_batch_by_ids: "wit_get_work_items_batch_by_ids",
  update_work_item: "wit_update_work_item",
  create_work_item: "wit_create_work_item",
  list_work_item_comments: "wit_list_work_item_comments",
  get_work_items_for_iteration: "wit_get_work_items_for_iteration",
  add_work_item_comment: "wit_add_work_item_comment",
  add_child_work_items: "wit_add_child_work_items",
  link_work_item_to_pull_request: "wit_link_work_item_to_pull_request",
  get_work_item_type: "wit_get_work_item_type",
  get_query: "wit_get_query",
  get_query_results_by_id: "wit_get_query_results_by_id",
  update_work_items_batch: "wit_update_work_items_batch",
  work_items_link: "wit_work_items_link",
  work_item_unlink: "wit_work_item_unlink",
  add_artifact_link: "wit_add_artifact_link",
};

export function configureWorkItemTools(server: McpServer, tokenProvider: () => Promise<AccessToken>, connectionProvider: () => Promise<WebApi>, userAgentProvider: () => string) {
  server.tool(
    WORKITEM_TOOLS.list_backlogs,
    "Revieve a list of backlogs for a given project and team.",
    {
      project: z.string().describe("The name or ID of the Azure DevOps project."),
      team: z.string().describe("The name or ID of the team."),
    },
    async ({ project, team }) => {
      const connection = await connectionProvider();
      const workApi = await connection.getWorkApi();
      const backlogs = await workApi.getBacklogs({ project, team });
      return {
        content: [{ type: "text", text: JSON.stringify(backlogs, null, 2) }],
      };
    }
  );

  server.tool(
    WORKITEM_TOOLS.list_backlog_work_items,
    "Revieve a list of backlogs for a given project, team and backlog category.",
    {
      project: z.string().describe("The name or ID of the Azure DevOps project."),
      team: z.string().describe("The name or ID of the team."),
      backlogId: z.string().describe("The ID of the backlog."),
    },
    async ({ project, team, backlogId }) => {
      const connection = await connectionProvider();
      const workApi = await connection.getWorkApi();
      const backlogWorkItems = await workApi.getBacklogLevelWorkItems({ project, team }, backlogId);
      return {
        content: [{ type: "text", text: JSON.stringify(backlogWorkItems, null, 2) }],
      };
    }
  );

  server.tool(
    WORKITEM_TOOLS.my_work_items,
    "Retrieve a list of work items relevant to the authenticated user.",
    {
      project: z.string().describe("The name or ID of the Azure DevOps project."),
      type: z.enum(["assignedtome", "followed", "mentioned", "myactivity", "recentlyupdated"]),
      top: z.number().optional(),
      includeCompleted: z.boolean().optional().default(false),
    },
    async ({ project, type, top, includeCompleted }) => {
      try {
        const connection = await connectionProvider();
        const workApi = await connection.getWorkApi();
        const queryResults = await workApi.getPredefinedQueryResults(project, type, top, includeCompleted);
        return {
          content: [{ type: "text", text: JSON.stringify(queryResults, null, 2) }],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return {
          isError: true,
          content: [{ type: "text", text: `Error getting work items: ${errorMessage}` }],
        };
      }
    }
  );

  server.tool(
    WORKITEM_TOOLS.get_work_item,
    "Get a single work item by ID.",
    {
      id: z.number().describe("The ID of the work item."),
      project: z.string().optional().describe("The name or ID of the Azure DevOps project."),
      expand: z.enum(["all", "relations", "fields", "links", "none"]).optional().default("none"),
    },
    async ({ id, project, expand }) => {
      const connection = await connectionProvider();
      const witApi = await connection.getWorkItemTrackingApi();
      const expandEnum = WorkItemExpand[expand.charAt(0).toUpperCase() + expand.slice(1) as keyof typeof WorkItemExpand];
      const workItem = await witApi.getWorkItem(id, undefined, undefined, expandEnum, project);
      return {
        content: [{ type: "text", text: JSON.stringify([workItem], null, 2) }],
      };
    }
  );

  server.tool(
    WORKITEM_TOOLS.get_work_items_batch_by_ids,
    "Retrieve a list of work items by IDs in batch.",
    {
      ids: z.array(z.number()).describe("An array of work item IDs to retrieve."),
      project: z.string().optional().describe("The name or ID of the Azure DevOps project."),
      fields: z.array(z.string()).optional().describe("A list of fields to return in the response."),
      expand: z.enum(["all", "relations", "fields", "links", "none"]).optional().default("all").describe("The expansion level for the work items. Defaults to 'all'."),
    },
    async ({ ids, project, fields, expand }) => {
      try {
        const connection = await connectionProvider();
        const witApi = await connection.getWorkItemTrackingApi();
        const defaultFields = ["System.Id", "System.WorkItemType", "System.Title", "System.State", "System.Parent", "System.Tags", "Microsoft.VSTS.Common.StackRank", "System.AssignedTo"];
        const fieldsToRequest = fields && fields.length > 0 ? fields : defaultFields;
        const request: WorkItemBatchGetRequest = {
          ids: ids,
          fields: fieldsToRequest,
          $expand: WorkItemExpand[expand as keyof typeof WorkItemExpand],
        };
        const workItems = await witApi.getWorkItemsBatch(request, project);

        if (workItems) {
          const userFields = [
              "System.AssignedTo",
              "System.CreatedBy",
              "System.ChangedBy",
              "System.AuthorizedAs",
              "Microsoft.VSTS.Common.ActivatedBy",
              "Microsoft.VSTS.Common.ResolvedBy",
              "Microsoft.VSTS.Common.ClosedBy",
          ];
          const transformedWorkItems = workItems.map(item => {
              if (item.fields) {
                  for (const field of userFields) {
                      if (item.fields[field] && typeof item.fields[field] === 'object') {
                          const user = item.fields[field];
                          const displayName = user.displayName || '';
                          const uniqueName = user.uniqueName || '';
                          if (displayName) {
                            item.fields[field] = `${displayName} <${uniqueName}>`;
                          } else {
                            item.fields[field] = `<${uniqueName}>`;
                          }
                      }
                  }
              }
              return item;
          });
          return {
            content: [{ type: "text", text: JSON.stringify(transformedWorkItems, null, 2) }],
          };
        }
        return {
          content: [{ type: "text", text: JSON.stringify(null, null, 2) }],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return {
          isError: true,
          content: [{ type: "text", text: `Error getting work items in batch: ${errorMessage}` }],
        };
      }
    }
  );

  server.tool(
    WORKITEM_TOOLS.update_work_item,
    "Update a work item by ID with specified fields.",
    {
      id: z.number().describe("The ID of the work item to update."),
      updates: z.array(z.object({
        op: z.string(),
        path: z.string(),
        value: z.any(),
      })).describe("An array of patch operations, e.g., [{'op': 'add', 'path': '/fields/System.Title', 'value': 'New Title'}]."),
      project: z.string().optional().describe("The name or ID of the Azure DevOps project."),
    },
    async ({ id, updates, project }) => {
      const connection = await connectionProvider();
      const witApi = await connection.getWorkItemTrackingApi();
      const workItem = await witApi.updateWorkItem(null, updates as any, id, project);
      return {
        content: [{ type: "text", text: JSON.stringify([workItem], null, 2) }],
      };
    }
  );

  server.tool(
    WORKITEM_TOOLS.create_work_item,
    "Create a new work item in a specified project and work item type.",
    {
      project: z.string().describe("The name or ID of the Azure DevOps project."),
      workItemType: z.string().describe("The type of the work item to create (e.g., 'Bug', 'Task')."),
      fields: z.array(z.object({
        name: z.string(),
        value: z.any(),
        format: z.string().optional(),
      })).describe("An array of field objects for the new work item, e.g., [{'name': 'System.Title', 'value': 'My New Bug'}]."),
    },
    async ({ project, workItemType, fields }) => {
      try {
        const connection = await connectionProvider();
        const witApi = await connection.getWorkItemTrackingApi();
        const patchDocument: JsonPatchOperation[] = [];
        for (const field of fields) {
            patchDocument.push({ op: "add" as any, path: `/fields/${field.name}`, value: field.value });
            if (field.format && field.value.length > 50) {
                patchDocument.push({ op: "add" as any, path: `/multilineFieldsFormat/${field.name}`, value: field.format });
            }
        }
        const workItem = await witApi.createWorkItem(null, patchDocument, project, workItemType);
        if (!workItem) {
            return {
                isError: true,
                content: [{ type: "text", text: "Work item was not created" }],
            };
        }
        return {
          content: [{ type: "text", text: JSON.stringify(workItem, null, 2) }],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return {
            isError: true,
            content: [{ type: "text", text: `Error creating work item: ${errorMessage}` }],
        };
      }
    }
  );

  server.tool(
    WORKITEM_TOOLS.list_work_item_comments,
    "Retrieve a list of comments for a work item by ID.",
    {
      project: z.string().describe("The name or ID of the Azure DevOps project."),
      workItemId: z.number().describe("The ID of the work item."),
      top: z.number().optional(),
    },
    async ({ project, workItemId, top }) => {
      const connection = await connectionProvider();
      const witApi = await connection.getWorkItemTrackingApi();
      const comments = await witApi.getComments(project, workItemId, top);
      return {
        content: [{ type: "text", text: JSON.stringify(comments, null, 2) }],
      };
    }
  );

  server.tool(
    WORKITEM_TOOLS.get_work_items_for_iteration,
    "Retrieve a list of work items for a specified iteration.",
    {
      project: z.string().describe("The name or ID of the Azure DevOps project."),
      team: z.string().describe("The name or ID of the team."),
      iterationId: z.string().describe("The ID of the iteration."),
    },
    async ({ project, team, iterationId }) => {
      try {
        const connection = await connectionProvider();
        const workApi = await connection.getWorkApi();
        const iterationWorkItems = await workApi.getIterationWorkItems({ project, team }, iterationId);
        return {
          content: [{ type: "text", text: JSON.stringify(iterationWorkItems, null, 2) }],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return {
          isError: true,
          content: [{ type: "text", text: `Error getting iteration work items: ${errorMessage}` }],
        };
      }
    }
  );

  server.tool(
    WORKITEM_TOOLS.add_work_item_comment,
    "Add a comment to a work item by ID.",
    {
      project: z.string().describe("The name or ID of the Azure DevOps project."),
      workItemId: z.number().describe("The ID of the work item."),
      comment: z.string().describe("The text of the comment to add."),
      format: z.enum(["markdown", "html"]).optional(),
    },
    async ({ project, workItemId, comment, format }) => {
        const connection = await connectionProvider();
        const token = await tokenProvider();
        const commentFormat = format === "markdown" ? 0 : 1;
        const url = `${connection.serverUrl}/${project}/_apis/wit/workItems/${workItemId}/comments?format=${commentFormat}&api-version=7.2-preview.4`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token.token}`,
                "Content-Type": "application/json",
                "User-Agent": userAgentProvider(),
            },
            body: JSON.stringify({ text: comment }),
        });

        if (!response.ok) {
            throw new Error(`Failed to add a work item comment: ${response.statusText}`);
        }

        const result = await response.text();
        return {
            content: [{ type: "text", text: result }],
        };
    }
  );

  server.tool(
    WORKITEM_TOOLS.add_child_work_items,
    "Create one or more child work items of a specific work item type for the given parent ID.",
    {
      parentId: z.number().describe("The ID of the parent work item."),
      project: z.string().describe("The name or ID of the Azure DevOps project."),
      workItemType: z.string().describe("The type of child work items to create (e.g., 'Task', 'Bug')."),
      items: z.array(z.object({
          title: z.string(),
          description: z.string().optional(),
          areaPath: z.string().optional(),
          iterationPath: z.string().optional(),
          format: z.enum(["Markdown", "Html"]).optional(),
      })),
    },
    async ({ parentId, project, workItemType, items }) => {
        if (items.length > 50) {
            return {
                isError: true,
                content: [{ type: "text", text: "A maximum of 50 child work items can be created in a single call." }],
            };
        }
        try {
            const connection = await connectionProvider();
            const witApi = await connection.getWorkItemTrackingApi();

            const createdWorkItems: WorkItem[] = [];
            for (const item of items) {
                const patchDocument: JsonPatchOperation[] = [
                    { op: "add" as any, path: "/fields/System.Title", value: item.title },
                    { op: "add" as any, path: "/relations/-", value: { rel: "System.LinkTypes.Hierarchy-Reverse", url: `${connection.serverUrl}/${project}/_apis/wit/workItems/${parentId}` } }
                ];
                if (item.description) {
                    patchDocument.push({ op: "add" as any, path: "/fields/System.Description", value: item.description });
                    if (item.format === "Markdown") {
                        patchDocument.push({ op: "add" as any, path: "/multilineFieldsFormat/System.Description", value: "Markdown" });
                    }
                }
                if (item.areaPath?.trim()) {
                    patchDocument.push({ op: "add" as any, path: "/fields/System.AreaPath", value: item.areaPath.trim() });
                }
                if (item.iterationPath?.trim()) {
                    patchDocument.push({ op: "add" as any, path: "/fields/System.IterationPath", value: item.iterationPath.trim() });
                }

                const workItem = await witApi.createWorkItem({}, patchDocument, project, workItemType);
                if(workItem) createdWorkItems.push(workItem);
            }

            return {
                content: [{ type: "text", text: JSON.stringify(createdWorkItems, null, 2) }],
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            return {
                isError: true,
                content: [{ type: "text", text: `Error creating child work items: ${errorMessage}` }],
            };
        }
    }
  );

  server.tool(
    WORKITEM_TOOLS.link_work_item_to_pull_request,
    "Link a single work item to an existing pull request.",
    {
      projectId: z.string().describe("The name or ID of the Azure DevOps project where the work item is located."),
      workItemId: z.number().describe("The ID of the work item to link."),
      repositoryId: z.string().describe("The ID of the repository containing the pull request."),
      pullRequestId: z.number().describe("The ID of the pull request to link to."),
      pullRequestProjectId: z.string().optional().describe("The project ID of the pull request, if different from the work item's project."),
    },
    async ({ projectId, workItemId, repositoryId, pullRequestId, pullRequestProjectId }) => {
      try {
        const effectiveProjectId = pullRequestProjectId || projectId;
        const artifactPathValue = `${effectiveProjectId}/${repositoryId}/${pullRequestId}`;
        const vstfsUrl = `vstfs:///Git/PullRequestId/${encodeURIComponent(artifactPathValue)}`;

        const document = [
          {
            op: "add",
            path: "/relations/-",
            value: {
              rel: "ArtifactLink",
              url: vstfsUrl,
              attributes: {
                name: "Pull Request",
              },
            },
          },
        ];

        const connection = await connectionProvider();
        const witApi = await connection.getWorkItemTrackingApi();
        const updatedWorkItem = await witApi.updateWorkItem({}, document, workItemId, projectId);

        if (!updatedWorkItem) {
          return {
            isError: true,
            content: [{ type: "text", text: "Work item update failed" }],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  workItemId: workItemId,
                  pullRequestId: pullRequestId,
                  success: true,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return {
          isError: true,
          content: [{ type: "text", text: `Error linking work item to pull request: ${errorMessage}` }],
        };
      }
    }
  );

  server.tool(
    WORKITEM_TOOLS.get_work_item_type,
    "Get a specific work item type.",
    {
      project: z.string().describe("The name or ID of the Azure DevOps project."),
      workItemType: z.string().describe("The name of the work item type (e.g., 'Bug', 'Task')."),
    },
    async ({ project, workItemType }) => {
      const connection = await connectionProvider();
      const witApi = await connection.getWorkItemTrackingApi();
      const result: WorkItemType = await witApi.getWorkItemType(project, workItemType);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    WORKITEM_TOOLS.get_query,
    "Get a query by its ID or path.",
    {
      project: z.string().describe("The name or ID of the Azure DevOps project."),
      query: z.string().describe("The ID or path of the query."),
      expand: z.enum(["none", "all", "minimal", "clauses"]).optional().default("none"),
      depth: z.number().optional(),
      includeDeleted: z.boolean().optional().default(false),
      useIsoDateFormat: z.boolean().optional().default(false),
    },
    async ({ project, query, expand, depth, includeDeleted, useIsoDateFormat }) => {
      const connection = await connectionProvider();
      const witApi = await connection.getWorkItemTrackingApi();
      const expandEnum = QueryExpand[expand.charAt(0).toUpperCase() + expand.slice(1) as keyof typeof QueryExpand];
      const result = await witApi.getQuery(project, query, expandEnum, depth, includeDeleted, useIsoDateFormat);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    WORKITEM_TOOLS.get_query_results_by_id,
    "Retrieve the results of a work item query given the query ID.",
    {
      project: z.string().describe("The name or ID of the Azure DevOps project."),
      id: z.string().describe("The ID of the query."),
      team: z.string().optional().describe("The name or ID of the team."),
      timePrecision: z.boolean().optional().default(false),
      top: z.number().optional(),
    },
    async ({ project, id, team, timePrecision, top }) => {
      const connection = await connectionProvider();
      const witApi = await connection.getWorkItemTrackingApi();
      const teamContext = { project, team };
      const queryResult = await witApi.queryById(id, teamContext, timePrecision, top);
      return {
        content: [{ type: "text", text: JSON.stringify(queryResult, null, 2) }],
      };
    }
  );

  server.tool(
    WORKITEM_TOOLS.update_work_items_batch,
    "Update work items in batch.",
    {
      project: z.string().describe("The name or ID of the Azure DevOps project."),
      updates: z
        .array(
          z.object({
            op: z.string(),
            id: z.number(),
            path: z.string(),
            value: z.any(),
            format: z.string().optional(),
          })
        )
        .describe("An array of work item update objects, each with an 'op', 'id', 'path', and 'value'."),
    },
    async ({ project, updates }) => {
        const connection = await connectionProvider();
        const token = await tokenProvider();
        const batchUrl = `${connection.serverUrl}/${project}/_apis/wit/$batch?api-version=${batchApiVersion}`;

        const updatesById: { [id: number]: any[] } = {};
        for (const update of updates) {
            if (!updatesById[update.id]) {
                updatesById[update.id] = [];
            }
            updatesById[update.id].push(update);
        }

        const requests = Object.entries(updatesById).map(([id, singleItemUpdates]) => {
            const document: JsonPatchOperation[] = [];
            const multilineFields: {[key: string]: string} = {};

            for (const update of singleItemUpdates) {
                document.push({ op: update.op as any, path: update.path, value: update.value });
                if (update.format === "Markdown" && typeof update.value === 'string' && update.value.length > 50) {
                    const fieldName = update.path.split("/").pop();
                    if (fieldName) {
                        multilineFields[fieldName] = "Markdown";
                    }
                }
            }

            for(const [field, format] of Object.entries(multilineFields)) {
                document.push({ op: "add" as any, path: `/multilineFieldsFormat/${field}`, value: format });
            }

            return {
                method: "PATCH",
                uri: `/_apis/wit/workitems/${id}?api-version=5.0`,
                headers: { "Content-Type": "application/json-patch+json" },
                body: document,
            };
        });

        const response = await fetch(batchUrl, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token.token}`,
                "User-Agent": userAgentProvider(),
            },
            body: JSON.stringify(requests),
        });

        if (!response.ok) {
            throw new Error(`Failed to update work items in batch: ${response.statusText}`);
        }

        const data = await response.json();
        return {
            content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
    }
  );

  server.tool(
    WORKITEM_TOOLS.work_items_link,
    "Link work items together in batch.",
    {
      project: z.string().describe("The name or ID of the Azure DevOps project."),
      updates: z
        .array(
          z.object({
            id: z.number(),
            linkToId: z.number(),
            type: z.string(),
            comment: z.string().optional(),
          })
        )
        .describe("An array of link update objects, each with an id, linkToId, type, and optional comment."),
    },
    async ({ project, updates }) => {
        const connection = await connectionProvider();
        const token = await tokenProvider();
        const batchUrl = `${connection.serverUrl}/${project}/_apis/wit/$batch?api-version=${batchApiVersion}`;

        const requests = updates.map((link) => {
            const document = [
                {
                    op: "add" as any,
                    path: "/relations/-",
                    value: {
                        rel: getLinkTypeFromName(link.type),
                        url: `${connection.serverUrl}/${project}/_apis/wit/workItems/${link.linkToId}`,
                        attributes: {
                            comment: link.comment || "",
                        },
                    },
                },
            ];
            return {
                method: "PATCH",
                uri: `/_apis/wit/workitems/${link.id}`,
                headers: { "Content-Type": "application/json-patch+json" },
                body: document,
            };
        });

        const response = await fetch(batchUrl, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token.token}`,
                "User-Agent": userAgentProvider(),
            },
            body: JSON.stringify(requests),
        });

        if (!response.ok) {
            throw new Error(`Failed to update work items in batch: ${response.statusText}`);
        }

        const data = await response.json();
        return {
            content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
    }
  );

  function getLinkTypeFromName(name: string): string {
    const linkTypeMap: { [key: string]: string } = {
        parent: "System.LinkTypes.Hierarchy-Reverse",
        child: "System.LinkTypes.Hierarchy-Forward",
        duplicate: "System.LinkTypes.Duplicate-Forward",
        "duplicate of": "System.LinkTypes.Duplicate-Reverse",
        related: "System.LinkTypes.Related",
        successor: "System.LinkTypes.Dependency-Forward",
        predecessor: "System.LinkTypes.Dependency-Reverse",
        "tested by": "Microsoft.VSTS.Common.TestedBy-Forward",
        tests: "Microsoft.VSTS.Common.TestedBy-Reverse",
        affects: "Microsoft.VSTS.WorkitemTypes.Bug-Forward",
        "affected by": "Microsoft.VSTS.WorkitemTypes.Bug-Reverse",
        artifact: "ArtifactLink",
    };
    const fullLinkType = linkTypeMap[name.toLowerCase()];
    if (!fullLinkType) {
        throw new Error(`Unknown link type: ${name}`);
    }
    return fullLinkType;
  }

  server.tool(
    WORKITEM_TOOLS.work_item_unlink,
    "Unlink one or many links from a work item.",
    {
        project: z.string().describe("The name or ID of the Azure DevOps project."),
        id: z.number().describe("The ID of the work item from which to unlink."),
        type: z.string().describe("The type of link to remove (e.g., 'related', 'child', 'artifact')."),
        url: z.string().optional().describe("The URL of the specific link to remove. If not provided, all links of the specified type will be removed."),
    },
    async ({ project, id, type, url }) => {
        try {
            const connection = await connectionProvider();
            const witApi = await connection.getWorkItemTrackingApi();
            const workItem = await witApi.getWorkItem(id, undefined, undefined, WorkItemExpand.Relations, project);

            if (!workItem?.relations) {
                return { isError: true, content: [{ type: "text", text: `No matching relations found for link type '${type}'` }] };
            }

            const fullLinkType = getLinkTypeFromName(type);

            const indicesToRemove: number[] = [];
            workItem.relations.forEach((relation, index) => {
                if (relation.rel === fullLinkType && (!url || relation.url === url)) {
                    indicesToRemove.push(index);
                }
            });

            if (indicesToRemove.length === 0) {
                return { isError: true, content: [{ type: "text", text: `No matching relations found for link type '${type}'` + (url ? ` and URL '${url}'` : "") }] };
            }

            const patchDocument: JsonPatchOperation[] = indicesToRemove.reverse().map(index => ({
                op: "remove" as any,
                path: `/relations/${index}`,
            }));

            const updatedWorkItem = await witApi.updateWorkItem(null, patchDocument, id, project);

            return {
                content: [
                    { type: "text", text: `Removed ${indicesToRemove.length} link(s) of type '${type}':\n${fullLinkType}\n\nUpdated work item result:\n${JSON.stringify(updatedWorkItem, null, 2)}` },
                ],
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            return { isError: true, content: [{ type: "text", text: `Error unlinking work item: ${errorMessage}` }] };
        }
    }
  );

  server.tool(
    WORKITEM_TOOLS.add_artifact_link,
    "Link to artifacts like branch, pull request, commit, and build.",
    {
        project: z.string().describe("The name or ID of the Azure DevOps project."),
        workItemId: z.number().describe("The ID of the work item to which the artifact link will be added."),
        linkType: z.string().describe("The type of artifact link (e.g., 'Branch', 'Commit')."),
        comment: z.string().optional().describe("A comment for the artifact link."),
        artifactUri: z.string().optional().describe("The full URI of the artifact to link."),
        projectId: z.string().optional().describe("The ID of the project for the artifact."),
        repositoryId: z.string().optional().describe("The ID of the repository."),
        branchName: z.string().optional().describe("The name of the branch."),
        commitId: z.string().optional().describe("The ID of the commit."),
        pullRequestId: z.string().optional().describe("The ID of the pull request."),
        buildId: z.string().optional().describe("The ID of the build."),
    },
    async (params) => {
        try {
            let uri = params.artifactUri;
            if (!uri) {
                switch (params.linkType) {
                    case "Branch":
                        if (!params.projectId || !params.repositoryId || !params.branchName) return { isError: true, content: [{ type: "text", text: "For 'Branch' links, 'projectId', 'repositoryId', and 'branchName' are required." }] };
                        uri = `vstfs:///Git/Ref/${encodeURIComponent(params.projectId)}%2F${encodeURIComponent(params.repositoryId)}%2FGB${encodeURIComponent(params.branchName)}`;
                        break;
                    case "Fixed in Commit":
                    case "Commit":
                        if (!params.projectId || !params.repositoryId || !params.commitId) return { isError: true, content: [{ type: "text", text: "For 'Fixed in Commit' links, 'projectId', 'repositoryId', and 'commitId' are required." }] };
                        uri = `vstfs:///Git/Commit/${encodeURIComponent(params.projectId)}%2F${encodeURIComponent(params.repositoryId)}%2F${encodeURIComponent(params.commitId)}`;
                        break;
                    case "Pull Request":
                        if (!params.projectId || !params.repositoryId || !params.pullRequestId) return { isError: true, content: [{ type: "text", text: "For 'Pull Request' links, 'projectId', 'repositoryId', and 'pullRequestId' are required." }] };
                        uri = `vstfs:///Git/PullRequestId/${encodeURIComponent(params.projectId)}%2F${encodeURIComponent(params.repositoryId)}%2F${encodeURIComponent(params.pullRequestId)}`;
                        break;
                    case "Build":
                    case "Found in build":
                    case "Integrated in build":
                        if (!params.buildId) return { isError: true, content: [{ type: "text", text: "For 'Build' links, 'buildId' is required." }] };
                        uri = `vstfs:///Build/Build/${params.buildId}`;
                        break;
                    default:
                        return { isError: true, content: [{ type: "text", text: `URI building from components is not supported for link type '${params.linkType}'. Please provide the full 'artifactUri' instead.` }] };
                }
            }

            const patchDocument: JsonPatchOperation[] = [
                { op: "add" as any, path: "/relations/-", value: { rel: "ArtifactLink", url: uri, attributes: { name: params.linkType, comment: params.comment } } },
            ];

            const connection = await connectionProvider();
            const witApi = await connection.getWorkItemTrackingApi();
            const updatedWorkItem = await witApi.updateWorkItem({}, patchDocument, params.workItemId, params.project);

            if (!updatedWorkItem) {
                return { isError: true, content: [{ type: "text", text: "Work item update failed" }] };
            }

            return { content: [{ type: "text", text: JSON.stringify({ workItemId: params.workItemId, artifactUri: uri, linkType: params.linkType, comment: params.comment || null, success: true }, null, 2) }] };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            return { isError: true, content: [{ type: "text", text: `Error adding artifact link to work item: ${errorMessage}` }] };
        }
    }
  );
}

export { WORKITEM_TOOLS };
