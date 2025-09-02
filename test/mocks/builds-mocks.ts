import { IBuildApi } from "azure-devops-node-api/BuildApi";
import { IPipelinesApi } from "azure-devops-node-api/PipelinesApi";

export const mockBuildApiClient = (): jest.Mocked<IBuildApi> =>
  ({
    getDefinitions: jest.fn(),
    getDefinitionRevisions: jest.fn(),
    getBuilds: jest.fn(),
    getBuildLogs: jest.fn(),
    getBuildLogLines: jest.fn(),
    getBuildChanges: jest.fn(),
  } as unknown as jest.Mocked<IBuildApi>);

export const mockPipelinesApiClient = (): jest.Mocked<IPipelinesApi> =>
  ({
    getRun: jest.fn(),
    listRuns: jest.fn(),
    runPipeline: jest.fn(),
  } as unknown as jest.Mocked<IPipelinesApi>);
