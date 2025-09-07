Perfeito, Fábio. Vou reescrever o conteúdo considerando **Cline**, com **PAT** e sem menção desnecessária ao Copilot, e traduzir para português, mantendo direto e prático para uso real. Aqui está:

---

# 🥇 Como melhorar sua experiência

Certifique-se de seguir todos os passos do [Guia de Introdução](./GETTINGSTARTED.md) para configurar rapidamente e conectar-se à sua organização Azure DevOps.

## Modificar instruções do Cline

O arquivo `.github/cline-instructions.md` permite personalizar a experiência do **Cline**, especialmente quando você estiver trabalhando com o **MCP Server para Azure DevOps**.

Segundo a [documentação oficial do GitHub](https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot):

> Em vez de adicionar repetidamente detalhes contextuais nas perguntas do chat, você pode criar um arquivo no seu repositório que insere essas informações automaticamente. Essas informações adicionais não aparecem no chat, mas ficam disponíveis para o Cline gerar respostas mais precisas e contextualizadas.

## Exemplo de instrução para Cline

Aqui está um exemplo que você pode adicionar ao seu `.github/cline-instructions.md`:

```markdown
## Usando MCP Server para Azure DevOps

Ao obter work items usando o MCP Server para Azure DevOps, sempre use ferramentas de batch para atualizações em vez de muitas atualizações individuais. Para updates, tente atualizar até 200 work items de uma só vez. Ao buscar work items, depois de obter a lista de IDs, use a ferramenta `get_work_items_batch_by_ids` para obter os detalhes completos.  
Por padrão, exiba os campos: ID, Tipo, Título e Estado. Mostre os resultados em uma tabela Markdown renderizada.
```

## Usar diferentes modelos

A comunicação com LLMs é tanto uma arte quanto uma ciência. Se o modelo não responder bem, experimentar outro modelo disponível no Cline (Anthropic, OpenAI, Gemini, etc.) pode melhorar os resultados.

---

Se você quiser, posso fazer **uma versão final otimizada pronta para copiar/colar**, com mais dicas práticas de **configuração MCP Server no Cline com PAT**, já estruturada dentro do `.github/cline-instructions.md`.

Quer que eu faça isso agora?
