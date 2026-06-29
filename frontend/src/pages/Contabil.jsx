import { useState, useEffect, useRef } from "react";
import { useToast } from "../components/Toast";

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
  const styles = { primary: { background: C.lilac, color: C.white, border: "none" }, outline: { background: "transparent", color: C.lilac, border: `1.5px solid ${C.lilac}` }, success: { background: C.success, color: C.white, border: "none" } };
  return <button onClick={onClick} style={{ ...(styles[variant] || styles.primary), borderRadius: 8, padding: "8px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, ...style }}>{children}</button>;
}

const PlusIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>);
const UploadIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>);
const DownloadIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>);

const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function ContaRow({ conta, gradeData = [], level = 0, ano }) {
  const entry = gradeData.find(g => g.conta?.id === conta.id);
  const mesesStatus = entry ? entry.meses : [];
  const filhos = gradeData.filter(g => g.conta?.contaPaiId === conta.id).map(g => g.conta);
  return (
    <>
      <tr style={{ borderBottom: `1px solid ${C.snow}`, background: level === 0 ? C.snow : "transparent" }}
        onMouseEnter={e => e.currentTarget.style.background = level === 0 ? C.ghost : C.snow}
        onMouseLeave={e => e.currentTarget.style.background = level === 0 ? C.snow : "transparent"}>
        <td style={{ padding: "8px 12px", fontWeight: level === 0 ? 700 : 600, color: C.text, fontSize: 12 }}>
          <span style={{ marginLeft: level * 16, fontFamily: "monospace", fontSize: 11, color: C.muted, marginRight: 6 }}>{conta.codigo || ''}</span>
          {conta.nome || ''}
        </td>
        <td style={{ padding: "8px 12px" }}><Badge label={conta.tipo || '—'} color={conta.tipo === "Ativo" ? C.success : conta.tipo === "Passivo" ? C.danger : C.warn} /></td>
        <td style={{ padding: "8px 12px" }}><Badge label={conta.natureza || '—'} color={C.lilac} /></td>
        {mesesStatus && mesesStatus.map((ms, i) => (
          <td key={i} style={{ textAlign: "center", padding: "6px 4px", minWidth: 80, cursor: "pointer" }}
            onClick={() => {
              const mes = meses[i];
              window.dispatchEvent(new CustomEvent("navigate", { 
                detail: { 
                  page: "planner", 
                  empresaId: conta.empresaId, 
                  ano: ano, 
                  mes: mes, 
                  contaId: conta.id 
                } 
              }));
            }}>
            <div style={{ width: 68, padding: "4px 2px", borderRadius: 6, background: (ms.cor || C.muted) + "22", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", margin: "0 auto", border: `1px solid ${(ms.cor || C.muted)}33` }}>
              <span style={{ fontSize: 8, fontWeight: 700, color: ms.cor || C.muted }}>{ms.label || '—'}</span>
              {ms.responsavelNome && <span style={{ fontSize: 7, color: ms.cor || C.muted, marginTop: 1, opacity: 0.8 }}>{ms.responsavelNome}</span>}
            </div>
          </td>
        ))}
      </tr>
      {(filhos || []).map(filho => (
        <ContaRow key={filho.id} conta={filho} gradeData={gradeData} level={level + 1} ano={ano} />
      ))}
    </>
  );
}

export default function GestaoContabil() {
  const toast = useToast();
  const [contas, setContas] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [equipes, setEquipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showContaModal, setShowContaModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [filtroEmpresa, setFiltroEmpresa] = useState("");
  const [filtroEquipe, setFiltroEquipe] = useState("");
  const [ano, setAno] = useState(new Date().getFullYear());
  const [gradeData, setGradeData] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [formConta, setFormConta] = useState({ empresaId: "", codigo: "", nome: "", tipo: "Ativo", natureza: "Analítica", contaPaiId: "" });

  const curYear = new Date().getFullYear();
  const anos = Array.from({ length: 21 }, (_, i) => curYear - 10 + i);
  const filtrosRef = useRef({ filtroEmpresa, ano });

  useEffect(() => { filtrosRef.current = { filtroEmpresa, ano }; }, [filtroEmpresa, ano]);

  const fetchData = () => {
    Promise.all([
      fetch("/api/contabil/contas").then(r => r.json()).catch(() => []),
      fetch("/api/empresas").then(r => r.json()).catch(() => []),
      fetch("/api/equipes").then(r => r.json()).catch(() => []),
    ]).then(([c, e, eqs]) => {
      setContas(Array.isArray(c) ? c : []);
      setEmpresas(Array.isArray(e) ? e : []);
      setEquipes(Array.isArray(eqs) ? eqs : []);
      setLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.empresaId) {
        setFiltroEmpresa(e.detail.empresaId);
        if (e.detail.ano) { const y = parseInt(e.detail.ano); if (!isNaN(y)) setAno(y); }
      }
    };
    window.addEventListener("navigate", handler);
    return () => { window.removeEventListener("navigate", handler); };
  }, []);

  useEffect(() => {
    const plannerHandler = () => {
      const { filtroEmpresa: fe, ano: a } = filtrosRef.current;
      if (fe && a) {
        fetch(`/api/contabil/grade?empresaId=${fe}&ano=${a}`).then(r => r.json()).then(setGradeData).catch(() => {});
      }
    };
    window.addEventListener("planner-updated", plannerHandler);
    return () => { window.removeEventListener("planner-updated", plannerHandler); };
  }, []);

  useEffect(() => {
    if (filtroEmpresa && ano) {
      fetch(`/api/contabil/grade?empresaId=${filtroEmpresa}&ano=${ano}`).then(r => r.json()).then(setGradeData).catch(() => {});
    } else {
      setGradeData(null);
    }
    const interval = setInterval(() => {
      if (filtroEmpresa && ano) {
        fetch(`/api/contabil/grade?empresaId=${filtroEmpresa}&ano=${ano}`).then(r => r.json()).then(setGradeData).catch(() => {});
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [filtroEmpresa, ano]);

  const empresasFiltradas = filtroEquipe
    ? (empresas || []).filter(e => e.equipe === filtroEquipe)
    : (empresas || []);

  const handleCriarConta = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/contabil/contas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formConta) });
      if (res.ok) { setShowContaModal(false); setFormConta({ empresaId: "", codigo: "", nome: "", tipo: "Ativo", natureza: "Analítica", contaPaiId: "" }); fetchData(); }
      else { const err = await res.json(); toast(err.message, "error"); }
    } catch (e) { toast("Erro de rede", "error"); }
  };

  const handleUpload = async () => {
    if (!uploadFile || !filtroEmpresa) { toast("Selecione uma empresa e um arquivo", "info"); return; }
    try {
      let text = await uploadFile.text();
      // Remove BOM and normalize line endings
      text = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      const linhas = text.split('\n').map(l => l.trim()).filter(Boolean).slice(1);
      const raw = [];
      for (const l of linhas) {
        const parts = [];
        let current = '', inQuotes = false;
        for (const ch of l) {
          if (ch === '"') { inQuotes = !inQuotes; continue; }
          if (ch === ';' && !inQuotes) { parts.push(current.trim()); current = ''; continue; }
          current += ch;
        }
        parts.push(current.trim());
        if (parts.length < 4) continue;
        const [codigo, nome, tipo, natureza, contaPaiCodigo] = parts;
        raw.push({ codigo, nome, tipo, natureza, contaPaiCodigo: contaPaiCodigo || '' });
      }
      // Generate temp IDs and resolve parent references in a second pass
      for (const r of raw) { r.id = crypto.randomUUID ? crypto.randomUUID() : 't' + Date.now() + Math.random().toString(36).slice(2, 7); }
      for (const r of raw) {
        if (!r.contaPaiCodigo) { r.contaPaiId = undefined; continue; }
        const pai = raw.find(p => p.codigo === r.contaPaiCodigo);
        r.contaPaiId = pai ? pai.id : undefined;
      }
      const contasImport = raw.map(r => ({ codigo: r.codigo, nome: r.nome, tipo: r.tipo, natureza: r.natureza, contaPaiId: r.contaPaiId }));
      const res = await fetch("/api/contabil/contas/importar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ empresaId: filtroEmpresa, contas: contasImport }) });
      if (res.ok) { toast("Plano de contas importado!", "success"); setShowUploadModal(false); fetchData(); }
      else { const err = await res.json(); toast(err.message, "error"); }
    } catch (err) { toast("Erro ao processar arquivo: " + err.message, "error"); }
  };

  const baixarModelo = () => {
    const BOM = "\uFEFF";
    const csv = BOM + "codigo;nome;tipo;natureza;contaPaiCodigo\n1;Ativo;Ativo;Sintética;\n1.01;Circulante;Ativo;Sintética;1\n1.01.001;Caixa;Ativo;Analítica;1.01\n2;Passivo;Passivo;Sintética;\n3;DRE;DRE;Sintética;";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "modelo_plano_contas.csv"; a.click();
  };

  if (loading) return <div style={{ color: C.muted, padding: 40, textAlign: "center" }}>Carregando...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <select value={filtroEmpresa} onChange={e => setFiltroEmpresa(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.ghost}`, fontSize: 13 }}>
          <option value="">Selecione uma empresa</option>
          {empresasFiltradas.map(e => <option key={e.id} value={e.id}>{e.apelido} - {e.razaoSocial}</option>)}
        </select>
        <select value={filtroEquipe} onChange={e => setFiltroEquipe(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.ghost}`, fontSize: 13 }}>
          <option value="">Todas as equipes</option>
          {[...new Set(empresas.map(e => e.equipe))].map(eq => <option key={eq} value={eq}>{eq}</option>)}
        </select>
        <select value={ano} onChange={e => setAno(parseInt(e.target.value))} style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.ghost}`, fontSize: 13 }}>
          {anos.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <Btn onClick={() => setShowContaModal(true)}><PlusIcon /> Nova Conta</Btn>
        <Btn variant="outline" onClick={() => setShowUploadModal(true)}><UploadIcon /> Importar CSV</Btn>
        <Btn variant="outline" onClick={baixarModelo}><DownloadIcon /> Modelo</Btn>
      </div>

      {filtroEmpresa && gradeData ? (
        <Card style={{ padding: 0, overflow: "auto" }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.ghost}`, fontWeight: 700, fontSize: 14, color: C.text }}>
            Plano de Contas · {empresas.find(e => e.id === gradeData.empresaId)?.apelido || ''} · {ano}
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 600 }}>
            <thead style={{ background: C.snow }}>
              <tr>
                <th style={{ textAlign: "left", padding: "8px 12px", color: C.muted, fontWeight: 600, fontSize: 10, textTransform: "uppercase" }}>Conta</th>
                <th style={{ textAlign: "left", padding: "8px 12px", color: C.muted, fontWeight: 600, fontSize: 10, textTransform: "uppercase" }}>Tipo</th>
                <th style={{ textAlign: "left", padding: "8px 12px", color: C.muted, fontWeight: 600, fontSize: 10, textTransform: "uppercase" }}>Nat.</th>
                {meses.map(m => (
                  <th key={m} style={{ textAlign: "center", padding: "8px 4px", color: C.muted, fontWeight: 600, fontSize: 9, textTransform: "uppercase", minWidth: 36 }}>{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
               {(gradeData?.grade || []).filter(c => c.conta && !c.conta.contaPaiId).map(conta => (
                  <ContaRow key={conta.conta.id} conta={conta.conta} gradeData={gradeData.grade} ano={ano} />
                ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <Card>
          <div style={{ textAlign: "center", padding: "40px 20px", color: C.muted }}>
            <div style={{ fontSize: 40, fontWeight: 800, color: C.ghost, marginBottom: 8 }}>&#128202;</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>Gestão Contábil</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Selecione uma empresa acima para visualizar o plano de contas por período.</div>
          </div>
        </Card>
      )}

      {showContaModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "#0006", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
          onClick={() => setShowContaModal(false)}>
          <div style={{ background: C.white, borderRadius: 16, padding: 32, width: 480 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 20 }}>Nova Conta Contábil</div>
            <form onSubmit={handleCriarConta} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Empresa</label>
                <select required value={formConta.empresaId} onChange={e => setFormConta({ ...formConta, empresaId: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.ghost}`, fontSize: 13 }}>
                  <option value="">Selecione...</option>
                  {empresas.map(e => <option key={e.id} value={e.id}>{e.apelido}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Código *</label>
                  <input required value={formConta.codigo} onChange={e => setFormConta({ ...formConta, codigo: e.target.value })} placeholder="1.01.001" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.ghost}`, boxSizing: "border-box", fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Nome *</label>
                  <input required value={formConta.nome} onChange={e => setFormConta({ ...formConta, nome: e.target.value })} placeholder="Ex: Caixa" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.ghost}`, boxSizing: "border-box", fontSize: 13 }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Tipo</label>
                  <select value={formConta.tipo} onChange={e => setFormConta({ ...formConta, tipo: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.ghost}`, fontSize: 13 }}>
                    <option value="Ativo">Ativo</option><option value="Passivo">Passivo</option><option value="DRE">DRE</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Natureza</label>
                  <select value={formConta.natureza} onChange={e => setFormConta({ ...formConta, natureza: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.ghost}`, fontSize: 13 }}>
                    <option value="Analítica">Analítica</option><option value="Sintética">Sintética</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Conta Pai (opcional)</label>
                <select value={formConta.contaPaiId} onChange={e => setFormConta({ ...formConta, contaPaiId: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.ghost}`, fontSize: 13 }}>
                  <option value="">— Nenhuma —</option>
                  {contas.filter(c => c.natureza === "Sintética").map(c => <option key={c.id} value={c.id}>{c.codigo} - {c.nome}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
                <button type="button" onClick={() => setShowContaModal(false)} style={{ padding: "10px 20px", borderRadius: 8, border: `1px solid ${C.ghost}`, background: C.white, color: C.muted, cursor: "pointer", fontWeight: 600 }}>Cancelar</button>
                <button type="submit" style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: C.lilac, color: C.white, cursor: "pointer", fontWeight: 600 }}>Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showUploadModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "#0006", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
          onClick={() => setShowUploadModal(false)}>
          <div style={{ background: C.white, borderRadius: 16, padding: 32, width: 440 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 20 }}>Importar Plano de Contas</div>
            <p style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>Formato CSV: codigo;nome;tipo;natureza;contaPaiCodigo</p>
            <input type="file" accept=".csv,.txt" onChange={e => setUploadFile(e.target.files[0])} style={{ marginBottom: 16 }} />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setShowUploadModal(false)} style={{ padding: "10px 20px", borderRadius: 8, border: `1px solid ${C.ghost}`, background: C.white, color: C.muted, cursor: "pointer", fontWeight: 600 }}>Cancelar</button>
              <button onClick={handleUpload} style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: C.success, color: C.white, cursor: "pointer", fontWeight: 600 }}>Importar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
