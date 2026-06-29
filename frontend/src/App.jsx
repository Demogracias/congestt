import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Empresas from "./pages/Empresas";
import Equipes from "./pages/Equipes";
import Planner from "./pages/Planner";
import Contabil from "./pages/Contabil";
import Dashboard from "./pages/Dashboard";
import Relatorios from "./pages/Relatorios";
import Config from "./pages/Config";
import Logo from "./components/Logo";

const C = {
  deep:    "#1E1245",
  purple:  "#2D1B69",
  mid:     "#4A2C8F",
  lilac:   "#7C5CBF",
  soft:    "#B39DDB",
  ghost:   "#EDE7F6",
  snow:    "#F8F6FF",
  white:   "#FFFFFF",
  success: "#4CAF82",
  warn:    "#F59E0B",
  danger:  "#EF4444",
  text:    "#1A0F3C",
  muted:   "#6B5B8C",
};

const icons = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  empresas: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  equipes: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  planner: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  contabil: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  relatorios: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  config: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M12 2v2M12 20v2M20 12h2M2 12h2M17.66 17.66l-1.41-1.41M6.34 17.66l1.41-1.41"/>
    </svg>
  ),
  chevronLeft: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  chevronRight: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  plus: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  bell: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  search: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  trending: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  clock: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  check: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
};

function Sidebar({ active, setActive, collapsed, setCollapsed }) {
  const W = collapsed ? 64 : 220;
  const navItems = [
    { id: "dashboard",  label: "Dashboard",      icon: "dashboard" },
    { id: "empresas",   label: "Empresas",       icon: "empresas" },
    { id: "planner",   label: "Planner",        icon: "planner" },
    { id: "contabil",  label: "Gestão Contábil", icon: "contabil" },
    { id: "equipes",    label: "Equipes",        icon: "equipes" },
    { id: "relatorios",label: "Relatórios",     icon: "relatorios" },
  ];

  return (
    <aside style={{
      width: W, minWidth: W, height: "100vh", background: C.purple,
      display: "flex", flexDirection: "column",
      transition: "width 0.25s cubic-bezier(.4,0,.2,1), min-width 0.25s cubic-bezier(.4,0,.2,1)",
      position: "relative", zIndex: 10, overflow: "hidden",
      boxShadow: "2px 0 16px #0004",
    }}>
        <div style={{ padding: "20px 14px 16px", borderBottom: `1px solid ${C.mid}` }}>
          <Logo variant={collapsed ? 'icon' : 'full'} style={{ justifyContent: 'center' }} />
        </div>
      <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
        {navItems.map(item => {
          const isActive = active === item.id;
          return (
            <button key={item.id} onClick={() => setActive(item.id)}
              title={collapsed ? item.label : undefined}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: collapsed ? "10px 13px" : "10px 12px",
                borderRadius: 8, border: "none", cursor: "pointer", width: "100%",
                background: isActive ? C.mid : "transparent",
                color: isActive ? C.white : C.soft,
                fontWeight: isActive ? 600 : 400, fontSize: 13.5,
                transition: "all 0.15s", textAlign: "left",
                justifyContent: collapsed ? "center" : "flex-start",
                position: "relative",
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#ffffff18"; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
            >
              {isActive && (
                <span style={{
                  position: "absolute", left: 0, top: "20%", height: "60%",
                  width: 3, background: C.soft, borderRadius: "0 3px 3px 0",
                }} />
              )}
              <span style={{ color: isActive ? C.white : C.soft, flexShrink: 0 }}>
                {icons[item.icon]}
              </span>
              {!collapsed && <span style={{ whiteSpace: "nowrap", overflow: "hidden" }}>{item.label}</span>}
            </button>
          );
        })}
      </nav>
      <div style={{ padding: "8px 8px 12px", borderTop: `1px solid ${C.mid}` }}>
        <button onClick={() => setActive("config")}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: collapsed ? "10px 13px" : "10px 12px",
            borderRadius: 8, border: "none", cursor: "pointer", width: "100%",
            background: active === "config" ? C.mid : "transparent",
            color: C.soft, fontSize: 13.5, justifyContent: collapsed ? "center" : "flex-start",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "#ffffff18"; }}
          onMouseLeave={e => { e.currentTarget.style.background = active === "config" ? C.mid : "transparent"; }}
        >
          {icons.config}
          {!collapsed && <span>Configurações</span>}
        </button>
        <button onClick={() => setCollapsed(v => !v)}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: "100%", padding: "8px", marginTop: 4,
            borderRadius: 8, border: `1px solid ${C.mid}`, cursor: "pointer",
            background: "transparent", color: C.soft,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "#ffffff18"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
        >
          {collapsed ? icons.chevronRight : icons.chevronLeft}
          {!collapsed && <span style={{ fontSize: 12, marginLeft: 6 }}>Recolher</span>}
        </button>
      </div>
    </aside>
  );
}

