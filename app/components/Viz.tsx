"use client";

import React from "react";
import type { SeamStatus } from "@/lib/mock";

const SV: Record<SeamStatus, string> = { green: "var(--green)", amber: "var(--amber)", red: "var(--red)" };

// KPI tile — big number, label, optional delta.
export function Kpi({ label, value, unit, delta, accent }: { label: string; value: string | number; unit?: string; delta?: string; accent?: string }) {
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value mono" style={accent ? { color: accent } : undefined}>
        {value}{unit && <span className="kpi-unit">{unit}</span>}
      </div>
      {delta && <div className="kpi-delta">{delta}</div>}
    </div>
  );
}

// Heatmap — rows × columns of status cells.
export function Heatmap({ rows, cols, cell }: { rows: { id: string; label: string; icon?: string }[]; cols: string[]; cell: (rowId: string, colIdx: number) => SeamStatus }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <div className="heatmap" style={{ gridTemplateColumns: `150px repeat(${cols.length}, 1fr)` }}>
        <div className="hm-corner" />
        {cols.map((c) => <div key={c} className="hm-col">{c}</div>)}
        {rows.map((r) => (
          <React.Fragment key={r.id}>
            <div className="hm-row-label">{r.icon} {r.label}</div>
            {cols.map((_, ci) => {
              const s = cell(r.id, ci);
              return <div key={ci} className="hm-cell" style={{ background: `color-mix(in srgb, ${SV[s]} 22%, var(--panel))`, borderColor: `color-mix(in srgb, ${SV[s]} 45%, transparent)` }}>
                <span className="hm-dot" style={{ background: SV[s] }} />
              </div>;
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// Labeled horizontal bar (capacity / load / reuse). Threshold turns it red.
export function Bar({ label, value, max = 100, unit = "%", warnAbove, goodHigh }: { label: string; value: number; max?: number; unit?: string; warnAbove?: number; goodHigh?: boolean }) {
  const pct = Math.max(0, Math.min((value / max) * 100, 100));
  let col = "var(--accent)";
  if (warnAbove !== undefined) col = value >= warnAbove ? "var(--red)" : value >= warnAbove * 0.8 ? "var(--amber)" : "var(--green)";
  else if (goodHigh) col = value >= max * 0.55 ? "var(--green)" : value >= max * 0.35 ? "var(--amber)" : "var(--red)";
  return (
    <div className="vbar">
      <div className="vbar-top"><span className="vbar-label">{label}</span><span className="vbar-val mono" style={{ color: col }}>{value}{unit}</span></div>
      <div className="vbar-track"><i style={{ width: `${pct}%`, background: col }} /></div>
    </div>
  );
}

// Grouped bars — pipeline / forecast / won per vertical.
export function ForecastBars({ rows }: { rows: { label: string; icon: string; pipeline: number; forecast: number; won: number }[] }) {
  const max = Math.max(...rows.map((r) => r.pipeline), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "6px 2px" }}>
      {rows.map((r) => (
        <div key={r.label}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 6 }}>
            <span style={{ fontWeight: 650 }}>{r.icon} {r.label}</span>
            <span className="mono" style={{ color: "var(--ink-3)" }}>${r.pipeline}M pipeline · ${r.won}M won</span>
          </div>
          <div style={{ position: "relative", height: 22, background: "var(--panel-2)", borderRadius: 6, border: "1px solid var(--line)", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, width: `${(r.forecast / max) * 100}%`, background: "var(--accent-soft)" }} />
            <div style={{ position: "absolute", top: 0, bottom: 0, width: `${(r.won / max) * 100}%`, background: "var(--accent)", opacity: 0.85 }} />
            <div style={{ position: "absolute", left: `${(r.forecast / max) * 100}%`, top: -2, bottom: -2, width: 2, background: "var(--ink)" }} title="forecast" />
          </div>
        </div>
      ))}
      <div style={{ fontSize: 10.5, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>solid = won · light = forecast fill · line = forecast target</div>
    </div>
  );
}

// Journey stepper — visual onboarding progress.
export function Journey({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="journey">
      {steps.map((s, i) => {
        const state = i < current ? "done" : i === current ? "active" : "todo";
        return (
          <React.Fragment key={i}>
            <div className={`jstep ${state}`}>
              <span className="jdot">{state === "done" ? "✓" : i + 1}</span>
              <span className="jlabel">{s}</span>
            </div>
            {i < steps.length - 1 && <span className={`jline ${i < current ? "done" : ""}`} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// Donut stat (reuse rate).
export function Donut({ value, label, color = "var(--accent)" }: { value: number; label: string; color?: string }) {
  const r = 34, c = 2 * Math.PI * r, off = c * (1 - value / 100);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg viewBox="0 0 88 88" width="92" height="92">
        <circle cx="44" cy="44" r={r} fill="none" stroke="var(--panel-2)" strokeWidth="10" />
        <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} transform="rotate(-90 44 44)" />
        <text x="44" y="48" textAnchor="middle" fontSize="20" fontWeight="700" fill={color} style={{ fontFamily: "var(--font-mono)" }}>{value}%</text>
      </svg>
      <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{label}</span>
    </div>
  );
}

export function statusPill(status: SeamStatus, label: string) {
  return <span className={`status-pill status-${status}`}><span className="dot" />{label}</span>;
}
