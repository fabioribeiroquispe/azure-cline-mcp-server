## 📌 Descrição do trabalho realizado

Alteração do projeto original da Microsoft [`azure-devops-mcp`](https://github.com/microsoft/azure-devops-mcp)  
para permitir uso com a extensão **Cline** no VSCode, adicionando suporte a autenticação via **Personal Access Token (PAT)**.

## 🔗 GitHub issue (se aplicável)

<!-- Referência a uma issue, se existir -->

## ⚠️ Riscos associados

- Alterações podem divergir da branch oficial da Microsoft, dificultando futuras atualizações upstream.
- Necessário manter compatibilidade com versões futuras do Cline.
- Possível impacto se forem introduzidas quebras na API do MCP.

## ✅ Checklist

- [ ] Li as [contribution guidelines](./CONTRIBUTING.md)
- [ ] Li o [code of conduct](./CODE_OF_CONDUCT.md)
- [ ] Título da Pull Request está claro e informativo
- [ ] Código segue boas práticas de consistência
- [ ] Documentação adicionada/atualizada ou N/A
- [ ] Testes automatizados adicionados ou N/A

## 🧪 Como foi testado

- Testado com a extensão **Cline** no VSCode
- Autenticação realizada com **PAT**
- Execução de comandos de listagem e consulta de projetos no Azure DevOps
- Verificação de integração ponta a ponta entre MCP server e Cline
