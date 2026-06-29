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
  const styles = { primary: { background: C.lilac, color: C.white, border: "none" }, outline: { background: "transparent", color: C.lilac, border: `1.5px solid ${C.lilac}` }, danger: { background: C.danger, color: C.white, border: "none" } };
  return <button onClick={onClick} style={{ ...styles[variant], borderRadius: 8, padding: "8px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, ...style }}>{children}</button>;
}

const PlusIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>);
const EditIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>);
const TrashIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>);

const atividades = ["Indústria", "Serviço", "Comércio"];
const fechamentos = ["Mensal", "Bimestral", "Trimestral", "Semestral", "Anual", "Sem Movimento"];
const portes = ["Grande", "Médio", "Pequeno", "Micro"];
// const equipesList removed — unused

export default function Empresas() {
  const toast = useToast();
  const [empresas, setEmpresas] = useState([]);
  const [equipes, setEquipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterAtividade, setFilterAtividade] = useState("Todos");
  const [filterEquipe, setFilterEquipe] = useState("Todas");
  const [filterGrupo, setFilterGrupo] = useState("Todos");
  const [grupos, setGrupos] = useState([]);
  const [showGrupoModal, setShowGrupoModal] = useState(false);
  const [novoGrupo, setNovoGrupo] = useState("");
  const [consultando, setConsultando] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const cnpjTimer = useRef(null);

  const INITIAL_FORM = { cnpj: "", razaoSocial: "", apelido: "", porte: "Médio", atividade: "Indústria", grupoEconomico: "", equipe: "Alpha", tipo: "Matriz", matrizCnpj: "", tipoFechamento: "Mensal", diaFechamento: 15 };
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = () => {
    setLoading(true);
    setFetchError(false);
    fetch("/api/empresas").then(r => r.json()).then(data => { setEmpresas(data); setLoading(false); }).catch(() => { setLoading(false); setFetchError(true); });
    fetch("/api/empresas/grupos").then(r => r.json()).then(data => setGrupos(data)).catch(() => toast("Erro ao carregar grupos", "error"));
    fetch("/api/equipes").then(r => r.json()).then(data => { if (Array.isArray(data)) setEquipes(data); }).catch(() => toast("Erro ao carregar equipes", "error"));
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    return () => {
      if (cnpjTimer.current) clearTimeout(cnpjTimer.current);
    };
  }, []);

  const consultarCNPJ = async (cnpj) => {
    const clean = cnpj.replace(/\D/g, '');
    if (clean.length !== 14) return;
    setConsultando(true);
    try {
      const res = await fetch(`/api/empresas/consultar-cnpj/${cnpj}`);
      if (res.ok) {
        const data = await res.json();
        setForm(f => ({
          ...f,
          razaoSocial: data.empresa.razaoSocial,
          apelido: data.empresa.nomeFantasia || f.apelido,
          porte: data.empresa.porte,
          atividade: data.empresa.atividade,
        }));
        if (data.filiais && data.filiais.length > 0) {
          await fetch(`/api/empresas/vincular-filiais/${cnpj}`);
          fetchData();
          toast(`${data.filiais.length} filial(is) vinculada(s) automaticamente.`, "success");
        }
        if (data.empresa.razaoSocial) {
          toast("Dados da Receita Federal carregados.", "success");
        }
      }
    } catch (err) { console.error("Erro ao consultar CNPJ:", err); toast("Erro ao consultar CNPJ", "error"); }
    setConsultando(false);
  };

  const filtered = (empresas || []).filter(e => {
    if (filterAtividade !== "Todos" && e.atividade !== filterAtividade) return false;
    if (filterEquipe !== "Todas" && e.equipe !== filterEquipe) return false;
    if (filterGrupo !== "Todos" && e.grupoEconomico !== filterGrupo) return false;
    if (search) {
      const s = search.toLowerCase();
      return e.razaoSocial.toLowerCase().includes(s) || e.apelido.toLowerCase().includes(s) || e.cnpj.includes(s);
    }
    return true;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    const url = editId ? `/api/empresas/${editId}` : "/api/empresas";
    const method = editId ? "PUT" : "POST";
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) {
        fetchData();
        setShowModal(false);
        setEditId(null);
        setForm(INITIAL_FORM);
      } else {
        const err = await res.json();
        toast(err.message, "error");
      }
    } catch (e) { toast("Erro de rede", "error"); }
    setSubmitting(false);
  };

  const handleEdit = (emp) => {
    setForm({ cnpj: emp.cnpj, razaoSocial: emp.razaoSocial, apelido: emp.apelido, porte: emp.porte, atividade: emp.atividade, grupoEconomico: emp.grupoEconomico, equipe: emp.equipe, tipo: emp.tipo, matrizCnpj: emp.matrizCnpj || "", tipoFechamento: emp.tipoFechamento || "Mensal", diaFechamento: emp.diaFechamento || 15 });
    setEditId(emp.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir esta empresa?")) return;
    try {
      const res = await fetch(`/api/empresas/${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
      else { const err = await res.json(); toast(err.message, "error"); }
    } catch (e) { toast("Erro de rede ao excluir", "error"); }
  };

  if (loading) return <div style={{ color: C.muted, padding: 40, textAlign: "center" }}>Carregando...</div>;
  if (fetchError) return <div style={{ color: C.danger, padding: 40, textAlign: "center" }}>Erro ao carregar empresas. <button onClick={fetchData} style={{ background: C.lilac, color: C.white, border: "none", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontWeight: 600, marginLeft: 8 }}>Tentar novamente</button></div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ background: C.white, borderRadius: 8, border: `1px solid ${C.ghost}`, display: "flex", alignItems: "center", padding: "0 10px" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." style={{ border: "none", padding: "8px", outline: "none", fontSize: 13, width: 140 }} />
          </div>
          <select value={filterAtividade} onChange={e => setFilterAtividade(e.target.value)} style={{ padding: "7px 10px", borderRadius: 8, border: `1px solid ${C.ghost}`, fontSize: 12, color: C.text }}>
            <option value="Todos">Atv.: Todas</option>
            {atividades.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={filterEquipe} onChange={e => setFilterEquipe(e.target.value)} style={{ padding: "7px 10px", borderRadius: 8, border: `1px solid ${C.ghost}`, fontSize: 12, color: C.text }}>
            <option value="Todas">Equipe: Todas</option>
            {equipes.map(eq => <option key={eq.nome} value={eq.nome}>{eq.nome}</option>)}
          </select>
          <select value={filterGrupo} onChange={e => setFilterGrupo(e.target.value)} style={{ padding: "7px 10px", borderRadius: 8, border: `1px solid ${C.ghost}`, fontSize: 12, color: C.text }}>
            <option value="Todos">Grupo: Todos</option>
            {grupos.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <Btn onClick={() => { setEditId(null); setForm(INITIAL_FORM); setShowModal(true); }}><PlusIcon /> Nova Empresa</Btn>
              <Btn variant="outline" onClick={() => { setNovoGrupo(""); setShowGrupoModal(true); }}><PlusIcon /> Grupo</Btn>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {[{ l: "Total", v: empresas.length }, { l: "Matrizes", v: empresas.filter(e => e.tipo === "Matriz").length }, { l: "Filiais", v: empresas.filter(e => e.tipo === "Filial").length }, { l: "Grupos Econ.", v: new Set(empresas.map(e => e.grupoEconomico).filter(Boolean)).size }].map(s => (
          <Card key={s.l} style={{ padding: "14px 18px", textAlign: "center" }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: C.purple }}>{s.v}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{s.l}</div>
          </Card>
        ))}
      </div>

      <Card style={{ padding: 0, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 900 }}>
          <thead style={{ background: C.snow }}>
            <tr>
              {["CNPJ", "Razão Social", "Apelido", "Atividade", "Porte", "Tipo", "Grupo Econ.", "Equipe", "Fechamento", "Dia", "Ações"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "12px 16px", color: C.muted, fontWeight: 600, fontSize: 11, textTransform: "uppercase", borderBottom: `1px solid ${C.ghost}`, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={11} style={{ textAlign: "center", padding: 40, color: C.muted, fontSize: 13 }}>Nenhuma empresa encontrada</td></tr>
            )}
            {filtered.map(e => (
              <tr key={e.id} style={{ borderBottom: `1px solid ${C.snow}` }}
                onMouseEnter={ev => ev.currentTarget.style.background = C.snow}
                onMouseLeave={ev => ev.currentTarget.style.background = "transparent"}>
                <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 12, color: C.muted }}>{e.cnpj}</td>
                <td style={{ padding: "12px 16px", fontWeight: 600, color: C.text }}>{e.razaoSocial}</td>
                <td style={{ padding: "12px 16px" }}><Badge label={e.apelido} color={C.purple} /></td>
                <td style={{ padding: "12px 16px" }}><Badge label={e.atividade} color={C.lilac} /></td>
                <td style={{ padding: "12px 16px" }}><Badge label={e.porte} color={e.porte === "Grande" ? C.mid : e.porte === "Médio" ? C.lilac : C.soft} /></td>
                <td style={{ padding: "12px 16px" }}><Badge label={e.tipo} color={e.tipo === "Matriz" ? C.success : C.warn} /></td>
                <td style={{ padding: "12px 16px", color: e.grupoEconomico ? C.text : C.muted }}>{e.grupoEconomico || "—"}</td>
                <td style={{ padding: "12px 16px" }}><Badge label={e.equipe} color={C.lilac} /></td>
                <td style={{ padding: "12px 16px", fontSize: 12, color: C.text }}>{e.tipoFechamento || "—"}</td>
                <td style={{ padding: "12px 16px", fontSize: 12, color: C.text }}>{e.diaFechamento || "—"}</td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    <Btn variant="outline" onClick={() => handleEdit(e)} style={{ padding: "5px 8px" }}><EditIcon /></Btn>
                    <Btn variant="danger" onClick={() => handleDelete(e.id)} style={{ padding: "5px 8px" }}><TrashIcon /></Btn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {showGrupoModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "#0006", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
          onClick={() => setShowGrupoModal(false)}>
          <div style={{ background: C.white, borderRadius: 16, padding: 32, width: 400 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 20 }}>Novo Grupo Econômico</div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Nome do Grupo</label>
              <input value={novoGrupo} onChange={e => setNovoGrupo(e.target.value)} placeholder="Ex: Carbonil" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.ghost}`, boxSizing: "border-box", fontSize: 13 }} />
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setShowGrupoModal(false)} style={{ padding: "10px 20px", borderRadius: 8, border: `1px solid ${C.ghost}`, background: C.white, color: C.muted, cursor: "pointer", fontWeight: 600 }}>Cancelar</button>
              <button type="button" onClick={async () => {
                if (!novoGrupo.trim()) return;
                const res = await fetch("/api/empresas/grupos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nome: novoGrupo.trim() }) });
                if (res.ok) { setShowGrupoModal(false); setNovoGrupo(""); fetchData(); } else { const err = await res.json(); toast(err.message, "error"); }
              }} style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: C.lilac, color: C.white, cursor: "pointer", fontWeight: 600 }}>Salvar</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "#0006", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
          onClick={() => setShowModal(false)}>
          <div style={{ background: C.white, borderRadius: 16, padding: 32, width: 560, maxHeight: "90vh", overflow: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 20 }}>{editId ? "Editar Empresa" : "Nova Empresa"}</div>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>CNPJ *</label>
                  <div style={{ position: "relative" }}>
                  <input required value={form.cnpj} onChange={e => {
                    const v = e.target.value;
                    setForm({ ...form, cnpj: v });
                    if (v.replace(/\D/g, '').length === 14) {
                      if (cnpjTimer.current) clearTimeout(cnpjTimer.current);
                      cnpjTimer.current = setTimeout(() => consultarCNPJ(v), 400);
                    }
                  }} placeholder="00.000.000/0000-00" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.ghost}`, boxSizing: "border-box", fontSize: 13 }} />
                  {consultando && <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: C.lilac, fontWeight: 600 }}>Consultando...</span>}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Razão Social *</label>
                  <input required value={form.razaoSocial} onChange={e => setForm({ ...form, razaoSocial: e.target.value })} placeholder="Nome completo" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.ghost}`, boxSizing: "border-box", fontSize: 13 }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Apelido</label>
                  <input value={form.apelido} onChange={e => setForm({ ...form, apelido: e.target.value })} placeholder="Nome curto" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.ghost}`, boxSizing: "border-box", fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Atividade *</label>
                  <select required value={form.atividade} onChange={e => setForm({ ...form, atividade: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.ghost}`, fontSize: 13 }}>
                    {atividades.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Grupo Econômico</label>
                  <select value={form.grupoEconomico} onChange={e => setForm({ ...form, grupoEconomico: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.ghost}`, fontSize: 13 }}>
                    <option value="">— Sem grupo —</option>
                    {grupos.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Porte</label>
                  <select value={form.porte} onChange={e => setForm({ ...form, porte: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.ghost}`, fontSize: 13 }}>
                    {portes.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Equipe</label>
                  <select value={form.equipe} onChange={e => setForm({ ...form, equipe: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.ghost}`, fontSize: 13 }}>
                    {equipes.map(eq => <option key={eq.nome} value={eq.nome}>{eq.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Tipo</label>
                  <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.ghost}`, fontSize: 13 }}>
                    <option value="Matriz">Matriz</option>
                    <option value="Filial">Filial</option>
                  </select>
                </div>
              </div>
              {form.tipo === "Filial" && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>CNPJ Matriz</label>
                  <input value={form.matrizCnpj} onChange={e => setForm({ ...form, matrizCnpj: e.target.value })} placeholder="CNPJ da matriz" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.ghost}`, boxSizing: "border-box", fontSize: 13 }} />
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Tipo de Fechamento</label>
                  <select value={form.tipoFechamento} onChange={e => setForm({ ...form, tipoFechamento: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.ghost}`, fontSize: 13 }}>
                    {fechamentos.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Dia do Fechamento</label>
                  <input type="number" min="1" max="31" value={form.diaFechamento} onChange={e => { const v = parseInt(e.target.value); if (v >= 1 && v <= 31) setForm({ ...form, diaFechamento: v }); else if (e.target.value === '') setForm({ ...form, diaFechamento: 0 }); }} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.ghost}`, boxSizing: "border-box", fontSize: 13 }} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: "10px 20px", borderRadius: 8, border: `1px solid ${C.ghost}`, background: C.white, color: C.muted, cursor: "pointer", fontWeight: 600 }}>Cancelar</button>
                <button type="submit" disabled={consultando || submitting} style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: C.lilac, color: C.white, cursor: "pointer", fontWeight: 600 }}>{consultando ? "Consultando..." : submitting ? "Salvando..." : "Salvar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
