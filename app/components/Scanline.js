"use client";

export default function Scanline() {
  return (
    <div
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 100, overflow: "hidden" }}
    >
      <div style={{
        position: "absolute", left: 0, right: 0, height: 2,
        background: "linear-gradient(transparent, rgba(255,255,255,0.03), transparent)",
        animation: "scanline 4s linear infinite",
      }} />
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)",
        pointerEvents: "none",
      }} />
    </div>
  );
}
