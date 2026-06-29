import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info", duration = 4000) => {
    const id = crypto.randomUUID ? crypto.randomUUID() : Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const toast = useCallback((message, type) => addToast(message, type), [addToast]);

  const colors = {
    info: { bg: "#EDE7F6", color: "#2D1B69" },
    success: { bg: "#E8F5E9", color: "#2E7D32" },
    error: { bg: "#FFEBEE", color: "#C62828" },
    warn: { bg: "#FFF8E1", color: "#F57F17" },
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div style={{
        position: "fixed", bottom: 24, right: 24, zIndex: 9999,
        display: "flex", flexDirection: "column", gap: 8,
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: (colors[t.type] || colors.info).bg,
            color: (colors[t.type] || colors.info).color,
            padding: "12px 20px", borderRadius: 10, boxShadow: "0 4px 12px #0002",
            fontSize: 13, fontWeight: 500, maxWidth: 360,
            animation: "slideIn 0.3s ease",
          }}>
            {t.message}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}