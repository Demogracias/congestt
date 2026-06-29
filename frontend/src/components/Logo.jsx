import React from 'react';
import logoImg from '../assets/logo.png';

const C = {
  white: "#FFFFFF",
  soft: "#B39DDB",
};

export default function Logo({ variant = 'full', style = {} }) {
  if (variant === 'icon') {
    return (
      <div style={{ ...style, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <img 
          src={logoImg} 
          alt="ConGestt Logo" 
          style={{ 
            width: 40, 
            height: 40, 
            objectFit: "contain",
            display: "block" 
          }} 
        />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, ...style }}>
      <img 
        src={logoImg} 
        alt="ConGestt Logo" 
        style={{ 
          width: 48, 
          height: 48, 
          objectFit: "contain",
          display: "block",
          flexShrink: 0
        }} 
      />
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        <span style={{ fontSize: 20, fontWeight: 800, color: C.white, fontFamily: 'Inter, sans-serif', letterSpacing: "-0.3px" }}>ConGestt</span>
        <span style={{ fontSize: 10, fontWeight: 600, color: C.soft, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 2 }}>Gestão de Equipes</span>
      </div>
    </div>
  );
}
