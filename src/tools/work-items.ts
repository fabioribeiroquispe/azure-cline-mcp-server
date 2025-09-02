// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebApi } from "azure-devops-node-api";
import { IWorkItemTrackingApi } from "azure-devops-node-api/WorkItemTrackingApi.js";
import { JsonPatchDocument, JsonPatchOperation, Operation } from "azure-devops-node-api/interfaces/common/VSSInterfaces.js";
import {
  ArtifactUriQuery,
  WorkItem,
  WorkItemBatchGetRequest,
  WorkItemExpand,
  WorkItemQueryResult,
  WorkItemType,
} from "azure-devops-node-api/interfaces/WorkItemTrackingInterfaces.js";
import { TeamContext } from "azure-devops-node-api/interfaces/CoreInterfaces.js";
import { z } from "zod";
import { batchApiVersion } from "../utils.js";

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

async function getWorkItemsFromQuery(witApi: IWorkItemTrackingApi, queryResult: WorkItemQueryResult) {
  if (!queryResult.workItems?.length) {
    return [];
  }
  const workItemIds = queryResult.workItems.map((item) => item.id).filter((id): id is number => id !== undefined);
  if (workItemIds.length === 0) {
    return [];
  }
  const workItems = await witApi.getWorkItems(workItemIds);
  return workItems;
}

