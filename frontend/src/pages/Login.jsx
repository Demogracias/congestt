import { useState } from "react";
import Logo from "../components/Logo";

const C = {
  deep: "#1E1245", purple: "#2D1B69", mid: "#4A2C8F", lilac: "#7C5CBF",
  soft: "#B39DDB", ghost: "#EDE7F6", snow: "#F8F6FF", white: "#FFFFFF",
  success: "#4CAF82", warn: "#F59E0B", danger: "#EF4444", text: "#1A0F3C", muted: "#6B5B8C",
};

export default function Login() {
  const [aba, setAba] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPass, setRegPass] = useState("");
  const [regKey, setRegKey] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Credenciais invalidas");
      }
      const data = await res.json();
      const { password: _, ...safe } = data;
      localStorage.setItem("user", JSON.stringify(safe));
      window.location.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      if (regPass.length < 4) throw new Error("Senha deve ter no mínimo 4 caracteres");
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: regEmail, password: regPass, key: regKey }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Erro no registro");
      }
      const data = await res.json();
      setSuccess(`Conta criada! Email: ${data.email} | Nivel: ${data.level} (${data.role})`);
      setRegEmail(""); setRegPass(""); setRegKey("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      height: "100vh", width: "100vw", display: "flex", alignItems: "center", justifyContent: "center",
      background: `linear-gradient(135deg, ${C.deep}, ${C.purple})`, fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{ background: C.white, padding: "40px", borderRadius: 20, boxShadow: "0 20px 40px #0004", width: "100%", maxWidth: 420, textAlign: "center" }}>
        <div style={{ marginBottom: 32, display: "flex", justifyContent: "center" }}>
          <Logo />
        </div>

        <div style={{ display: "flex", gap: 0, marginBottom: 24, background: C.snow, borderRadius: 10, padding: 3 }}>
          {["login", "registrar"].map(t => (
            <button key={t} onClick={() => { setAba(t); setError(""); setSuccess(""); }}
              style={{
                flex: 1, padding: "8px 0", border: "none", borderRadius: 8, cursor: "pointer",
                fontWeight: 600, fontSize: 13, background: aba === t ? C.white : "transparent",
                color: aba === t ? C.purple : C.muted, boxShadow: aba === t ? "0 1px 3px #0001" : "none",
              }}>{t === "login" ? "Entrar" : "Criar Conta"}</button>
          ))}
        </div>

        {aba === "login" && (
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ textAlign: "left" }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 4, display: "block" }}>E-mail</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                style={{ width: "100%", padding: "12px", borderRadius: 8, border: `1px solid ${C.ghost}`, boxSizing: "border-box" }} />
            </div>
            <div style={{ textAlign: "left" }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 4, display: "block" }}>Senha</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                style={{ width: "100%", padding: "12px", borderRadius: 8, border: `1px solid ${C.ghost}`, boxSizing: "border-box" }} />
            </div>
            {error && <div style={{ color: C.danger, fontSize: 13, fontWeight: 500 }}>{error}</div>}
            <button disabled={submitting} style={{
              background: submitting ? C.muted : C.lilac, color: C.white, border: "none", padding: "14px",
              borderRadius: 8, fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer", fontSize: 15, opacity: submitting ? 0.7 : 1
            }}>{submitting ? "Entrando..." : "Entrar"}</button>
          </form>
        )}

        {aba === "registrar" && (
          <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ textAlign: "left" }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 4, display: "block" }}>E-mail</label>
              <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} required
                style={{ width: "100%", padding: "12px", borderRadius: 8, border: `1px solid ${C.ghost}`, boxSizing: "border-box" }} />
            </div>
            <div style={{ textAlign: "left" }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 4, display: "block" }}>Senha</label>
              <input type="password" value={regPass} onChange={e => setRegPass(e.target.value)} required
                style={{ width: "100%", padding: "12px", borderRadius: 8, border: `1px solid ${C.ghost}`, boxSizing: "border-box" }} />
            </div>
            <div style={{ textAlign: "left" }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 4, display: "block" }}>Chave de Registro</label>
              <input type="text" value={regKey} onChange={e => setRegKey(e.target.value)} required placeholder="Informe sua chave de registro"
                style={{ width: "100%", padding: "12px", borderRadius: 8, border: `1px solid ${C.ghost}`, boxSizing: "border-box" }} />
            </div>
            {error && <div style={{ color: C.danger, fontSize: 13, fontWeight: 500 }}>{error}</div>}
            {success && <div style={{ color: C.success, fontSize: 13, fontWeight: 500, background: C.success + "11", padding: "8px 12px", borderRadius: 8 }}>{success}</div>}
            <button disabled={submitting} style={{
              background: submitting ? C.muted : C.success, color: C.white, border: "none", padding: "14px",
              borderRadius: 8, fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer", fontSize: 15, opacity: submitting ? 0.7 : 1
            }}>{submitting ? "Criando..." : "Criar Conta"}</button>
          </form>
        )}

        <div style={{ marginTop: 20, fontSize: 11, color: C.muted, borderTop: `1px solid ${C.ghost}`, paddingTop: 14 }}>
          <strong>Contas padrao:</strong> admin@congestt.com / 123 (Gerente) | user@congestt.com / 123 (Analista)
        </div>
      </div>
    </div>
  );
}
