// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Content } from "@modelcontextprotocol/sdk/server/mcp";

export interface ToolResponse {
  content: Content[];
  isError?: boolean;
}
