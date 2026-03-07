import { useState, useEffect, useRef } from "react";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Bebas+Neue&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body { background: #0d0d0d; }

  @keyframes flicker {
    0%, 100% { opacity: 1; }
    92% { opacity: 1; }
    93% { opacity: 0.4; }
    94% { opacity: 1; }
    96% { opacity: 0.7; }
    97% { opacity: 1; }
  }

  @keyframes scanline {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100vh); }
  }

  @keyframes glitch {
    0%, 100% { clip-path: inset(0 0 100% 0); transform: translate(0); }
    10% { clip-path: inset(10% 0 60% 0); transform: translate(-4px, 0); }
    20% { clip-path: inset(50% 0 20% 0); transform: translate(4px, 0); }
    30% { clip-path: inset(80% 0 5% 0); transform: translate(-2px, 0); }
    40% { clip-path: inset(30% 0 50% 0); transform: translate(2px, 0); }
    50% { clip-path: inset(60% 0 10% 0); transform: translate(-4px, 0); }
    60% { clip-path: inset(0 0 80% 0); transform: translate(4px, 0); }
    70% { clip-path: inset(40% 0 30% 0); transform: translate(0); }
    80% { clip-path: inset(70% 0 0% 0); transform: translate(-2px, 0); }
    90% { clip-path: inset(20% 0 70% 0); transform: translate(2px, 0); }
  }

  @keyframes pulse-red {
    0%, 100% { box-shadow: 0 0 20px rgba(255,30,60,0.3), 0 0 60px rgba(255,30,60,0.1); }
    50% { box-shadow: 0 0 30px rgba(255,30,60,0.6), 0 0 80px rgba(255,30,60,0.2); }
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes countUp {
    from { opacity: 0; transform: scale(0.5); }
    to { opacity: 1; transform: scale(1); }
  }

  @keyframes typewriter {
    from { width: 0; }
    to { width: 100%; }
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }

  @keyframes shake {
    0%, 100% { transform: rotate(0deg); }
    20% { transform: rotate(-2deg); }
    40% { transform: rotate(2deg); }
    60% { transform: rotate(-1deg); }
    80% { transform: rotate(1deg); }
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-20px); }
    to { opacity: 1; transform: translateX(0); }
  }

  @keyframes dashIn {
    from { stroke-dashoffset: 339; }
    to { stroke-dashoffset: var(--target-offset); }
  }

  .title-glitch {
    position: relative;
    animation: flicker 6s infinite;
  }
  .title-glitch::before,
  .title-glitch::after {
    content: attr(data-text);
    position: absolute;
    inset: 0;
    font-family: inherit;
    font-size: inherit;
    font-weight: inherit;
    letter-spacing: inherit;
  }
  .title-glitch::before {
    color: #00ffff;
    animation: glitch 3s infinite;
    animation-delay: 0.5s;
    opacity: 0.5;
  }
  .title-glitch::after {
    color: #ff1e3c;
    animation: glitch 3s infinite;
    animation-delay: 1s;
    opacity: 0.5;
  }

  .roast-btn {
    position: relative;
    overflow: hidden;
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .roast-btn::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%);
    transform: translateX(-100%);
    transition: transform 0.4s;
  }
  .roast-btn:hover::before { transform: translateX(100%); }
  .roast-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 40px rgba(255,30,60,0.5) !important; }
  .roast-btn:active { transform: translateY(0); }

  .url-input:focus-within {
    border-color: rgba(255,30,60,0.6) !important;
    box-shadow: 0 0 0 3px rgba(255,30,60,0.12), inset 0 0 20px rgba(255,30,60,0.05) !important;
  }

  .card-enter {
    animation: fadeUp 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards;
    opacity: 0;
  }

  .terminal-line {
    animation: slideIn 0.3s ease forwards;
    opacity: 0;
  }
