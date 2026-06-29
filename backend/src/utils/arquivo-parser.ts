interface ArquivoProcessado {
  linhas: Record<string, string>[];
  errors: string[];
}

export function parseExcelConteudo(conteudo: string): ArquivoProcessado {
  const result: ArquivoProcessado = { linhas: [], errors: [] };
  try {
    const linhas = conteudo.split('\n').filter(l => l.trim());
    if (linhas.length < 2) {
      result.errors.push('Arquivo deve conter cabeçalho + dados');
      return result;
    }

    const headers = linhas[0].split('\t').map(h => h.trim().toLowerCase());
    for (let i = 1; i < linhas.length; i++) {
      const cols = linhas[i].split('\t').map(c => c.trim());
      if (cols.length !== headers.length) {
        result.errors.push(`Linha ${i + 1}: número de colunas inválido`);
        continue;
      }
      const linha: Record<string, string> = {};
      headers.forEach((h, idx) => { linha[h] = cols[idx]; });
      result.linhas.push(linha);
    }
  } catch (e) {
    console.error('[ArquivoParser] Erro ao processar arquivo:', e);
    result.errors.push('Erro ao processar arquivo');
  }
  return result;
}

export function parseXMLConteudo(conteudo: string): ArquivoProcessado {
  const result: ArquivoProcessado = { linhas: [], errors: [] };
  try {
    const linhas = conteudo.split('\n').filter(l => l.trim());
    let inRow = false;
    let currentRow: Record<string, string> = {};

    for (const linha of linhas) {
      if (linha.includes('<row>') || linha.includes('<Row>')) {
        inRow = true;
        currentRow = {};
      } else if (linha.includes('</row>') || linha.includes('</Row>')) {
        if (Object.keys(currentRow).length > 0) {
          result.linhas.push(currentRow);
        }
        inRow = false;
      } else if (inRow) {
        const match = linha.match(/<(\w+)>(.*?)<\/\1>/);
        if (match) {
          currentRow[match[1].toLowerCase()] = match[2];
        }
      }
    }
  } catch (e) {
    console.error('[ArquivoParser] Erro ao processar XML:', e);
    result.errors.push('Erro ao processar XML');
  }
  return result;
}
