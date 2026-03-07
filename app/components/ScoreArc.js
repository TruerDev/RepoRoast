"use client";

import { useState, useEffect } from "react";

export default function ScoreArc({ score }) {
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
    <div
      role="meter"
      aria-valuenow={val}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Code health score: ${val} out of 100 — ${label}`}
      style={{ position: "relative", width: 180, height: 180, flexShrink: 0 }}
    >
      <svg width="180" height="180" style={{ transform: "rotate(-90deg)" }} aria-hidden="true">
        <circle cx="90" cy="90" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
        <circle cx="90" cy="90" r={radius} fill="none"
          stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 1.8s cubic-bezier(0.34,1.56,0.64,1), stroke 0.3s",
            filter: `drop-shadow(0 0 12px ${color})`,
          }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex",
        flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{
          fontFamily: "'Bebas Neue', sans-serif", fontSize: 56, color,
          lineHeight: 1, filter: `drop-shadow(0 0 8px ${color})`,
          animation: "countUp 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.3s both",
        }}>{val}</span>
        <span style={{
          fontFamily: "'Space Mono', monospace", fontSize: 9,
          color: "rgba(255,255,255,0.3)", letterSpacing: 3,
        }}>
          {label}
        </span>
      </div>
    </div>
  );
}
