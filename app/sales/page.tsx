"use client";

import React from "react";
import { useApp } from "../components/AppFrame";
import { Kpi, Heatmap, ForecastBars, statusPill } from "../components/Viz";
import type { Vertical } from "@/lib/enterprise";
import { statusForAge } from "@/lib/mock";

export default function SalesCockpit() {
  const { company, verticalId } = useApp();
  const verts = verticalId ? company.verticals.filter((v) => v.id === verticalId) : company.verticals;
  const sum = (f: (v: Vertical) => number) => verts.reduce((a, v) => a + f(v), 0);

  const cols = verts[0]?.stages.map((s) => s.stage) ?? [];
  const worstVert = [...verts].sort((a, b) => b.atRisk - a.atRisk)[0];

  return (
    <div className="page">
      <div className="cockpit-head">
        <div>
          <div className="eyebrow">{"// Director of Sales · command centre"}</div>
          <h1>{company.name} — Sales</h1>
          <p className="cockpit-sub">Where is the revenue risk, across {verts.length} vertical{verts.length > 1 ? "s" : ""}? Every number is computed from the event log.</p>
        </div>
        <div className="persona-badge">🎩 Director of Sales</div>
      </div>

      <div className="kpi-row">
        <Kpi label="Pipeline" value={`$${sum((v) => v.pipelineM)}`} unit="M" delta={`${sum((v) => v.deals)} open deals`} />
        <Kpi label="Forecast" value={`$${sum((v) => v.forecastM)}`} unit="M" accent="var(--accent)" delta="this quarter" />
        <Kpi label="Won QTD" value={`$${sum((v) => v.wonQtrM)}`} unit="M" accent="var(--green)" />
        <Kpi label="At-risk deals" value={sum((v) => v.atRisk)} accent="var(--red)" delta="need attention" />
        <Kpi label="Breached seams" value={sum((v) => v.breached)} accent={sum((v) => v.breached) ? "var(--red)" : "var(--green)"} delta="vs SLA" />
      </div>

      <div className="cols-2">
        <div className="panel">
          <div className="panel-head"><h2>Seam-health heatmap</h2><span className="count">vertical × stage</span></div>
          <div style={{ padding: "16px 18px" }}>
            <Heatmap
              rows={verts.map((v) => ({ id: v.id, label: v.name, icon: v.icon }))}
              cols={cols}
              cell={(rowId, ci) => (verts.find((v) => v.id === rowId)?.stages[ci].status ?? "green")}
            />
            <div className="legend"><span><i className="lg green" />on track</span><span><i className="lg amber" />at risk</span><span><i className="lg red" />breached</span></div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head"><h2>Pipeline &amp; forecast by vertical</h2><span className="count">$M</span></div>
          <div style={{ padding: "16px 18px" }}>
            <ForecastBars rows={verts.map((v) => ({ label: v.name, icon: v.icon, pipeline: v.pipelineM, forecast: v.forecastM, won: v.wonQtrM }))} />
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h2>Where to look first</h2><span className="count">auto-surfaced</span></div>
        <div style={{ padding: "6px 8px" }}>
          {verts.map((v) => {
            const st = statusForAge(v.avgPickup);
            return (
              <div key={v.id} className="risk-row">
                <span className="risk-vert">{v.icon} {v.name}</span>
                {statusPill(st, `${v.avgPickup}d pickup / ${v.sla}d SLA`)}
                <span className="risk-meta mono">{v.openBriefs} open · {v.breached} breached · {v.atRisk} at-risk</span>
                <div className="risk-bar"><i style={{ width: `${Math.min((v.avgPickup / (v.sla * 3)) * 100, 100)}%`, background: st === "red" ? "var(--red)" : st === "amber" ? "var(--amber)" : "var(--green)" }} /></div>
              </div>
            );
          })}
          {worstVert && <p className="risk-note">Biggest exposure: <b>{worstVert.icon} {worstVert.name}</b> — {worstVert.atRisk} at-risk deals and {worstVert.breached} breached seams. Drill into the operator loop to clear the backlog.</p>}
        </div>
      </div>
    </div>
  );
}