function Topbar({ title, subtitle, user, onNavigate }) {
  const initials = user?.email ? user.email.charAt(0).toUpperCase() + (user.email.split('@')[0].slice(-1) || '').toUpperCase() : '?';
  return (
    <header style={{
      height: 60, background: C.white, borderBottom: `1px solid ${C.ghost}`,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 28px", gap: 16, flexShrink: 0,
    }}>
      <div>
        <div style={{ fontSize: 17, fontWeight: 700, color: C.text }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: C.muted }}>{subtitle}</div>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => {
          fetch("/api/planner/alertas").then(r => r.json()).then(alertas => {
            if (alertas.length === 0) { alert("Nenhum alerta no momento."); return; }
            alert(alertas.map(a => `• ${a.mensagem}`).join("\n"));
          }).catch(() => alert("Erro ao buscar alertas"));
        }} style={{
          background: C.snow, border: `1px solid ${C.ghost}`, borderRadius: 8,
          padding: "7px 10px", cursor: "pointer", color: C.muted, position: "relative",
          transition: "opacity 0.15s",
        }}
          onMouseEnter={e => { e.currentTarget.style.opacity = "0.8"; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}>
          {icons.bell}
          <span style={{
            position: "absolute", top: 5, right: 5, width: 7, height: 7,
            background: C.lilac, borderRadius: "50%", border: `1.5px solid ${C.white}`,
          }} />
        </button>
        <div title={`${user.email} (${user.role})`} onClick={() => onNavigate && onNavigate("config")} style={{
          width: 34, height: 34, borderRadius: "50%", background: C.lilac,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: C.white, fontWeight: 700, fontSize: 13, cursor: "pointer",
          transition: "opacity 0.15s",
        }}
          onMouseEnter={e => { e.currentTarget.style.opacity = "0.8"; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = "1" }}>{initials}</div>
      </div>
    </header>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: C.white, borderRadius: 12, border: `1px solid ${C.ghost}`,
      padding: "20px 24px", ...style,
    }}>
      {children}
    </div>
  );
}

function Badge({ label, color = C.lilac, bg }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
      background: bg || color + "22", color, display: "inline-block",
    }}>{label}</span>
  );
}

function Btn({ children, variant = "primary", onClick, style = {} }) {
  const styles = {
    primary: { background: C.lilac, color: C.white, border: "none" },
    outline: { background: "transparent", color: C.lilac, border: `1.5px solid ${C.lilac}` },
    ghost:   { background: C.snow, color: C.muted, border: `1px solid ${C.ghost}` },
  };
  return (
    <button onClick={onClick} style={{
      ...styles[variant], borderRadius: 8, padding: "8px 16px",
      fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex",
      alignItems: "center", gap: 6, transition: "opacity 0.15s", ...style,
    }}
      onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
    >
      {children}
    </button>
  );
}

export default function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));
  const [active, setActive] = useState(() => {
    const saved = localStorage.getItem("activePage");
    return saved || "dashboard";
  });
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    localStorage.setItem("activePage", active);
  }, [active]);

  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.page) {
        setActive(e.detail.page);
      }
    };
    window.addEventListener("navigate", handler);
    return () => window.removeEventListener("navigate", handler);
  }, []);

  if (!user) return <Login />;

  const pages = {
    dashboard:  { title: "Dashboard", subtitle: "Visão geral de desempenho", component: Dashboard },
    empresas:   { title: "Cadastro de Empresas", subtitle: "Matrizes, filiais e grupos", component: Empresas },
    planner:    { title: "Planner de Atividades", subtitle: "Acompanhamento por período", component: Planner },
    contabil:   { title: "Gestão Contábil", subtitle: "Plano de contas por empresa e período", component: Contabil },
    equipes:    { title: "Equipes", subtitle: "Cadastro e hierarquia", component: Equipes },
    relatorios: { title: "Relatórios", subtitle: "Análises e comparativos", component: Relatorios },
    config:     { title: "Configurações", subtitle: "Perfil e preferências", component: Config },
  };

  const page = pages[active] || pages.dashboard;
  const PageComponent = page.component;

  return (
    <div style={{
      display: "flex", height: "100vh", width: "100vw", overflow: "hidden",
      fontFamily: "'Inter', sans-serif", background: C.snow, color: C.text,
    }}>
      <Sidebar active={active} setActive={setActive} collapsed={collapsed} setCollapsed={setCollapsed} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Topbar title={page.title} subtitle={page.subtitle} user={user} onNavigate={setActive} />
        <main style={{ flex: 1, overflow: "auto", padding: "24px 28px" }}>
          <PageComponent />
        </main>
      </div>
    </div>
  );
}
