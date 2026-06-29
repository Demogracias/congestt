# Nota de Acompanhamento - Mudanças Planner & Contábil

## 1. Formulário de Nova Tarefa (Planner)
- [x] **Múltiplas Contas Contábeis**: Campo `contaContabilIds` (array) com checkboxes. Seleção hierárquica: sintética → analíticas filhas auto-selecionadas.
- [x] **Seleção de Competência**: Duas listas minimizáveis (Anos + Meses) com checkboxes, multi-seleção de meses por ano.
- [x] **Backward compatibility**: Interface `Atividade` mantém `contaContabilId` (deprecated) para leitura de dados antigos.

## 2. Interface e Ações (Todas as abas)
- [x] **Botões de ação** (Iniciar/Pausar/Retomar/Concluir/Anotar) presentes em cards das abas Lista, Grupo e Calendário.
- [x] **Visualização detalhada (read-only)**: `TaskDetailModal` acionado ao clicar no card, exibindo todos os campos bloqueados.
- [x] **Histórico**: Modal exibe histórico de movimentação (início, pausas, conclusão) + anotações com autor/data.

## 3. Aba Calendário
- [x] Side panel com ação de clique nos cards → abre `TaskDetailModal`.
- [x] Subtarefa nos cards do side panel (Iniciar/Pausar/Retomar/Concluir/Anotar).
- [ ] **Melhoria visual estilo MS Planner** (pendente para próxima iteração).

## 4. Integração Módulo Contábil
- [x] Grade endpoint usa `contaContabilIds?.includes()` com fallback para `contaContabilId`.
- [x] Grade retorna `responsavelNome` por mês (nome extraído do email do usuário).
- [x] Status reflete `ativ.status`: running → Em andamento, completed → Concluída.
- [x] Auto-refresh da grade a cada 30s no frontend.
- [x] Builds (tsc + vite) compilam sem erros.

## 5. Análise de Falhas Estruturais (28/Jun/2026)

### 🔴 Falhas Críticas Corrigidas

- **[Ciclo 1] `fetchAtividades` sem `.catch()`** (`Planner.jsx:382`)
  - `fetch("/api/planner").then(r => r.json()).then(setAtividades)` — se a API retorna erro, `setAtividades` recebe objeto `{ message }` em vez de array.
  - Qualquer `.filter()`/`.map()` no render seguinte quebra a árvore React → tela branca sem possibilidade de navegação.
  - **Fix**: `.then(d => { if (Array.isArray(d)) setAtividades(d); }).catch(() => {})`

- **[Ciclo 2] `filtroMes` inconsistente** (`Planner.jsx:328,358,597`)
  - Contábil envia `mes: "Jan"` (abreviação), Planner esperava `YYYY-MM`.
  - `setFiltroMes("Jan")` + `filtroMes.slice(-2)` → `"an"` → nunca casava com `"2026-01".endsWith("-an")` → filtro silenciosamente quebrado.
  - **Fix**: conversão de abreviatura para `YYYY-MM` no handler de navegação + filtro por `===` em vez de `endsWith`.

- **[Ciclo 3] Duplicata de chave em `App.jsx`** (`App.jsx:127`)
  - `{ gestaoContabil: "contabil", gestaoContabil: "contabil" }` — mesma chave duas vezes.
  - Não quebrava mas indicava mapeamento perdido.
  - **Fix**: removido mapa desnecessário, `setActive(e.detail.page)` diretamente.

- **[Ciclo 4] `criarRecorrencias` mutação de `Date`** (`planner.service.ts:151`)
  - `dataFim` mutado in-place via `dataFim.setMonth(dataFim.getMonth() + 1)` no loop → acumulava incorretamente.
  - `dataFimOriginal: ''` em vez de preservar o valor original.
  - **Fix**: criar novos `Date` a cada iteração, preservar `dataFimOriginal` da base.

- **[Ciclo 5] `Persistence.ts` erros silenciosos** (`persistence.ts`)
  - `catch {}` vazio em `load()` e `flush()` — JSON corrompido ou falha de escrita passavam sem aviso.
  - **Fix**: `console.error` com mensagem descritiva + escrita atômica (tmp + rename).

- **[Ciclo 6] `Contabil.jsx` stale closures + fetch sem `.catch()`** (`Contabil.jsx`)
  - `plannerHandler` fechava `filtroEmpresa` e `ano` obsoletos (effect com deps vazias).
  - `fetchData()` sem `.catch()` → qualquer falha de API deixava `loading: true` eterno.
  - **Fix**: `useRef` para valores atuais, `.catch(() => [])` + `Array.isArray` checks.

- **[Ciclo 7] Filtro multi-mês quebrado no backend** (`planner.service.ts`)
  - `a.meses.includes("2026-01,2026-02")` — string concatenada nunca casava com meses individuais.
  - **Fix**: `.split(',')` + `.some(m => mesesList.includes(m))`.

- **[Ciclo 8] Null safety em listas do Planner** (`Planner.jsx:343-348`)
  - Initial load não validava que `ativs`, `emps`, `c`, `eqs` fossem arrays.
  - **Fix**: `Array.isArray(ativs) ? ativs : []` para todos os 5 estados.

### 🟡 Falhas Graves Ainda Pendentes

- [x] **`dev.bat` mata todos os `node.exe`** → usar `netstat` + `taskkill /PID` específico
- [x] **`estenderPrazo` barra extensão após iniciar** → regra de negócio contraditória
- [x] **Import CSV `contaPaiCodigo` usado como `contaPaiId`** → contas órfãs no plano de contas
- [x] **`handlePause` usa `prompt()` nativo** → bloqueante, sem UX adequada
- [x] **Contas contábeis com `empresaId: ""`** → grade exibe contas de todas as empresas
- [x] **`formatTime` não valida NaN** → pode mostrar `NaN:NaN:NaN` no timer
- [x] **Zero arquivos CSS** → 100% inline styles, dificulta manutenção e temas

### 🔵 Falhas Leves

- [x] `logo64.txt` — artefato de desenvolvimento não removido
- [x] Duas blank lines em `Planner.jsx:3-4`
- [x] `BUSINESS_RULES.md`, `DOCUMENTACAO.md`, `ACOMPANHAMENTO.md` — informações duplicadas entre 3 arquivos
- [x] `filtroMes` com `if (filtroMes)` tratando string vazia como falsy
