"use client";

import React from "react";
import type { SeamStatus } from "@/lib/mock";

const STATUS_VAR: Record<SeamStatus, string> = {
  green: "var(--green)",
  amber: "var(--amber)",
  red: "var(--red)",
};

// ---------------------------------------------------------------------------
// The revenue engine: 5 functions, with the Sales→PreSales seam we clear
// highlighted and colored live by its SLA health.
// ---------------------------------------------------------------------------
const STAGES = [
  { key: "mkt", label: "Marketing", icon: "◇" },
  { key: "sales", label: "Sales", icon: "◆" },
  { key: "presales", label: "PreSales", icon: "★" },
  { key: "delivery", label: "Delivery", icon: "▲" },
  { key: "support", label: "Support", icon: "●" },
];

export function EnginePipeline({ status, age, sla }: { status: SeamStatus; age: number; sla: number }) {
  const c = STATUS_VAR[status];
  const W = 860;
  const H = 132;
  const pad = 24;
  const gap = (W - pad * 2) / STAGES.length;
  const nodeW = 116;
  const cy = 58;

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ minWidth: 640, display: "block" }} role="img" aria-label="Revenue engine pipeline">
        {STAGES.map((s, i) => {
          const x = pad + gap * i + gap / 2;
          const isSeamStart = s.key === "sales";
          const isSeamEnd = s.key === "presales";
          const active = isSeamStart || isSeamEnd;
          // connector to next
          const nx = pad + gap * (i + 1) + gap / 2;
          const isSeamConn = s.key === "sales";
          return (
            <g key={s.key}>
              {i < STAGES.length - 1 && (
                <g>
                  <line
                    x1={x + nodeW / 2} y1={cy} x2={nx - nodeW / 2} y2={cy}
                    stroke={isSeamConn ? c : "var(--line-strong)"}
                    strokeWidth={isSeamConn ? 3 : 1.5}
                    strokeDasharray={isSeamConn ? "0" : "4 4"}
                  />
                  <polygon
                    points={`${nx - nodeW / 2},${cy} ${nx - nodeW / 2 - 7},${cy - 4} ${nx - nodeW / 2 - 7},${cy + 4}`}
                    fill={isSeamConn ? c : "var(--line-strong)"}
                  />
                  {isSeamConn && (
                    <>
                      <circle cx={(x + nx) / 2} cy={cy} r={5} fill={c}>
                        <animate attributeName="opacity" values="1;0.3;1" dur="1.6s" repeatCount="indefinite" />
                      </circle>
                      <text x={(x + nx) / 2} y={cy - 14} textAnchor="middle" fontSize="10.5" fontWeight="700" fill={c} style={{ fontFamily: "var(--font-mono)" }}>
                        SEAM · {age.toFixed(1)}d / {sla}d
                      </text>
                    </>
                  )}
                </g>
              )}
              <rect
                x={x - nodeW / 2} y={cy - 26} width={nodeW} height={52} rx={12}
                fill={active ? "color-mix(in srgb, " + c + " 12%, var(--panel))" : "var(--panel-2)"}
                stroke={active ? c : "var(--line)"}
                strokeWidth={active ? 2 : 1}
              />
              <text x={x} y={cy - 4} textAnchor="middle" fontSize="16" fill={active ? c : "var(--ink-3)"}>{s.icon}</text>
              <text x={x} y={cy + 14} textAnchor="middle" fontSize="12" fontWeight="650" fill="var(--ink)">{s.label}</text>
              <text x={x} y={H - 10} textAnchor="middle" fontSize="9.5" fill="var(--ink-3)" style={{ fontFamily: "var(--font-mono)" }}>
                {s.key === "presales" ? "you are here" : ""}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SLA gauge: a radial arc showing brief age against the SLA.
// ---------------------------------------------------------------------------
export function SlaGauge({ age, sla, status }: { age: number; sla: number; status: SeamStatus }) {
  const c = STATUS_VAR[status];
  const size = 132;
  const r = 52;
  const cx = size / 2;
  const cy = size / 2;
  const startA = 135;
  const sweep = 270;
  const max = sla * 2; // full arc = 2x SLA
  const frac = Math.max(0, Math.min(age / max, 1));

  const polar = (angleDeg: number) => {
    const a = (angleDeg * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const arc = (fromFrac: number, toFrac: number) => {
    const a0 = startA + sweep * fromFrac;
    const a1 = startA + sweep * toFrac;
    const [x0, y0] = polar(a0);
    const [x1, y1] = polar(a1);
    const large = a1 - a0 > 180 ? 1 : 0;
    return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
  };
  const slaMark = sla / max;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="118" height="118" role="img" aria-label="SLA gauge">
      <path d={arc(0, 1)} fill="none" stroke="var(--panel-2)" strokeWidth={12} strokeLinecap="round" />
      <path d={arc(0, frac)} fill="none" stroke={c} strokeWidth={12} strokeLinecap="round" />
      {/* SLA threshold tick */}
      {(() => { const [mx, my] = polar(startA + sweep * slaMark); const [ix, iy] = polar(startA + sweep * slaMark); void mx; void my;
        const a = ((startA + sweep * slaMark) * Math.PI) / 180;
        const x1 = cx + (r - 9) * Math.cos(a), y1 = cy + (r - 9) * Math.sin(a);
        const x2 = cx + (r + 9) * Math.cos(a), y2 = cy + (r + 9) * Math.sin(a);
        void ix; void iy;
        return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--ink)" strokeWidth={2} />;
      })()}
      <text x={cx} y={cy - 2} textAnchor="middle" fontSize="24" fontWeight="700" fill={c} style={{ fontFamily: "var(--font-mono)" }}>{age.toFixed(1)}</text>
      <text x={cx} y={cy + 15} textAnchor="middle" fontSize="10" fill="var(--ink-3)">days open</text>
      <text x={cx} y={size - 4} textAnchor="middle" fontSize="9.5" fill="var(--ink-3)" style={{ fontFamily: "var(--font-mono)" }}>SLA {sla}d ▲</text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Sparkline (reuse-rate trend).
// ---------------------------------------------------------------------------
export function Sparkline({ values, color = "var(--accent)" }: { values: number[]; color?: string }) {
  const W = 180, H = 44, pad = 3;
  const vs = values.length ? values : [0];
  const min = Math.min(...vs, 0);
  const max = Math.max(...vs, 60);
  const xf = (i: number) => pad + (i / Math.max(vs.length - 1, 1)) * (W - pad * 2);
  const yf = (v: number) => H - pad - ((v - min) / Math.max(max - min, 1)) * (H - pad * 2);
  const line = vs.map((v, i) => `${i === 0 ? "M" : "L"} ${xf(i).toFixed(1)} ${yf(v).toFixed(1)}`).join(" ");
  const area = `${line} L ${xf(vs.length - 1).toFixed(1)} ${H - pad} L ${xf(0).toFixed(1)} ${H - pad} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" role="img" aria-label="Reuse trend">
      <path d={area} fill={color} opacity={0.12} />
      <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={xf(vs.length - 1)} cy={yf(vs[vs.length - 1])} r={3} fill={color} />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Region variance: pickup time by region against the SLA.
// ---------------------------------------------------------------------------
export function RegionBars({ sla }: { sla: number }) {
  const rows = [
    { region: "US", days: 6.8, reuse: 21 },
    { region: "UK", days: 1.9, reuse: 58 },
    { region: "India", days: 2.1, reuse: 55 },
  ];
  const max = 7.2;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "14px 16px" }}>
      {rows.map((r) => {
        const pct = (r.days / max) * 100;
        const breach = r.days > sla;
        const col = breach ? "var(--red)" : "var(--green)";
        return (
          <div key={r.region} style={{ display: "grid", gridTemplateColumns: "44px 1fr 54px", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 650 }}>{r.region}</span>
            <div style={{ position: "relative", height: 16, background: "var(--panel-2)", borderRadius: 5, border: "1px solid var(--line)" }}>
              <div style={{ position: "absolute", left: `${(sla / max) * 100}%`, top: -3, bottom: -3, width: 2, background: "var(--ink-3)" }} title={`SLA ${sla}d`} />
              <div style={{ width: `${pct}%`, height: "100%", background: col, borderRadius: 5, opacity: 0.85 }} />
            </div>
            <span className="mono" style={{ fontSize: 12, color: col, textAlign: "right", fontWeight: 600 }}>{r.days}d</span>
          </div>
        );
      })}
      <div style={{ fontSize: 10.5, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>vertical line = 2-day SLA · US is the outlier we fix</div>
    </div>
  );
}
