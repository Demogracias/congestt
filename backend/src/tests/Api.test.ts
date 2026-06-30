import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const BASE = 'http://localhost:3001';
let token: string;

beforeAll(async () => {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@congestt.com', password: '123' }),
  });
  expect(res.status).toBe(200);
  const data: any = await res.json();
  token = data.token as string;
  expect(token).toBeTruthy();
});

describe('API — Autenticação', () => {
  it('login com senha errada retorna 401', async () => {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@congestt.com', password: 'wrong' }),
    });
    expect(res.status).toBe(401);
  });

  it('rota sem token retorna 401', async () => {
    const res = await fetch(`${BASE}/api/empresas`);
    expect(res.status).toBe(401);
  });
});

describe('API — Empresas', () => {
  let createdId: string;

  afterAll(async () => {
    if (createdId) {
      await fetch(`${BASE}/api/empresas/${createdId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    }
  });

  it('lista empresas', async () => {
    const res = await fetch(`${BASE}/api/empresas`, { headers: { Authorization: `Bearer ${token}` } });
    expect(res.status).toBe(200);
    const data: any = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(4);
  });

  it('cria empresa com dados válidos', async () => {
    const res = await fetch(`${BASE}/api/empresas`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        cnpj: '11.111.111/0001-91', razaoSocial: 'Teste Ltda', apelido: 'TESTE',
        porte: 'Pequeno', atividade: 'Serviço', equipe: 'Alpha', tipo: 'Matriz',
        tipoFechamento: 'Mensal', diaFechamento: 10,
      }),
    });
    expect(res.status).toBe(201);
    const data: any = await res.json();
    expect(data.id).toBeTruthy();
    expect(data.apelido).toBe('TESTE');
    createdId = data.id;
  });
});

describe('API — Contábil', () => {
  it('grade retorna contas para empresaId', async () => {
    const res = await fetch(`${BASE}/api/contabil/grade?empresaId=1&ano=2026`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const data: any = await res.json();
    expect(data.grade).toBeDefined();
    expect(Array.isArray(data.grade)).toBe(true);
    expect(data.grade.length).toBeGreaterThanOrEqual(12);
    expect(data.grade[0].conta).toBeDefined();
    expect(data.grade[0].meses).toHaveLength(12);
  });

  it('contas lista sem filtro retorna todas', async () => {
    const res = await fetch(`${BASE}/api/contabil/contas`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const data: any = await res.json();
    expect(data.length).toBe(12);
  });
});

describe('API — Dashboard', () => {
  it('cards-por-equipe retorna dados', async () => {
    const res = await fetch(`${BASE}/api/dashboard/cards-por-equipe`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const data: any = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(2);
    expect(data[0].equipeNome).toBeTruthy();
  });

  it('grade-empresas retorna matriz mensal', async () => {
    const res = await fetch(`${BASE}/api/dashboard/grade-empresas?ano=2026&equipe=Todas`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const data: any = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(4);
  });
});

describe('API — Planner', () => {
  let tarefaId: string;

  afterAll(async () => {
    if (tarefaId) {
      await fetch(`${BASE}/api/planner/${tarefaId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    }
  });

  it('cria tarefa', async () => {
    const res = await fetch(`${BASE}/api/planner`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        titulo: 'Teste API', descricao: 'Teste integração',
        responsaveis: ['1'], meses: ['2026-08'], empresaId: '1',
        contaContabilIds: ['c3'], dataInicio: '2026-08-01', dataFim: '2026-08-31',
      }),
    });
    expect(res.status).toBe(201);
    const data: any = await res.json();
    expect(data.id).toBeTruthy();
    expect(data.status).toBe('pending');
    tarefaId = data.id;
  });

  it('start altera status para running', async () => {
    if (!tarefaId) return;
    const res = await fetch(`${BASE}/api/planner/${tarefaId}/start`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ usuarioId: '1' }),
    });
    expect(res.status).toBe(200);
    const data: any = await res.json();
    expect(data.status).toBe('running');
  });

  it('pause altera status para paused', async () => {
    if (!tarefaId) return;
    const res = await fetch(`${BASE}/api/planner/${tarefaId}/pause`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ justificativa: 'Teste de pausa', tipo: 'pausa' }),
    });
    expect(res.status).toBe(200);
    const data: any = await res.json();
    expect(data.status).toBe('paused');
    expect(data.pausas[0].justificativa).toBe('Teste de pausa');
  });

  it('complete altera status para completed', async () => {
    if (!tarefaId) return;
    const res = await fetch(`${BASE}/api/planner/${tarefaId}/complete`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const data: any = await res.json();
    expect(data.status).toBe('completed');
    expect(data.concluidaEm).toBeTruthy();
  });
});
