import { useState, useEffect } from "react";

const C = {
  purple: "#2D1B69", mid: "#4A2C8F", lilac: "#7C5CBF", soft: "#B39DDB",
  ghost: "#EDE7F6", snow: "#F8F6FF", white: "#FFFFFF",
  danger: "#EF4444", text: "#1A0F3C", muted: "#6B5B8C",
};

export default function PromptModal({ open, title, label, value: initialValue, onConfirm, onCancel, children }) {
  const [value, setValue] = useState("");

  useEffect(() => { if (open) setValue(initialValue || ""); }, [open, initialValue]);

  if (!open) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#0005", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 9999,
    }} onClick={onCancel}>
      <div style={{
        background: C.white, borderRadius: 16, padding: 28, width: "100%",
        maxWidth: 400, boxShadow: "0 20px 40px #0004",
      }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 16px", color: C.text, fontSize: 16 }}>{title}</h3>
        {label && (
          <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 4, display: "block" }}>{label}</label>
        )}
        {children ? children : (
          <input value={value} onChange={e => setValue(e.target.value)} autoFocus
            style={{ width: "100%", padding: "12px", borderRadius: 8, border: `1px solid ${C.ghost}`, boxSizing: "border-box", marginBottom: 16 }} />
        )}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{
            background: C.snow, color: C.muted, border: `1px solid ${C.ghost}`, borderRadius: 8,
            padding: "10px 20px", fontWeight: 600, fontSize: 13, cursor: "pointer",
          }}>Cancelar</button>
          <button onClick={async () => { await onConfirm(value); setValue(""); }} style={{
            background: C.lilac, color: C.white, border: "none", borderRadius: 8,
            padding: "10px 20px", fontWeight: 600, fontSize: 13, cursor: "pointer",
          }}>Confirmar</button>
        </div>
      </div>
    </div>
  );
}