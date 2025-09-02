// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { WebApi } from "azure-devops-node-api";
import { getCurrentUserDetails, getUserIdFromEmail, searchIdentities } from "../../../src/tools/auth";
import { jest, describe, expect, it, beforeEach, afterEach } from "@jest/globals";

type TokenProviderMock = jest.MockedFunction<() => Promise<string>>;

// Helper function to mock fetch responses, as suggested by the user.
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

    // Properly typed global.fetch mock, as suggested by the user.
    global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getCurrentUserDetails", () => {
    it("should fetch current user details with correct parameters", async () => {
      tokenProvider.mockResolvedValue("fake-token");
      const mockUserData = {
        authenticatedUser: {
          id: "user-123",
          displayName: "Test User",
          uniqueName: "test@example.com",
        },
      };
      // Using the new helper
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
      expect(result).toEqual(mockUserData);
    });

    it("should handle HTTP error responses correctly", async () => {
      tokenProvider.mockResolvedValue("fake-token");
      // Using the new helper for an error case
      mockFetch({ message: "Unauthorized" }, false, 401);

      await expect(getCurrentUserDetails(tokenProvider, connectionProvider, userAgentProvider)).rejects.toThrow("Error fetching user details: Unauthorized");
    });
  });

  describe("searchIdentities", () => {
    it("should search identities and return expected result", async () => {
      tokenProvider.mockResolvedValue("fake-token");
      const mockIdentities = { value: [{ id: "user1-id" }] };
      mockFetch(mockIdentities);

      const result = await searchIdentities("test@example.com", tokenProvider, connectionProvider, userAgentProvider);

      expect(global.fetch).toHaveBeenCalledWith(
        "https://vssps.dev.azure.com/test-org/_apis/identities?api-version=7.1-preview.1&searchFilter=General&filterValue=test%40example.com",
        expect.any(Object)
      );
      expect(result).toEqual(mockIdentities);
    });

    it("should handle HTTP error responses correctly", async () => {
      tokenProvider.mockResolvedValue("fake-token");
      mockFetch("Not Found", false, 404);

      await expect(searchIdentities("nonexistent@example.com", tokenProvider, connectionProvider, userAgentProvider)).rejects.toThrow("HTTP 404: Not Found");
    });
  });

  describe("getUserIdFromEmail", () => {
    it("should return user ID from email", async () => {
      tokenProvider.mockResolvedValue("fake-token");
      const mockIdentities = { value: [{ id: "user1-id" }] };
      mockFetch(mockIdentities);

      const result = await getUserIdFromEmail("john.doe@example.com", tokenProvider, connectionProvider, userAgentProvider);
      expect(result).toBe("user1-id");
    });

    it("should throw error when no users found", async () => {
      tokenProvider.mockResolvedValue("fake-token");
      mockFetch({ value: [] });

      await expect(getUserIdFromEmail("nobody@example.com", tokenProvider, connectionProvider, userAgentProvider)).rejects.toThrow("No user found with email/unique name: nobody@example.com");
    });

    it("should throw error when user has no ID", async () => {
      tokenProvider.mockResolvedValue("fake-token");
      mockFetch({ value: [{ providerDisplayName: "John Doe" }] });

      await expect(getUserIdFromEmail("john.doe@example.com", tokenProvider, connectionProvider, userAgentProvider)).rejects.toThrow("No ID found for user with email/unique name: john.doe@example.com");
    });
  });
});
