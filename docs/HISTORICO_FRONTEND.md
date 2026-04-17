# Frontend Plataforma de Mentoria (Handoff Completo)

Este documento concentra o contexto do projeto, decisões tomadas durante o desenvolvimento, regras de negócio implementadas e guia de transferência para outro repositório.

## 1. Objetivo do frontend

Aplicação web (HTML/CSS/JS puro) para consumir a API JWT do backend e entregar:

- Autenticação com login em 2 etapas e cadastro de usuário.
- Catálogo de cursos, módulos e aulas com player YouTube.
- Progresso real de aprendizagem por vídeo.
- Certificados liberados por conclusão total do curso.
- Perfil do usuário autenticado (self-profile).

## 2. Contexto do chat e evolução do produto

Resumo das decisões e entregas relevantes realizadas ao longo do chat:

1. Começou com foco em API/coleção de endpoints (Postman/Insomnia).
2. Evoluiu para frontend de catálogo (cursos > módulos > aulas > player).
3. Foi adicionada segurança JWT end-to-end no backend e frontend.
4. Frontend foi separado de `src/main/resources/static` para pasta própria `frontend/`.
5. Interface foi refinada para estilo do protótipo, fonte Nunito e assets reais.
6. Regras de UX/negócio foram reforçadas:
	 - Perfil apenas do usuário logado (sem CRUD geral de usuários na tela).
	 - Papel `ALUNO` não pode ser alterado pelo próprio ALUNO.
	 - Navegação de conteúdo por módulo primeiro, depois aulas.
	 - Aulas com thumbnail YouTube, título, descrição e navegação anterior/próxima.
	 - Ordenação de módulos/aulas por `ordem` (numérica).
7. Progresso de aula deixou de ser "por clique" e passou a ser por reprodução real.
8. Corrigidos problemas de:
	 - Primeiro carregamento do player.
	 - Exibição de nome de módulo.
	 - Falso 100% quando IDs eram reaproveitados.
9. Implementado "retomar de onde parou" no vídeo, inclusive após sair e voltar.
10. Implementado sync de conteúdo em "quase tempo real" por polling (6s).
11. Navbar ficou fixa/visível, responsiva com menu hambúrguer no mobile.
12. Feedbacks técnicos ruidosos de status foram suprimidos para UX mais limpa.

## 3. Estrutura final de arquivos

```
frontend/
	assets/
		img-01-course.webp
		login-prototipo.png (opcional, recomendado)
	styles/
		catalogo-base.css
		catalogo-auth.css
		catalogo-platform.css
		catalogo-content.css
		catalogo-responsive.css
	auth.css
	auth.html
	auth.js
	catalogo.css
	catalogo.html
	catalogo.js
	src/
		config/
			constants.js
		core/
			context.js
			feedback.js
			normalizers.js
			session.js
			youtube.js
		services/
			api.js
			storage.js
		features/
			auth.js
			bootstrap.js
			catalog.js
			player.js
			realtime.js
		main.js
	README.md
```

### Papel de cada arquivo

- `catalogo.html`: tela principal (login/cadastro + plataforma).
- `catalogo.css`: entrypoint de estilos que importa os módulos CSS por responsabilidade.
- `catalogo.js`: entrypoint mínimo (carrega `src/main.js` como módulo).
- `styles/*.css`: separação de estilos em base, autenticação, plataforma, conteúdo e responsividade.
- `src/config`: constantes globais e chaves de armazenamento.
- `src/core`: contexto da aplicação (estado/DOM), feedback de UI, utilitários compartilhados e controle de sessão.
- `src/services`: infraestrutura (HTTP e persistência local).
- `src/features`: regras de domínio e fluxo da aplicação (auth, catálogo, player, realtime, bootstrap).
- `auth.*`: tela auxiliar de teste de JWT (não é a principal da plataforma).

## 4. Arquitetura em camadas

O frontend foi refatorado para separação de responsabilidades seguindo camadas de engenharia:

1. `config`: constantes e políticas globais.
2. `core`: estado compartilhado, referências de DOM, sessão e feedback visual.
3. `services`: comunicação com API e armazenamento local.
4. `features`: regras de negócio e casos de uso por domínio.
5. `entrypoint`: inicialização e orquestração do app.

### Mapa de responsabilidades por módulo

- `src/features/auth.js`: login, cadastro, logout, modos de autenticação e perfil do usuário.
- `src/features/catalog.js`: renderização, seleção curso/módulo/aula, ordenação e KPIs.
- `src/features/player.js`: integração YouTube, progresso real, conclusão e retomada.
- `src/features/realtime.js`: carregamento inicial e polling de sincronização.
- `src/features/bootstrap.js`: binding de eventos e startup da aplicação.

### Estado principal (`state`) e runtime (`playerRuntime`)

- `state`: sessão, catálogo, seleção corrente, métricas e controle de sincronização.
- `playerRuntime`: estado efêmero do player e timers de rastreamento.

- Os dados continuam com o mesmo comportamento funcional da versão anterior, porém distribuídos por camadas para reduzir acoplamento.

### Persistência local (localStorage)

- `jm.jwt`: token JWT.
- `jm.apiBaseUrl`: URL base opcional da API.
- `jm.aulaWatchMetrics`: progresso detalhado por aula.
- `jm.watchedAulas`: legado (compatibilidade antiga).

