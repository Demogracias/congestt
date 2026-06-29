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
  return <button onClick={onClick} style={{ ...(styles[variant] || styles.primary), borderRadius: 8, padding: "8px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, ...style }}>{children}</button>;
}

export default function Config() {
  const toast = useToast();
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const [aba, setAba] = useState("perfil");
  const [auditLogs, setAuditLogs] = useState([]);
  const [consentimentos, setConsentimentos] = useState([]);
  const [anonimizacoes, setAnonimizacoes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/audit").then(r => r.json()),
      fetch("/api/lgpd/consentimentos").then(r => r.json()),
      fetch("/api/lgpd/anonimizacao").then(r => r.json()),
    ]).then(([a, c, an]) => {
      setAuditLogs(a); setConsentimentos(c); setAnonimizacoes(an); setLoading(false);
    }).catch(() => { setLoading(false); toast("Erro ao carregar dados", "error"); });
  }, []);

  const registrarConsentimento = async (tipo, aceito) => {
    if (!user?.id) { toast("Usuário não identificado", "error"); return; }
    const res = await fetch("/api/lgpd/consentimentos", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuarioId: user.id, tipo, aceito }),
    });
    if (res.ok) {
      const data = await fetch("/api/lgpd/consentimentos").then(r => r.json());
      setConsentimentos(data);
    }
  };

  const solicitarAnonimizacao = async () => {
    if (!confirm("Tem certeza? Esta ação solicitará a anonimização dos seus dados pessoais.")) return;
    if (!user?.id) { toast("Usuário não identificado", "error"); return; }
    const res = await fetch("/api/lgpd/anonimizacao", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuarioId: user.id }),
    });
    if (res.ok) {
      const data = await fetch("/api/lgpd/anonimizacao").then(r => r.json());
      setAnonimizacoes(data);
    } else {
      const err = await res.json();
      toast(err.message, "error");
    }
  };

  if (loading) return <div style={{ color: C.muted, padding: 40, textAlign: "center" }}>Carregando...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 800 }}>
      <div style={{ display: "flex", gap: 8 }}>
        {[{ id: "perfil", label: "Perfil" }, { id: "audit", label: "Auditoria" }, { id: "lgpd", label: "LGPD" }].map(t => (
          <Btn key={t.id} variant={aba === t.id ? "primary" : "outline"} onClick={() => setAba(t.id)} style={{ fontSize: 12 }}>{t.label}</Btn>
        ))}
      </div>

      {aba === "perfil" && (
        <Card>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 16 }}>Perfil do Usuário</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.lilac, display: "flex", alignItems: "center", justifyContent: "center", color: C.white, fontWeight: 800, fontSize: 20 }}>
              {user.email?.charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{user.email}</div>
              <div style={{ fontSize: 12, color: C.muted }}>{user.role} · Nível {user.level}</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: 13, color: C.muted }}>
            <div><strong>E-mail:</strong> {user.email}</div>
            {user.id && <div><strong>ID:</strong> {user.id}</div>}
          </div>
        </Card>
      )}

      {aba === "audit" && (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.ghost}` }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>Logs de Auditoria</div>
            <div style={{ fontSize: 12, color: C.muted }}>Todas as operações realizadas no sistema</div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead style={{ background: C.snow }}>
              <tr>
                {["Data/Hora", "Usuário", "Ação", "Recurso", "Detalhes"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 14px", color: C.muted, fontWeight: 600, fontSize: 10, textTransform: "uppercase", borderBottom: `1px solid ${C.ghost}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {auditLogs.map(log => (
                <tr key={log.id || log.timestamp} style={{ borderBottom: `1px solid ${C.snow}` }}
                  onMouseEnter={e => e.currentTarget.style.background = C.snow}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "8px 14px", fontFamily: "monospace", fontSize: 11, color: C.muted, whiteSpace: "nowrap" }}>
                    {new Date(log.timestamp).toLocaleString('pt-BR')}
                  </td>
                  <td style={{ padding: "8px 14px", color: C.text }}>{log.usuarioId}</td>
                  <td style={{ padding: "8px 14px" }}><Badge label={log.acao} color={log.acao === 'login' ? C.success : log.acao === 'criar' ? C.lilac : C.warn} /></td>
                  <td style={{ padding: "8px 14px", fontFamily: "monospace", color: C.muted }}>{log.recurso}{log.recursoId ? ` #${log.recursoId}` : ''}</td>
                  <td style={{ padding: "8px 14px", color: C.text }}>{log.detalhes}</td>
                </tr>
              ))}
              {auditLogs.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 20, textAlign: "center", color: C.muted }}>Nenhum log registrado</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      {aba === "lgpd" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 16 }}>Consentimentos</div>
            {[
              { tipo: "termos_uso", label: "Termos de Uso", desc: "Aceitar os termos e condições de uso do sistema" },
              { tipo: "dados_pessoais", label: "Dados Pessoais", desc: "Permitir o armazenamento de dados pessoais para operação do sistema" },
              { tipo: "comunicacao", label: "Comunicação", desc: "Receber notificações e comunicados do sistema" },
            ].map(item => {
              const consent = consentimentos.find(c => c.tipo === item.tipo && c.usuarioId === user.id);
              return (
                <div key={item.tipo} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${C.snow}` }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{item.desc}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Badge label={consent?.aceito ? "Aceito" : "Pendente"} color={consent?.aceito ? C.success : C.warn} />
                    <button onClick={() => registrarConsentimento(item.tipo, true)}
                      style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${C.success}`, background: "transparent", color: C.success, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>Aceitar</button>
                    <button onClick={() => registrarConsentimento(item.tipo, false)}
                      style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${C.danger}`, background: "transparent", color: C.danger, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>Recusar</button>
                  </div>
                </div>
              );
            })}
          </Card>

          <Card>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 16 }}>Direito à Exclusão (Anonimização)</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>
              Solicite a anonimização dos seus dados pessoais. Após processada, seus dados serão irreversivelmente anonimizados.
            </div>
            <Btn variant="danger" onClick={solicitarAnonimizacao}>Solicitar Anonimização</Btn>

            {anonimizacoes.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8 }}>Histórico de Solicitações</div>
                {anonimizacoes.map(a => (
                  <div key={a.dataSolicitacao} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: C.snow, borderRadius: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: C.text }}>Solicitado em {new Date(a.dataSolicitacao).toLocaleString('pt-BR')}</span>
                    <Badge label={a.status === 'concluido' ? 'Concluído' : 'Pendente'} color={a.status === 'concluido' ? C.success : C.warn} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
