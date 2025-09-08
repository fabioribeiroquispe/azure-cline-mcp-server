---
name: Adicionar nova(s) tool(s)
about: Use este template para aproveitar a IA e adicionar as tools desejadas
labels: enhancement, feature-request
---

## Nota: Este é um fork do projeto original **Microsoft Azure DevOps MCP Server**, adaptado por **fabioribeiroquispe** para funcionar com **Cline** e autenticação via **PAT**.

# Resumo

Implementar novas tools que integrem com as APIs do Azure DevOps para habilitar buscas e outras tarefas de automação.

# Tools

Desenvolver as seguintes tools com suporte completo a parâmetros (incluindo opcionais):

## `search_wiki`: Buscar conteúdos relevantes nos Wikis do Azure DevOps.

Endpoint:  
POST https://almsearch.dev.azure.com/{organization}/{project}/_apis/search/wikisearchresults?api-version=7.2-preview.1

## `search_code`: Buscar resultados de código nos Repos do Azure DevOps.

Endpoint:  
POST https://almsearch.dev.azure.com/{organization}/{project}/_apis/search/codesearchresults?api-version=7.2-preview.1

# Regras

1. Seguir estritamente os padrões e convenções de código existentes no projeto.
2. Garantir que cada tool exponha todos os parâmetros da API (obrigatórios e opcionais).
3. Utilizar a biblioteca oficial [Azure DevOps Node API](https://github.com/microsoft/azure-devops-node-api) para interagir com as APIs.

# Brinde especial 🎁

Se seguir as regras, você ganha um doce! 🍬
