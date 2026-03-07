"use client";

export default function RoastCard({ s, i }) {
  return (
    <article className="card-enter" style={{ animationDelay: `${i * 0.12}s` }}>
      <div style={{
        background: `linear-gradient(135deg, ${s.color}0a, transparent)`,
        border: `1px solid ${s.color}30`,
        borderLeft: `3px solid ${s.color}`,
        borderRadius: 12, padding: "18px 22px",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 0 24px ${s.color}20`; e.currentTarget.style.borderColor = `${s.color}60`; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = `${s.color}30`; }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <span aria-hidden="true" style={{ fontSize: 22 }}>{s.icon}</span>
          <h3 style={{
            fontFamily: "'Space Mono', monospace", fontSize: 13,
            fontWeight: 700, color: "#fff", margin: 0,
          }}>{s.title}</h3>
          <span style={{
            marginLeft: "auto",
            fontFamily: "'Space Mono', monospace", fontSize: 9,
            padding: "3px 8px", borderRadius: 4,
            background: `${s.color}20`, color: s.color,
            letterSpacing: 2, border: `1px solid ${s.color}40`,
          }}>{s.severity}</span>
        </div>
        <p style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: 14, color: "rgba(255,255,255,0.65)", lineHeight: 1.7,
        }}>
          {s.text}
        </p>
      </div>
    </article>
  );
}
