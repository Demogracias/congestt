import { useState, useEffect } from "react";
import TaskForm from "../components/TaskForm";
import PromptModal from "../components/PromptModal";
import { useToast } from "../components/Toast";
const C = {
  deep: "#1E1245", purple: "#2D1B69", mid: "#4A2C8F", lilac: "#7C5CBF",
  soft: "#B39DDB", ghost: "#EDE7F6", snow: "#F8F6FF", white: "#FFFFFF",
  success: "#4CAF82", warn: "#F59E0B", danger: "#EF4444", text: "#1A0F3C", muted: "#6B5B8C",
};

function Card({ children, style = {} }) {
  return <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.ghost}`, padding: "16px 20px", ...style }}>{children}</div>;
}
function Badge({ label, color = C.lilac, bg }) {
  return <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: bg || color + "22", color, display: "inline-block" }}>{label}</span>;
}
function Btn({ children, variant = "primary", onClick, style = {} }) {
  const styles = { primary: { background: C.lilac, color: C.white, border: "none" }, outline: { background: "transparent", color: C.lilac, border: `1.5px solid ${C.lilac}` }, success: { background: C.success, color: C.white, border: "none" }, danger: { background: C.danger, color: C.white, border: "none" }, warn: { background: C.warn, color: C.white, border: "none" } };
  return <button onClick={onClick} style={{ ...(styles[variant] || styles.primary), borderRadius: 8, padding: "6px 12px", fontWeight: 600, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, ...style }}>{children}</button>;
}

const PlusIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>);
const PlayIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>);
const PauseIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>);
const StopIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>);
const HistoryIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>);
const NoteIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>);

function PauseJustificativaModal({ onConfirm, onCancel }) {
  const [value, setValue] = useState("");
  return (
    <div style={{ position: "fixed", inset: 0, background: "#0005", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}
      onClick={onCancel}>
      <div style={{ background: C.white, borderRadius: 16, padding: 28, width: "100%", maxWidth: 400, boxShadow: "0 20px 40px #0004" }}
        onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 16px", color: C.text, fontSize: 16 }}>Justificativa da Pausa</h3>
        <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Justificativa (mínimo 3 caracteres):</label>
        <input value={value} onChange={e => setValue(e.target.value)} autoFocus
          style={{ width: "100%", padding: "12px", borderRadius: 8, border: `1px solid ${C.ghost}`, boxSizing: "border-box", marginBottom: 16 }} />
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{ background: C.snow, color: C.muted, border: `1px solid ${C.ghost}`, borderRadius: 8, padding: "10px 20px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Cancelar</button>
          <button onClick={() => onConfirm(value)} style={{ background: C.lilac, color: C.white, border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Confirmar</button>
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds) {
  if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) seconds = 0;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

const monthNames = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const dayNames = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

function CalendarView({ atividades, empresas, elapsed, user, handleAction, handlePause, setShowNota, openEdit, onViewDetails }) {
  const [ano, setAno] = useState(new Date().getFullYear());
  const [mes, setMes] = useState(new Date().getMonth());
  const [diaSelecionado, setDiaSelecionado] = useState(null);
  const [visaoCal, setVisaoCal] = useState('mes');
  const [semanaOffset, setSemanaOffset] = useState(0);

  const today = new Date();

  const firstDay = new Date(ano, mes, 1).getDay();
  const daysInMonth = new Date(ano, mes + 1, 0).getDate();

  const getMonday = (d) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const getWeekDates = (offset) => {
    const monday = getMonday(new Date());
    monday.setDate(monday.getDate() + offset * 7);
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const weekDates = getWeekDates(semanaOffset);

  const prevMonth = () => { if (mes === 0) { setAno(ano - 1); setMes(11); } else setMes(mes - 1); setDiaSelecionado(null); };
  const nextMonth = () => { if (mes === 11) { setAno(ano + 1); setMes(0); } else setMes(mes + 1); setDiaSelecionado(null); };

  const getTasksForDay = (year, month, day) => {
    const targetStart = new Date(year, month, day);
    const targetEnd = new Date(year, month, day + 1);

    return (atividades || []).filter(a => {
      if (!a || !a.dataInicio) return false;
      const inicio = new Date(a.dataInicio + 'T00:00:00-03:00');
      const fim = a.dataFim ? new Date(a.dataFim + 'T23:59:59-03:00') : inicio;
      return targetStart <= fim && targetEnd > inicio;
    });
  };

  const dias = [];
  for (let i = 0; i < firstDay; i++) dias.push(null);
  for (let d = 1; d <= daysInMonth; d++) dias.push(d);

  const statusColor = (s) => s === 'completed' ? C.success : s === 'running' ? C.warn : s === 'paused' ? C.lilac : C.muted;

  return (
    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
      <Card style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 4 }}>
            <button onClick={visaoCal === 'mes' ? prevMonth : () => setSemanaOffset(semanaOffset - 1)} style={{ border: `1px solid ${C.ghost}`, background: C.white, borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontWeight: 600, color: C.muted, fontSize: 16 }}>‹</button>
            <button onClick={() => setVisaoCal('mes')} style={{ padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600, border: `1.5px solid ${visaoCal === 'mes' ? C.lilac : C.ghost}`, background: visaoCal === 'mes' ? C.lilac : C.white, color: visaoCal === 'mes' ? C.white : C.muted, cursor: "pointer" }}>Mês</button>
            <button onClick={() => { setVisaoCal('semana'); setDiaSelecionado(null); setSemanaOffset(0); }} style={{ padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600, border: `1.5px solid ${visaoCal === 'semana' ? C.lilac : C.ghost}`, background: visaoCal === 'semana' ? C.lilac : C.white, color: visaoCal === 'semana' ? C.white : C.muted, cursor: "pointer" }}>Semana</button>
            <button onClick={visaoCal === 'mes' ? nextMonth : () => setSemanaOffset(semanaOffset + 1)} style={{ border: `1px solid ${C.ghost}`, background: C.white, borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontWeight: 600, color: C.muted, fontSize: 16 }}>›</button>
          </div>
          <div style={{ fontWeight: 700, fontSize: 18, color: C.text }}>
            {visaoCal === 'mes' ? `${monthNames[mes]} ${ano}` : `${weekDates[0].getDate()}/${weekDates[0].getMonth()+1} - ${weekDates[6].getDate()}/${weekDates[6].getMonth()+1}/${weekDates[6].getFullYear()}`}
          </div>
        </div>
        {visaoCal === 'mes' ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
            {dayNames.map(d => <div key={d} style={{ fontWeight: 600, fontSize: 11, color: C.muted, textAlign: "center", padding: "6px 0" }}>{d}</div>)}
            {dias.map((d, i) => {
              if (d === null) return <div key={`e${i}`} />;
              const dayTasks = getTasksForDay(ano, mes, d);
              const isToday = today.getFullYear() === ano && today.getMonth() === mes && today.getDate() === d;
              const isSelected = diaSelecionado === d;
              return (
                      <div key={d} onClick={() => { setDiaSelecionado(isSelected ? null : d); }}
                        style={{ border: `1px solid ${C.ghost}`, borderRadius: 8, padding: 4, minHeight: 72, cursor: "pointer", background: isSelected ? C.snow : C.white, outline: isToday ? `2px solid ${C.lilac}` : undefined, outlineOffset: -1 }}>
                  <div style={{ fontSize: 11, fontWeight: isToday ? 800 : 600, color: isToday ? C.lilac : C.text, marginBottom: 2, textAlign: "right", padding: "1px 2px" }}>{d}</div>
                  {dayTasks.slice(0, 3).map(t => (
                    <div key={t.id} title={t.titulo} style={{ fontSize: 9, padding: "1px 3px", marginBottom: 1, borderRadius: 3, background: statusColor(t.status) + "22", color: statusColor(t.status), fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {t.titulo}
                    </div>
                  ))}
                  {dayTasks.length > 3 && <div style={{ fontSize: 9, color: C.muted, textAlign: "center" }}>+{dayTasks.length - 3}</div>}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
            {dayNames.map((d, i) => {
              const date = weekDates[i];
              const dayTasks = getTasksForDay(date.getFullYear(), date.getMonth(), date.getDate());
              const isToday = today.toDateString() === date.toDateString();
              return (
                <div key={date.toISOString().slice(0,10)}>
                  <div style={{ fontWeight: 600, fontSize: 11, color: C.muted, textAlign: "center", padding: "6px 0" }}>{d}</div>
                      <div onClick={() => { const isSel = diaSelecionado instanceof Date && diaSelecionado.getTime() === date.getTime(); setDiaSelecionado(isSel ? null : date); }}
                        style={{ border: `1px solid ${C.ghost}`, borderRadius: 8, padding: 4, minHeight: 100, cursor: "pointer", background: diaSelecionado instanceof Date && diaSelecionado.getTime() === date.getTime() ? C.snow : C.white, outline: isToday ? `2px solid ${C.lilac}` : undefined, outlineOffset: -1 }}>
                    <div style={{ fontSize: 11, fontWeight: isToday ? 800 : 600, color: isToday ? C.lilac : C.text, marginBottom: 2, textAlign: "right", padding: "1px 2px" }}>{date.getDate()}</div>
                    {dayTasks.slice(0, 4).map(t => (
                      <div key={t.id} title={t.titulo} style={{ fontSize: 9, padding: "1px 3px", marginBottom: 1, borderRadius: 3, background: statusColor(t.status) + "22", color: statusColor(t.status), fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {t.titulo}
                      </div>
                    ))}
                    {dayTasks.length > 4 && <div style={{ fontSize: 9, color: C.muted, textAlign: "center" }}>+{dayTasks.length - 4}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
      {diaSelecionado && (
        <Card style={{ width: 320, flexShrink: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 12 }}>
            {diaSelecionado instanceof Date ? `${diaSelecionado.getDate()} de ${monthNames[diaSelecionado.getMonth()]}` : `${diaSelecionado} de ${monthNames[mes]}`}
          </div>
          {(() => {
            const dayTasks = diaSelecionado instanceof Date
              ? getTasksForDay(diaSelecionado.getFullYear(), diaSelecionado.getMonth(), diaSelecionado.getDate())
              : getTasksForDay(ano, mes, diaSelecionado);
            if (dayTasks.length === 0) return <div style={{ fontSize: 13, color: C.muted }}>Nenhuma tarefa neste dia.</div>;
            return dayTasks.map(t => (
              <div key={t.id} onClick={() => onViewDetails(t)} style={{ padding: "8px 10px", borderLeft: `3px solid ${statusColor(t.status)}`, marginBottom: 8, background: C.snow, borderRadius: 6, cursor: "pointer" }}>
                <div style={{ fontWeight: 600, fontSize: 12, color: C.text }}>{t.titulo}</div>
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>{empresas.find(e => e.id === t.empresaId)?.apelido || 'Sem empresa'}</div>
                <div style={{ fontSize: 10, color: C.muted, fontFamily: "monospace", marginBottom: 6 }}>{formatTime(elapsed[t.id] || 0)}</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {t.status === 'pending' && <><Btn variant="success" onClick={() => handleAction(t.id, "start", { usuarioId: user?.id })}><PlayIcon /> Iniciar</Btn><Btn variant="outline" onClick={() => openEdit(t)} style={{ fontSize: 9, padding: "3px 6px" }}>Editar</Btn></>}
                  {t.status === 'running' && <><Btn variant="warn" onClick={() => handlePause(t.id)}><PauseIcon /> Pausar</Btn><Btn variant="success" onClick={() => { if (confirm("Concluir?")) handleAction(t.id, "complete"); }}><StopIcon /> Concluir</Btn></>}
                  {t.status === 'paused' && <Btn variant="success" onClick={() => handleAction(t.id, "resume", { tipo: "normal" })}><PlayIcon /> Retomar</Btn>}
                  <Btn variant="outline" onClick={() => setShowNota({ id: t.id, texto: '' })}><NoteIcon /> Anotar</Btn>
                </div>
              </div>
            ));
          })()}
        </Card>
      )}
    </div>
  );
}

const TaskDetailModal = ({ ativ, onClose, empresas, contas, onEdit, atividades }) => {
  const taskToast = useToast();
  const [taskConfirm, setTaskConfirm] = useState({ open: false, message: '', onConfirm: () => {} });
  if (!ativ) return null;
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "#0006", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: C.white, borderRadius: 16, padding: 32, width: 600, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>Detalhes da Tarefa</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {ativ.status === 'pending' && <button onClick={() => { onEdit(ativ); onClose(); }} style={{ padding: "6px 14px", borderRadius: 8, border: `1.5px solid ${C.lilac}`, background: C.white, color: C.lilac, cursor: "pointer", fontWeight: 600, fontSize: 12 }}>Editar</button>}
            <button onClick={onClose} style={{ border: "none", background: "transparent", fontSize: 24, cursor: "pointer", color: C.muted }}>&times;</button>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, display: "block" }}>Título</label>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{ativ.titulo}</div>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, display: "block" }}>Status</label>
              <Badge label={ativ.status === 'pending' ? 'Pendente' : ativ.status === 'running' ? 'Em Andamento' : ativ.status === 'paused' ? 'Pausada' : 'Concluída'} color={ativ.status === 'completed' ? C.success : ativ.status === 'running' ? C.warn : ativ.status === 'paused' ? C.lilac : C.muted} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, display: "block" }}>Descrição</label>
            <div style={{ fontSize: 14, color: C.text }}>{ativ.descricao || 'Sem descrição'}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, display: "block" }}>Empresa</label>
              <div style={{ fontSize: 14, color: C.text }}>{empresas.find(e => e.id === ativ.empresaId)?.apelido || 'Não vinculada'}</div>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, display: "block" }}>Competências</label>
               <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{ (ativ.meses || []).map(m => <Badge key={m} label={m} color={C.soft} />)}</div>
            </div>
          </div>
           <div>
             <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, display: "block" }}>Contas Contábeis</label>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {(ativ.contaContabilIds || []).map(id => {
                  const c = contas.find(con => con.id === id);
                  return c ? <Badge key={id} label={`${c.codigo} - ${c.nome}`} color={C.lilac} /> : null;
                }) || 'Nenhuma conta vinculada'}
              </div>
           </div>
           <div>
             <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, display: "block" }}>Bloqueado por</label>
             <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
               {(ativ.bloqueadoPor || []).map(bid => {
                 const b = atividades.find(a => a.id === bid);
                 return b ? (
                   <Badge key={bid} label={b.titulo} color={C.danger} 
                     style={{ display: "flex", alignItems: "center", gap: 4 }}
                   >
                        <span onClick={() => setTaskConfirm({ open: true, message: `Remover bloqueio de ${b.titulo}?`, onConfirm: async () => {
                            try {
                              const r = await fetch(`/api/planner/${ativ.id}/removerBloqueio`, { 
                                method: "POST", 
                                headers: { "Content-Type": "application/json" }, 
                                body: JSON.stringify({ bloqueadorId: bid }) 
                              });
                              if (r.ok) window.dispatchEvent(new Event('planner-updated'));
                              else { const e = await r.json(); taskToast(e.message, 'error'); }
                            } catch (e) { taskToast("Erro ao remover bloqueio", "error"); }
                        }})}
                     style={{ cursor: "pointer", fontSize: 10 }}
                   >&times;</span >
                   </Badge>
                 ) : null;
               }) || 'Nenhuma dependência'}
             </div>
           </div>
           <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, display: "block" }}>Data Início</label>
              <div style={{ fontSize: 14, color: C.text }}>{ativ.dataInicio}</div>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, display: "block" }}>Data Fim</label>
              <div style={{ fontSize: 14, color: C.text }}>{ativ.dataFim}</div>
            </div>
          </div>
          <hr style={{ border: `none`, borderTop: `1px solid ${C.ghost}`, margin: "10px 0" }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 10 }}>Histórico de Movimentação</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {ativ.historico.map(h => (
                <div key={h.id} style={{ fontSize: 12, padding: "8px", background: C.snow, borderRadius: 6, borderLeft: `3px solid ${C.lilac}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontWeight: 600, color: C.text }}>{h.acao}</span>
                    <span style={{ fontSize: 10, color: C.muted }}>{new Date(h.data).toLocaleString()}</span>
                  </div>
                  <div style={{ fontSize: 11, color: C.muted }}>{h.detalhes}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 10 }}>Anotações</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {ativ.blocosNota.map(n => (
                <div key={n.id} style={{ fontSize: 12, padding: "8px", background: C.snow, borderRadius: 6, fontStyle: "italic", color: C.muted }}>
                  "{n.texto}" <span style={{ fontSize: 10, fontWeight: 600, color: C.lilac, marginLeft: 8 }}>{n.autor} - {new Date(n.criadoEm).toLocaleString()}</span>
                </div>
              ))}
              {ativ.blocosNota.length === 0 && <div style={{ fontSize: 12, color: C.muted, textAlign: "center" }}>Nenhuma anotação registrada.</div>}
            </div>
          </div>
        </div>
      </div>
      {taskConfirm.open && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "#0006", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200 }}
          onClick={() => setTaskConfirm({ ...taskConfirm, open: false })}>
          <div style={{ background: C.white, borderRadius: 16, padding: 32, width: 360 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 20 }}>{taskConfirm.message}</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setTaskConfirm({ ...taskConfirm, open: false })} style={{ padding: "10px 20px", borderRadius: 8, border: `1px solid ${C.ghost}`, background: C.white, color: C.muted, cursor: "pointer", fontWeight: 600 }}>Cancelar</button>
              <button onClick={() => { const cb = taskConfirm.onConfirm; setTaskConfirm({ ...taskConfirm, open: false }); cb(); }} style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: C.lilac, color: C.white, cursor: "pointer", fontWeight: 600 }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Planner() {
  const toast = useToast();
  const [atividades, setAtividades] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [contas, setContas] = useState([]);
  const [equipes, setEquipes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visao, setVisao] = useState("lista");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editando, setEditando] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(null);
  const [showNota, setShowNota] = useState(null);
  const [user] = useState(() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } });
  const [elapsed, setElapsed] = useState({});
  const [filtroEquipe, setFiltroEquipe] = useState("");
  const [filtroEmpresa, setFiltroEmpresa] = useState(null);
  const [filtroConta, setFiltroConta] = useState(null);
  const [filtroMes, setFiltroMes] = useState(null);
  const [subAtiva, setSubAtiva] = useState("ativas");
  const [subatividades, setSubatividades] = useState([]);
  const [form, setForm] = useState({
    empresaId: '', titulo: '', descricao: '', responsaveis: [],
    meses: [], contaContabilIds: [], dataInicio: '', dataFim: '',
    recorrenciaTipo: '', recorrenciaIntervalo: 1, paiId: '',
  });
  const [promptState, setPromptState] = useState({ open: false, title: '', label: '', onConfirm: () => {} });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, message: '', onConfirm: () => {} });
  const [pauseModal, setPauseModal] = useState({ open: false, id: null, step: 'tipo', tipo: 'pausa' });
  const showConfirm = (message, onConfirm) => setConfirmDialog({ open: true, message, onConfirm });
  const closeConfirm = () => setConfirmDialog({ open: false, message: '', onConfirm: () => {} });

  const arquivarConcluidas = (ativs) => {
    const concluidas = ativs.filter(a => a.status === 'completed').sort((a, b) => new Date(b.dataFim || 0) - new Date(a.dataFim || 0));
    if (concluidas.length <= 50) return { ativas: ativs, arquivadas: [] };
    const arquivadas = concluidas.slice(50);
    const ativas = ativs.filter(a => !arquivadas.includes(a));
    return { ativas, arquivadas };
  };

  const getAtividadesParaVisao = () => {
    const { ativas, arquivadas } = arquivarConcluidas(atividades);
    return subAtiva === 'arquivadas' ? arquivadas : ativas;
  };

  useEffect(() => {
    Promise.all([
      fetch("/api/planner").then(r => r.json()).catch(() => []),
      fetch("/api/empresas").then(r => r.json()).catch(() => []),
      fetch("/api/contabil/contas").then(r => r.json()).catch(() => []),
      fetch("/api/equipes").then(r => r.json()).catch(() => []),
      fetch("/api/auth/usuarios").then(r => r.json()).then(d => Array.isArray(d) ? d : []).catch(() => []),
    ]).then(([ativs, emps, c, eqs, usrs]) => {
      setAtividades(Array.isArray(ativs) ? ativs : []);
      setEmpresas(Array.isArray(emps) ? emps : []);
      setContas(Array.isArray(c) ? c : []);
      setEquipes(Array.isArray(eqs) ? eqs : []);
      setUsuarios(Array.isArray(usrs) ? usrs : []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.page === 'planner') {
        if (e.detail.empresaId) setFiltroEmpresa(e.detail.empresaId);
        if (e.detail.contaId) setFiltroConta(e.detail.contaId);
        if (e.detail.mes) {
          const abbr = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
          const idx = abbr.indexOf(e.detail.mes);
          if (idx !== -1 && e.detail.ano) {
            const y = parseInt(e.detail.ano);
            setFiltroMes(`${y}-${(idx+1).toString().padStart(2,'0')}`);
          } else {
            setFiltroMes(e.detail.mes);
          }
        }
        setVisao('lista');
      }
    };
    window.addEventListener("navigate", handler);
    return () => window.removeEventListener("navigate", handler);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const newElapsed = {};
      (atividades || []).forEach(a => {
        if (a.status === 'running' && a.timerStart) {
          newElapsed[a.id] = (a.timerTotal || 0) + (now - new Date(a.timerStart).getTime()) / 1000;
        } else {
          newElapsed[a.id] = a.timerTotal || 0;
        }
      });
      setElapsed(newElapsed);
    }, 1000);
    return () => clearInterval(interval);
  }, [atividades]);

  const fetchAtividades = () => {
    fetch("/api/planner").then(r => r.json()).then(d => { if (Array.isArray(d)) setAtividades(d); }).catch(() => {});
    window.dispatchEvent(new Event('planner-updated'));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      meses: Array.isArray(form.meses) ? form.meses : [form.meses],
      recorrencia: form.recorrenciaTipo ? { tipo: form.recorrenciaTipo, intervalo: form.recorrenciaIntervalo } : undefined,
    };
    if (payload.recorrenciaTipo) delete payload.recorrenciaTipo;
    if (payload.recorrenciaIntervalo) delete payload.recorrenciaIntervalo;

    const emp = empresas.find(e => e.id === form.empresaId);
    if (emp) payload.empresaId = emp.id;
    if (form.contaContabilIds && form.contaContabilIds.length) {
      const nomes = contas.filter(c => form.contaContabilIds.includes(c.id)).map(c => c.nome);
      payload.contaContabilNomes = nomes;
    }

    let res;
    try {
      res = await fetch("/api/planner", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    } catch (e) { toast("Erro de rede", "error"); return; }
    if (!res.ok) { const err = await res.json(); toast(err.message, "error"); return; }
    const created = await res.json();

    for (const st of subatividades) {
      if (!st.trim()) continue;
      const subPayload = { 
        ...payload, 
        titulo: st.trim(), 
        paiId: created.id, 
        dataInicio: payload.dataInicio, 
        dataFim: payload.dataFim, 
        recorrencia: undefined 
      };
      try {
        await fetch("/api/planner", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subPayload),
        });
      } catch (err) {
        toast("Erro ao criar subatividade: " + err.message, "error");
      }
    }

    toast("Tarefa criada com sucesso!", "success");
    setShowModal(false); resetForm(); fetchAtividades();
  };

  const resetForm = () => {
    setForm({ empresaId: '', titulo: '', descricao: '', responsaveis: [], meses: [], contaContabilIds: [], dataInicio: '', dataFim: '', recorrenciaTipo: '', recorrenciaIntervalo: 1, paiId: '' });
    setSubatividades([]);
    setEditando(null);
    setModalMode('create');
  };

  const handleAction = async (id, action, body = {}) => {
    try {
      const res = await fetch(`/api/planner/${id}/${action}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) { 
        fetchAtividades(); 
        if (action === 'complete') {
          checkAndArchive();
        }
        toast("Ação realizada!", "success"); 
      }
      else { const err = await res.json(); toast(err.message || "Erro na requisição", "error"); }
    } catch (e) { toast("Erro de rede: " + e.message, "error"); }
  };

  const checkAndArchive = () => {
    const concluidas = (atividades || []).filter(a => a.status === 'completed').sort((a, b) => new Date(b.dataFim || b.updatedAt || 0) - new Date(a.dataFim || a.updatedAt || 0));
    if (concluidas.length > 50) {
      const paraArquivar = concluidas.slice(50);
      const idsArquivar = paraArquivar.map(a => a.id);
      setAtividades(prev => prev.map(a => idsArquivar.includes(a.id) ? { ...a, arquivada: true } : a));
    }
  };

  const handleBloqueio = async (id) => {
    setPromptState({
      open: true, title: "Bloquear tarefa", label: "ID da atividade que bloqueia esta tarefa:",
      onConfirm: async (bid) => {
        if (!bid) return;
        try {
          const res = await fetch(`/api/planner/${id}/adicionarBloqueio`, { 
            method: "POST", headers: { "Content-Type": "application/json" }, 
            body: JSON.stringify({ bloqueadorId: bid }) 
          });
          if (res.ok) { fetchAtividades(); toast("Bloqueio adicionado!", "success"); }
          else { const err = await res.json(); toast(err.message, "error"); }
        } catch (e) { toast("Erro de rede", "error"); }
      }
    });
  };

  const handlePause = (id) => {
    setPauseModal({ open: true, id, step: 'tipo', tipo: 'pausa' });
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      meses: Array.isArray(form.meses) ? form.meses : [form.meses],
    };
    const emp = empresas.find(e => e.id === form.empresaId);
    if (emp) payload.empresaId = emp.id;
    if (form.contaContabilIds && form.contaContabilIds.length) {
      const nomes = contas.filter(c => form.contaContabilIds.includes(c.id)).map(c => c.nome);
      payload.contaContabilNomes = nomes;
    }

    try {
      const res = await fetch(`/api/planner/${editando.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) { setShowModal(false); resetForm(); fetchAtividades(); toast("Tarefa atualizada!", "success"); }
      else { const err = await res.json(); toast(err.message, "error"); }
    } catch (e) { toast("Erro de rede", "error"); }
  };

  const openEdit = (ativ) => {
    if (!ativ) return;
    const ids = ativ.contaContabilIds || (ativ.contaContabilId ? [ativ.contaContabilId] : []);
    setForm({
      empresaId: ativ.empresaId || '', titulo: ativ.titulo || '', descricao: ativ.descricao || '',
      responsaveis: ativ.responsaveis || [], meses: ativ.meses || [], contaContabilIds: ids,
      dataInicio: ativ.dataInicio || '', dataFim: ativ.dataFim || '',
      recorrenciaTipo: '', recorrenciaIntervalo: 1,
      paiId: ativ.paiId || '',
    });
    setSubatividades(ativ.subatividades || []);
    setEditando(ativ);
    setModalMode('edit');
    setShowModal(true);
  };

  const getFilteredUsuarios = () => {
    let filtered = usuarios || [];
        if (form?.empresaId) {
          const emp = (empresas || []).find(e => e.id === form.empresaId);
          if (emp) {
            const eq = (equipes || []).find(e => e.nome === emp.equipe);
            const membrosNomes = eq?.membros ? Object.values(eq.membros).map(m => m.nome) : [];
            if (membrosNomes.length) filtered = (usuarios || []).filter(u => membrosNomes.includes(u.email.split('@')[0]));
          }
        }
    return filtered;
  };

  const handleNota = async (id) => {
    if (!showNota?.texto) return;
    try {
      const res = await fetch(`/api/planner/${id}/observacoes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ texto: showNota.texto, autor: user?.email || 'anon' }) });
      if (res.ok) { setShowNota(null); fetchAtividades(); }
      else { const err = await res.json(); toast(err.message, "error"); }
    } catch (e) { toast("Erro de rede", "error"); }
  };

  const statusList = [
    { key: 'pending', label: 'Pendentes', color: C.muted },
    { key: 'running', label: 'Em Andamento', color: C.warn },
    { key: 'paused', label: 'Pausadas', color: C.lilac },
    { key: 'completed', label: 'Concluídas', color: C.success },
  ];

  const ativPorEmpresa = {};
  empresas.forEach(emp => {
    ativPorEmpresa[emp.id] = atividades.filter(a => a.empresaId === emp.id);
  });

  if (loading) return <div style={{ color: C.muted, padding: 40, textAlign: "center" }}>Carregando...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", gap: 4 }}>
          {["lista", "grupo", "calendario"].map(v => (
            <button key={v} onClick={() => setVisao(v)} style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, border: `1.5px solid ${visao === v ? C.lilac : C.ghost}`, background: visao === v ? C.lilac : C.white, color: visao === v ? C.white : C.muted, cursor: "pointer", textTransform: "capitalize" }}>
              {v === "lista" ? "Lista" : v === "grupo" ? "Grupo" : "Calendário"}
            </button>
          ))}
          <select value={filtroEquipe} onChange={e => setFiltroEquipe(e.target.value)} style={{ marginLeft: 8, padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.ghost}`, fontSize: 12, color: C.muted }}>
            <option value="">Supervisor: Todas equipes</option>
            {equipes.map(eq => <option key={eq.id} value={eq.nome}>Supervisor: {eq.nome} ({eq.supervisao})</option>)}
          </select>
        </div>
        <Btn onClick={() => { resetForm(); setShowModal(true); }}><PlusIcon /> Nova Tarefa</Btn>
      </div>

       {filtroEquipe && visao === "lista" && (
         <div style={{ fontSize: 12, color: C.muted, padding: "6px 12px", background: C.snow, borderRadius: 8, border: `1px solid ${C.ghost}` }}>
           Filtrando por equipe <strong>{filtroEquipe}</strong> — exibindo executor, empresa e competência
         </div>
       )}
        {(filtroEmpresa || filtroConta || filtroMes !== null) && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {filtroEmpresa && <Badge label={`Empresa: ${empresas.find(e => e.id === filtroEmpresa)?.apelido || '—'}`} color={C.purple} />}
              {filtroConta && <Badge label={`Conta: ${contas.find(c => c.id === filtroConta)?.nome || '—'}`} color={C.mid} />}
              {filtroMes !== null && <Badge label={`Mês: ${filtroMes}`} color={C.soft} />}
            </div>
            <button onClick={() => { setFiltroEmpresa(null); setFiltroConta(null); setFiltroMes(null); }} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 12, border: "none", background: C.ghost, color: C.muted, cursor: "pointer" }}>Limpar Filtros</button>
          </div>
        )}

      {visao === "lista" && (
        <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
          {["ativas", "arquivadas"].map(s => (
            <button key={s} onClick={() => setSubAtiva(s)} style={{ padding: "4px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, border: `1.5px solid ${subAtiva === s ? C.lilac : C.ghost}`, background: subAtiva === s ? C.lilac : C.white, color: subAtiva === s ? C.white : C.muted, cursor: "pointer" }}>{s === "ativas" ? "Ativas" : "Arquivo Antigo"}</button>
          ))}
        </div>
      )}

      {visao === "lista" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, alignItems: "start" }}>
           {statusList.map(st => {
              let filtered = (atividades || []).filter(a => a.status === st.key);
              if (filtroEmpresa) {
                filtered = filtered.filter(a => a.empresaId === filtroEmpresa);
              }
              if (filtroEquipe) {
                const eq = equipes.find(e => e.nome === filtroEquipe);
                const membrosNomes = eq?.membros ? Object.values(eq.membros).map(m => m.nome) : [];
                filtered = filtered.filter(a => a.responsaveis?.some(r => {
                  const usr = usuarios.find(u => u.id === r);
                  return usr && membrosNomes.includes(usr.email.split('@')[0]);
                }));
             }
             if (filtroConta) {
               filtered = filtered.filter(a => (a.contaContabilIds || []).includes(filtroConta) || a.contaContabilId === filtroConta);
             }
              if (filtroMes !== null) {
                filtered = filtered.filter(a => (a.meses || []).some(m => m === filtroMes || m.startsWith(filtroMes)));
              }
              if (subAtiva === "ativas") {
                filtered = filtered.filter(a => !a.arquivada);
              } else if (subAtiva === "arquivadas") {
                filtered = filtered.filter(a => a.arquivada);
              }
              return (
               <div key={st.key}>
                <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: st.color }} />
                  {st.label} <Badge label={filtered.length} color={st.color} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                     {filtered.length === 0 && <div style={{ padding: 20, textAlign: "center", color: C.muted, fontSize: 12 }}>Nenhuma tarefa</div>}
                     {filtered.map(ativ => (
                        <Card key={ativ.id} style={{ padding: "12px 14px", cursor: "pointer", borderLeft: `3px solid ${st.color}`, marginLeft: (ativ.nivel || 0) * 12 }}
                          onClick={() => setShowDetailModal(ativ)}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: C.text, marginBottom: 4 }}>{ativ.titulo}</div>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 4 }}>
                        {ativ.empresaId && <Badge label={empresas.find(e => e.id === ativ.empresaId)?.apelido || '—'} color={C.purple} />}
                        {ativ.meses?.map(m => <Badge key={m} label={m} color={C.soft} />)}
                      </div>
                      {filtroEquipe && (
                        <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>
                          {ativ.responsaveis?.map(r => {
                            const usr = usuarios.find(u => u.id === r);
                            return usr ? <Badge key={r} label={usr.email.split('@')[0]} color={C.mid} /> : null;
                          })}
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: C.muted, fontFamily: "monospace" }}>{formatTime(elapsed[ativ.id] || 0)}</div>
                      <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginTop: 4 }} onClick={e => e.stopPropagation()}>
                        {ativ.status === 'pending' && <><Btn variant="success" onClick={() => handleAction(ativ.id, "start", { usuarioId: user?.id })}><PlayIcon /></Btn><Btn variant="outline" onClick={() => openEdit(ativ)} style={{ fontSize: 9, padding: "3px 6px" }}>Editar</Btn></>}
                        {ativ.status === 'running' && <><Btn variant="warn" onClick={() => handlePause(ativ.id)}><PauseIcon /></Btn><Btn variant="success" onClick={() => showConfirm("Concluir tarefa?", () => handleAction(ativ.id, "complete"))}><StopIcon /></Btn></>}
                        {ativ.status === 'paused' && <Btn variant="success" onClick={() => handleAction(ativ.id, "resume", { tipo: "normal" })}><PlayIcon /> Retomar</Btn>}
                        <Btn variant="outline" onClick={() => setShowNota({ id: ativ.id, texto: '' })}><NoteIcon /></Btn>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {visao === "grupo" && (
        <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
          {["ativas", "arquivadas"].map(s => (
            <button key={s} onClick={() => setSubAtiva(s)} style={{ padding: "4px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, border: `1.5px solid ${subAtiva === s ? C.lilac : C.ghost}`, background: subAtiva === s ? C.lilac : C.white, color: subAtiva === s ? C.white : C.muted, cursor: "pointer" }}>{s === "ativas" ? "Ativas" : "Arquivo Antigo"}</button>
          ))}
        </div>
      )}

      {visao === "grupo" && (
        <div style={{ overflowX: "auto" }}>
          <div style={{ display: "flex", gap: 16, minWidth: "max-content" }}>
             { (empresas || []).map(emp => {
               let ativs = (atividades || []).filter(a => a.empresaId === emp.id);
                if (filtroEmpresa) {
                  ativs = ativs.filter(a => a.empresaId === filtroEmpresa);
                }
                if (filtroEquipe) {
                  const eq = equipes.find(e => e.nome === filtroEquipe);
                const membrosIds = eq?.membros ? Object.values(eq.membros).map(m => m.id) : [];
                ativs = ativs.filter(a => a.responsaveis?.some(r => membrosIds.includes(r)));
               }
               if (filtroConta) {
                 ativs = ativs.filter(a => (a.contaContabilIds || []).includes(filtroConta) || a.contaContabilId === filtroConta);
               }
                if (filtroMes !== null) {
                  ativs = ativs.filter(a => (a.meses || []).some(m => m === filtroMes || m.startsWith(filtroMes)));
                }
                if (subAtiva === "ativas") {
                  ativs = ativs.filter(a => !a.arquivada);
                } else if (subAtiva === "arquivadas") {
                  ativs = ativs.filter(a => a.arquivada);
                }
                if (ativs.length === 0) return null;
              return (
                <div key={emp.id} style={{ minWidth: 260 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.purple, marginBottom: 8, padding: "0 4px" }}>{emp.apelido} <Badge label={ativs.length} color={C.lilac} /></div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                     {ativs.map(ativ => (
                        <Card key={ativ.id} style={{ padding: "10px 12px", borderLeft: `3px solid ${ativ.status === 'completed' ? C.success : ativ.status === 'running' ? C.warn : ativ.status === 'paused' ? C.lilac : C.muted}`, marginLeft: (ativ.nivel || 0) * 12 }}
                          onClick={() => setShowDetailModal(ativ)}>
                          <div style={{ fontWeight: 600, fontSize: 12, color: C.text }}>{ativ.titulo}</div>
                        <div style={{ fontSize: 11, color: C.muted }}>{ativ.meses?.join(', ')}</div>
                        <div style={{ fontSize: 10, color: C.muted, fontFamily: "monospace", marginBottom: 4 }}>{formatTime(elapsed[ativ.id] || 0)}</div>
                        <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                          {ativ.status === 'pending' && <><Btn variant="success" onClick={() => handleAction(ativ.id, "start", { usuarioId: user?.id })}><PlayIcon /></Btn><Btn variant="outline" onClick={() => openEdit(ativ)} style={{ fontSize: 9, padding: "3px 6px" }}>Editar</Btn></>}
                          {ativ.status === 'running' && <><Btn variant="warn" onClick={() => handlePause(ativ.id)}><PauseIcon /></Btn><Btn variant="success" onClick={() => showConfirm("Concluir tarefa?", () => handleAction(ativ.id, "complete"))}><StopIcon /></Btn></>}
                          {ativ.status === 'paused' && <Btn variant="success" onClick={() => handleAction(ativ.id, "resume", { tipo: "normal" })}><PlayIcon /></Btn>}
                          <Btn variant="outline" onClick={() => setShowNota({ id: ativ.id, texto: '' })} style={{ fontSize: 9, padding: "3px 6px" }}><NoteIcon /></Btn>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
<div style={{ minWidth: 260 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: C.muted, marginBottom: 8, padding: "0 4px" }}>Sem empresa <Badge label={(atividades || []).filter(a => !a.empresaId && (subAtiva === "ativas" ? !a.arquivada : a.arquivada)).length} color={C.muted} /></div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {(atividades || []).filter(a => !a.empresaId && (subAtiva === "ativas" ? !a.arquivada : a.arquivada)).map(ativ => (
                  <Card key={ativ.id} style={{ padding: "10px 12px", borderLeft: `3px solid ${C.muted}` }}>
                    <div style={{ fontWeight: 600, fontSize: 12, color: C.text }}>{ativ.titulo}</div>
                    <div style={{ fontSize: 10, color: C.muted }}>{formatTime(elapsed[ativ.id] || 0)}</div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {visao === "calendario" && <CalendarView atividades={atividades} empresas={empresas} elapsed={elapsed} user={user} handleAction={handleAction} handlePause={handlePause} setShowNota={setShowNota} openEdit={openEdit} onViewDetails={(ativ) => setShowDetailModal(ativ)} />}

      {showNota && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "#0006", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
          onClick={() => setShowNota(null)}>
          <div style={{ background: C.white, borderRadius: 16, padding: 24, width: 400 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 12 }}>Nova Anotação</div>
            <textarea value={showNota.texto} onChange={e => setShowNota({ ...showNota, texto: e.target.value })} placeholder="Digite sua anotação..." rows={4} style={{ width: "100%", padding: "10px", borderRadius: 8, border: `1px solid ${C.ghost}`, fontSize: 13, boxSizing: "border-box", resize: "vertical" }} />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
              <button onClick={() => setShowNota(null)} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${C.ghost}`, background: C.white, cursor: "pointer" }}>Cancelar</button>
              <button onClick={() => handleNota(showNota.id)} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: C.lilac, color: C.white, cursor: "pointer", fontWeight: 600 }}>Salvar</button>
            </div>
          </div>
        </div>
      )}

{showModal && (
        <div style={{ position: "fixed", inset: 0, background: "#0005", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
          onClick={() => { setShowModal(false); resetForm(); }}>
          <div style={{ background: C.white, borderRadius: 16, padding: 28, maxWidth: 600, maxHeight: "90vh", overflow: "auto", width: "100%", margin: 20 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>
                {modalMode === 'view' ? 'Detalhes da Tarefa' : modalMode === 'edit' ? 'Editar Tarefa' : 'Nova Tarefa'}
              </div>
              <button onClick={() => { setShowModal(false); resetForm(); }} style={{ border: "none", background: "transparent", fontSize: 24, cursor: "pointer", color: C.muted, padding: 0 }}>&times;</button>
            </div>
            <TaskForm
              form={form}
              setForm={setForm}
              onSubmit={modalMode === 'create' ? handleCreate : modalMode === 'edit' ? handleEdit : (e) => e.preventDefault()}
              onCancel={() => { setShowModal(false); resetForm(); }}
              editando={editando}
              modalMode={modalMode}
              empresas={empresas}
              contas={contas}
              usuarios={usuarios}
              equipes={equipes}
              atividades={atividades}
              subatividades={subatividades}
              setSubatividades={setSubatividades}
            />
          </div>
        </div>
      )}

        {showDetailModal && <TaskDetailModal ativ={showDetailModal} onClose={() => setShowDetailModal(null)} empresas={empresas} contas={contas} onEdit={openEdit} atividades={atividades} />}

      {pauseModal.open && pauseModal.step === 'tipo' && (
        <div style={{ position: "fixed", inset: 0, background: "#0005", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}
          onClick={() => setPauseModal({ ...pauseModal, open: false })}>
          <div style={{ background: C.white, borderRadius: 16, padding: 28, width: "100%", maxWidth: 400, boxShadow: "0 20px 40px #0004" }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 16px", color: C.text, fontSize: 16 }}>Tipo de pausa</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: 8, borderRadius: 8, border: `1px solid ${C.ghost}`, background: pauseModal.tipo === 'pausa' ? C.snow : C.white }}>
                <input type="radio" name="tipoPausa" checked={pauseModal.tipo === 'pausa'} onChange={() => setPauseModal({ ...pauseModal, tipo: 'pausa' })} />
                <span style={{ fontWeight: 600, color: C.text }}>Pausa Normal</span>
                <span style={{ marginLeft: "auto", fontSize: 10, color: C.muted }}>(ex: reunião, almoço, suporte)</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: 8, borderRadius: 8, border: `1px solid ${C.ghost}`, background: pauseModal.tipo === 'fim_expediente' ? C.snow : C.white }}>
                <input type="radio" name="tipoPausa" checked={pauseModal.tipo === 'fim_expediente'} onChange={() => setPauseModal({ ...pauseModal, tipo: 'fim_expediente' })} />
                <span style={{ fontWeight: 600, color: C.text }}>Fim de Expediente</span>
                <span style={{ marginLeft: "auto", fontSize: 10, color: C.muted }}>(encerra dia sem justificativa)</span>
              </label>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setPauseModal({ ...pauseModal, open: false })} style={{ background: C.snow, color: C.muted, border: `1px solid ${C.ghost}`, borderRadius: 8, padding: "10px 20px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Cancelar</button>
              <button onClick={() => {
                if (pauseModal.tipo === 'fim_expediente') {
                  handleAction(pauseModal.id, "pause", { justificativa: "Fim de expediente", tipo: "fim_expediente" });
                  setPauseModal({ ...pauseModal, open: false });
                } else {
                  setPauseModal({ ...pauseModal, step: 'justificativa' });
                }
              }} style={{ background: C.lilac, color: C.white, border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Continuar</button>
            </div>
          </div>
        </div>
      )}

      {pauseModal.open && pauseModal.step === 'justificativa' && (
        <PauseJustificativaModal
          onConfirm={(j) => {
            if (!j || j.trim().length < 3) { toast("Mínimo 3 caracteres", "error"); return; }
            handleAction(pauseModal.id, "pause", { justificativa: j.trim(), tipo: "pausa" });
            setPauseModal({ ...pauseModal, open: false });
          }}
          onCancel={() => setPauseModal({ ...pauseModal, open: false })}
        />
      )}

       <PromptModal
         open={promptState.open}
         title={promptState.title}
         label={promptState.label}
         onConfirm={(v) => { setPromptState(prev => ({ ...prev, open: false })); setTimeout(() => promptState.onConfirm(v), 0); }}
         onCancel={() => setPromptState(prev => ({ ...prev, open: false }))}
       />
       {confirmDialog.open && (
         <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "#0006", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100 }}
           onClick={closeConfirm}>
           <div style={{ background: C.white, borderRadius: 16, padding: 32, width: 360 }} onClick={e => e.stopPropagation()}>
             <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 20 }}>{confirmDialog.message}</div>
             <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
               <button onClick={closeConfirm} style={{ padding: "10px 20px", borderRadius: 8, border: `1px solid ${C.ghost}`, background: C.white, color: C.muted, cursor: "pointer", fontWeight: 600 }}>Cancelar</button>
               <button onClick={() => { closeConfirm(); confirmDialog.onConfirm(); }} style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: C.lilac, color: C.white, cursor: "pointer", fontWeight: 600 }}>Confirmar</button>
             </div>
           </div>
         </div>
       )}
    </div>
  );
}
