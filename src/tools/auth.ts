// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { WebApi } from "azure-devops-node-api";
import { apiVersion } from "../utils";
import { ToolResponse } from "../shared/tool-response";
import { IdentityBase } from "azure-devops-node-api/interfaces/IdentitiesInterfaces";

async function getCurrentUserDetails(
  tokenProvider: () => Promise<string>,
  connectionProvider: () => Promise<WebApi>,
  userAgentProvider: () => string
): Promise<ToolResponse> {
  try {
    const connection = await connectionProvider();
    const url = `${connection.serverUrl}/_apis/connectionData`;
    const token = await tokenProvider();
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": userAgentProvider(),
      },
    });
    const data = await response.json();
    if (!response.ok) {
      return {
        content: [{ type: "text", text: `Error fetching user details: ${data.message}` }],
        isError: true,
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return {
      content: [{ type: "text", text: `Error fetching user details: ${errorMessage}` }],
      isError: true,
    };
  }
}

/**
 * Searches for identities using Azure DevOps Identity API
 */
async function searchIdentities(
  identity: string,
  tokenProvider: () => Promise<string>,
  connectionProvider: () => Promise<WebApi>,
  userAgentProvider: () => string
): Promise<ToolResponse> {
  try {
    const token = await tokenProvider();
    const connection = await connectionProvider();
    const orgName = connection.serverUrl.split("/")[3];
    const baseUrl = `https://vssps.dev.azure.com/${orgName}/_apis/identities`;

    const params = new URLSearchParams({
      "api-version": apiVersion,
      searchFilter: "General",
      filterValue: identity,
    });

    const response = await fetch(`${baseUrl}?${params}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": userAgentProvider(),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        content: [{ type: "text", text: `HTTP ${response.status}: ${errorText}` }],
        isError: true,
      };
    }

    const data = await response.json();
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return {
      content: [{ type: "text", text: `Error searching identities: ${errorMessage}` }],
      isError: true,
    };
  }
}

/**
 * Gets the user ID from email or unique name using Azure DevOps Identity API
 */
async function getUserIdFromEmail(
  userEmail: string,
  tokenProvider: () => Promise<string>,
  connectionProvider: () => Promise<WebApi>,
  userAgentProvider: () => string
): Promise<ToolResponse> {
  try {
    const searchResponse = await searchIdentities(userEmail, tokenProvider, connectionProvider, userAgentProvider);

    if (searchResponse.isError) {
      return searchResponse;
    }

    const identities = JSON.parse(searchResponse.content[0].text) as { value: IdentityBase[] };

    if (!identities || identities.value?.length === 0) {
      return {
        content: [{ type: "text", text: `No user found with email/unique name: ${userEmail}` }],
        isError: true,
      };
    }

    const firstIdentity = identities.value[0];
    if (!firstIdentity.id) {
      return {
        content: [{ type: "text", text: `No ID found for user with email/unique name: ${userEmail}` }],
        isError: true,
      };
    }

    return {
      content: [{ type: "text", text: JSON.stringify({ id: firstIdentity.id }, null, 2) }],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return {
      content: [{ type: "text", text: `Error getting user ID from email: ${errorMessage}` }],
      isError: true,
    };
  }
}

export { getCurrentUserDetails, getUserIdFromEmail, searchIdentities };
