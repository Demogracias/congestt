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

export async function consultarCNPJ(cnpj: string): Promise<ReceitaData | null> {
  const clean = cnpj.replace(/\D/g, '');
  const cached = cache.get(clean);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  const data = MOCK_DATABASE[clean] || null;
  if (data) {
    cache.set(clean, { data, timestamp: Date.now() });
  }
  return data;
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
