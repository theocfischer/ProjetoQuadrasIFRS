# Sistema de Agendamento de Quadras — IFRS

Projeto acadêmico desenvolvido durante a formação técnica em Informática no IFRS Campus Restinga.

O sistema simula uma aplicação web para gerenciamento de agendamentos de quadras esportivas, com cadastro de usuários, autenticação, controle de sessão, visualização de horários e integração com banco de dados MySQL.

---

## Tecnologias utilizadas

- Node.js
- Express
- MySQL
- HTML
- CSS
- JavaScript
- bcrypt
- express-session

---

## Funcionalidades

- Cadastro de usuários
- Login com senha criptografada
- Controle de sessão
- Cadastro/gerenciamento de quadras
- Agendamento de horários
- Visualização de horários disponíveis
- Integração com banco de dados relacional

---

## Objetivo do projeto

O objetivo do projeto foi praticar o desenvolvimento de uma aplicação web com back-end em Node.js, persistência de dados em MySQL e controle básico de autenticação e sessão.

O sistema foi desenvolvido em contexto acadêmico, com foco em aplicar conceitos de desenvolvimento web, banco de dados, rotas, formulários, autenticação e organização de uma aplicação completa.

---

## Estrutura do projeto

```text
ProjetoQuadrasIFRS/
├── model/
├── views/
├── index.js
├── package.json
├── package-lock.json
├── quadras.sql
├── .gitignore
└── README.md
```

---

## Banco de dados

O arquivo `quadras.sql` contém a estrutura necessária para criação do banco de dados usado pelo sistema.

O projeto utiliza MySQL para armazenar informações relacionadas a usuários, quadras e agendamentos.

---

## Como executar localmente

Este projeto roda localmente, pois utiliza Node.js, Express e MySQL.

Passos gerais:

1. Clone o repositório:

```bash
git clone https://github.com/theocfischer/ProjetoQuadrasIFRS.git
```

2. Instale as dependências:

```bash
npm install
```

3. Importe o arquivo `quadras.sql` no MySQL.

4. Configure a conexão com o banco de dados no projeto.

5. Execute a aplicação:

```bash
node index.js
```

> Observação: este projeto não funciona diretamente pelo GitHub Pages, pois depende de back-end e banco de dados local.

---

## Aprendizados

Durante o desenvolvimento deste projeto, foram praticados conceitos como:

- criação de rotas com Express;
- integração entre Node.js e MySQL;
- operações básicas de cadastro, consulta e agendamento;
- autenticação básica de usuários;
- criptografia de senhas com bcrypt;
- controle de sessão com express-session;
- organização de uma aplicação web com front-end, back-end e banco de dados;
- modelagem simples de dados relacionais.

---

## Melhorias futuras

Algumas melhorias possíveis para versões futuras:

- melhorar a responsividade da interface;
- separar melhor as responsabilidades do código;
- criar arquivo `.env` para configurações sensíveis;
- adicionar validações mais completas nos formulários;
- melhorar mensagens de erro e feedback ao usuário;
- documentar melhor as rotas principais;
- adicionar capturas de tela ao README;
- revisar a organização do projeto seguindo uma estrutura MVC mais clara.

---

## Observação

Este projeto foi desenvolvido como atividade acadêmica durante minha formação técnica em Informática no IFRS.

O foco principal foi praticar conceitos de desenvolvimento web com Node.js, Express, MySQL, autenticação, sessões e integração com banco de dados relacional.

---

## Autor

Theo Fischer