function configureWorkItemTools(server: McpServer, tokenProvider: () => Promise<string>, connectionProvider: () => Promise<WebApi>, userAgentProvider: () => string) {
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
    },
    async ({ project }) => {
      const connection = await connectionProvider();
      const witApi = await connection.getWorkItemTrackingApi();
      const queryResult = await witApi.queryByWiql(
        {
          query: `
            SELECT [System.Id]
            FROM WorkItems
            WHERE [System.AssignedTo] = @Me OR [System.CreatedBy] = @Me
            ORDER BY [System.ChangedDate] DESC
          `,
        },
        project
      );
      const workItems = await getWorkItemsFromQuery(witApi, queryResult);
      return {
        content: [{ type: "text", text: JSON.stringify(workItems, null, 2) }],
      };
    }
  );

  server.tool(
    WORKITEM_TOOLS.get_work_item,
    "Get a single work item by ID.",
    {
      id: z.number().describe("The ID of the work item."),
      project: z.string().optional().describe("The name or ID of the Azure DevOps project."),
      expand: z
        .enum(["all", "relations", "fields", "links", "none"])
        .optional()
        .default("all")
        .describe("The expansion level for the work item. Defaults to 'all'."),
    },
    async ({ id, project, expand }) => {
      const connection = await connectionProvider();
      const witApi = await connection.getWorkItemTrackingApi();
      const workItem = await witApi.getWorkItem(id, undefined, undefined, WorkItemExpand[expand as keyof typeof WorkItemExpand], project);
      return {
        content: [{ type: "text", text: JSON.stringify(workItem, null, 2) }],
      };
    }
  );

  server.tool(
    WORKITEM_TOOLS.get_work_items_batch_by_ids,
    "Retrieve a list of work items by IDs in batch.",
    {
      ids: z.array(z.number()).describe("An array of work item IDs to retrieve."),
      project: z.string().optional().describe("The name or ID of the Azure DevOps project."),
      expand: z
        .enum(["all", "relations", "fields", "links", "none"])
        .optional()
        .default("all")
        .describe("The expansion level for the work items. Defaults to 'all'."),
    },
    async ({ ids, project, expand }) => {
      const connection = await connectionProvider();
      const witApi = await connection.getWorkItemTrackingApi();
      const workItems = await witApi.getWorkItemsBatch({ ids: ids } as WorkItemBatchGetRequest, project);
      return {
        content: [{ type: "text", text: JSON.stringify(workItems, null, 2) }],
      };
    }
  );

  server.tool(
    WORKITEM_TOOLS.update_work_item,
    "Update a work item by ID with specified fields.",
    {
      id: z.number().describe("The ID of the work item to update."),
      updates: z.record(z.any()).describe("An object with fields to update, e.g., {'System.Title': 'New Title', 'System.State': 'Done'}."),
      project: z.string().optional().describe("The name or ID of the Azure DevOps project."),
    },
    async ({ id, updates, project }) => {
      const connection = await connectionProvider();
      const witApi = await connection.getWorkItemTrackingApi();
      const patchDocument: JsonPatchDocument = Object.entries(updates).map(([key, value]) => ({
        op: Operation.Add,
        path: `/fields/${key}`,
        value: value,
      }));
      const workItem = await witApi.updateWorkItem({}, patchDocument, id, project);
      return {
        content: [{ type: "text", text: JSON.stringify(workItem, null, 2) }],
      };
    }
  );

  server.tool(
    WORKITEM_TOOLS.create_work_item,
    "Create a new work item in a specified project and work item type.",
    {
      project: z.string().describe("The name or ID of the Azure DevOps project."),
      type: z.string().describe("The type of the work item to create (e.g., 'Bug', 'Task')."),
      fields: z.record(z.any()).describe("An object with fields for the new work item, e.g., {'System.Title': 'My New Bug'}."),
    },
    async ({ project, type, fields }) => {
      const connection = await connectionProvider();
      const witApi = await connection.getWorkItemTrackingApi();
      const patchDocument: JsonPatchDocument = Object.entries(fields).map(([key, value]) => ({
        op: Operation.Add,
        path: `/fields/${key}`,
        value: value,
      }));
      const workItem = await witApi.createWorkItem({}, patchDocument, project, type);
      return {
        content: [{ type: "text", text: JSON.stringify(workItem, null, 2) }],
      };
    }
  );

  server.tool(
    WORKITEM_TOOLS.list_work_item_comments,
    "Retrieve a list of comments for a work item by ID.",
    {
      project: z.string().describe("The name or ID of the Azure DevOps project."),
      workItemId: z.number().describe("The ID of the work item."),
    },
    async ({ project, workItemId }) => {
      const connection = await connectionProvider();
      const witApi = await connection.getWorkItemTrackingApi();
      const comments = await witApi.getComments(project, workItemId);
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
      const connection = await connectionProvider();
      const workApi = await connection.getWorkApi();
      const iterationWorkItems = await workApi.getIterationWorkItems({ project, team } as TeamContext, iterationId);
      const workItems = await getWorkItemsFromQuery(
        await connection.getWorkItemTrackingApi(),
        iterationWorkItems as unknown as WorkItemQueryResult
      );
      return {
        content: [{ type: "text", text: JSON.stringify(workItems, null, 2) }],
      };
    }
  );

  server.tool(
    WORKITEM_TOOLS.add_work_item_comment,
    "Add a comment to a work item by ID.",
    {
      project: z.string().describe("The name or ID of the Azure DevOps project."),
      workItemId: z.number().describe("The ID of the work item."),
      comment: z.string().describe("The text of the comment to add."),
    },
    async ({ project, workItemId, comment }) => {
      const connection = await connectionProvider();
      const witApi = await connection.getWorkItemTrackingApi();
      const result = await witApi.addComment(
        {
          text: comment,
        },
        project,
        workItemId
      );
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    WORKITEM_TOOLS.add_child_work_items,
    "Create one or more child work items of a specific work item type for the given parent ID.",
    {
      project: z.string().describe("The name or ID of the Azure DevOps project."),
      parentWorkItemId: z.number().describe("The ID of the parent work item."),
      childWorkItemType: z.string().describe("The type of child work items to create (e.g., 'Task', 'Bug')."),
      childWorkItemTitles: z.array(z.string()).describe("An array of titles for the child work items to be created."),
    },
    async ({ project, parentWorkItemId, childWorkItemType, childWorkItemTitles }) => {
      const connection = await connectionProvider();
      const witApi = await connection.getWorkItemTrackingApi();

      const createdWorkItems: WorkItem[] = [];
      for (const title of childWorkItemTitles) {
        const patchDocument: JsonPatchDocument = [
          {
            op: Operation.Add,
            path: "/fields/System.Title",
            value: title,
          },
          {
            op: Operation.Add,
            path: "/relations/-",
            value: {
              rel: "System.LinkTypes.Hierarchy-Reverse",
              url: `${connection.serverUrl}/${project}/_apis/wit/workItems/${parentWorkItemId}`,
            },
          },
        ];
        const workItem = await witApi.createWorkItem({}, patchDocument, project, childWorkItemType);
        createdWorkItems.push(workItem);
      }

      return {
        content: [{ type: "text", text: JSON.stringify(createdWorkItems, null, 2) }],
      };
    }
  );

  server.tool(
    WORKITEM_TOOLS.link_work_item_to_pull_request,
    "Link a single work item to an existing pull request.",
    {
      project: z.string().describe("The name or ID of the Azure DevOps project."),
      workItemId: z.number().describe("The ID of the work item to link."),
      repoId: z.string().describe("The ID of the repository containing the pull request."),
      pullRequestId: z.number().describe("The ID of the pull request to link to."),
    },
    async ({ project, workItemId, repoId, pullRequestId }) => {
      const connection = await connectionProvider();
      const witApi = await connection.getWorkItemTrackingApi();
      const prArtifactUrl = `vstfs:///Git/PullRequestId/${project}%2F${repoId}%2F${pullRequestId}`;

      const patchDocument: JsonPatchDocument = [
        {
          op: Operation.Add,
          path: "/relations/-",
          value: {
            rel: "ArtifactLink",
            url: prArtifactUrl,
            attributes: {
              name: "Pull Request",
            },
          },
        },
      ];

      const updatedWorkItem = await witApi.updateWorkItem({}, patchDocument, workItemId);
      return {
        content: [{ type: "text", text: JSON.stringify(updatedWorkItem, null, 2) }],
      };
    }
  );

  server.tool(
    WORKITEM_TOOLS.get_work_item_type,
    "Get a specific work item type.",
    {
      project: z.string().describe("The name or ID of the Azure DevOps project."),
      type: z.string().describe("The name of the work item type (e.g., 'Bug', 'Task')."),
    },
    async ({ project, type }) => {
      const connection = await connectionProvider();
      const witApi = await connection.getWorkItemTrackingApi();
      const workItemType: WorkItemType = await witApi.getWorkItemType(project, type);
      return {
        content: [{ type: "text", text: JSON.stringify(workItemType, null, 2) }],
      };
    }
  );

  server.tool(
    WORKITEM_TOOLS.get_query,
    "Get a query by its ID or path.",
    {
      project: z.string().describe("The name or ID of the Azure DevOps project."),
      queryIdentifier: z.string().describe("The ID or path of the query."),
    },
    async ({ project, queryIdentifier }) => {
      const connection = await connectionProvider();
      const witApi = await connection.getWorkItemTrackingApi();
      const query = await witApi.getQuery(project, queryIdentifier);
      return {
        content: [{ type: "text", text: JSON.stringify(query, null, 2) }],
      };
    }
  );

  server.tool(
    WORKITEM_TOOLS.get_query_results_by_id,
    "Retrieve the results of a work item query given the query ID.",
    {
      project: z.string().describe("The name or ID of the Azure DevOps project."),
      queryId: z.string().describe("The ID of the query."),
    },
    async ({ project, queryId }) => {
      const connection = await connectionProvider();
      const witApi = await connection.getWorkItemTrackingApi();
      const queryResult = await witApi.queryById(queryId, project);
      const workItems = await getWorkItemsFromQuery(witApi, queryResult);
      return {
        content: [{ type: "text", text: JSON.stringify(workItems, null, 2) }],
      };
    }
  );

  server.tool(
    WORKITEM_TOOLS.update_work_items_batch,
    "Update work items in batch.",
    {
      project: z.string().describe("The name or ID of the Azure DevOps project."),
      workItemUpdates: z
        .array(
          z.object({
            id: z.number(),
            updates: z.record(z.any()),
          })
        )
        .describe("An array of work item update objects, each with an 'id' and an 'updates' object."),
    },
    async ({ project, workItemUpdates }) => {
      const connection = await connectionProvider();
      const token = await tokenProvider();
      const batchUrl = `${connection.serverUrl}/${project}/_apis/wit/$batch?api-version=${batchApiVersion}`;

      const requests = workItemUpdates.map(update => {
        const document = Object.entries(update.updates).map(([key, value]) => ({
          op: "add",
          path: `/fields/${key}`,
          value: value,
        }));
        return {
            method: "PATCH",
            uri: `/_apis/wit/workitems/${update.id}`,
            headers: { "Content-Type": "application/json-patch+json" },
            body: document
        };
      });

      const responses = await fetch(batchUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "User-Agent": userAgentProvider(),
        },
        body: JSON.stringify(requests),
      });
      const data = await responses.json();
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
      linkUpdates: z
        .array(
          z.object({
            sourceId: z.number(),
            targetId: z.number(),
            linkType: z.string(),
            comment: z.string().optional(),
          })
        )
        .describe("An array of link update objects, each with a sourceId, targetId, linkType, and optional comment."),
    },
    async ({ project, linkUpdates }) => {
      const connection = await connectionProvider();
      const token = await tokenProvider();
      const batchUrl = `${connection.serverUrl}/${project}/_apis/wit/$batch?api-version=${batchApiVersion}`;

      const requests = linkUpdates.map(link => {
        const document = [{
            op: Operation.Add,
            path: "/relations/-",
            value: {
              rel: link.linkType,
              url: `${connection.serverUrl}/${project}/_apis/wit/workItems/${link.targetId}`,
              attributes: {
                comment: link.comment,
              },
            },
        }];
        return {
            method: "PATCH",
            uri: `/_apis/wit/workitems/${link.sourceId}`,
            headers: { "Content-Type": "application/json-patch+json" },
            body: document
        };
      });

      const responses = await fetch(batchUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "User-Agent": userAgentProvider(),
        },
        body: JSON.stringify(requests),
      });
      const data = await responses.json();
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  server.tool(
    WORKITEM_TOOLS.work_item_unlink,
    "Unlink one or many links from a work item.",
    {
      workItemId: z.number().describe("The ID of the work item from which to unlink."),
      linkIndices: z.array(z.number()).describe("An array of indices of the links to remove from the work item's relations."),
    },
    async ({ workItemId, linkIndices }) => {
      const connection = await connectionProvider();
      const witApi = await connection.getWorkItemTrackingApi();
      const patchDocument: JsonPatchOperation[] = linkIndices.map((index) => ({
        op: Operation.Remove,
        path: `/relations/${index}`,
      }));
      const updatedWorkItem = await witApi.updateWorkItem({}, patchDocument, workItemId);
      return {
        content: [{ type: "text", text: JSON.stringify(updatedWorkItem, null, 2) }],
      };
    }
  );

  server.tool(
    WORKITEM_TOOLS.add_artifact_link,
    "Link to artifacts like branch, pull request, commit, and build.",
    {
      workItemId: z.number().describe("The ID of the work item to which the artifact link will be added."),
      artifactTool: z.string().describe("The tool associated with the artifact (e.g., 'Git', 'Build')."),
      artifactType: z.string().describe("The type of the artifact (e.g., 'Commit', 'PullRequest', 'Build')."),
      artifactId: z.string().describe("The ID of the artifact to link."),
      comment: z.string().optional().describe("A comment for the artifact link."),
    },
    async ({ workItemId, artifactTool, artifactType, artifactId, comment }) => {
      const connection = await connectionProvider();
      const witApi = await connection.getWorkItemTrackingApi();
      const query: ArtifactUriQuery = {
        artifactUris: [`vstfs:///${artifactTool}/Artifact/${artifactId}`],
      };
      // This method does not exist on IWorkItemTrackingApi, skipping for now.
      // const result = await witApi.getArtifactUris(query, undefined);
      // const uri = result.artifactUris?.[artifactId]?.uri;
      // if (!uri) {
      //   throw new Error(`Could not resolve artifact URI for ${artifactTool}/${artifactId}`);
      // }
      const uri = "vstfs:///" + artifactTool + "/Artifact/" + artifactId;
      const patchDocument: JsonPatchOperation[] = [
        {
          op: Operation.Add,
          path: "/relations/-",
          value: {
            rel: "ArtifactLink",
            url: uri,
            attributes: {
              name: artifactType,
              comment: comment,
            },
          },
        },
      ];
      const updatedWorkItem = await witApi.updateWorkItem({}, patchDocument, workItemId);
      return {
        content: [{ type: "text", text: JSON.stringify(updatedWorkItem, null, 2) }],
      };
    }
  );
}

export { WORKITEM_TOOLS, configureWorkItemTools };
