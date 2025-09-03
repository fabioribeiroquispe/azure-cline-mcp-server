// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { WebApi } from "azure-devops-node-api";
import { getCurrentUserDetails, getUserIdFromEmail, searchIdentities } from "../../../src/tools/auth";
import { jest, describe, expect, it, beforeEach, afterEach } from "@jest/globals";
import { ToolResponse } from "../../../src/shared/tool-response";

type TokenProviderMock = jest.MockedFunction<() => Promise<string>>;

const mockFetch = (data: unknown, ok = true, status = 200) => {
  (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
    ok,
    status,
    json: jest.fn().mockResolvedValue(data),
    text: jest.fn().mockResolvedValue(typeof data === "string" ? data : JSON.stringify(data)),
  } as Response);
};

describe("auth functions", () => {
  let tokenProvider: TokenProviderMock;
  let connectionProvider: jest.MockedFunction<() => Promise<WebApi>>;
  let userAgentProvider: jest.MockedFunction<() => string>;
  let mockConnection: WebApi;

  beforeEach(() => {
    tokenProvider = jest.fn();
    userAgentProvider = jest.fn().mockReturnValue("Jest");

    mockConnection = {
      serverUrl: "https://dev.azure.com/test-org",
    } as WebApi;

    connectionProvider = jest.fn().mockResolvedValue(mockConnection);

    global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getCurrentUserDetails", () => {
    it("should fetch current user details and return a ToolResponse", async () => {
      tokenProvider.mockResolvedValue("fake-token");
      const mockUserData = {
        authenticatedUser: {
          id: "user-123",
          displayName: "Test User",
          uniqueName: "test@example.com",
        },
      };
      mockFetch(mockUserData);

      const result = await getCurrentUserDetails(tokenProvider, connectionProvider, userAgentProvider);

      expect(global.fetch).toHaveBeenCalledWith("https://dev.azure.com/test-org/_apis/connectionData", {
        method: "GET",
        headers: {
          "Authorization": "Bearer fake-token",
          "Content-Type": "application/json",
          "User-Agent": "Jest",
        },
      });
      expect(result).toEqual<ToolResponse>({
        content: [{ type: "text", text: JSON.stringify(mockUserData, null, 2) }],
      });
    });

    it("should handle HTTP error responses and return an error ToolResponse", async () => {
      tokenProvider.mockResolvedValue("fake-token");
      mockFetch({ message: "Unauthorized" }, false, 401);

      const result = await getCurrentUserDetails(tokenProvider, connectionProvider, userAgentProvider);

      expect(result).toEqual<ToolResponse>({
        content: [{ type: "text", text: "Error fetching user details: Unauthorized" }],
        isError: true,
      });
    });
  });

  describe("searchIdentities", () => {
    it("should search identities and return a ToolResponse", async () => {
      tokenProvider.mockResolvedValue("fake-token");
      const mockIdentities = { value: [{ id: "user1-id" }] };
      mockFetch(mockIdentities);

      const result = await searchIdentities("test@example.com", tokenProvider, connectionProvider, userAgentProvider);

      expect(global.fetch).toHaveBeenCalledWith(
        "https://vssps.dev.azure.com/test-org/_apis/identities?api-version=7.2-preview.1&searchFilter=General&filterValue=test%40example.com",
        expect.any(Object)
      );
      expect(result).toEqual<ToolResponse>({
        content: [{ type: "text", text: JSON.stringify(mockIdentities, null, 2) }],
      });
    });

    it("should handle HTTP error responses and return an error ToolResponse", async () => {
      tokenProvider.mockResolvedValue("fake-token");
      mockFetch("Not Found", false, 404);

      const result = await searchIdentities("nonexistent@example.com", tokenProvider, connectionProvider, userAgentProvider);

      expect(result).toEqual<ToolResponse>({
        content: [{ type: "text", text: "HTTP 404: Not Found" }],
        isError: true,
      });
    });
  });

  describe("getUserIdFromEmail", () => {
    it("should return user ID in a ToolResponse", async () => {
      tokenProvider.mockResolvedValue("fake-token");
      const mockIdentities = { value: [{ id: "user1-id" }] };
      mockFetch(mockIdentities);

      const result = await getUserIdFromEmail("john.doe@example.com", tokenProvider, connectionProvider, userAgentProvider);
      expect(result).toEqual<ToolResponse>({
        content: [{ type: "text", text: JSON.stringify({ id: "user1-id" }, null, 2) }],
      });
    });

    it("should return an error ToolResponse when no users found", async () => {
      tokenProvider.mockResolvedValue("fake-token");
      mockFetch({ value: [] });

      const result = await getUserIdFromEmail("nobody@example.com", tokenProvider, connectionProvider, userAgentProvider);
      expect(result).toEqual<ToolResponse>({
        content: [{ type: "text", text: "No user found with email/unique name: nobody@example.com" }],
        isError: true,
      });
    });

    it("should return an error ToolResponse when user has no ID", async () => {
      tokenProvider.mockResolvedValue("fake-token");
      mockFetch({ value: [{ providerDisplayName: "John Doe" }] });

      const result = await getUserIdFromEmail("john.doe@example.com", tokenProvider, connectionProvider, userAgentProvider);
      expect(result).toEqual<ToolResponse>({
        content: [{ type: "text", text: "No ID found for user with email/unique name: john.doe@example.com" }],
        isError: true,
      });
    });
  });
});
