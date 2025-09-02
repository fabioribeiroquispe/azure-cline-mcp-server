# ⭐ Azure DevOps MCP Server

Easily install the Azure DevOps MCP Server for VS Code or VS Code Insiders:

[![Install with NPX in VS Code](https://img.shields.io/badge/VS_Code-Install_AzureDevops_MCP_Server-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=ado&config=%7B%20%22type%22%3A%20%22stdio%22%2C%20%22command%22%3A%20%22npx%22%2C%20%22args%22%3A%20%5B%22-y%22%2C%20%22%40azure-devops%2Fmcp%22%2C%20%22%24%7Binput%3Aado_org%7D%22%5D%7D&inputs=%5B%7B%22id%22%3A%20%22ado_org%22%2C%20%22type%22%3A%20%22promptString%22%2C%20%22description%22%3A%20%22Azure%20DevOps%20organization%20name%20%20%28e.g.%20%27contoso%27%29%22%7D%5D)
[![Install with NPX in VS Code Insiders](https://img.shields.io/badge/VS_Code_Insiders-Install_AzureDevops_MCP_Server-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=ado&quality=insiders&config=%7B%20%22type%22%3A%20%22stdio%22%2C%20%22command%22%3A%20%22npx%22%2C%20%22args%22%3A%20%5B%22-y%22%2C%20%22%40azure-devops%2Fmcp%22%2C%20%22%24%7Binput%3Aado_org%7D%22%5D%7D&inputs=%5B%7B%22id%22%3A%20%22ado_org%22%2C%20%22type%22%3A%20%22promptString%22%2C%20%22description%22%3A%20%22Azure%20DevOps%20organization%20name%20%20%28e.g.%20%27contoso%27%29%22%7D%5D)

This TypeScript project provides a **local** MCP server for Azure DevOps, enabling you to perform a wide range of Azure DevOps tasks directly from your code editor.

> 🚨 **Public Preview:** This project is in public preview. Tools and features may change before general availability.

## 📄 Table of Contents

1. [📺 Overview](#-overview)
2. [🏆 Expectations](#-expectations)
3. [⚙️ Supported Tools](#️-supported-tools)
4. [🔌 Installation & Getting Started](#-installation--getting-started)
5. [🌏 Using Domains](#-using-domains)
6. [📝 Troubleshooting](#-troubleshooting)
7. [🎩 Examples & Best Practices](#-examples--best-practices)
8. [🙋‍♀️ Frequently Asked Questions](#️-frequently-asked-questions)
9. [📌 Contributing](#-contributing)

## 📺 Overview

The Azure DevOps MCP Server brings Azure DevOps context to your agents. Try prompts like:

- "List my ADO projects"
- "List ADO Builds for 'Contoso'"
- "List ADO Releases for 'Contoso'"
- "List ADO Repos for 'Contoso'"
- "List test plans for 'Contoso'"
- "List teams for project 'Contoso'"
- "List iterations for project 'Contoso'"
- "List my work items for project 'Contoso'"
- "List work items in current iteration for 'Contoso' project and 'Contoso Team'"
- "List all wikis in the 'Contoso' project"
- "Create a wiki page '/Architecture/Overview' with content about system design"
- "Update the wiki page '/Getting Started' with new onboarding instructions"
- "Get the content of the wiki page '/API/Authentication' from the Documentation wiki"

## 🏆 Expectations

The Azure DevOps MCP Server is built from tools that are concise, simple, focused, and easy to use—each designed for a specific scenario. We intentionally avoid complex tools that try to do too much. The goal is to provide a thin abstraction layer over the REST APIs, making data access straightforward and letting the language model handle complex reasoning.

## ⚙️ Supported Tools

Interact with these Azure DevOps services:

### 🧿 Core

- **core_list_project_teams**: Retrieve a list of teams for the specified Azure DevOps project.
- **core_list_projects**: Retrieve a list of projects in your Azure DevOps organization.
- **core_get_identity_ids**: Retrieve Azure DevOps identity IDs for a list of unique names.

### ⚒️ Work

- **work_list_team_iterations**: Retrieve a list of iterations for a specific team in a project.
- **work_create_iterations**: Create new iterations in a specified Azure DevOps project.
- **work_assign_iterations**: Assign existing iterations to a specific team in a project.

### 📅 Work Items

- **wit_my_work_items**: Retrieve a list of work items relevant to the authenticated user.
- **wit_list_backlogs**: Retrieve a list of backlogs for a given project and team.
- **wit_list_backlog_work_items**: Retrieve a list of backlogs for a given project, team, and backlog category.
- **wit_get_work_item**: Get a single work item by ID.
- **wit_get_work_items_batch_by_ids**: Retrieve a list of work items by IDs in batch.
- **wit_update_work_item**: Update a work item by ID with specified fields.
- **wit_create_work_item**: Create a new work item in a specified project and work item type.
- **wit_list_work_item_comments**: Retrieve a list of comments for a work item by ID.
- **wit_get_work_items_for_iteration**: Retrieve a list of work items for a specified iteration.
- **wit_add_work_item_comment**: Add a comment to a work item by ID.
- **wit_add_child_work_items**: Create one or more child work items of a specific work item type for the given parent ID.
- **wit_link_work_item_to_pull_request**: Link a single work item to an existing pull request.
- **wit_get_work_item_type**: Get a specific work item type.
- **wit_get_query**: Get a query by its ID or path.
- **wit_get_query_results_by_id**: Retrieve the results of a work item query given the query ID.
- **wit_update_work_items_batch**: Update work items in batch.
- **wit_work_items_link**: Link work items together in batch.
- **wit_work_item_unlink**: Unlink one or many links from a work item.
- **wit_add_artifact_link**: Link to artifacts like branch, pull request, commit, and build.

### 📁 Repositories

- **repo_list_repos_by_project**: Retrieve a list of repositories for a given project.
- **repo_list_pull_requests_by_repo**: Retrieve a list of pull requests for a given repository.
- **repo_list_pull_requests_by_project**: Retrieve a list of pull requests for a given project ID or name.
- **repo_list_branches_by_repo**: Retrieve a list of branches for a given repository.
- **repo_list_my_branches_by_repo**: Retrieve a list of your branches for a given repository ID.
- **repo_list_pull_requests_by_commits**: List pull requests associated with commits.
- **repo_list_pull_request_threads**: Retrieve a list of comment threads for a pull request.
- **repo_list_pull_request_thread_comments**: Retrieve a list of comments in a pull request thread.
- **repo_get_repo_by_name_or_id**: Get the repository by project and repository name or ID.
- **repo_get_branch_by_name**: Get a branch by its name.
- **repo_get_pull_request_by_id**: Get a pull request by its ID.
- **repo_create_pull_request**: Create a new pull request.
- **repo_update_pull_request_status**: Update the status of an existing pull request to active or abandoned.
- **repo_update_pull_request**: Update various fields of an existing pull request (title, description, draft status, target branch).
- **repo_update_pull_request_reviewers**: Add or remove reviewers for an existing pull request.
- **repo_reply_to_comment**: Replies to a specific comment on a pull request.
- **repo_resolve_comment**: Resolves a specific comment thread on a pull request.
- **repo_search_commits**: Searches for commits.
- **repo_create_pull_request_thread**: Creates a new comment thread on a pull request.

### 🛰️ Builds

- **build_get_definitions**: Retrieve a list of build definitions for a given project.
- **build_get_definition_revisions**: Retrieve a list of revisions for a specific build definition.
- **build_get_builds**: Retrieve a list of builds for a given project.
- **build_get_log**: Retrieve the logs for a specific build.
- **build_get_log_by_id**: Get a specific build log by log ID.
- **build_get_changes**: Get the changes associated with a specific build.
- **build_get_status**: Fetch the status of a specific build.
- **build_update_build_stage**: Update the stage of a specific build.
- **pipelines_get_run**: Gets a run for a particular pipeline.
- **pipelines_list_runs**: Gets top 10000 runs for a particular pipeline.
- **pipelines_run_pipeline**: Starts a new run of a pipeline.

### 🚀 Releases

- **release_get_definitions**: Retrieve a list of release definitions for a given project.
- **release_get_releases**: Retrieve a list of releases for a given project.

### 🔒 Advanced Security

- **advsec_get_alerts**: Retrieve Advanced Security alerts for a repository.
- **advsec_get_alert_details**: Get detailed information about a specific Advanced Security alert.

### 🧪 Test Plans

- **testplan_create_test_plan**: Create a new test plan in the project.
- **testplan_create_test_case**: Create a new test case work item.
- **testplan_add_test_cases_to_suite**: Add existing test cases to a test suite.
- **testplan_list_test_plans**: Retrieve a paginated list of test plans from an Azure DevOps project. Allows filtering for active plans and toggling detailed information.
- **testplan_list_test_cases**: Get a list of test cases in the test plan.
- **testplan_show_test_results_from_build_id**: Get a list of test results for a given project and build ID.

### 📖 Wiki

- **wiki_list_wikis**: Retrieve a list of wikis for an organization or project.
- **wiki_get_wiki**: Get the wiki by wikiIdentifier.
- **wiki_list_pages**: Retrieve a list of wiki pages for a specific wiki and project.
- **wiki_get_page_content**: Retrieve wiki page content by wikiIdentifier and path.
- **wiki_create_or_update_page**: Create or update wiki pages with full content support.

### 🔎 Search

- **search_code**: Get code search results for a given search text.
- **search_wiki**: Get wiki search results for a given search text.
- **search_workitem**: Get work item search results for a given search text.

## 🔌 Installation & Getting Started

This guide explains how to set up and configure the Azure DevOps MCP Server.

### Prerequisites

1.  Install [VS Code](https://code.visualstudio.com/download) or [VS Code Insiders](https://code.visualstudio.com/insiders).
2.  Install [Node.js](https://nodejs.org/en/download) 20+.
3.  Open VS Code in an empty folder where you want to configure the server.

### Authentication

This server uses **Personal Access Token (PAT)** authentication exclusively. You must generate a PAT from your Azure DevOps organization to use this tool.

**How to Generate a Personal Access Token (PAT):**

1.  Log in to your Azure DevOps organization.
2.  In the top right corner, go to **User settings** -> **Personal Access Tokens**.
3.  Click **+ New Token**.
4.  Give the token a name (e.g., `mcp-server-token`).
5.  Select the organization.
6.  Set the desired expiration date.
7.  For **Scopes**, select **Full access**. This is the simplest option to ensure all tools work correctly.
8.  Click **Create**.
9.  **Important:** Copy the generated token immediately. You will not be able to see it again.

### Installation and Configuration

The server is configured via a `.vscode/mcp.json` file in your project folder.

**1. Create the Configuration File:**

In your project, create a `.vscode/mcp.json` file with the following content:

```json
{
  "inputs": [
    {
      "id": "ado_org",
      "type": "promptString",
      "description": "Azure DevOps organization name (e.g. 'contoso')"
    },
    {
      "id": "ado_pat",
      "type": "promptPassword",
      "description": "Azure DevOps Personal Access Token"
    }
  ],
  "servers": {
    "ado": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "@azure-devops/mcp",
        "${input:ado_org}",
        "--pat",
        "${input:ado_pat}"
      ]
    }
  }
}
```

**2. Start the Server:**

- Save the `.vscode/mcp.json` file.
- VS Code should automatically detect the file and show a status bar item to start the server. Click 'Start'.
- When prompted, enter your Azure DevOps **organization name** and the **PAT** you generated.

![start mcp server](./docs/media/start-mcp-server.gif)

**3. Enable Tools in your AI Assistant:**

- In your AI assistant (e.g., GitHub Copilot Chat), switch to Agent Mode.
- Click "Select Tools" and choose the available tools (e.g., `ado:core_list_projects`).

![configure mcp server tools](./docs/media/configure-mcp-server-tools.gif)

### Using with Cline

If you are using [Cline](https://docs.cline.bot/) as your AI assistant, the configuration process is different. Cline uses a central `cline_mcp_settings.json` file instead of the `.vscode/mcp.json` file.

**1. Open Cline MCP Settings:**

- In the Cline extension, click the "MCP Servers" icon in the top navigation bar.
- Select the "Installed" tab.
- Click the "Configure MCP Servers" button at the bottom of the pane to open the `cline_mcp_settings.json` file.

**2. Add the Server Configuration:**

Add the following JSON object to the `mcpServers` list in your `cline_mcp_settings.json` file.

```json
"azure-devops": {
  "command": "npx",
  "args": [
    "-y",
    "@azure-devops/mcp"
  ],
  "env": {
    "ADO_ORG_NAME": "your_azure_devops_organization_name",
    "ADO_PAT": "your_personal_access_token_here"
  },
  "disabled": false
}
```

**Important:**
- Replace `your_azure_devops_organization_name` with your actual organization name.
- Replace `your_personal_access_token_here` with the PAT you generated.
- Make sure to add a comma if you are adding this server to an existing list of servers in the `mcpServers` object.

**3. Restart Cline:**

After saving the `cline_mcp_settings.json` file, you may need to restart Cline or VS Code for the new server configuration to be loaded.

### Configuration Details

This section provides details for all the fields in the `.vscode/mcp.json` file.

#### `inputs` Array

This array defines the prompts that VS Code will show the user to gather necessary values.

-   `id`: A unique identifier for the input. The value provided by the user is referenced in the `args` section using `${input:id}`.
    -   `ado_org` (required): The name of your Azure DevOps organization.
    -   `ado_pat` (required): The Personal Access Token for authentication.
-   `type`: The type of prompt.
    -   `promptString`: A standard text input field.
    -   `promptPassword`: A text input field that masks the user's entry for security.
-   `description`: The text displayed to the user in the prompt.

#### `servers` Object

This object defines the MCP server to be run.

-   `ado`: A user-defined name for the server configuration.
-   `type`: The transport protocol. Must be `stdio`.
-   `command`: The command to execute to start the server.
    -   `npx`: (Recommended for most users) Fetches and runs the latest version of the server package from the npm registry.
    -   `mcp-server-azuredevops`: Use this if you have cloned this repository and are running the server from the local source code.
-   `args`: An array of arguments passed to the command.
    -   `"${input:ado_org}"`: The mandatory organization name, passed from the input prompt.
    -   `"--pat", "${input:ado_pat}"`: The mandatory Personal Access Token, passed from the input prompt.
    -   `"-d", "domain1", "domain2", ...`: (Optional) A list of tool domains to enable. This allows you to load only the tools you need. If omitted, all domains are loaded by default.

#### Using Domains

To keep the toolset manageable, you can load specific **domains** (groups of related tools). Add the `-d` flag followed by the domain names to the `args` array.

**Example: Load only Work Item and Core tools**

```json
"args": [
  "${input:ado_org}",
  "--pat",
  "${input:ado_pat}",
  "-d",
  "core",
  "work-items"
]
```

**Available Domains:**
`core`, `work`, `work-items`, `search`, `test-plans`, `repositories`, `wiki`, `builds`, `releases`, `advanced-security`

We recommend always including `core` as it provides essential project-level tools.

> 💥 **Tip:** For an enhanced experience with GitHub Copilot Chat, create a `.github/copilot-instructions.md` file in your project and add the line: "`This project uses Azure DevOps. Always check to see if the Azure DevOps MCP server has a tool relevant to the user's request.`"

## 📝 Troubleshooting

See the [Troubleshooting guide](./docs/TROUBLESHOOTING.md) for help with common issues and logging.

## 🎩 Examples & Best Practices

Explore example prompts in our [Examples documentation](./docs/EXAMPLES.md).

For best practices and tips to enhance your experience with the MCP Server, refer to the [How-To guide](./docs/HOWTO.md).

## 🙋‍♀️ Frequently Asked Questions

For answers to common questions about the Azure DevOps MCP Server, see the [Frequently Asked Questions](./docs/FAQ.md).

## 📌 Contributing

We welcome contributions! During preview, please file issues for bugs, enhancements, or documentation improvements.

See our [Contributions Guide](./CONTRIBUTING.md) for:

- 🛠️ Development setup
- ✨ Adding new tools
- 📝 Code style & testing
- 🔄 Pull request process

## 🤝 Code of Conduct

This project follows the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For questions, see the [FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [open@microsoft.com](mailto:open@microsoft.com).

## 📈 Project Stats

[![Star History Chart](https://api.star-history.com/svg?repos=microsoft/azure-devops-mcp&type=Date)](https://star-history.com/#microsoft/azure-devops-mcp)

## 🏆 Hall of Fame

Thanks to all contributors who make this project awesome! ❤️

[![Contributors](https://contrib.rocks/image?repo=microsoft/azure-devops-mcp)](https://github.com/microsoft/azure-devops-mcp/graphs/contributors)

> Generated with [contrib.rocks](https://contrib.rocks)

## License

Licensed under the [MIT License](./LICENSE.md).

---

_Trademarks: This project may include trademarks or logos for Microsoft or third parties. Use of Microsoft trademarks or logos must follow [Microsoft’s Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general). Third-party trademarks are subject to their respective policies._

<!-- version: 2023-04-07 [Do not delete this line, it is used for analytics that drive template improvements] -->
