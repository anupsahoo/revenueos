"use client";

import React from "react";
import { useApp } from "../components/AppFrame";
import { Kpi, Bar, Donut } from "../components/Viz";
import { ARCHITECTS, type Vertical } from "@/lib/enterprise";

export default function PresalesCockpit() {
  const { company, verticalId } = useApp();
  const verts = verticalId ? company.verticals.filter((v) => v.id === verticalId) : company.verticals;
  const sum = (f: (v: Vertical) => number) => verts.reduce((a, v) => a + f(v), 0);
  const wAvg = (f: (v: Vertical) => number) => Math.round(sum((v) => f(v) * v.deals) / Math.max(sum((v) => v.deals), 1));

  const vertNames = new Set(verts.map((v) => v.name));
  const architects = verticalId ? ARCHITECTS.filter((a) => vertNames.has(a.vertical)) : ARCHITECTS;
  const overloaded = architects.filter((a) => a.load >= 85).length;

  return (
    <div className="page">
      <div className="cockpit-head">
        <div>
          <div className="eyebrow">{"// Director of Pre-Sales · command centre"}</div>
          <h1>{company.name} — Pre-Sales</h1>
          <p className="cockpit-sub">Where is the burden? Capacity, throughput and reuse across {verts.length} vertical{verts.length > 1 ? "s" : ""}.</p>
        </div>
        <div className="persona-badge">🎩 Director of Pre-Sales</div>
      </div>

      <div className="kpi-row">
        <Kpi label="Open briefs" value={sum((v) => v.openBriefs)} delta={`${sum((v) => v.breached)} past SLA`} accent={sum((v) => v.breached) ? "var(--red)" : undefined} />
        <Kpi label="Architects" value={architects.length} delta={`${overloaded} overloaded`} accent={overloaded ? "var(--amber)" : "var(--green)"} />
        <Kpi label="POC throughput" value={sum((v) => v.pocThroughput)} unit="/mo" accent="var(--accent)" />
        <Kpi label="Reuse rate" value={wAvg((v) => v.reuse)} unit="%" accent="var(--accent)" delta="target 55%+" />
        <Kpi label="Avg pickup" value={wAvg((v) => v.avgPickup)} unit="d" accent={wAvg((v) => v.avgPickup) > 2 ? "var(--red)" : "var(--green)"} delta="2d SLA" />
      </div>

      <div className="cols-2">
        <div className="panel">
          <div className="panel-head"><h2>Architect capacity</h2><span className="count">{overloaded} over 85%</span></div>
          <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
            {architects.map((a) => (
              <Bar key={a.name} label={`${a.name} · ${a.vertical} · ${a.open} open`} value={a.load} warnAbove={85} />
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head"><h2>Reuse &amp; throughput by vertical</h2><span className="count">the leverage</span></div>
          <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "space-around" }}>
              {verts.map((v) => <Donut key={v.id} value={v.reuse} label={`${v.icon} ${v.name}`} />)}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {verts.map((v) => <Bar key={v.id} label={`${v.icon} ${v.name} · POC throughput`} value={v.pocThroughput} max={20} unit="/mo" goodHigh />)}
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h2>Backlog pressure</h2><span className="count">open vs breached</span></div>
        <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
          {verts.map((v) => (
            <div key={v.id} className="risk-row">
              <span className="risk-vert">{v.icon} {v.name}</span>
              <span className="risk-meta mono">{v.openBriefs} open · {v.breached} breached · load {v.load}%</span>
              <div className="risk-bar"><i style={{ width: `${v.load}%`, background: v.load >= 85 ? "var(--red)" : v.load >= 68 ? "var(--amber)" : "var(--green)" }} /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
