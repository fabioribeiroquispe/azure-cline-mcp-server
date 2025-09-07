# Perguntas Frequentes

Antes de começar, certifique-se de seguir os passos do arquivo `README.md`. Isso ajudará você a se conectar e configurar sua organização no Azure DevOps.

## O MCP Server suporta tanto Azure DevOps Services quanto instalações on-premises?

Atualmente, o MCP Server suporta apenas o Azure DevOps Services. Vários endpoints de API necessários ainda não estão disponíveis para instalações on-premises. Além disso, focar no Azure DevOps Services durante a prévia pública facilita a depuração e a entrega de correções.

## Posso me conectar a mais de uma organização ao mesmo tempo?

Não, você só pode se conectar a uma organização por vez. No entanto, é possível alternar entre organizações conforme necessário.

## Posso definir um projeto padrão em vez de buscar a lista toda vez?

Atualmente, é necessário buscar a lista de projetos para que o modelo tenha contexto sobre o nome ou ID do projeto. Planejamos melhorar essa experiência no futuro usando prompts. Enquanto isso, você pode definir um nome de projeto padrão no arquivo `cline-instructions.md`.
