import { useState, useEffect } from "react";

const C = {
  deep: "#1E1245", purple: "#2D1B69", mid: "#4A2C8F", lilac: "#7C5CBF",
  soft: "#B39DDB", ghost: "#EDE7F6", snow: "#F8F6FF", white: "#FFFFFF",
  success: "#4CAF82", warn: "#F59E0B", danger: "#EF4444", text: "#1A0F3C", muted: "#6B5B8C",
};

function Card({ children, style = {} }) {
  return <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.ghost}`, padding: "20px 24px", ...style }}>{children}</div>;
}
function Badge({ label, color = C.lilac }) {
  return <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: color + "22", color, display: "inline-block" }}>{label}</span>;
}
function Btn({ children, variant = "primary", onClick, style = {} }) {
  const styles = { primary: { background: C.lilac, color: C.white, border: "none" }, outline: { background: "transparent", color: C.lilac, border: `1.5px solid ${C.lilac}` } };
  return <button onClick={onClick} style={{ ...styles[variant], borderRadius: 8, padding: "8px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, ...style }}>{children}</button>;
}

const icons = {
  clock: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  trending: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  equipes: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  relatorios: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
};

function formatTime(segundos) {
  if (typeof segundos !== 'number' || isNaN(segundos) || segundos < 0) segundos = 0;
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  return `${h}h ${m}min`;
}

const relatorioConfig = [
  { id: "maior-tempo", titulo: "Contas c/ maior tempo de atividade", icone: icons.clock, descricao: "Top 10 atividades com maior duração acumulada" },
  { id: "comparativo-porte", titulo: "Comparativo por porte", icone: icons.trending, descricao: "Desempenho por porte de empresa" },
  { id: "comparativo-atividade", titulo: "Comparativo por atividade principal", icone: icons.trending, descricao: "Performance por ramo de atividade" },
  { id: "analise-colaborador", titulo: "Análise por colaborador", icone: icons.equipes, descricao: "Produtividade individual detalhada" },
  { id: "analise-equipe", titulo: "Análise por equipe", icone: icons.equipes, descricao: "Comparativo de performance entre equipes" },
  { id: "analise-supervisao", titulo: "Análise por supervisão", icone: icons.relatorios, descricao: "Visão consolidada por supervisão" },
];

function RelatorioView({ tipo }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setFetchError(false);
    fetch(`/api/relatorios/${tipo}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setLoading(false); setFetchError(true); });
  }, [tipo]);

  if (loading) return <div style={{ padding: 20, color: C.muted, textAlign: "center" }}>Carregando...</div>;
  if (fetchError) return <div style={{ padding: 20, color: C.danger, textAlign: "center" }}>Erro ao carregar relatório.</div>;
  if (!data || data.length === 0) return <div style={{ padding: 20, color: C.muted, textAlign: "center" }}>Nenhum dado disponível.</div>;

  const keys = Object.keys(data[0]);

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead style={{ background: C.snow }}>
          <tr>
            {keys.map(k => (
              <th key={k} style={{ textAlign: "left", padding: "10px 14px", color: C.muted, fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `1px solid ${C.ghost}`, whiteSpace: "nowrap" }}>{k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.id || row._id || i} style={{ borderBottom: `1px solid ${C.snow}` }}
              onMouseEnter={e => e.currentTarget.style.background = C.snow}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              {keys.map(k => (
                <td key={k} style={{ padding: "10px 14px", color: C.text, whiteSpace: "nowrap" }}>
                  {typeof row[k] === 'number' && k.includes('perc') ? `${row[k]}%` :
                   typeof row[k] === 'number' && k.includes('tempo') ? formatTime(row[k]) :
                   typeof row[k] === 'number' ? row[k].toLocaleString() : String(row[k])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Relatorios() {
  const [selected, setSelected] = useState(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {!selected && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
          {relatorioConfig.map(t => (
            <Card key={t.titulo} style={{ cursor: "pointer", display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start" }}
              onClick={() => setSelected(t)}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.lilac; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.ghost; }}>
              <span style={{ color: C.lilac }}>{t.icone}</span>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{t.titulo}</div>
              <div style={{ fontSize: 11, color: C.muted }}>{t.descricao}</div>
              <Badge label="Ver relatório" color={C.lilac} />
            </Card>
          ))}
        </div>
      )}

      {selected && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <button onClick={() => setSelected(null)}
              style={{ background: "none", border: `1px solid ${C.ghost}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: C.muted, fontWeight: 600, fontSize: 12 }}>
              ← Voltar
            </button>
            <span style={{ color: C.lilac }}>{selected.icone}</span>
            <span style={{ fontWeight: 700, fontSize: 16, color: C.text }}>{selected.titulo}</span>
          </div>
          <Card>
            <RelatorioView tipo={selected.id} />
          </Card>
        </div>
      )}
    </div>
  );
}
