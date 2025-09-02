// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { WebApi } from "azure-devops-node-api";
import { IIdentityApi } from "azure-devops-node-api/IdentitiesApi";
import { Identity } from "azure-devops-node-api/interfaces/IdentitiesInterfaces.js";

async function getConnectionData(connectionProvider: () => Promise<WebApi>) {
  const connection = await connectionProvider();
  const connData = await connection.connect();
  if (!connData.authenticatedUser) {
    throw new Error("Failed to get authenticated user details.");
  }
  return connData;
}

/**
 * Searches for identities using Azure DevOps Identity API
 */
async function searchIdentities(identity: string, connectionProvider: () => Promise<WebApi>): Promise<Identity[]> {
  const connection: WebApi = await connectionProvider();
  const identityApi: IIdentityApi = await connection.getIdentityApi();
  const identities: Identity[] = await identityApi.readIdentities(undefined, undefined, undefined, "General", identity);
  return identities;
}

/**
 * Gets the user ID from email or unique name using Azure DevOps Identity API
 */
async function getUserIdFromEmail(userEmail: string, connectionProvider: () => Promise<WebApi>): Promise<string> {
  const identities = await searchIdentities(userEmail, connectionProvider);

  if (!identities || identities.length === 0) {
    throw new Error(`No user found with email/unique name: ${userEmail}`);
  }

  const firstIdentity = identities[0];
  if (!firstIdentity.id) {
    throw new Error(`No ID found for user with email/unique name: ${userEmail}`);
  }

  return firstIdentity.id;
}

export { getConnectionData, getUserIdFromEmail, searchIdentities };
