# Frontend - Plataforma de Mentoria Jackeline Mizael

Este README é focado somente no frontend, por enquanto.

Aplicação web em HTML, CSS e JavaScript (ES Modules) com:

- Login em 2 etapas e cadastro
- Catálogo de cursos, módulos e aulas
- Player YouTube com progresso real
- Certificados por conclusão de curso
- Perfil do usuário autenticado

## Estrutura do Frontend

- [frontend/catalogo.html](frontend/catalogo.html): tela principal (login, catálogo, player, perfil)
- [frontend/inscricao.html](frontend/inscricao.html): tela de formulario de inscricao (Pipefy embed)
- [frontend/catalogo.css](frontend/catalogo.css): entrypoint de estilos
- [frontend/styles](frontend/styles): módulos de estilo (base, auth, plataforma, conteúdo, responsivo)
- [frontend/catalogo.js](frontend/catalogo.js): entrypoint JS do app
- [frontend/src](frontend/src): código por camadas (config, core, services, features)

## Stack do Frontend

- HTML5
- CSS3
- JavaScript moderno (ES Modules)
- API do YouTube Iframe (player)
- LocalStorage para sessão e métricas de progresso

## Como Executar o Frontend

### Pré-requisitos

- Node.js (para servir os arquivos estáticos)
- API disponível e acessível (padrão: http://localhost:8081)

### Passos

1. Na raiz do projeto, execute:

```bash
npx serve frontend -l 5500
```

2. Abra no navegador:

- http://localhost:5500/catalogo.html
- http://localhost:5500/inscricao.html

### Configuração da URL da API

Ordem de resolução da base URL no frontend:

1. window.API_BASE_URL
2. localStorage jm.apiBaseUrl
3. fallback http://localhost:8081

Exemplo para sobrescrever via DevTools:

```js
localStorage.setItem("jm.apiBaseUrl", "http://localhost:8081");
```

## Regras de Negócio do Frontend

### Autenticação

- Login em 2 etapas: e-mail -> senha
- Cadastro em 2 etapas
- Token JWT persistido em localStorage na chave jm.jwt

### Inscrição (Pipefy)

- Página dedicada em `inscricao.html` com iframe do formulário Pipefy

### Catálogo

Fluxo hierárquico obrigatório:

1. Curso
2. Módulo do curso
3. Aula do módulo

- Módulos e aulas ordenados por ordem
- Aula renderizada com player YouTube

### Progresso e Certificados

- Progresso calculado por tempo real assistido
- Conclusão validada na janela final do vídeo
- Certificado liberado apenas com 100% do curso concluído

### Perfil

- Usuário altera apenas o próprio perfil
- Papel ALUNO não pode se auto-promover pela interface

## Endpoints Consumidos

- POST /auth/login
- POST /usuarios
- GET /auth/me
- POST /auth/logout
- GET /cursos
- GET /modulos
- GET /aulas
- PUT /usuarios/{id}

## Documentação

- Histórico técnico completo: [docs/HISTORICO_FRONTEND.md](docs/HISTORICO_FRONTEND.md)
- Guia rápido local do frontend: [frontend/README.md](frontend/README.md)
- Prompt de escopo frontend: [PROMPT_FRONTEND_REPO_SEPARADO.md](PROMPT_FRONTEND_REPO_SEPARADO.md)
