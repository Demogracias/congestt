import client from 'prom-client';

const register = new client.Registry();
client.collectDefaultMetrics({ register });

export const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total de requisições HTTP',
  labelNames: ['method', 'path', 'status'],
  registers: [register],
});

export const httpErrorCounter = new client.Counter({
  name: 'http_errors_total',
  help: 'Total de erros HTTP',
  labelNames: ['method', 'path', 'status'],
  registers: [register],
});

export const taskTimer = new client.Histogram({
  name: 'task_duration_seconds',
  help: 'Duração das tarefas em segundos',
  labelNames: ['status'],
  buckets: [60, 300, 600, 1800, 3600, 7200, 14400, 28800, 86400],
  registers: [register],
});

export const activeRequests = new client.Gauge({
  name: 'http_requests_active',
  help: 'Requisições ativas no momento',
  registers: [register],
});

export function getMetrics() {
  return register.metrics();
}
