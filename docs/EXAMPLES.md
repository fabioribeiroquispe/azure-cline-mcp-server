# Azure Cline MCP Server: Guia de Uso

Este guia oferece exemplos passo a passo de como utilizar o Azure Cline MCP Server para interagir com sua organização no Azure DevOps. Para dicas adicionais e boas práticas, consulte o [Guia How To](./HOWTO.md).

> 📝 Estes exemplos foram testados e validados apenas em inglês. Se encontrar problemas ao usar outro idioma, abra uma issue no repositório para que possamos investigar.

- [Listar Projetos](#listar-projetos)
- [Listar Equipes](#listar-equipes)
- [Meus Work Items](#meus-work-items)
- [Work Items em um Backlog](#work-items-em-um-backlog)
- [Consultar e Editar Work Items](#consultar-e-editar-work-items)
- [Criar e Vincular Test Cases](#criar-e-vincular-test-cases)
- [Triagem de Work Items](#triagem-de-work-items)
- [Usando Formato Markdown](#adicionando-e-atualizando-work-items-usando-o-parametro-format)
- [Remover Links de um Work Item](#remover-um-ou-mais-links-de-um-work-item)
- [Adicionar Links de Artefatos](#adicionando-links-de-artefatos)
- [Lendo, Criando e Atualizando Conteúdo de Wiki](#lendo-criando-e-atualizando-conteudo-de-wiki)

---

## 🙋‍♂️ Projetos e Equipes

### Listar Projetos

A maioria das ferramentas de work item requer contexto de projeto. Você pode recuperar a lista de projetos e especificar o projeto desejado:

```text
listar projetos ado
```

### Listar Equipes

Este comando retorna todos os projetos do Azure DevOps para a organização definida no arquivo `mcp.json`. Da mesma forma, você pode obter o contexto da equipe:

```text
listar equipes para projeto contoso
```

📽️ [Azure Cline MCP Server: Listar projetos e equipes](https://youtu.be/x579E4_jNtY)

---

## 📅 Work Items

### Meus Work Items

Recupere a lista de work items atribuídos a você. É necessário fornecer o contexto do projeto:

```text
listar meus work items para projeto contoso
```

O modelo deve usar automaticamente a ferramenta `wit_get_work_items_batch_by_ids` para buscar os detalhes dos work items.

📽️ [Azure Cline MCP Server: Meus Work Items](https://youtu.be/y_ri8n7mBlg)

### Work Items em um Backlog

É necessário contexto de projeto, equipe e backlog (Epics, Stories, Features) para listar todos os work items de um backlog:

```text
listar backlogs para projeto Contoso e equipe Fabrikam
```

Com os níveis do backlog, você pode buscar os work items correspondentes:

```text
listar work items para backlog Features
```

📽️ [Azure Cline MCP Server: Consultar backlog](https://youtu.be/LouuyoscNrI)

### Consultar e Editar Work Items

Obtenha um work item, seus comentários, atualize campos e adicione novos comentários:

```text
consultar work item 12345 mostrando campos ID, Tipo, Estado, Repro Steps, Story Points e Prioridade. Listar todos os comentários e resumir
```

Depois, você pode atualizar campos específicos. Exemplo: gerar Repro Steps mais detalhados e atualizar Story Points e Estado:

```text
melhorar Repro Steps com mais detalhes. Atualizar work item com esses Repro Steps, StoryPoints = 5 e Estado = Ativo
```

Atribua o work item a você e adicione um comentário:

```text
atribuir work item 12345 para meuemail@outlook.com e adicionar comentário "Vou assumir este bug e corrigir"
```

📽️ [Azure Cline MCP Server: Trabalhando com Work Items](https://youtu.be/tT7wqSIPKdA)

### Criar e Vincular Test Cases

Abra uma user story e gere automaticamente Test Cases detalhados com base na descrição da história. Vincule os testes gerados de volta à User Story:

```text
abrir work item 1234 no projeto 'Contoso'. Analisar descrição e criar 1-3 Test Cases com passos de teste. Mostrar prévia antes de criar no Azure DevOps. Vincular o Test Case à User Story 1234
```

📽️ [Azure Cline MCP Server: Criando Test Cases a partir de Work Item](https://youtu.be/G7fnYjlSh_w)

### Triagem de Work Items

Recupere todos os work items de um backlog e faça a triagem conforme seus critérios:

```text
listar iterações para equipe Contoso
```

```text
listar níveis de backlog para equipe Contoso
```

Depois, instrua o modelo a identificar bugs de segurança e histórias de alta prioridade. Atribua os itens à iteração atual ou à próxima se necessário:

```text
listar work items do backlog Stories. Identificar todos os bugs relacionados à segurança. Atribuir os 4 primeiros para a iteração atual. Se houver mais de 4, atribuir o restante para a próxima iteração. Encontrar 2-3 histórias de alta prioridade e atribuir à iteração atual. Executar!
```

📽️ [Azure Cline MCP Server: Triagem de Work Items](https://youtu.be/gCI_pPS76C8)

### Adicionando e Atualizando Work Items Usando o Parâmetro `format`

O parâmetro `format` indica se campos de texto longo devem usar Markdown. Disponível para:

- **wit_update_work_items_batch**
- **wit_add_child_work_items**
- **wit_create_work_item**

> 🚩 HTML é o padrão, a menos que `Markdown` seja explicitamente definido.

```text
atualizar work item 12345 com nova descrição usando texto em Markdown. Usar parâmetro format Markdown e atualização em lote
```

📽️ [Azure Cline MCP Server: Usando Markdown para criar e atualizar Work Items](https://youtu.be/OD4c2m7Fj9U)

### Remover um ou Mais Links de um Work Item

Recupere o work item cujos links deseja remover:

```text
consultar work item 1234 no projeto Contoso mostrando relações
```

Remova links específicos ou por tipo:

```text
remover links 5678 e 91011 do work item 1234. Remover também links relacionados e links para pull request 121314
```

---

### 🔗 Adicionando Links de Artefatos

Associe work items a artefatos do repositório (branches, commits, pull requests). Você pode:

1. Fornecer o URI completo no formato `vstfs`:

**Branch**:
`vstfs:///Git/Ref/{projectId}%2F{repositoryId}%2FGB{branchName}`

**Commit**:
`vstfs:///Git/Commit/{projectId}%2F{repositoryId}%2F{commitId}`

**Pull Request**:
`vstfs:///Git/PullRequestId/{projectId}%2F{repositoryId}%2F{pullRequestId}`

```text
adicionar link de branch ao work item 1234 no projeto "Contoso" com URI "vstfs:///Git/Ref/12341234-1234-1234-1234-123412341234%2F12341234-1234-1234-1234-123412341234%2FGBmain" e tipo de link "Branch" com comentário "Vinculado à branch principal para integração com Cline"
```

2. Ou fornecer apenas branch, commit, pull request ou build IDs; o sistema constrói automaticamente o URI.

Exemplo:

```text
listar pull requests para projeto Contoso e repositório Fabrikam. Vincular o primeiro pull request ao work item 12345
```

📽️ [Azure Cline MCP Server: Adicionando links de artefatos](https://youtu.be/t8HqEt8cZtY)

---

## 📖 Wiki

### Lendo, Criando e Atualizando Conteúdo de Wiki

1. Listar wikis do projeto:

```text
listar wikis no projeto Contoso
```

2. Listar páginas de um wiki específico:

```text
listar páginas do wiki Fabrikam
```

3. Ler o conteúdo de uma página existente:

```text
ler conteúdo da página 'nome-da-pagina' do wiki. Revisar e sugerir melhorias, depois atualizar a página
```

4. Criar uma nova página:

```text
criar nova página 'como assar um bolo' no wiki e adicionar o seguinte conteúdo:

<conteúdo>
```

📽️ [Azure Cline MCP Server: Lendo, criando e atualizando páginas de wiki](https://youtu.be/z_WQ_QefpGU)
