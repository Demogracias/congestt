import { useState, useEffect } from "react";
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
const UserPlusIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>);

export default function Equipes() {
  const toast = useToast();
  const [equipes, setEquipes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showMembroModal, setShowMembroModal] = useState(false);
  const [membroEquipeId, setMembroEquipeId] = useState(null);
  const [form, setForm] = useState({ nome: "", supervisao: "", supervisorId: "" });
  const [membroForm, setMembroForm] = useState({ id: "", nome: "", cargo: "", nivel: 1 });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/equipes").then(r => r.json()),
      fetch("/api/equipes/usuarios").then(r => r.json()),
    ]).then(([eqs, users]) => { setEquipes(eqs); setUsuarios(users); setLoading(false); })
    .catch(() => { setLoading(false); toast("Erro ao carregar dados", "error"); });
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editId ? `/api/equipes/${editId}` : "/api/equipes";
    const method = editId ? "PUT" : "POST";
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) { fetchData(); setShowModal(false); setEditId(null); setForm({ nome: "", supervisao: "", supervisorId: "" }); }
      else { const err = await res.json(); toast(err.message, "error"); }
    } catch (e) { toast("Erro de rede", "error"); }
  };

  const handleEdit = (eq) => {
    setForm({ nome: eq.nome, supervisao: eq.supervisao, supervisorId: eq.supervisorId || "" });
    setEditId(eq.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir esta equipe?")) return;
    try {
      const res = await fetch(`/api/equipes/${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
      else { const err = await res.json(); toast(err.message, "error"); }
    } catch (e) { toast("Erro de rede", "error"); }
  };

  const handleAddMembro = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/equipes/${membroEquipeId}/membros`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(membroForm) });
      if (res.ok) { fetchData(); setShowMembroModal(false); setMembroForm({ id: "", nome: "", cargo: "", nivel: 1 }); }
      else { const err = await res.json(); toast(err.message, "error"); }
    } catch (e) { toast("Erro de rede", "error"); }
  };

  const handleRemoveMembro = async (eqId, membroId) => {
    if (!confirm("Remover este membro?")) return;
    try {
      const res = await fetch(`/api/equipes/${eqId}/membros/${membroId}`, { method: "DELETE" });
      if (res.ok) fetchData();
      else { const err = await res.json(); toast(err.message, "error"); }
    } catch (e) { toast("Erro de rede", "error"); }
  };

  const openMembroModal = (eqId) => {
    setMembroEquipeId(eqId);
    setShowMembroModal(true);
  };

  if (loading) return <div style={{ color: C.muted, padding: 40, textAlign: "center" }}>Carregando...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Btn onClick={() => { setEditId(null); setForm({ nome: "", supervisao: "", supervisorId: "" }); setShowModal(true); }}><PlusIcon /> Nova Equipe</Btn>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
        {equipes.length === 0 && (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 40, color: C.muted, fontSize: 13 }}>Nenhuma equipe cadastrada</div>
        )}
        {equipes.map(eq => (
          <Card key={eq.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18, color: C.purple }}>Equipe {eq.nome}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Supervisão: {eq.supervisao}</div>
              </div>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <Badge label={`${eq.membros.length} membros`} color={C.lilac} />
                <Btn variant="outline" onClick={() => handleEdit(eq)} style={{ padding: "4px 6px" }}><EditIcon /></Btn>
                <Btn variant="danger" onClick={() => handleDelete(eq.id)} style={{ padding: "4px 6px" }}><TrashIcon /></Btn>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {eq.membros.map(m => (
                <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: C.snow, borderRadius: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.lilac, display: "flex", alignItems: "center", justifyContent: "center", color: C.white, fontWeight: 700, fontSize: 12 }}>
                      {(m.nome || m.email || '').split('@')[0].slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{m.nome}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{m.cargo}</div>
                    </div>
                  </div>
                  <button onClick={() => handleRemoveMembro(eq.id, m.id)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", padding: 4 }} title="Remover membro">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              ))}
              <Btn variant="outline" onClick={() => openMembroModal(eq.id)} style={{ padding: "6px 12px", fontSize: 12, alignSelf: "center" }}><UserPlusIcon /> Adicionar Membro</Btn>
            </div>
          </Card>
        ))}
      </div>

      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "#0006", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
          onClick={() => setShowModal(false)}>
          <div style={{ background: C.white, borderRadius: 16, padding: 32, width: 420 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 20 }}>{editId ? "Editar Equipe" : "Nova Equipe"}</div>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Nome *</label>
                <input required value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Gamma" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.ghost}`, boxSizing: "border-box", fontSize: 13 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Supervisão</label>
                <input value={form.supervisao} onChange={e => setForm({ ...form, supervisao: e.target.value })} placeholder="Ex: Gerência Regional SP" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.ghost}`, boxSizing: "border-box", fontSize: 13 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Supervisor (usuário)</label>
                <select value={form.supervisorId} onChange={e => setForm({ ...form, supervisorId: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.ghost}`, fontSize: 13 }}>
                  <option value="">— Selecione —</option>
                  {usuarios.map(u => <option key={u.id} value={u.id}>{u.email} ({u.role})</option>)}
                </select>
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: "10px 20px", borderRadius: 8, border: `1px solid ${C.ghost}`, background: C.white, color: C.muted, cursor: "pointer", fontWeight: 600 }}>Cancelar</button>
                <button type="submit" style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: C.lilac, color: C.white, cursor: "pointer", fontWeight: 600 }}>Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMembroModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "#0006", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
          onClick={() => setShowMembroModal(false)}>
          <div style={{ background: C.white, borderRadius: 16, padding: 32, width: 420 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 20 }}>Adicionar Membro</div>
            <form onSubmit={handleAddMembro} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Usuário</label>
                <select required value={membroForm.id} onChange={e => {
                  const user = usuarios.find(u => u.id === e.target.value);
                  if (user) setMembroForm({ id: user.id, nome: user.email.split('@')[0], cargo: user.role, nivel: user.level });
                }} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.ghost}`, fontSize: 13 }}>
                  <option value="">— Selecione —</option>
                  {usuarios.map(u => <option key={u.id} value={u.id}>{u.email} ({u.role})</option>)}
                </select>
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
                <button type="button" onClick={() => setShowMembroModal(false)} style={{ padding: "10px 20px", borderRadius: 8, border: `1px solid ${C.ghost}`, background: C.white, color: C.muted, cursor: "pointer", fontWeight: 600 }}>Cancelar</button>
                <button type="submit" style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: C.lilac, color: C.white, cursor: "pointer", fontWeight: 600 }}>Adicionar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
