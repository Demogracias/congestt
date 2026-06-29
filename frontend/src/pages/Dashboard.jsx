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

const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export default function Dashboard() {
  const [cardsEquipe, setCardsEquipe] = useState([]);
  const [grade, setGrade] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [concluidas, setConcluidas] = useState(null);
  const [equipeMes, setEquipeMes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [equipeFiltro, setEquipeFiltro] = useState("Todas");
  const [selectedEquipe, setSelectedEquipe] = useState(null);

  const curYear = new Date().getFullYear();
  const anos = Array.from({ length: 21 }, (_, i) => curYear - 10 + i);

  const fetchData = (a, eq) => {
    setLoading(true);
    const p1 = fetch("/api/dashboard/cards-por-equipe").then(r => r.json()).catch(() => []);
    const p2 = fetch(`/api/dashboard/grade-empresas?ano=${a}&equipe=${eq}`).then(r => r.json()).catch(() => []);
    const p3 = fetch("/api/dashboard/performance-por-porte").then(r => r.json()).catch(() => []);
    const p4 = fetch("/api/dashboard/concluidas-mes").then(r => r.json()).catch(() => null);
    const p5 = fetch("/api/dashboard/equipe-do-mes").then(r => r.json()).catch(() => null);
    Promise.all([p1, p2, p3, p4, p5]).then(([cards, g, perf, conc, eqMes]) => {
      setCardsEquipe(cards);
      setGrade(g);
      setPerformance(perf);
      setConcluidas(conc);
      setEquipeMes(eqMes);
      setLoading(false);
    });
  };

  useEffect(() => { fetchData(ano, equipeFiltro); }, [ano, equipeFiltro]);

  const toggleEquipeFiltro = (nome) => {
    if (selectedEquipe === nome) { setSelectedEquipe(null); setEquipeFiltro("Todas"); }
    else { setSelectedEquipe(nome); setEquipeFiltro(nome); }
  };

  const handleCellClick = (empresaId, mesIdx) => {
    window.dispatchEvent(new CustomEvent("navigate", { detail: { page: "contabil", empresaId, mes: mesIdx + 1, ano } }));
  };

  if (loading) return <div style={{ color: C.muted, padding: 40, textAlign: "center" }}>Carregando...</div>;

  const gradeFiltrada = selectedEquipe ? (grade || []).filter(g => g.empresa.equipe === selectedEquipe) : (grade || []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ overflowX: "auto", paddingBottom: 8 }}>
        <div style={{ display: "flex", gap: 12, minWidth: "max-content" }}>
           { (cardsEquipe || []).map(card => {
            const isSelected = selectedEquipe === card.equipeNome;
            return (
              <div key={card.equipeId} onClick={() => toggleEquipeFiltro(card.equipeNome)}
                style={{ background: isSelected ? C.purple : C.white, borderRadius: 12, border: `2px solid ${isSelected ? C.purple : C.ghost}`, padding: "16px 20px", minWidth: 200, cursor: "pointer", transition: "all 0.15s", userSelect: "none" }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = C.lilac; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = C.ghost; }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: isSelected ? C.white : C.purple, marginBottom: 8 }}>Equipe {card.equipeNome}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ fontSize: 12, color: isSelected ? C.soft : C.muted }}>Empresas: <strong style={{ color: isSelected ? C.white : C.text }}>{card.totalEmpresas}</strong></div>
                  <div style={{ fontSize: 12, color: isSelected ? C.soft : C.muted }}>Matrizes: <strong style={{ color: isSelected ? C.white : C.text }}>{card.matrizes}</strong></div>
                  <div style={{ fontSize: 12, color: isSelected ? C.soft : C.muted }}>Filiais: <strong style={{ color: isSelected ? C.white : C.text }}>{card.filiais}</strong></div>
                  <div style={{ fontSize: 12, color: isSelected ? C.soft : C.muted, marginTop: 4 }}>Porte predominante: <Badge label={card.portePredominante} color={isSelected ? C.white : C.lilac} bg={isSelected ? C.mid : undefined} /></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Card style={{ padding: 0, overflow: "auto" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.ghost}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>Grade de Empresas {selectedEquipe ? `- Equipe ${selectedEquipe}` : ''}</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select value={equipeFiltro} onChange={e => { setEquipeFiltro(e.target.value); setSelectedEquipe(e.target.value === "Todas" ? null : e.target.value); }} style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.ghost}`, fontSize: 12 }}>
              <option value="Todas">Todas as equipes</option>
              {cardsEquipe.map(c => <option key={c.equipeNome} value={c.equipeNome}>{c.equipeNome}</option>)}
            </select>
            <select value={ano} onChange={e => setAno(parseInt(e.target.value))} style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.ghost}`, fontSize: 12 }}>
               { (anos || []).map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 800 }}>
          <thead style={{ background: C.snow }}>
            <tr>
              <th style={{ textAlign: "left", padding: "10px 16px", color: C.muted, fontWeight: 600, fontSize: 11, textTransform: "uppercase", borderBottom: `1px solid ${C.ghost}`, position: "sticky", left: 0, background: C.snow, zIndex: 1 }}>Empresa</th>
              <th style={{ textAlign: "left", padding: "10px 16px", color: C.muted, fontWeight: 600, fontSize: 11, textTransform: "uppercase", borderBottom: `1px solid ${C.ghost}` }}>Equipe</th>
              {meses.map(m => (
                <th key={m} style={{ textAlign: "center", padding: "10px 8px", color: C.muted, fontWeight: 600, fontSize: 10, textTransform: "uppercase", borderBottom: `1px solid ${C.ghost}`, minWidth: 70 }}>{m}/{String(ano).slice(2)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {gradeFiltrada.length === 0 && (
              <tr><td colSpan={14} style={{ textAlign: "center", padding: 40, color: C.muted, fontSize: 13 }}>Nenhum dado disponível para os filtros selecionados</td></tr>
            )}
            {gradeFiltrada.map(row => (
              <tr key={row.empresa.id} style={{ borderBottom: `1px solid ${C.snow}` }}
                onMouseEnter={e => e.currentTarget.style.background = C.snow}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <td style={{ padding: "10px 16px", fontWeight: 600, color: C.text, whiteSpace: "nowrap", position: "sticky", left: 0, background: C.white, zIndex: 1, cursor: "pointer" }}
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent("navigate", { detail: { page: "contabil", empresaId: row.empresa.id, ano } }));
                  }}>
                  <span style={{ color: C.lilac }}>{row.empresa.apelido}</span>
                </td>
                <td style={{ padding: "10px 16px", color: C.muted }}><Badge label={row.empresa.equipe} color={C.lilac} /></td>
                  {row.meses.map((m, i) => (
                  <td key={i + '-' + row.empresa.id} style={{ textAlign: "center", padding: "8px" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: m.cor + "22", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", border: `1px solid ${m.cor}33` }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: m.cor }}>{m.perc}%</span>
                    </div>
                    <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>{m.concluidas}/{m.total || '-'}</div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        <Card>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 4 }}>Performance por Porte</div>
          <div style={{ fontSize: 10, color: C.muted, marginBottom: 12 }}>% de tarefas concluídas no prazo sobre o total de concluídas por porte</div>
          {performance.length === 0 ? (
            <div style={{ fontSize: 12, color: C.muted, textAlign: "center", padding: 20 }}>Nenhum dado disponível</div>
          ) : performance.map(p => (
            <div key={p.label} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: C.muted }}>{p.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{p.value}%</span>
              </div>
              <div style={{ background: C.ghost, borderRadius: 99, height: 7 }}>
                <div style={{ width: `${p.value}%`, background: p.label === "Grande" ? C.purple : p.label === "Médio" ? C.lilac : p.label === "Pequeno" ? C.soft : C.soft, height: "100%", borderRadius: 99 }} />
              </div>
            </div>
          ))}
        </Card>

        <Card>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 14 }}>Concluídas no Mês</div>
          {concluidas && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 36, fontWeight: 800, color: C.success }}>{concluidas.total}</div>
                <div style={{ fontSize: 12, color: C.muted }}>tarefas concluídas</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1, background: C.success + "11", borderRadius: 8, padding: "8px", textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.success }}>{concluidas.noPrazo}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>No prazo</div>
                </div>
                <div style={{ flex: 1, background: C.warn + "11", borderRadius: 8, padding: "8px", textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.warn }}>{concluidas.foraPrazo}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>Fora prazo</div>
                </div>
              </div>
            </div>
          )}
        </Card>

        {equipeMes && (
          <Card style={{ background: `linear-gradient(135deg, ${C.purple}, ${C.mid})`, border: "none", color: C.white }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Equipe do Mês</div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>Equipe {equipeMes.nome}</div>
            <div style={{ fontSize: 12, color: C.soft, marginTop: 4 }}>{equipeMes.concluidas} concluídas · {equipeMes.perc}% no prazo</div>
            <div style={{ marginTop: 12, fontSize: 12, color: C.soft }}>{equipeMes.atividades} atividades no total</div>
          </Card>
        )}
      </div>
    </div>
  );
}
