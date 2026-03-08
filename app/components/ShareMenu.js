"use client";

import { useState, useEffect, useRef } from "react";
import { t } from "../translations";

export default function ShareMenu({ result, lang }) {
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

  const shareText = `My repo "${result.repo}" scored ${result.score}/100 on RepoRoast\n"${result.label}"`;
  const shareUrl = "https://truer-repo-roast.vercel.app";
  const fullText = [
    `RepoRoast: ${result.repo}`,
    `Score: ${result.score}/100 — "${result.label}"`,
    "",
    result.verdict,
    "",
    ...result.sections.map(s => `${s.icon} ${s.title} [${s.severity}]\n${s.text}`),
  ].join("\n");

  function doCopy(text) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const items = [
    { label: t(lang, "copyText"), onClick: () => doCopy(fullText) },
    { label: t(lang, "copyLink"), onClick: () => doCopy(shareUrl) },
    { divider: true },
    { label: t(lang, "shareTwitter"), onClick: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText + "\n\nGet roasted: " + shareUrl)}`, "_blank", "noopener") },
    { label: t(lang, "shareTelegram"), onClick: () => window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, "_blank", "noopener") },
    { label: t(lang, "shareWhatsApp"), onClick: () => window.open(`https://wa.me/?text=${encodeURIComponent(shareText + "\n\n" + shareUrl)}`, "_blank", "noopener") },
    { label: t(lang, "shareReddit"), onClick: () => window.open(`https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(`My repo scored ${result.score}/100 on RepoRoast`)}`, "_blank", "noopener") },
    { label: t(lang, "shareLinkedIn"), onClick: () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, "_blank", "noopener") },
  ];

  return (
    <div ref={ref} style={{ position: "relative", flex: 2 }}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="share-btn"
        style={{
          width: "100%", padding: "13px 18px", borderRadius: 10, cursor: "pointer",
          fontSize: 11, letterSpacing: 2, textTransform: "uppercase",
          fontFamily: "'Space Mono', monospace", transition: "all 0.2s",
          background: "linear-gradient(135deg, #ff1e3c, #cc0022)", border: "none",
          color: "#fff", boxShadow: "0 4px 20px rgba(255,30,60,0.35)",
        }}
      >
        {copied ? t(lang, "copied") : t(lang, "shareRoast")}
      </button>
      {open && (
        <div role="menu" style={{
          position: "absolute", bottom: "100%", left: "50%", transform: "translateX(-50%)",
          marginBottom: 6, background: "#111",
          border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
          overflow: "hidden", minWidth: 220,
          boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
          animation: "fadeIn 0.15s ease",
        }}>
          {items.map((item, i) => item.divider ? (
            <div key={i} role="separator" style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "4px 0" }} />
          ) : (
            <button
              key={i}
              role="menuitem"
              className="share-menu-item"
              onClick={() => { item.onClick(); setOpen(false); }}
              style={{
                display: "block", width: "100%", background: "transparent",
                border: "none", padding: "10px 16px",
                color: "rgba(255,255,255,0.7)", cursor: "pointer",
                fontSize: 12, fontFamily: "'Space Mono', monospace",
                transition: "background 0.15s", textAlign: "left",
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