`;

const LOADING_STEPS = [
  { text: "$ git clone your-disaster...", color: "#666", delay: 0 },
  { text: "Analyzing commit history...", color: "#888", delay: 700 },
  { text: "Reading variable names...", color: "#888", delay: 1400 },
  { text: "Oh. Oh no.", color: "#ffd60a", delay: 2000 },
  { text: "Preparing psychological damage...", color: "#ff6b35", delay: 2600 },
  { text: "ERROR: Too many red flags to process", color: "#ff1e3c", delay: 3000 },
];

const SAMPLE = {
  repo: "johndoe/my-awesome-project",
  score: 18,
  label: "Certified Disaster",
  verdict: "This repository has the structural integrity of a house of cards in a wind tunnel. There's ambition buried under layers of technical debt like an archaeological site of bad decisions. Your future self will hate your current self. We're so sorry.",
  sections: [
    { icon: "💀", title: "Variable Names", severity: "CRITICAL", color: "#ff1e3c",
      text: "You have a variable called `data2`. Not `userData`, not `filteredData` — just `data2`. This isn't a variable name, it's a cry for help written in JavaScript." },
    { icon: "🔥", title: "Commit History", severity: "FATAL", color: "#ff4500",
      text: '43 commits. 31 say "fix". Fix WHAT? Nobody knows. Not even you. Especially not you. "fix fix fix fix" reads like a developer having a breakdown.' },
    { icon: "😬", title: "Dependencies", severity: "HIGH", color: "#ff8c00",
      text: "You're using moment.js in 2024. Moment.js has a website dedicated to begging you not to use it. You installed it anyway. Respect, honestly." },
    { icon: "🤡", title: "TODO Comments", severity: "MEDIUM", color: "#ffd60a",
      text: '7 TODO comments. The oldest is from 2021. "TODO: refactor later" — later came, had children, those children grew up, and they also left TODOs.' },
  ]
};

function Scanline() {
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 100, overflow: "hidden" }}>
      <div style={{
        position: "absolute", left: 0, right: 0, height: 2,
        background: "linear-gradient(transparent, rgba(255,255,255,0.03), transparent)",
        animation: "scanline 4s linear infinite"
      }} />
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)",
        pointerEvents: "none"
      }} />
    </div>
  );
}

function GridBg() {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
      backgroundImage: `
        linear-gradient(rgba(255,30,60,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,30,60,0.04) 1px, transparent 1px)
      `,
      backgroundSize: "48px 48px",
      maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)"
    }} />
  );
}

function ScoreArc({ score }) {
  const radius = 70;
  const circ = 2 * Math.PI * radius;
  const [val, setVal] = useState(0);

  useEffect(() => {
    requestAnimationFrame(() => setTimeout(() => setVal(score), 200));
  }, [score]);

  const offset = circ - (val / 100) * circ;
  const color = score < 25 ? "#ff1e3c" : score < 50 ? "#ff8c00" : "#ffd60a";
  const label = score < 25 ? "CRITICAL" : score < 50 ? "POOR" : score < 75 ? "MEH" : "OK";

  return (
    <div style={{ position: "relative", width: 180, height: 180, flexShrink: 0 }}>
      <svg width="180" height="180" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="90" cy="90" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
        <circle cx="90" cy="90" r={radius} fill="none"
          stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 1.8s cubic-bezier(0.34,1.56,0.64,1), stroke 0.3s",
            filter: `drop-shadow(0 0 12px ${color})`
          }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex",
        flexDirection: "column", alignItems: "center", justifyContent: "center"
      }}>
        <span style={{
          fontFamily: "'Bebas Neue', sans-serif", fontSize: 56, color,
          lineHeight: 1, filter: `drop-shadow(0 0 8px ${color})`,
          animation: "countUp 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.3s both"
        }}>{val}</span>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: 3 }}>
          {label}
        </span>
      </div>
    </div>
  );
}

function TerminalLoader({ onDone }) {
  const [lines, setLines] = useState([]);
  const [cur, setCur] = useState(true);

  useEffect(() => {
    LOADING_STEPS.forEach(({ text, color, delay }) => {
      setTimeout(() => setLines(p => [...p, { text, color }]), delay);
    });
    setTimeout(onDone, 3800);
    const t = setInterval(() => setCur(c => !c), 530);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      width: "100%", maxWidth: 540,
      background: "#0a0a0a",
      border: "1px solid rgba(255,30,60,0.2)",
      borderRadius: 14, padding: "20px 24px",
      fontFamily: "'Space Mono', monospace",
      boxShadow: "0 0 60px rgba(255,30,60,0.1), inset 0 1px 0 rgba(255,255,255,0.04)"
    }}>
      <div style={{ display: "flex", gap: 7, marginBottom: 18 }}>
        {["#ff5f57","#febc2e","#28c840"].map(c => (
          <div key={c} style={{ width: 13, height: 13, borderRadius: "50%", background: c, boxShadow: `0 0 6px ${c}55` }} />
        ))}
        <span style={{ marginLeft: 8, fontSize: 10, color: "rgba(255,255,255,0.2)", alignSelf: "center" }}>reporoast — bash</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, minHeight: 120 }}>
        {lines.map((l, i) => (
          <div key={i} className="terminal-line" style={{ animationDelay: `${i * 0.05}s`, color: l.color, fontSize: 13 }}>
            {l.text}
          </div>
        ))}
        {lines.length < LOADING_STEPS.length && (
          <span style={{ color: "#ff1e3c", animation: "blink 1s infinite", fontSize: 16, marginTop: 4 }}>█</span>
        )}
      </div>
    </div>
  );
}

function RoastCard({ s, i }) {
  return (
    <div className="card-enter" style={{ animationDelay: `${i * 0.12}s` }}>
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
          <span style={{ fontSize: 22 }}>{s.icon}</span>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 700, color: "#fff" }}>{s.title}</span>
          <span style={{
            marginLeft: "auto",
            fontFamily: "'Space Mono', monospace", fontSize: 9,
            padding: "3px 8px", borderRadius: 4,
            background: `${s.color}20`, color: s.color,
            letterSpacing: 2, border: `1px solid ${s.color}40`
          }}>{s.severity}</span>
        </div>
        <p style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 14, color: "rgba(255,255,255,0.65)", lineHeight: 1.7 }}>
          {s.text}
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState("input");

  return (
    <>
      <style>{css}</style>
      <Scanline />
      <GridBg />

      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(255,30,60,0.08) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0
      }} />

      <div style={{
        minHeight: "100vh",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: phase === "result" ? "flex-start" : "center",
        padding: phase === "result" ? "40px 20px 80px" : "20px",
        position: "relative", zIndex: 1,
        overflowX: "hidden"
      }}>

        {/* ── INPUT ── */}
        {phase === "input" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28, width: "100%", maxWidth: 540 }}>
            <div style={{ textAlign: "center", animation: "fadeUp 0.6s ease both" }}>
              <div style={{
                fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: 5,
                color: "#ff1e3c", marginBottom: 20, textTransform: "uppercase",
                filter: "drop-shadow(0 0 8px rgba(255,30,60,0.6))"
              }}>
                ◆ CODE REVIEW AS PUNISHMENT ◆
              </div>

              <div style={{ position: "relative", display: "inline-block" }}>
                <h1 className="title-glitch" data-text="REPOROAST" style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "clamp(72px, 18vw, 110px)",
                  letterSpacing: 4, lineHeight: 0.9, color: "#fff",
                  textShadow: "0 0 40px rgba(255,255,255,0.1)"
                }}>
                  REPO<span style={{ color: "#ff1e3c", filter: "drop-shadow(0 0 20px rgba(255,30,60,0.8))" }}>ROAST</span>
                </h1>
              </div>

              <p style={{
                fontFamily: "'Space Mono', monospace", fontSize: 13,
                color: "rgba(255,255,255,0.35)", marginTop: 20, letterSpacing: 1
              }}>
                Paste your GitHub repo.<br />We'll tell you the truth.
              </p>
            </div>

            <div style={{ width: "100%", animation: "fadeUp 0.6s 0.15s ease both", opacity: 0 }}>
              <div className="url-input" style={{
                display: "flex", background: "#111",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12, overflow: "hidden", marginBottom: 12,
                transition: "border-color 0.2s, box-shadow 0.2s"
              }}>
                <span style={{
                  padding: "15px 16px", fontFamily: "'Space Mono', monospace",
                  fontSize: 13, color: "rgba(255,255,255,0.2)",
                  borderRight: "1px solid rgba(255,255,255,0.07)", whiteSpace: "nowrap",
                  background: "rgba(255,255,255,0.02)"
                }}>github.com/</span>
                <input
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && setPhase("loading")}
                  placeholder="username/repository"
                  style={{
                    flex: 1, background: "transparent", border: "none", outline: "none",
                    color: "#fff", fontSize: 14, padding: "15px 16px",
                    fontFamily: "'Space Mono', monospace"
                  }}
                />
              </div>

              <button
                className="roast-btn"
                onClick={() => setPhase("loading")}
                style={{
                  width: "100%", padding: "15px 24px",
                  background: "linear-gradient(135deg, #ff1e3c, #cc0022)",
                  border: "none", borderRadius: 12,
                  color: "#fff", fontSize: 14, fontWeight: 700,
                  letterSpacing: 3, textTransform: "uppercase",
                  cursor: "pointer", fontFamily: "'Space Mono', monospace",
                  boxShadow: "0 4px 30px rgba(255,30,60,0.35)",
                  animation: "pulse-red 3s infinite"
                }}
              >
                🔥 ROAST MY CODE
              </button>

              <p style={{
                textAlign: "center", marginTop: 14,
                fontFamily: "'Space Mono', monospace", fontSize: 10,
                color: "rgba(255,255,255,0.15)", letterSpacing: 1
              }}>
                Public repos only · Emotional damage not covered by warranty
              </p>
            </div>
          </div>
        )}

        {/* ── LOADING ── */}
        {phase === "loading" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, animation: "fadeIn 0.4s ease both" }}>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, color: "#ff1e3c",
              letterSpacing: 4, filter: "drop-shadow(0 0 16px rgba(255,30,60,0.6))",
              animation: "flicker 2s infinite"
            }}>ANALYZING...</div>
            <TerminalLoader onDone={() => setPhase("result")} />
          </div>
        )}

        {/* ── RESULT ── */}
        {phase === "result" && (
          <div style={{ width: "100%", maxWidth: 640, display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Nav */}
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              fontFamily: "'Space Mono', monospace",
              animation: "fadeUp 0.4s ease both"
            }}>
              <button onClick={() => setPhase("input")} style={{
                background: "none", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8, padding: "6px 14px", color: "rgba(255,255,255,0.4)",
                cursor: "pointer", fontSize: 11, fontFamily: "'Space Mono', monospace",
                transition: "all 0.2s"
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,30,60,0.4)"; e.currentTarget.style.color = "#ff1e3c"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
              >← BACK</button>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>{SAMPLE.repo}</span>
              <div style={{
                marginLeft: "auto", fontSize: 9, padding: "4px 10px",
                background: "rgba(255,30,60,0.1)", border: "1px solid rgba(255,30,60,0.3)",
                borderRadius: 6, color: "#ff1e3c", letterSpacing: 2
              }}>LIVE RESULTS</div>
            </div>

            {/* Score hero */}
            <div style={{
              display: "flex", gap: 24, alignItems: "center",
              background: "linear-gradient(135deg, rgba(255,30,60,0.08), rgba(255,30,60,0.02))",
              border: "1px solid rgba(255,30,60,0.2)",
              borderRadius: 16, padding: "28px 32px",
              boxShadow: "0 0 40px rgba(255,30,60,0.08), inset 0 1px 0 rgba(255,255,255,0.04)",
              flexWrap: "wrap", gap: 24,
              animation: "fadeUp 0.5s 0.1s ease both", opacity: 0
            }}>
              <ScoreArc score={SAMPLE.score} />
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{
                  fontFamily: "'Space Mono', monospace", fontSize: 9,
                  color: "#ff1e3c", letterSpacing: 4, textTransform: "uppercase",
                  marginBottom: 10, filter: "drop-shadow(0 0 6px rgba(255,30,60,0.5))"
                }}>Code Health Score</div>
                <div style={{
                  fontFamily: "'Bebas Neue', sans-serif", fontSize: 36,
                  color: "#fff", letterSpacing: 2, marginBottom: 14,
                  lineHeight: 1
                }}>"{SAMPLE.label}"</div>
                <p style={{
                  fontFamily: "Georgia, serif", fontSize: 13,
                  color: "rgba(255,255,255,0.5)", lineHeight: 1.75
                }}>{SAMPLE.verdict}</p>
              </div>
            </div>

            {/* Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {SAMPLE.sections.map((s, i) => <RoastCard key={i} s={s} i={i} />)}
            </div>

            {/* Actions */}
            <div style={{
              display: "flex", gap: 10, flexWrap: "wrap",
              animation: "fadeUp 0.5s 0.6s ease both", opacity: 0
            }}>
              {[
                { label: "📋 Copy Result", style: { flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" } },
                { label: "🐦 Share Roast", style: { flex: 2, background: "linear-gradient(135deg, #ff1e3c, #cc0022)", border: "none", color: "#fff", boxShadow: "0 4px 20px rgba(255,30,60,0.35)" } },
                { label: "🔁 Roast Another", onClick: () => setPhase("input"), style: { flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" } },
              ].map(({ label, onClick, style }) => (
                <button key={label} onClick={onClick} style={{
                  padding: "13px 18px", borderRadius: 10, cursor: "pointer",
                  fontSize: 11, letterSpacing: 2, textTransform: "uppercase",
                  fontFamily: "'Space Mono', monospace", transition: "all 0.2s",
                  ...style
                }}
                  onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
                  onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                >{label}</button>
              ))}
            </div>

          </div>
        )}
      </div>
    </>
  );
}
