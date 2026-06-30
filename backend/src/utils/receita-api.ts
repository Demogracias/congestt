import logger from './logger';

interface ReceitaData {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  porte: 'Grande' | 'Médio' | 'Pequeno' | 'Micro';
  atividade: string;
  matrizCnpj?: string;
  naturezaJuridica: string;
}

const cache = new Map<string, { data: ReceitaData; timestamp: number }>();
const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000;

const FILIAIS_DB: Record<string, string[]> = {
  '12345678000190': ['98765432000111'],
};

const PORTE_MAP: Record<string, 'Grande' | 'Médio' | 'Pequeno' | 'Micro'> = {
  'GRANDE': 'Grande',
  'MEDIO': 'Médio',
  'MEIO': 'Médio',
  'PEQUENO': 'Pequeno',
  'MICRO': 'Micro',
  'MICROEMPRESA': 'Micro',
  'DEMAIS': 'Médio',
};

function mapPorte(porte: string): 'Grande' | 'Médio' | 'Pequeno' | 'Micro' {
  if (!porte) return 'Médio';
  const upper = porte.toUpperCase().replace(/[^A-Z]/g, '');
  return PORTE_MAP[upper] || 'Médio';
}

function extractAtividade(data: any): string {
  const cnae = data.cnae_fiscal_descricao;
  if (cnae && typeof cnae === 'string' && cnae.trim()) return cnae.trim();
  const principal = data.atividade_principal;
  if (principal && Array.isArray(principal) && principal.length > 0 && principal[0].text) return principal[0].text;
  return 'Não informada';
}

const BRASIL_API = 'https://brasilapi.com.br/api/cnpj/v1';

export async function consultarCNPJ(cnpj: string): Promise<ReceitaData | null> {
  const clean = cnpj.replace(/\D/g, '');
  if (clean.length !== 14) return null;

  const cached = cache.get(clean);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${BRASIL_API}/${clean}`, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const name = data.nome_fantasia || data.razao_social?.split(' ')[0] || '';
      const receitaData: ReceitaData = {
        cnpj: data.cnpj || formatCNPJ(clean),
        razaoSocial: data.razao_social || '',
        nomeFantasia: name,
        porte: mapPorte(data.porte || data.porte_descricao || ''),
        atividade: extractAtividade(data),
        naturezaJuridica: data.natureza_juridica || '',
        matrizCnpj: data.matriz_cnpj || undefined,
      };
      if (receitaData.razaoSocial) {
        cache.set(clean, { data: receitaData, timestamp: Date.now() });
      }
      return receitaData.razaoSocial ? receitaData : null;
    }
  } catch (err) {
    logger.warn({ err }, 'Erro ao consultar CNPJ, usando mock');
  }

  const mockData = MOCK_DATABASE[clean] || null;
  if (mockData) {
    cache.set(clean, { data: mockData, timestamp: Date.now() });
  }
  return mockData;
}

export async function consultarFiliais(cnpjMatriz: string): Promise<ReceitaData[]> {
  const clean = cnpjMatriz.replace(/\D/g, '');
  const filiais = FILIAIS_DB[clean] || [];
  const results: ReceitaData[] = [];
  for (const f of filiais) {
    const data = await consultarCNPJ(f);
    if (data) results.push(data);
  }
  return results;
}

function formatCNPJ(cnpj: string): string {
  const c = cnpj.replace(/\D/g, '');
  return `${c.slice(0,2)}.${c.slice(2,5)}.${c.slice(5,8)}/${c.slice(8,12)}-${c.slice(12,14)}`;
}

const MOCK_DATABASE: Record<string, ReceitaData> = {
  '12345678000190': {
    cnpj: '12.345.678/0001-90',
    razaoSocial: 'MISA Indústria Ltda',
    nomeFantasia: 'MISA',
    porte: 'Grande',
    atividade: 'Indústria',
    naturezaJuridica: 'Sociedade Empresária Limitada',
  },
  '98765432000111': {
    cnpj: '98.765.432/0001-11',
    razaoSocial: 'NIBRA Química S/A',
    nomeFantasia: 'NIBRA',
    porte: 'Grande',
    atividade: 'Indústria',
    naturezaJuridica: 'Sociedade Anônima',
    matrizCnpj: '12.345.678/0001-90',
  },
  '55444333000122': {
    cnpj: '55.444.333/0001-22',
    razaoSocial: 'Química Central Ltda',
    nomeFantasia: 'QUÍMICA',
    porte: 'Médio',
    atividade: 'Indústria',
    naturezaJuridica: 'Sociedade Empresária Limitada',
  },
  '11222333000144': {
    cnpj: '11.222.333/0001-44',
    razaoSocial: 'Calbras Serviços ME',
    nomeFantasia: 'CALBRAS',
    porte: 'Micro',
    atividade: 'Serviços',
    naturezaJuridica: 'Microempresa',
  },
};
