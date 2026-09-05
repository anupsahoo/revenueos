"use client";

import React from "react";
import { useApp } from "../components/AppFrame";
import { Stat, CapacityBars, DomainBars, TrendArea } from "../components/Charts";
import { Donut } from "../components/Viz";
import { BY_DOMAIN, CAPACITY, TREND, TOTALS, DOMAINS } from "@/lib/dataset";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const fmt = (n: number) => n.toLocaleString("en-US");

export default function PresalesCockpit() {
  const { verticalId } = useApp();
  const dom = verticalId && DOMAINS.includes(cap(verticalId)) ? cap(verticalId) : null;
  const domains = dom ? BY_DOMAIN.filter((d) => d.domain === dom) : BY_DOMAIN;
  const avgReuse = Math.round(domains.reduce((a, d) => a + d.reuse, 0) / domains.length);
  const overloaded = CAPACITY[3].people + CAPACITY[4].people;
  const totalPeople = CAPACITY.reduce((a, b) => a + b.people, 0);

  return (
    <div className="page">
      <div className="cockpit-head">
        <div><div className="eyebrow">{"// Director of Pre-Sales"}</div><h1>Pre-Sales Command Centre{dom && ` · ${dom}`}</h1></div>
        <div className="persona-badge">🎩 Director of Pre-Sales</div>
      </div>

      <div className="kpi-row">
        <Stat label="Solution architects" value={fmt(totalPeople)} />
        <Stat label="Overloaded" value={fmt(overloaded)} unit="" color="var(--red)" delta="over 80% load" />
        <Stat label="Avg reuse" value={avgReuse} unit="%" color="var(--accent)" delta="target 55%+" />
        <Stat label="SLA compliance" value={TOTALS.slaCompliance} unit="%" color="var(--green)" spark={TREND.map((t) => t.compliance)} />
        <Stat label="Open projects" value={fmt(domains.reduce((a, d) => a + d.projects, 0))} />
      </div>

      <div className="cols-2">
        <div className="panel chart-panel"><div className="panel-head"><h2>Architect capacity</h2><span className="count">{fmt(overloaded)} overloaded</span></div><div className="chart-body"><CapacityBars data={CAPACITY} /></div></div>
        <div className="panel chart-panel"><div className="panel-head"><h2>SLA compliance trend</h2><span className="count">12 mo</span></div><div className="chart-body"><TrendArea data={TREND} keys={[{ k: "compliance", color: "var(--green)", label: "Compliance %" }]} /></div></div>
      </div>

      <div className="cols-2">
        <div className="panel chart-panel"><div className="panel-head"><h2>Reuse by domain</h2><span className="count">the leverage · %</span></div><div className="chart-body"><DomainBars data={BY_DOMAIN} dataKey="reuse" unit="%" /></div></div>
        <div className="panel chart-panel"><div className="panel-head"><h2>Reuse leaders</h2><span className="count">top domains</span></div>
          <div className="chart-body" style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-around", alignItems: "center", paddingTop: 22 }}>
            {[...BY_DOMAIN].sort((a, b) => b.reuse - a.reuse).slice(0, 5).map((d) => <Donut key={d.domain} value={d.reuse} label={d.domain} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
