import { WebApi, getPersonalAccessTokenHandler } from "azure-devops-node-api";
import { apiVersion } from "../utils.js";
import { IdentityBase } from "azure-devops-node-api/interfaces/IdentitiesInterfaces.js";

interface IdentitiesResponse {
  value: IdentityBase[];
}

function getAuthHeaders(pat: string, userAgent?: string): Record<string, string> {
  const basicAuth = Buffer.from(`:${pat}`).toString("base64");
  return {
    "Authorization": `Basic ${basicAuth}`,
    "Content-Type": "application/json",
    "User-Agent": userAgent ?? "my-app",
  };
}

function getPatConnection(orgName: string, pat: string): WebApi {
  const authHandler = getPersonalAccessTokenHandler(pat);
  const orgUrl = `https://dev.azure.com/${orgName}`;
  return new WebApi(orgUrl, authHandler);
}

async function getCurrentUserDetails(orgName: string, pat: string, userAgent?: string) {
  const connection = getPatConnection(orgName, pat);
  const url = `${connection.serverUrl}/_apis/connectionData`;
  const headers = getAuthHeaders(pat, userAgent);

  const response = await fetch(url, { method: "GET", headers });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Error fetching user details: ${data.message}`);
  }
  return data;
}

async function searchIdentities(identity: string, orgName: string, pat: string, userAgent?: string): Promise<IdentitiesResponse> {
  const baseUrl = `https://vssps.dev.azure.com/${orgName}/_apis/identities`;
  const params = new URLSearchParams({
    "api-version": apiVersion,
    "searchFilter": "General",
    "filterValue": identity,
  });
  const headers = getAuthHeaders(pat, userAgent);

  const response = await fetch(`${baseUrl}?${params}`, { headers });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  return await response.json();
}

async function getUserIdFromEmail(userEmail: string, orgName: string, pat: string, userAgent?: string): Promise<string> {
  const identities = await searchIdentities(userEmail, orgName, pat, userAgent);

  if (!identities || identities.value?.length === 0) {
    throw new Error(`No user found with email/unique name: ${userEmail}`);
  }

  const firstIdentity = identities.value[0];
  if (!firstIdentity.id) {
    throw new Error(`No ID found for user with email/unique name: ${userEmail}`);
  }

  return firstIdentity.id;
}

export { getCurrentUserDetails, getUserIdFromEmail, searchIdentities, getPatConnection, getAuthHeaders };
