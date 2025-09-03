import { describe, it, expect, jest } from "@jest/globals";
import { IWorkApi } from "azure-devops-node-api/WorkApi";
import { IWorkItemTrackingApi } from "azure-devops-node-api/WorkItemTrackingApi";

describe("work-items-mocks", () => {
    it("should have a dummy test", () => {
        expect(true).toBe(true);
    });
});

export const mockWorkClient = (): jest.Mocked<IWorkApi> =>
  ({
    getBacklogs: jest.fn(),
    getBacklogLevelWorkItems: jest.fn(),
    getPredefinedQueryResults: jest.fn(),
    getTeamIterations: jest.fn(),
    getIterationWorkItems: jest.fn(),
  } as unknown as jest.Mocked<IWorkApi>);

export const mockWorkItemTrackingClient = (): jest.Mocked<IWorkItemTrackingApi> =>
  ({
    getWorkItemsBatch: jest.fn(),
    getWorkItem: jest.fn(),
    getComments: jest.fn(),
    addComment: jest.fn(),
    updateWorkItem: jest.fn(),
    createWorkItem: jest.fn(),
    getWorkItemType: jest.fn(),
    getQuery: jest.fn(),
    queryById: jest.fn(),
  } as unknown as jest.Mocked<IWorkItemTrackingApi>);
