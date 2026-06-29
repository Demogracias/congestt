import { useToast } from "./Toast";

const C = {
  deep: "#1E1245", purple: "#2D1B69", mid: "#4A2C8F", lilac: "#7C5CBF",
  soft: "#B39DDB", ghost: "#EDE7F6", snow: "#F8F6FF", white: "#FFFFFF",
  success: "#4CAF82", warn: "#F59E0B", danger: "#EF4444", text: "#1A0F3C", muted: "#6B5B8C",
};

function Badge({ label, color = C.lilac }) {
  return <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: color + "22", color, display: "inline-block" }}>{label}</span>;
}

function safeArray(arr) {
  return Array.isArray(arr) ? arr : [];
}

function getMonthStr(mes) {
  return String(mes).endsWith("-") ? mes : `${mes}-`;
}

export default function TaskForm({ 
  form, setForm, onSubmit, onCancel, editando, modalMode, 
  empresas = [], contas = [], usuarios = [], equipes = [], 
  atividades = [], subatividades = [], setSubatividades 
}) {
  const toast = useToast();
  const isView = modalMode === 'view';
  const isEdit = modalMode === 'edit';

  const getFilteredUsuarios = () => {
    let filtered = safeArray(usuarios);
    if (form?.empresaId) {
      const emp = safeArray(empresas).find(e => e.id === form.empresaId);
      if (emp) {
        const eq = safeArray(equipes).find(e => e.nome === emp.equipe);
        const membrosObj = eq?.membros || {};
        const membrosNomes = Object.values(membrosObj).map(m => m?.nome).filter(Boolean);
        if (membrosNomes.length) {
          filtered = filtered.filter(u => membrosNomes.includes((u?.email || '').split('@')[0]));
        }
      }
    }
    return filtered;
  };

  const safeMeses = safeArray(form?.meses);
  const curYear = new Date().getFullYear();
  const yearList = [curYear - 1, curYear, curYear + 1, curYear + 2];
  const monthNames = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const monthStrs = ["01","02","03","04","05","06","07","08","09","10","11","12"];

  const isYearSelected = (y) => safeMeses.some(m => String(m).startsWith(`${y}-`));
  const isMonthSelected = (monthStr) => safeMeses.some(m => String(m).endsWith(`-${monthStr}`));

  const handleYearClick = (y) => {
    if (isView) return;
    const current = safeMeses;
    const monthsForYear = monthStrs.map(m => `${y}-${m}`);
    if (isYearSelected(y)) {
      setForm({ ...form, meses: current.filter(m => !String(m).startsWith(`${y}-`)) });
    } else {
      setForm({ ...form, meses: [...new Set([...current, ...monthsForYear])] });
    }
  };

  const handleMonthClick = (monthStr) => {
    if (isView) return;
    const current = safeMeses;
    const selectedYears = [...new Set(current.map(m => String(m).split('-')[0]))];
    const targetYears = selectedYears.length > 0 ? selectedYears : [String(curYear)];
    if (isMonthSelected(monthStr)) {
      setForm({ ...form, meses: current.filter(m => !String(m).endsWith(`-${monthStr}`)) });
    } else {
      const newMeses = targetYears.map(y => `${y}-${monthStr}`);
      setForm({ ...form, meses: [...current, ...newMeses] });
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(e); }} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Título *</label>
        <input 
          required 
          disabled={isView} 
          value={form?.titulo || ''} 
          onChange={e => setForm({ ...form, titulo: e.target.value })} 
          placeholder="Ex: Fechamento Mensal" 
          style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.ghost}`, boxSizing: "border-box", fontSize: 13 }} 
        />
      </div>

      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Descrição</label>
        <textarea 
          disabled={isView} 
          value={form?.descricao || ''} 
          onChange={e => setForm({ ...form, descricao: e.target.value })} 
          rows={2} 
          placeholder="Descrição da tarefa" 
          style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.ghost}`, boxSizing: "border-box", fontSize: 13, resize: "vertical" }} 
        />
      </div>

       <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Atividade Pai (Hierarquia)</label>
          <select 
            disabled={isView} 
            value={form?.paiId || ''} 
            onChange={e => setForm({ ...form, paiId: e.target.value })} 
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.ghost}`, fontSize: 13 }}
          >
            <option value="">— Nenhuma (Tarefa Raiz) —</option>
            {safeArray(atividades).filter(a => a.id !== form?.id).map(a => <option key={a.id} value={a.id}>{a.titulo}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Vincular Empresa</label>
          <select 
            disabled={isView} 
            value={form?.empresaId || ''} 
            onChange={e => setForm({ ...form, empresaId: e.target.value })} 
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.ghost}`, fontSize: 13 }}
          >
            <option value="">— Sem empresa —</option>
            {safeArray(empresas).map(e => <option key={e.id} value={e.id}>{e.apelido} - {e.razaoSocial}</option>)}
          </select>
        </div>
       </div>
       <div>
         <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Contas Contábeis</label>
         <div style={{ width: "100%", maxHeight: 150, overflowY: "auto", border: `1px solid ${C.ghost}`, borderRadius: 8, padding: "4px", background: C.white }}>
           {safeArray(contas).filter(c => c?.ativa && (!c.empresaId || c.empresaId === form?.empresaId)).map(c => {
             const ids = safeArray(form?.contaContabilIds);
             const sel = ids.includes(c.id);
             return (
               <div key={c.id} onClick={() => { if (isView) return;
                 const currentIds = safeArray(form?.contaContabilIds);
                 let nextIds = [...currentIds];
                 if (sel) {
                   nextIds = nextIds.filter(id => id !== c.id);
                 } else {
                   nextIds.push(c.id);
                   if (c.natureza === "Sintética") {
                     const children = safeArray(contas).filter(child => child.contaPaiId === c.id).map(child => child.id);
                     nextIds = [...new Set([...nextIds, ...children])];
                   }
                 }
                 setForm({ ...form, contaContabilIds: nextIds });
               }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", cursor: isView ? "default" : "pointer", borderRadius: 6, fontSize: 12, background: sel ? C.snow : "transparent", color: C.text }}>
                 <input type="checkbox" checked={sel} readOnly style={{ cursor: "pointer" }} />
                 <span style={{ fontFamily: "monospace", fontSize: 11, color: C.muted }}>{c.codigo || '—'}</span>
                 <span style={{ flex: 1 }}>{c.nome || '—'}</span>
                 <Badge label={c.natureza || '—'} color={C.muted} />
               </div>
             );
           })}
           {safeArray(contas).filter(c => c?.ativa && (!c?.empresaId || c?.empresaId === (form?.empresaId || ''))).length === 0 && (
             <div style={{ textAlign: "center", padding: "10px", fontSize: 12, color: C.muted }}>Nenhuma conta encontrada</div>
           )}
         </div>
       </div>

<div>
        <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Responsáveis</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: "6px 8px", borderRadius: 8, border: `1px solid ${C.ghost}`, minHeight: 36 }}>
          {getFilteredUsuarios().map(u => {
            const sel = safeArray(form?.responsaveis).includes(u?.id);
            return (
              <span key={u?.id} onClick={() => { if (isView) return;
                const currentRes = safeArray(form?.responsaveis);
                setForm({ ...form, responsaveis: sel ? currentRes.filter(r => r !== u?.id) : [...currentRes, u?.id] }); }}
                style={{ fontSize: 11, padding: "2px 8px", borderRadius: 12, cursor: isView ? "default" : "pointer", background: sel ? C.lilac : C.snow, color: sel ? C.white : C.muted, fontWeight: 600, userSelect: "none", border: `1px solid ${sel ? C.lilac : C.ghost}` }}>
                {u?.email?.split('@')[0] || 'Usuário'} ({u?.role || '—'})
              </span>
            );
          })}
        </div>
      </div>

      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Competências (Períodos)</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.text, marginBottom: 2 }}>Anos</div>
            <div style={{ maxHeight: 100, overflowY: "auto", border: `1px solid ${C.ghost}`, borderRadius: 8, padding: "4px" }}>
              {yearList.map(y => (
                <div key={y} onClick={() => handleYearClick(y)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 8px", cursor: isView ? "default" : "pointer", borderRadius: 4, fontSize: 12, background: isYearSelected(y) ? C.snow : "transparent" }}>
                  <input type="checkbox" checked={isYearSelected(y)} readOnly /> {y}
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.text, marginBottom: 2 }}>Meses</div>
            <div style={{ maxHeight: 100, overflowY: "auto", border: `1px solid ${C.ghost}`, borderRadius: 8, padding: "4px" }}>
              {monthNames.map((m, i) => {
                const monthStr = monthStrs[i];
                const isSel = isMonthSelected(monthStr);
                return (
                  <div key={m} onClick={() => handleMonthClick(monthStr)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 8px", cursor: isView ? "default" : "pointer", borderRadius: 4, fontSize: 12, background: isSel ? C.snow : "transparent" }}>
                    <input type="checkbox" checked={isSel} readOnly /> {m}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

<div>
        <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>
          Subatividades
          <span onClick={() => { if (isView) return; setSubatividades([...safeArray(subatividades), '']); }} style={{ marginLeft: 8, fontSize: 11, color: C.lilac, cursor: "pointer", fontWeight: 600 }}>+ Adicionar</span>
        </label>
        {safeArray(subatividades).map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 4, marginBottom: 4 }}>
            <input 
              disabled={isView}
              value={s} 
              onChange={e => { 
                const n = [...safeArray(subatividades)]; 
                n[i] = e.target.value; 
                setSubatividades(n); 
              }} 
              placeholder="Subatividade" 
              style={{ flex: 1, padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.ghost}`, fontSize: 12 }} 
            />
            <button type="button" onClick={() => { if (isView) return; setSubatividades(safeArray(subatividades).filter((_, j) => j !== i)); }} style={{ border: "none", background: C.danger + "11", color: C.danger, borderRadius: 6, cursor: "pointer", padding: "4px 8px", fontWeight: 600, fontSize: 12 }}>X</button>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Data Início *</label>
          <input type="date" required disabled={isView} value={form?.dataInicio || ''} onChange={e => setForm({ ...form, dataInicio: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.ghost}`, boxSizing: "border-box", fontSize: 13 }} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Data Fim *</label>
          <input type="date" required disabled={isView} value={form?.dataFim || ''} onChange={e => {
            const val = e.target.value;
            setForm({ ...form, dataFim: val });
            if (form?.dataInicio && val && val < form.dataInicio) {
              toast('Data fim não pode ser anterior à data início', 'error');
            }
          }} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.ghost}`, boxSizing: "border-box", fontSize: 13 }} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Recorrência</label>
          <select disabled={isView} value={form?.recorrenciaTipo || ''} onChange={e => setForm({ ...form, recorrenciaTipo: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.ghost}`, fontSize: 13 }}>
            <option value="">Sem recorrência</option>
            <option value="semanal">Semanal</option>
            <option value="mensal">Mensal</option>
            <option value="anual">Anual</option>
          </select>
        </div>
        {(form?.recorrenciaTipo) && (
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Intervalo</label>
            <input type="number" min="1" disabled={isView} value={form?.recorrenciaIntervalo || 1} onChange={e => setForm({ ...form, recorrenciaIntervalo: parseInt(e.target.value) || 1 })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.ghost}`, boxSizing: "border-box", fontSize: 13 }} />
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
        <button type="button" onClick={onCancel} style={{ padding: "10px 20px", borderRadius: 8, border: `1px solid ${C.ghost}`, background: C.white, color: C.muted, cursor: "pointer", fontWeight: 600 }}>Cancelar</button>
        {!isView && (
          <button type="submit" style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: C.lilac, color: C.white, cursor: "pointer", fontWeight: 600 }}>
            {isEdit ? 'Salvar Alterações' : 'Criar Tarefa'}
          </button>
        )}
      </div>
    </form>
  );
}