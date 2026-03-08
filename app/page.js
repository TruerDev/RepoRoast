"use client";

import { useState, useEffect, useCallback } from "react";
import { t, LANGUAGES } from "./translations";
import Scanline from "./components/Scanline";
import GridBg from "./components/GridBg";
import ScoreArc from "./components/ScoreArc";
import TerminalLoader from "./components/TerminalLoader";
import RoastCard from "./components/RoastCard";
import LanguagePicker from "./components/LanguagePicker";
import ShareMenu from "./components/ShareMenu";
import SponsorBar from "./components/SponsorBar";

function extractRepo(input) {
  const cleaned = input.trim().replace(/\/+$/, "");
  const ghMatch = cleaned.match(/github\.com\/([^/]+\/[^/]+)/);
  if (ghMatch) return ghMatch[1];
  if (/^[^/\s]+\/[^/\s]+$/.test(cleaned)) return cleaned;
  return null;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState("input");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loadingTime, setLoadingTime] = useState("loading");
  const [lang, setLang] = useState("en");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const browserLang = navigator.language?.slice(0, 2);
    if (LANGUAGES.includes(browserLang)) setLang(browserLang);
  }, []);

  async function handleRoast() {
    const repo = extractRepo(url);
    if (!repo) {
      setError(t(lang, "errorInvalidRepo"));
      return;
    }
    setError(null);
    setPhase("loading");
    setLoadingTime("loading");
    setSubmitting(true);

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
      setPhase("error");
    } finally {
      setSubmitting(false);
    }
  }

  const handleLoaderDone = useCallback(() => {
    if (result) setPhase("result");
  }, [result]);

  function resetToInput() {
    setPhase("input");
    setResult(null);
    setUrl("");
  }

  const g = (key) => t(lang, key);

  return (
    <>
      <Scanline />
      <GridBg />
      <LanguagePicker lang={lang} setLang={setLang} />

      <div aria-hidden="true" style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(255,30,60,0.08) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      <main style={{
        minHeight: "100vh",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: phase === "result" ? "flex-start" : "center",
        padding: phase === "result" ? "40px 20px 80px" : "20px",
        position: "relative", zIndex: 1,
        overflowX: "hidden",
      }}>

        {/* INPUT PHASE */}
        {phase === "input" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28, width: "100%", maxWidth: 540 }}>
            <header style={{ textAlign: "center", animation: "fadeUp 0.6s ease both" }}>
              <div style={{
                fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: 5,
                color: "#ff1e3c", marginBottom: 20, textTransform: "uppercase",
                filter: "drop-shadow(0 0 8px rgba(255,30,60,0.6))",
              }}>
                {g("tagline")}
              </div>

              <div style={{ position: "relative", display: "inline-block" }}>
                <h1 className="title-glitch" data-text="REPOROAST" style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "clamp(72px, 18vw, 110px)",
                  letterSpacing: 4, lineHeight: 0.9, color: "#fff",
                  textShadow: "0 0 40px rgba(255,255,255,0.1)",
                }}>
                  REPO<span style={{ color: "#ff1e3c", filter: "drop-shadow(0 0 20px rgba(255,30,60,0.8))" }}>ROAST</span>
                </h1>
              </div>

              <p style={{
                fontFamily: "'Space Mono', monospace", fontSize: 13,
                color: "rgba(255,255,255,0.35)", marginTop: 20, letterSpacing: 1,
                whiteSpace: "pre-line",
              }}>
                {g("subtitle")}
              </p>
            </header>

            <div style={{ width: "100%", animation: "fadeUp 0.6s 0.15s ease both", opacity: 0 }}>
              {error && (
                <div role="alert" style={{
                  marginBottom: 12, padding: "10px 16px", borderRadius: 8,
                  background: "rgba(255,30,60,0.1)", border: "1px solid rgba(255,30,60,0.3)",
                  color: "#ff6b6b", fontFamily: "'Space Mono', monospace", fontSize: 12,
                }}>
                  {error}
                </div>
              )}

              <div className="url-input" style={{
                display: "flex", background: "#111",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12, overflow: "hidden", marginBottom: 12,
                transition: "border-color 0.2s, box-shadow 0.2s",
              }}>
                <span aria-hidden="true" style={{
                  padding: "15px 16px", fontFamily: "'Space Mono', monospace",
                  fontSize: 13, color: "rgba(255,255,255,0.2)",
                  borderRight: "1px solid rgba(255,255,255,0.07)", whiteSpace: "nowrap",
                  background: "rgba(255,255,255,0.02)",
                }}>github.com/</span>
                <input
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !submitting && handleRoast()}
                  placeholder={g("placeholder")}
                  aria-label="GitHub repository (username/repository)"
                  autoComplete="off"
                  spellCheck="false"
                  style={{
                    flex: 1, background: "transparent", border: "none", outline: "none",
                    color: "#fff", fontSize: 14, padding: "15px 16px",
                    fontFamily: "'Space Mono', monospace",
                  }}
                />
              </div>

              <button
                className="roast-btn"
                onClick={handleRoast}
                disabled={submitting}
                style={{
                  width: "100%", padding: "15px 24px",
                  background: "linear-gradient(135deg, #ff1e3c, #cc0022)",
                  border: "none", borderRadius: 12,
                  color: "#fff", fontSize: 14, fontWeight: 700,
                  letterSpacing: 3, textTransform: "uppercase",
                  cursor: submitting ? "not-allowed" : "pointer",
                  fontFamily: "'Space Mono', monospace",
                  boxShadow: "0 4px 30px rgba(255,30,60,0.35)",
                  animation: submitting ? "none" : "pulse-red 3s infinite",
                }}
              >
                {g("roastBtn")}
              </button>

              <p style={{
                textAlign: "center", marginTop: 14,
                fontFamily: "'Space Mono', monospace", fontSize: 10,
                color: "rgba(255,255,255,0.15)", letterSpacing: 1,
              }}>
                {g("disclaimer")}
              </p>
            </div>

            <SponsorBar />
          </div>
        )}

        {/* LOADING PHASE */}
        {phase === "loading" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, animation: "fadeIn 0.4s ease both" }}>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, color: "#ff1e3c",
              letterSpacing: 4, filter: "drop-shadow(0 0 16px rgba(255,30,60,0.6))",
              animation: "flicker 2s infinite",
            }}>{g("analyzing")}</div>
            <TerminalLoader onDone={handleLoaderDone} loadingTime={loadingTime} lang={lang} />
          </div>
        )}

        {/* ERROR PHASE */}
        {phase === "error" && error && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: 28, width: "100%", maxWidth: 500,
            animation: "fadeUp 0.5s ease both",
          }}>
            <div style={{
              width: "100%",
              background: "linear-gradient(135deg, rgba(255,30,60,0.12), rgba(255,30,60,0.03))",
              border: "1px solid rgba(255,30,60,0.3)",
              borderRadius: 16,
              padding: "40px 32px",
              boxShadow: "0 0 60px rgba(255,30,60,0.1), inset 0 1px 0 rgba(255,255,255,0.04)",
              textAlign: "center",
            }}>
              <div style={{
                fontSize: 48, marginBottom: 20, lineHeight: 1,
                filter: "drop-shadow(0 0 12px rgba(255,30,60,0.5))",
              }}>🔥</div>
              <div style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 28, letterSpacing: 3, color: "#ff1e3c",
                marginBottom: 16,
                filter: "drop-shadow(0 0 10px rgba(255,30,60,0.6))",
              }}>OVERHEATED</div>
              <p style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 13, color: "rgba(255,255,255,0.6)",
                lineHeight: 1.8, marginBottom: 8,
              }}>
                Too many roasts at once. Our AI is catching its breath — try again in a minute.
              </p>
              <p style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 10, color: "rgba(255,255,255,0.25)",
                letterSpacing: 1,
              }}>
                (The author doesn&apos;t have money for paid APIs.)
              </p>
            </div>

            <button
              className="roast-btn"
              onClick={() => { setError(null); setPhase("input"); }}
              style={{
                width: "100%", padding: "15px 24px",
                background: "linear-gradient(135deg, #ff1e3c, #cc0022)",
                border: "none", borderRadius: 12,
                color: "#fff", fontSize: 14, fontWeight: 700,
                letterSpacing: 3, textTransform: "uppercase",
                cursor: "pointer",
                fontFamily: "'Space Mono', monospace",
                boxShadow: "0 4px 30px rgba(255,30,60,0.35)",
                animation: "pulse-red 3s infinite",
              }}
            >{g("back")} ↩</button>
          </div>
        )}

        {/* RESULT PHASE */}
        {phase === "result" && result && (
          <div style={{ width: "100%", maxWidth: 640, display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Nav */}
            <nav style={{
              display: "flex", alignItems: "center", gap: 12,
              fontFamily: "'Space Mono', monospace",
              animation: "fadeUp 0.4s ease both",
            }}>
              <button
                onClick={resetToInput}
                className="nav-back"
                style={{
                  background: "none", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8, padding: "6px 14px", color: "rgba(255,255,255,0.4)",
                  cursor: "pointer", fontSize: 11, fontFamily: "'Space Mono', monospace",
                  transition: "all 0.2s",
                }}
              >{g("back")}</button>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>{result.repo}</span>
              <div style={{
                marginLeft: "auto", fontSize: 9, padding: "4px 10px",
                background: "rgba(255,30,60,0.1)", border: "1px solid rgba(255,30,60,0.3)",
                borderRadius: 6, color: "#ff1e3c", letterSpacing: 2,
              }}>{g("liveResults")}</div>
            </nav>

            {/* Score hero */}
            <section style={{
              display: "flex", gap: 24, alignItems: "center",
              background: "linear-gradient(135deg, rgba(255,30,60,0.08), rgba(255,30,60,0.02))",
              border: "1px solid rgba(255,30,60,0.2)",
              borderRadius: 16, padding: "28px 32px",
              boxShadow: "0 0 40px rgba(255,30,60,0.08), inset 0 1px 0 rgba(255,255,255,0.04)",
              flexWrap: "wrap",
              animation: "fadeUp 0.5s 0.1s ease both", opacity: 0,
            }}>
              <ScoreArc score={result.score} />
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{
                  fontFamily: "'Space Mono', monospace", fontSize: 9,
                  color: "#ff1e3c", letterSpacing: 4, textTransform: "uppercase",
                  marginBottom: 10, filter: "drop-shadow(0 0 6px rgba(255,30,60,0.5))",
                }}>{g("codeHealthScore")}</div>
                <div style={{
                  fontFamily: "'Bebas Neue', sans-serif", fontSize: 36,
                  color: "#fff", letterSpacing: 2, marginBottom: 14, lineHeight: 1,
                }}>&quot;{result.label}&quot;</div>
                <p style={{
                  fontFamily: "Georgia, serif", fontSize: 13,
                  color: "rgba(255,255,255,0.5)", lineHeight: 1.75,
                }}>{result.verdict}</p>
              </div>
            </section>

            {/* Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {result.sections.map((s, i) => <RoastCard key={i} s={s} i={i} />)}
            </div>

            {/* Actions */}
            <div style={{
              display: "flex", gap: 10, flexWrap: "wrap",
              animation: "fadeUp 0.5s 0.6s ease both", opacity: 0,
            }}>
              <button
                className="action-btn"
                onClick={() => {
                  const text = [
                    `RepoRoast: ${result.repo}`,
                    `Score: ${result.score}/100 — "${result.label}"`,
                    "",
                    result.verdict,
                    "",
                    ...result.sections.map(s => `${s.icon} ${s.title} [${s.severity}]\n${s.text}`),
                  ].join("\n");
                  navigator.clipboard.writeText(text);
                }}
                style={{
                  flex: 1, padding: "13px 18px", borderRadius: 10, cursor: "pointer",
                  fontSize: 11, letterSpacing: 2, textTransform: "uppercase",
                  fontFamily: "'Space Mono', monospace",
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.5)",
                }}
              >{g("copyResult")}</button>

              <ShareMenu result={result} lang={lang} />

              <button
                className="action-btn"
                onClick={resetToInput}
                style={{
                  flex: 1, padding: "13px 18px", borderRadius: 10, cursor: "pointer",
                  fontSize: 11, letterSpacing: 2, textTransform: "uppercase",
                  fontFamily: "'Space Mono', monospace",
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.5)",
                }}
              >{g("roastAnother")}</button>
            </div>

            <SponsorBar />
          </div>
        )}
      </main>
    </>
  );
}
