import { WebApi } from "azure-devops-node-api";
import { getCurrentUserDetails, getUserIdFromEmail, searchIdentities } from "../../../src/tools/auth";

// Mock global.fetch
declare const global: any;

describe("auth functions with PAT", () => {
  let mockConnection: WebApi;

  beforeEach(() => {
    global.fetch = jest.fn(); // Jest fornece globalmente
    process.argv.push("--pat=fake-pat");
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.argv = process.argv.filter((arg) => !arg.startsWith("--pat="));
  });

  describe("getCurrentUserDetails", () => {
    it("should fetch current user details with PAT headers", async () => {
      const mockUserData = {
        authenticatedUser: {
          id: "user-123",
          displayName: "Test User",
          uniqueName: "test@example.com",
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockUserData),
      });

      const result = await getCurrentUserDetails("test-org", "fake-pat");

      const expectedAuthHeader = `Basic ${Buffer.from(":fake-pat").toString("base64")}`;

      expect(global.fetch).toHaveBeenCalledWith("https://dev.azure.com/test-org/_apis/connectionData", {
        method: "GET",
        headers: {
          "Authorization": expectedAuthHeader,
          "Content-Type": "application/json",
          "User-Agent": "my-app",
        },
      });

      expect(result).toEqual(mockUserData);
    });

    it("should throw error on HTTP failure", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue({ message: "Unauthorized" }),
      });

      await expect(getCurrentUserDetails("test-org", "fake-pat")).rejects.toThrow("Error fetching user details: Unauthorized");
    });
  });

  describe("searchIdentities", () => {
    it("should search identities with correct PAT headers", async () => {
      const mockIdentities = {
        value: [{ id: "user1-id", providerDisplayName: "John Doe", descriptor: "aad.user1-descriptor" }],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockIdentities),
      });

      const result = await searchIdentities("john.doe@example.com", "test-org", "fake-pat");

      const expectedAuthHeader = `Basic ${Buffer.from(":fake-pat").toString("base64")}`;

      expect(global.fetch).toHaveBeenCalledWith("https://vssps.dev.azure.com/test-org/_apis/identities?api-version=7.2-preview.1&searchFilter=General&filterValue=john.doe%40example.com", {
        headers: {
          "Authorization": expectedAuthHeader,
          "Content-Type": "application/json",
          "User-Agent": "my-app",
        },
      });

      expect(result).toEqual(mockIdentities);
    });

    it("should throw on HTTP error", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        text: jest.fn().mockResolvedValue("Not Found"),
      });

      await expect(searchIdentities("nonexistent@example.com", "test-org", "fake-pat")).rejects.toThrow("HTTP 404: Not Found");
    });
  });

  describe("getUserIdFromEmail", () => {
    it("should return user ID from email", async () => {
      const mockIdentities = {
        value: [{ id: "user1-id", providerDisplayName: "John Doe", descriptor: "aad.user1-descriptor" }],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockIdentities),
      });

      const result = await getUserIdFromEmail("john.doe@example.com", "test-org", "fake-pat");
      expect(result).toBe("user1-id");
    });

    it("should throw when no users found", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ value: [] }),
      });

      await expect(getUserIdFromEmail("nobody@example.com", "test-org", "fake-pat")).rejects.toThrow("No user found with email/unique name: nobody@example.com");
    });
  });
});
