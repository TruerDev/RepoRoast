"use client";

const btnStyle = {
  display: "inline-flex", alignItems: "center", gap: 8,
  padding: "8px 18px", borderRadius: 8,
  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
  color: "rgba(255,255,255,0.5)", textDecoration: "none",
  fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: 1,
  cursor: "pointer",
};

export default function SponsorBar() {
  return (
    <div style={{
      display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap",
      animation: "fadeUp 0.6s 0.3s ease both", opacity: 0,
    }}>
      <a href="https://patreon.com/TruerDev" target="_blank" rel="noopener noreferrer"
        className="sponsor-btn" style={btnStyle}>
        <span aria-hidden="true" style={{ fontSize: 16 }}>🎨</span> Patreon
      </a>
      <a href="https://boosty.to/truerdev" target="_blank" rel="noopener noreferrer"
        className="sponsor-btn" style={btnStyle}>
        <span aria-hidden="true" style={{ fontSize: 16 }}>🚀</span> Boosty
      </a>
    </div>
  );
}
