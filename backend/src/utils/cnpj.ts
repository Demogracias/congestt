export function isValidCNPJ(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) return false;

  const calc = (base: number[], weights: number[]) => {
    const sum = base.reduce((acc, d, i) => acc + d * weights[i], 0);
    const rem = sum % 11;
    return rem < 2 ? 0 : 11 - rem;
  };

  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const d = digits.split('').map(Number);
  const d1 = calc(d.slice(0, 12), w1);
  if (d1 !== d[12]) return false;

  const d2 = calc(d.slice(0, 13), w2);
  if (d2 !== d[13]) return false;

  return true;
}

export function formatCNPJ(cnpj: string): string {
  const d = cnpj.replace(/\D/g, '');
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`;
}