## 5. Regras de negócio implementadas

## 5.1 Autenticação e cadastro

- Login em 2 etapas:
	- Etapa 1: e-mail.
	- Etapa 2: senha.
- Cadastro em 2 etapas:
	- Etapa 1: e-mail.
	- Etapa 2: nome, telefone, senha e confirmação.
- Cadastro envia `role: ALUNO` para API (regra interna), porém essa informação não é exibida como texto de UX no formulário.
- Após cadastro bem-sucedido, usuário é direcionado ao fluxo de login.

## 5.2 Perfil e papéis

- Tela de perfil trabalha apenas com o usuário autenticado.
- Se usuário for `ALUNO`, campo de role fica bloqueado na UI.
- Atualização de perfil usa payload completo exigido pelo backend (`nome`, `telefone`, `email`, `role`, `senha`).

## 5.3 Catálogo (curso, módulo, aula)

- Fluxo hierárquico obrigatório:
	1. Seleciona curso.
	2. Seleciona módulo do curso.
	3. Seleciona aula do módulo.
- Módulos e aulas são ordenados por `ordem` numérica.
- IDs são normalizados para número para evitar bugs de comparação `string` vs `number`.

## 5.4 Progresso e conclusão de aula

- Progresso baseado em tempo real de reprodução do player YouTube.
- Conclusão (100%) só ocorre quando o vídeo de fato chega à janela de fim.
- Antes disso, progresso máximo é 99%.
- KPI e certificados usam essas métricas reais.
- Métrica salva:
	- `watchedSeconds`
	- `durationSeconds`
	- `lastPositionSeconds`
	- `progressPercent`
	- `completed`
	- `completedAt`

## 5.5 Retomar vídeo de onde parou

- Ao abrir uma aula não concluída, player inicia do `lastPositionSeconds` salvo.
- Snapshot é persistido também quando:
	- troca de aula/curso,
	- logout,
	- aba fica oculta (`visibilitychange`),
	- página fecha (`beforeunload`).

## 5.6 Certificados

- Certificado libera apenas quando todas as aulas do curso estão concluídas (`completed`).

## 5.7 Realtime (quase tempo real)

- Atualização automática por polling a cada 6s:
	- `GET /cursos`
	- `GET /modulos`
	- `GET /aulas`
- Mudança detectada por assinatura de conteúdo (`contentSignature`).
- Não usa WebSocket/SSE atualmente.

## 6. Regras de UX/UI implementadas

- Navbar lateral mais destacada e fixa.
- No mobile, menu lateral vira drawer com botão hambúrguer + overlay.
- Ícones e estado ativo com paleta roxa (alinhamento ao protótipo).
- Status line mantém erros e informações úteis.
- Feedbacks técnicos ruidosos foram suprimidos (ex.: "video pronto...").

## 7. Integração com backend (contratos esperados)

## 7.1 Base URL da API

Ordem de resolução:

1. `window.API_BASE_URL`
2. `localStorage.getItem("jm.apiBaseUrl")`
3. Fallback: `http://localhost:8081`

## 7.2 Endpoints usados no frontend

Públicos:

- `POST /auth/login`
- `POST /usuarios` (cadastro)

Protegidos (Bearer JWT):

- `GET /auth/me`
- `POST /auth/logout`
- `GET /cursos`
- `GET /modulos`
- `GET /aulas`
- `PUT /usuarios/{id}` (perfil)

## 7.3 CORS

Backend precisa permitir origem do frontend separado. No estado atual, backend já foi configurado para aceitar CORS amplo.

## 8. Como executar

1. Suba o backend (porta `8081`).
2. Sirva a pasta `frontend/` com servidor estático.

Exemplo com Node:

```bash
npx serve frontend -l 5500
```

Abrir:

- `http://localhost:5500/catalogo.html`

## 9. Checklist para transferir este frontend para outro repositório

1. Copiar todos os arquivos da pasta `frontend/`.
2. Garantir que os assets estejam presentes:
	 - `assets/img-01-course.webp`
	 - `assets/login-prototipo.png` (se quiser o visual completo do login).
3. Confirmar que a URL da API no ambiente de destino está correta.
4. Validar CORS no backend de destino.
5. Testar fluxos críticos:
	 - login,
	 - cadastro,
	 - abertura de curso/módulo/aula,
	 - progresso e conclusão,
	 - retomar vídeo,
	 - certificados,
	 - perfil,
	 - responsividade mobile e menu hambúrguer.

## 10. Limitações conhecidas e melhorias futuras

- Realtime atual é polling, não push.
- Progresso depende da API do YouTube (variações de navegador podem afetar precisão em casos extremos).
- Métricas de progresso ficam no navegador local do usuário (localStorage).

Melhorias possíveis:

1. Migrar realtime para SSE/WebSocket.
2. Persistir progresso no backend (sincronização multi-dispositivo).
3. Adicionar suíte de testes E2E (Playwright/Cypress).

## 11. Resumo executivo (para handoff rápido)

Este frontend está pronto para uso com backend JWT, possui UX responsiva, regras de negócio aplicadas para trilha educacional e controle de progresso real por vídeo com retomada do ponto assistido. A documentação acima foi preparada para permitir migração da pasta `frontend/` para outro repositório sem perda de contexto técnico e funcional.
