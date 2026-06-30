# ConGestt — Próximos Sprints

## Sprint 9 — Testes Automatizados
- **E2E** com Playwright: login → criar empresa → criar tarefa → verificar grade contábil
- **Unitários** nos services (vitest): PlannerService.pausarTimer(), AuthService.login(), etc.
- **Integração** na API: bater endpoints e validar respostas
- Pipeline CI/CD (GitHub Actions) rodando testes a cada push

## Sprint 10 — DevOps & Distribuição
- **Docker**: Dockerfile multi-stage + docker-compose.yml (app + postgres opcional)
- **Packaging**: Empacotar com `pkg` em único `.exe`
- **Variáveis de ambiente**: Validar todas no startup, `.env.example` completo
- **Backup automático**: Script que faz dump do SQLite + compacta data/ ao iniciar

## Sprint 11 — Arquitetura (Clean Code)
- **Repository pattern**: Extrair lógica de dados dos services para repositórios
- **Service layer**: Services sem dependência direta de `SqlitePersistence` (injeção de dependência)
- **Error handling**: Erros padronizados (classes `AppError`, `NotFoundError`, `ValidationError`)
- **Validação**: Zod ou Joi nos controllers (em vez de `if (!x) return res.status...`)
- **Tipagem forte**: Remover `as any` de `req.query` e similares

## Sprint 12 — Observabilidade
- **Logging estruturado**: Winston ou pino (em vez de console.log)
- **Health check**: `GET /api/health` (status DB, versão, uptime)
- **Metrics**: Contadores de requisições, erros, timer das tasks (prom-client para Prometheus)
- **Dashboard admin**: Página interna com status do sistema, fila de erros, cache

## Sprint 13 — Performance & UX
- **Drag-and-drop** no Kanban (react-beautiful-dnd ou dnd-kit)
- **Ações em lote**: Selecionar tarefas → concluir/reagendar em massa
- **Paginação** nas listas (empresas, tarefas, audit)
- **Cache**: Memorizar `getGradeEmpresas` com TTL (evita recomputar a cada 30s)
- **WebSocket**: Notificações em tempo real (tarefa atrasada, conclusão)

## Sprint 14 — Enterprise Features
- **RBAC avançado**: Permissões por recurso (não só level numérico)
- **Multi-tenancy**: Isolamento por cliente/grupo econômico
- **Audit trail exportável**: CSV/PDF do histórico
- **LGPD completa**: Portal do titular (baixar/anonimizar dados pelo próprio usuário)
- **Relatórios**: PDF com gráficos (dashboard exportável)
