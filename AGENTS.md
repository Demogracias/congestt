# ConGestt — Session Memory

## Goal
- Manter o sistema ConGestt operacional com funcionalidades completas de gestão de equipes, empresas, planner, contábil e dashboard.

## Progress
### Done
- **Sprint 7 (Auth & Networking):** JWT real (jsonwebtoken), bcrypt password hashing, middleware JWT protegendo todas as rotas /api/* (exceto login/register), bind 0.0.0.0 com IP da LAN, fetch monkey-patch com token automático + redirect 401
- **Critical bug fixes:** member-ID vs user-ID (filtro por email prefix), deadline off-by-one (end-of-day), criarRecorrencias fire-and-forget (.catch), dashboard fake percentages (short-circuit), side-effect em TaskDetailModal, `Persistence.ts` race condition (write queue)
- **Audit integration:** auth (login/register), empresas (crud), planner (create/start/pause/complete) auditados
- **UX improvements:** loading states (submitting), empty states (table/list), form validation (data fim ≥ data início)
- **Sprint 6 (Compliance & LGPD):** AuditService, LgpdService (consentimento, anonimização), Config.jsx com abas Perfil/Auditoria/LGPD
- **Reset de features concluído:** Todos os módulos reformulados conforme especificação
- **Sprint 8 (Production Hardening):** Persistence.ts lança erros em vez de engolir; todos os `add/update/delete` com `await`; `crypto.randomUUID()` em todos os IDs; bcrypt assíncrono em todo AuthService; JWT secret gerado automaticamente via `crypto.randomBytes(32)` e salvo em `data/.jwt_secret`; CORS configurado com opções via env `CORS_ORIGIN`; rate limiting no login (10 tentativas/15min); ErrorBoundary + ToastProvider no frontend; PromptModal substitui `prompt()` nativo; `alert()` substituído por `toast()` em todas as páginas; Registration keys removidas do frontend (servem apenas do backend); LGPD realmente anonimiza dados (sobrescreve email/password/role); app.listen com error handler EADDRINUSE + handlers globais `uncaughtException` e `unhandledRejection`; servidor bind via env `HOST`; subatividades loop com try/catch; criarRecorrencias não herma mais `onTime`, `alertaEnviado` do pai

### Empresas (Cadastro de Empresas)
- Consulta automática de CNPJ via mock da Receita Federal (razão social, porte, atividade)
- Vinculação automática de filiais ao cadastrar matriz
- Atividade com 3 filtros fixos: Indústria, Serviço, Comércio
- Grupo Econômico com autocomplete e criação in-line
- Tipo de Fechamento: Mensal, Bimestral, Trimestral, Semestral, Anual, Sem Movimento
- Campo Dia do Fechamento (1-31)
- Editar e Excluir empresas
- Filtros de busca: por texto, atividade, equipe, grupo econômico

### Equipes
- Supervisor selecionado a partir da lista de usuários cadastrados
- Inclusão de membros a partir dos usuários cadastrados
- Editar e Excluir equipes
- Remover membros individualmente

### Dashboard (reformulado)
- Cards por equipe com scroll horizontal: nome, total empresas, matrizes, porte predominante
- Cards clicáveis como filtro para a tabela inferior
- Tabela empresas × meses com ano (últimos 5 anos)
- Percentual de conclusão por mês vinculado ao planner
- Cores: verde (100%), amarelo (0.01%-99.99%), vermelho (0%)
- Clique no nome da empresa → redireciona para Gestão Contábil (corrigido mapeamento de página)
- Performance por porte: % concluídas no prazo sobre total concluídas por porte
- Concluídas no mês (data atual), Equipe do mês (gerência/supervisão)

### Gestão Contábil
- Renomeado de "Módulo Contábil" para "Gestão Contábil"
- Movido para segundo no menu lateral
- Removidos saldos das contas
- Adicionadas colunas de meses do ano
- Filtros: empresa, equipe, ano (últimos 5 anos)
- Status da conta no mês: Não iniciado (vermelho), Em andamento (amarelo), Concluída (verde)
- Vinculado ao planner (tarefa concluída = conta concluída)
- Upload de plano de contas por CSV (individual por empresa)
- Download de modelo de layout CSV

### Planner (reformulado)
- Visualizações: Lista (Kanban), Grupo (por empresa), Calendário
- Tarefas com: vínculo de empresa, conta contábil, período/competência
- Múltiplos executores por tarefa
- Timer com início, pausa (com justificativa), retomada e conclusão
- Tipos de pausa: normal (com justificativa e vínculo opcional) e fim de expediente
- Bloco de anotações por tarefa
- Histórico da tarefa (início, pausas, retomadas, conclusão)
- Prazo não alterável após início (gera atraso automaticamente)
- Recorrência: semanal, mensal, anual
- Média de tempo por quantidade de executores

### Técnico
- Backend compilado (TypeScript → CommonJS)
- Frontend buildado (Vite)
- Persistência em JSON files em `backend/data/`
- Servidor único Express na porta 3001

### Sessão Atual (Jun/2026) — Fase 2 Concluída  
- **Modo dev**: Vite dev server (`http://localhost:3000`) com proxy para backend (`http://localhost:3001`)  
- **Produção**: `start.bat` → `http://localhost:3001` (Express serve frontend buildado + API)  
- **Login**: admin@congestt.com / 123
- **Auth**: JWT real com 24h de expiração; senhas hasheadas com bcrypt; middleware aplicado a todas as rotas `/api/*` exceto `/api/auth/login` e `/api/auth/register`
- **Rede**: Servidor bind via `HOST` env (default `0.0.0.0`) — acessível via LAN pelo IP exibido no console
- **Rate limiting**: 10 tentativas de login a cada 15 minutos (express-rate-limit)
- **JWT secret**: Gerado automaticamente via `crypto.randomBytes(32)` e salvo em `data/.jwt_secret` na primeira execução; sobrescrito por env `JWT_SECRET`
- **Seed data**: Equipes usam IDs "1"/"2" fixos (compatível com users seed e data files existentes); novos usuários usam `crypto.randomUUID()` via `generateId()`
- **Seed config**: Seed users (admin/user) mantêm IDs fixos "1"/"2" por compatibilidade com dados existentes; apenas novos registros (`register`) usam `crypto.randomUUID()`

## Key Decisions
- Servidor único (Express na porta 3001) serve frontend buildado + API, eliminando dependência do Vite dev server em produção
- Persistência em JSON file: leve, sem dependência de banco, substituível por PostgreSQL no futuro
- Prefixo `/api` para todas as rotas do backend; compatível com Vite proxy (dev) e com Express static (produção)
- `crypto.randomUUID()` usado em todo o backend em vez de `Math.random().toString(36).substr(2, 9)` para IDs seguros
- Bcrypt assíncrono em todo AuthService (não bloqueia event loop)
- `Persistence.writeQueue` com propagação de erros (não engole silenciosamente)

## Next Steps
- Substituir Persistence<T> por queries SQL (PostgreSQL)
- Adicionar testes automatizados (E2E com Playwright ou Cypress)
- Empacotar single EXE com `pkg` para distribuição standalone
- Implementar drag-and-drop sorting nas colunas Kanban
- Adicionar ações em lote (selecionar múltiplas tarefas → alterar status/responsável)
- Polir visual da aba Calendário (estilo MS Planner)
- Importar cor da paleta externa (`const C = {...}`) em vez de repetir em cada página

## Critical Context
- Servidor: `start.bat` → `http://localhost:3001`
- Login: admin@congestt.com / 123
- Chaves de registro: apenas no backend (`auth.service.ts`), removidas do frontend por segurança
- Dados persistem em `data/*.json` (projeto raiz, unificado)
- JWT com 24h de expiração, middleware aplicado em `/api/*` exceto `/api/auth/login` e `/api/auth/register`
- Senhas hasheadas com bcryptjs (assíncrono, migração automática na primeira inicialização)
- Servidor bind `0.0.0.0` com IP da LAN exibido no console
- `Persistence.ts` usa write queue para evitar race conditions em escrita concorrente
- `generateId()` exportado de `persistence.ts` — usa `crypto.randomUUID()`
- ErrorBoundary + ToastProvider wrappam toda a aplicação React
- PromptModal substitui `prompt()` nativo — sem bloqueios de UI
- `app.listen` com error handler para EADDRINUSE + `process.on('uncaughtException')` e `unhandledRejection`
- LGPD: anonimização agora sobrescreve email, senha e role do usuário com dados irreversíveis
