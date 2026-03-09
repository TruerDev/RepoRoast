"use client";

import { useState, useEffect, useRef } from "react";
import { t, LANGUAGES } from "../translations";

export default function LanguagePicker({ lang, setLang }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const current = t(lang, "flag") + " " + t(lang, "lang");

  return (
    <nav ref={ref} aria-label="Language selection" style={{ position: "fixed", top: 16, right: 16, zIndex: 50 }}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="lang-toggle"
        style={{
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8, padding: "6px 12px", color: "rgba(255,255,255,0.6)",
          cursor: "pointer", fontSize: 12, fontFamily: "'Space Mono', monospace",
          transition: "all 0.2s", display: "flex", alignItems: "center", gap: 6,
        }}
      >
        {current} <span aria-hidden="true" style={{ fontSize: 8 }}>▼</span>
      </button>
      {open && (
        <div role="listbox" aria-label="Choose language" style={{
          position: "absolute", top: "100%", right: 0, marginTop: 4,
          background: "#111", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 10, overflow: "hidden", minWidth: 160,
          boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
          animation: "fadeIn 0.15s ease",
        }}>
          {LANGUAGES.map(code => (
            <button
              key={code}
              role="option"
              aria-selected={lang === code}
              className="lang-option"
              onClick={() => { setLang(code); setOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 8, width: "100%",
                background: lang === code ? "rgba(255,30,60,0.1)" : "transparent",
                border: "none", padding: "10px 14px",
                color: lang === code ? "#ff1e3c" : "rgba(255,255,255,0.6)",
                cursor: "pointer", fontSize: 12, fontFamily: "'Space Mono', monospace",
                transition: "background 0.15s", textAlign: "left",
                borderLeft: lang === code ? "2px solid #ff1e3c" : "2px solid transparent",
              }}
            >
              {t(code, "flag")} {t(code, "lang")}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}
