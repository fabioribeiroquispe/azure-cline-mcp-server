# 🚀 Guia Visual Completo: Azure Cline DevOps MCP Server

> ⚠️ Adaptado do [Azure DevOps MCP Server da Microsoft](https://github.com/microsoft/azure-devops-mcp) para **Cline**, **Claude** e **autenticação via PAT**.

---

<details>
<summary>🕐 Pré-requisitos</summary>

### Visual Studio Code / Insiders

* [VS Code](https://code.visualstudio.com/download) ou [VS Code Insiders](https://code.visualstudio.com/insiders)
* [Node.js 20+](https://nodejs.org/en/download)
* PAT configurado no Azure DevOps
* Pasta de projeto vazia para abrir no VS Code

### Visual Studio 2022

* [Visual Studio 2022 v17.14+](https://learn.microsoft.com/en-us/visualstudio/releases/2022/release-history)
* PAT configurado

### Cline / Claude / Cursor

* Extensões MCP instaladas
* Acesso à configuração de MCP Servers

</details>

---

<details>
<summary>🍕 Instalação - VS Code + Cline</summary>

### ✨ Instalação com um clique

[![VS Code](https://img.shields.io/badge/VS_Code-Install_AzureClineDevOps_MCP_Server-0098FF?style=flat-square\&logo=visualstudiocode\&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=ado&config=%7B%22type%22%3A%20%22stdio%22%2C%20%22command%22%3A%20%22npx%22%2C%20%22args%22%3A%20%5B%22-y%22%2C%20%22azure-cline-mcp-server%22%2C%20%22%24%7Binput%3Aado_org%7D%22%2C%20%22%24%7Binput%3Apat%7D%22%5D%7D&inputs=%5B%7B%22id%22%3A%20%22ado_org%22%2C%20%22type%22%3A%20%22promptString%22%2C%20%22description%22%3A%20%22Nome%20da%20organiza%C3%A7%C3%A3o%20Azure%20DevOps%20%28ex.%20%27contoso%27%29%22%7D,%7B%22id%22%3A%20%22pat%22%2C%22type%22%3A%20%22promptString%22%2C%22description%22%3A%22Personal%20Access%20Token%20%28PAT%29%22%7D%5D)


> Após a instalação, selecione **Modo Act** no Cline e atualize a lista de ferramentas.

---

### 🧨 Instalação via Feed Público

1. Crie `.vscode/mcp.json` no projeto:

```json
{
  "inputs": [
    { "id": "ado_org", "type": "promptString", "description": "Nome da organização do Azure DevOps (ex.: 'contoso')" },
    { "id": "pat", "type": "promptString", "description": "Personal Access Token (PAT)" }
  ],
  "servers": {
    "ado": { "type": "stdio", "command": "npx", "args": ["-y", "azure-cline-mcp-server", "${input:ado_org}", "${input:pat}"] }
  }
}
```

2. Salve e clique em **Iniciar**
3. Alterne para **Modo Act**
4. Clique em **Selecionar Ferramentas**


> Crie `.github/copilot-instructions.md` com instruções do projeto para melhorar a experiência MCP Server.

</details>

---

<details>
<summary>⚙️ Configuração do MCP Server</summary>

### Global

1. **MCP Servers → Installed → Advanced MCP Settings**
2. Em `Cline>Mcp:Mode`, escolha: permitir / restringir / desabilitar


### Individual

* Deletar → ícone da lixeira
* Reiniciar → botão Restart
* Habilitar/Desabilitar → toggle switch
* Timeout → `Network Timeout`


### Arquivo `cline_mcp_settings.json`

```json
{
  "mcpServers": {
    "ado": {
      "command": "npx",
      "args": ["-y", "azure-cline-mcp-server", "${input:ado_org}", "${input:pat}"],
      "alwaysAllow": ["tool1", "tool2"],
      "disabled": false
    }
  }
}
```

</details>

---

<details>
<summary>🛠️ Usando Ferramentas MCP</summary>

1. Digite sua solicitação no Cline / Claude / Cursor
2. MCP Server detecta ferramentas disponíveis
3. Aprove ou configure auto-approval

**Exemplo:** `"Listar projetos ADO"`

</details>

---

<details>
<summary>⚠️ Resolução de Problemas</summary>

* **Servidor não responde:** verifique processo ativo
* **Erro de permissão:** confira PAT
* **Ferramenta não disponível:** servidor implementa a ferramenta?
* **Performance lenta:** ajuste `Network Timeout`

</details>

---

<details>
<summary>💻 VS 2022</summary>

1. Configure PAT no VS
2. Execute `npx -y azure-cline-mcp-server <ADO_ORG> <PAT>`
3. Abra MCP Server via Cline / plugin compatível

</details>

---

<details>
<summary>🤖 Claude Code / Desktop</summary>

```json
{
  "mcpServers": {
    "ado": {
      "command": "npx",
      "args": ["-y", "azure-cline-mcp-server", "<ADO_ORG>", "<PAT>"],
      "alwaysAllow": ["tool1", "tool2"],
      "disabled": false
    }
  }
}
```

* Reinicie Claude
* Teste `"Listar projetos ADO"`

</details>

---

<details>
<summary>🖱️ Cursor</summary>

* Configure como **STDIO Server**
* Args: `["-y", "azure-cline-mcp-server", "<ADO_ORG>", "<PAT>"]`
* Teste comandos MCP

</details>
