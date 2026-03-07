"use client";

import { useState, useEffect, useRef } from "react";
import { t, LANGUAGES, getLoadingSteps } from "./translations";

const css = `
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

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-20px); }
    to { opacity: 1; transform: translateX(0); }
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

  .share-menu-item:hover {
    background: rgba(255,255,255,0.08) !important;
  }

  .lang-option:hover {
    background: rgba(255,30,60,0.15) !important;
  }

  .sponsor-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(255,30,60,0.25);
  }
`;

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

function TerminalLoader({ onDone, loadingTime, lang }) {
  const [lines, setLines] = useState([]);
  const [apiDone, setApiDone] = useState(false);
  const [minTimePassed, setMinTimePassed] = useState(false);

  useEffect(() => {
    const steps = getLoadingSteps(lang);
    steps.forEach(({ text, color, delay }) => {
      setTimeout(() => setLines(p => [...p, { text, color }]), delay);
    });
    setTimeout(() => setMinTimePassed(true), 3800);
  }, [lang]);

  useEffect(() => {
    if (loadingTime === "done") setApiDone(true);
  }, [loadingTime]);

  useEffect(() => {
    if (apiDone && minTimePassed) onDone();
  }, [apiDone, minTimePassed, onDone]);

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
        {(!apiDone || !minTimePassed) && (
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

function LanguagePicker({ lang, setLang }) {
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
    <div ref={ref} style={{ position: "fixed", top: 16, right: 16, zIndex: 50 }}>
      <button onClick={() => setOpen(!open)} style={{
        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 8, padding: "6px 12px", color: "rgba(255,255,255,0.6)",
        cursor: "pointer", fontSize: 12, fontFamily: "'Space Mono', monospace",
        transition: "all 0.2s", display: "flex", alignItems: "center", gap: 6,
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,30,60,0.4)"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
      >
        {current} <span style={{ fontSize: 8 }}>▼</span>
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "100%", right: 0, marginTop: 4,
          background: "#111", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 10, overflow: "hidden", minWidth: 160,
          boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
          animation: "fadeIn 0.15s ease",
        }}>
          {LANGUAGES.map(code => (
            <button key={code} className="lang-option" onClick={() => { setLang(code); setOpen(false); }} style={{
              display: "flex", alignItems: "center", gap: 8, width: "100%",
              background: lang === code ? "rgba(255,30,60,0.1)" : "transparent",
              border: "none", padding: "10px 14px", color: lang === code ? "#ff1e3c" : "rgba(255,255,255,0.6)",
              cursor: "pointer", fontSize: 12, fontFamily: "'Space Mono', monospace",
              transition: "background 0.15s", textAlign: "left",
              borderLeft: lang === code ? "2px solid #ff1e3c" : "2px solid transparent",
            }}>
              {t(code, "flag")} {t(code, "lang")}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ShareMenu({ result, lang }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!result) return null;

  const shareText = `My repo "${result.repo}" scored ${result.score}/100 on RepoRoast 🔥\n"${result.label}"`;
  const shareUrl = "https://reporoast.vercel.app";
  const fullText = `RepoRoast: ${result.repo}\nScore: ${result.score}/100 — "${result.label}"\n\n${result.verdict}\n\n${result.sections.map(s => `${s.icon} ${s.title} [${s.severity}]\n${s.text}`).join("\n\n")}`;

  function doCopy(text) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const items = [
    { label: t(lang, "copyText"), onClick: () => doCopy(fullText) },
    { label: t(lang, "copyLink"), onClick: () => doCopy(shareUrl) },
    { divider: true },
    { label: t(lang, "shareTwitter"), onClick: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText + "\n\nGet roasted: " + shareUrl)}`, "_blank") },
    { label: t(lang, "shareTelegram"), onClick: () => window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, "_blank") },
    { label: t(lang, "shareWhatsApp"), onClick: () => window.open(`https://wa.me/?text=${encodeURIComponent(shareText + "\n\n" + shareUrl)}`, "_blank") },
    { label: t(lang, "shareReddit"), onClick: () => window.open(`https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(`My repo scored ${result.score}/100 on RepoRoast 🔥`)}`, "_blank") },
    { label: t(lang, "shareLinkedIn"), onClick: () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, "_blank") },
  ];

  return (
    <div ref={ref} style={{ position: "relative", flex: 2 }}>
      <button onClick={() => setOpen(!open)} style={{
        width: "100%", padding: "13px 18px", borderRadius: 10, cursor: "pointer",
        fontSize: 11, letterSpacing: 2, textTransform: "uppercase",
        fontFamily: "'Space Mono', monospace", transition: "all 0.2s",
        background: "linear-gradient(135deg, #ff1e3c, #cc0022)", border: "none",
        color: "#fff", boxShadow: "0 4px 20px rgba(255,30,60,0.35)",
      }}
        onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
        onMouseLeave={e => e.currentTarget.style.opacity = "1"}
      >
        {copied ? t(lang, "copied") : t(lang, "shareRoast")}
      </button>
      {open && (
        <div style={{
          position: "absolute", bottom: "100%", left: "50%", transform: "translateX(-50%)",
          marginBottom: 6, background: "#111",
          border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
          overflow: "hidden", minWidth: 220,
          boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
          animation: "fadeIn 0.15s ease",
        }}>
          {items.map((item, i) => item.divider ? (
            <div key={i} style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "4px 0" }} />
          ) : (
            <button key={i} className="share-menu-item" onClick={() => { item.onClick(); setOpen(false); }} style={{
              display: "block", width: "100%", background: "transparent",
              border: "none", padding: "10px 16px",
              color: "rgba(255,255,255,0.7)", cursor: "pointer",
              fontSize: 12, fontFamily: "'Space Mono', monospace",
              transition: "background 0.15s", textAlign: "left",
            }}>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SponsorBar() {
  const btnStyle = {
    display: "inline-flex", alignItems: "center", gap: 8,
    padding: "8px 18px", borderRadius: 8,
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
    color: "rgba(255,255,255,0.5)", textDecoration: "none",
    fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: 1,
    transition: "all 0.2s", cursor: "pointer",
  };
  return (
    <div style={{
      display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap",
      animation: "fadeUp 0.6s 0.3s ease both", opacity: 0,
    }}>
      <a href="https://patreon.com/TruerDev" target="_blank" rel="noopener noreferrer"
        className="sponsor-btn" style={btnStyle}>
        <span style={{ fontSize: 16 }}>🎨</span> Patreon
      </a>
      <a href="https://boosty.to/reporoast" target="_blank" rel="noopener noreferrer"
        className="sponsor-btn" style={btnStyle}>
        <span style={{ fontSize: 16 }}>🚀</span> Boosty
      </a>
    </div>
  );
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState("input");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loadingTime, setLoadingTime] = useState("loading");
  const [lang, setLang] = useState("en");

  useEffect(() => {
    const browserLang = navigator.language?.slice(0, 2);
    if (LANGUAGES.includes(browserLang)) setLang(browserLang);
  }, []);

  function extractRepo(input) {
    const cleaned = input.trim().replace(/\/+$/, "");
    const ghMatch = cleaned.match(/github\.com\/([^\/]+\/[^\/]+)/);
    if (ghMatch) return ghMatch[1];
    if (/^[^\/\s]+\/[^\/\s]+$/.test(cleaned)) return cleaned;
    return null;
  }

  async function handleRoast() {
    const repo = extractRepo(url);
    if (!repo) {
      setError(t(lang, "errorInvalidRepo"));
      return;
    }
    setError(null);
    setPhase("loading");
    setLoadingTime("loading");

    try {
      const res = await fetch("/api/roast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo, lang }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to roast (${res.status})`);
      }
      const data = await res.json();
      setResult({ ...data, repo });
      setLoadingTime("done");
    } catch (err) {
      setError(err.message);
      setPhase("input");
    }
  }

  function handleLoaderDone() {
    if (result) setPhase("result");
  }

  const g = (key) => t(lang, key);

  return (
    <>
      <style>{css}</style>
      <Scanline />
      <GridBg />
      <LanguagePicker lang={lang} setLang={setLang} />

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

        {/* INPUT */}
        {phase === "input" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28, width: "100%", maxWidth: 540 }}>
            <div style={{ textAlign: "center", animation: "fadeUp 0.6s ease both" }}>
              <div style={{
                fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: 5,
                color: "#ff1e3c", marginBottom: 20, textTransform: "uppercase",
                filter: "drop-shadow(0 0 8px rgba(255,30,60,0.6))"
              }}>
                {g("tagline")}
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
                color: "rgba(255,255,255,0.35)", marginTop: 20, letterSpacing: 1,
                whiteSpace: "pre-line"
              }}>
                {g("subtitle")}
              </p>
            </div>

            <div style={{ width: "100%", animation: "fadeUp 0.6s 0.15s ease both", opacity: 0 }}>
              {error && (
                <div style={{
                  marginBottom: 12, padding: "10px 16px", borderRadius: 8,
                  background: "rgba(255,30,60,0.1)", border: "1px solid rgba(255,30,60,0.3)",
                  color: "#ff6b6b", fontFamily: "'Space Mono', monospace", fontSize: 12
                }}>
                  {error}
                </div>
              )}

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
                  onKeyDown={e => e.key === "Enter" && handleRoast()}
                  placeholder={g("placeholder")}
                  style={{
                    flex: 1, background: "transparent", border: "none", outline: "none",
                    color: "#fff", fontSize: 14, padding: "15px 16px",
                    fontFamily: "'Space Mono', monospace"
                  }}
                />
              </div>

              <button
                className="roast-btn"
                onClick={handleRoast}
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
                {g("roastBtn")}
              </button>

              <p style={{
                textAlign: "center", marginTop: 14,
                fontFamily: "'Space Mono', monospace", fontSize: 10,
                color: "rgba(255,255,255,0.15)", letterSpacing: 1
              }}>
                {g("disclaimer")}
              </p>
            </div>

            <SponsorBar />
          </div>
        )}

        {/* LOADING */}
        {phase === "loading" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, animation: "fadeIn 0.4s ease both" }}>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, color: "#ff1e3c",
              letterSpacing: 4, filter: "drop-shadow(0 0 16px rgba(255,30,60,0.6))",
              animation: "flicker 2s infinite"
            }}>{g("analyzing")}</div>
            <TerminalLoader onDone={handleLoaderDone} loadingTime={loadingTime} lang={lang} />
          </div>
        )}

        {/* RESULT */}
        {phase === "result" && result && (
          <div style={{ width: "100%", maxWidth: 640, display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Nav */}
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              fontFamily: "'Space Mono', monospace",
              animation: "fadeUp 0.4s ease both"
            }}>
              <button onClick={() => { setPhase("input"); setResult(null); setUrl(""); }} style={{
                background: "none", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8, padding: "6px 14px", color: "rgba(255,255,255,0.4)",
                cursor: "pointer", fontSize: 11, fontFamily: "'Space Mono', monospace",
                transition: "all 0.2s"
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,30,60,0.4)"; e.currentTarget.style.color = "#ff1e3c"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
              >{g("back")}</button>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>{result.repo}</span>
              <div style={{
                marginLeft: "auto", fontSize: 9, padding: "4px 10px",
                background: "rgba(255,30,60,0.1)", border: "1px solid rgba(255,30,60,0.3)",
                borderRadius: 6, color: "#ff1e3c", letterSpacing: 2
              }}>{g("liveResults")}</div>
            </div>

            {/* Score hero */}
            <div style={{
              display: "flex", gap: 24, alignItems: "center",
              background: "linear-gradient(135deg, rgba(255,30,60,0.08), rgba(255,30,60,0.02))",
              border: "1px solid rgba(255,30,60,0.2)",
              borderRadius: 16, padding: "28px 32px",
              boxShadow: "0 0 40px rgba(255,30,60,0.08), inset 0 1px 0 rgba(255,255,255,0.04)",
              flexWrap: "wrap",
              animation: "fadeUp 0.5s 0.1s ease both", opacity: 0
            }}>
              <ScoreArc score={result.score} />
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{
                  fontFamily: "'Space Mono', monospace", fontSize: 9,
                  color: "#ff1e3c", letterSpacing: 4, textTransform: "uppercase",
                  marginBottom: 10, filter: "drop-shadow(0 0 6px rgba(255,30,60,0.5))"
                }}>{g("codeHealthScore")}</div>
                <div style={{
                  fontFamily: "'Bebas Neue', sans-serif", fontSize: 36,
                  color: "#fff", letterSpacing: 2, marginBottom: 14,
                  lineHeight: 1
                }}>&quot;{result.label}&quot;</div>
                <p style={{
                  fontFamily: "Georgia, serif", fontSize: 13,
                  color: "rgba(255,255,255,0.5)", lineHeight: 1.75
                }}>{result.verdict}</p>
              </div>
            </div>

            {/* Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {result.sections.map((s, i) => <RoastCard key={i} s={s} i={i} />)}
            </div>

            {/* Actions */}
            <div style={{
              display: "flex", gap: 10, flexWrap: "wrap",
              animation: "fadeUp 0.5s 0.6s ease both", opacity: 0
            }}>
              <button onClick={() => {
                const text = `RepoRoast: ${result.repo}\nScore: ${result.score}/100 — "${result.label}"\n\n${result.verdict}\n\n${result.sections.map(s => `${s.icon} ${s.title} [${s.severity}]\n${s.text}`).join("\n\n")}`;
                navigator.clipboard.writeText(text);
              }} style={{
                flex: 1, padding: "13px 18px", borderRadius: 10, cursor: "pointer",
                fontSize: 11, letterSpacing: 2, textTransform: "uppercase",
                fontFamily: "'Space Mono', monospace", transition: "all 0.2s",
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.5)"
              }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >{g("copyResult")}</button>

              <ShareMenu result={result} lang={lang} />

              <button onClick={() => { setPhase("input"); setResult(null); setUrl(""); }} style={{
                flex: 1, padding: "13px 18px", borderRadius: 10, cursor: "pointer",
                fontSize: 11, letterSpacing: 2, textTransform: "uppercase",
                fontFamily: "'Space Mono', monospace", transition: "all 0.2s",
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.5)"
              }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >{g("roastAnother")}</button>
            </div>

            {/* Sponsor section */}
            <SponsorBar />

          </div>
        )}
      </div>
    </>
  );
}
