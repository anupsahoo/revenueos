"use client";

import React from "react";
import { useApp } from "../components/AppFrame";
import { Stat, DomainBars, Funnel6, TrendArea, DealScatter, RegionStack } from "../components/Charts";
import { BY_DOMAIN, BY_REGION, FUNNEL, TREND, SCATTER, TOTALS, DOMAINS } from "@/lib/dataset";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const fmt = (n: number) => n.toLocaleString("en-US");

export default function SalesCockpit() {
  const { verticalId } = useApp();
  const dom = verticalId && DOMAINS.includes(cap(verticalId)) ? cap(verticalId) : null;
  const row = dom ? BY_DOMAIN.find((d) => d.domain === dom) : null;
  const scatter = dom ? SCATTER.filter((s) => s.domain === dom) : SCATTER;

  return (
    <div className="page">
      <div className="cockpit-head">
        <div><div className="eyebrow">{"// Director of Sales"}</div><h1>Sales Command Centre{dom && ` · ${dom}`}</h1></div>
        <div className="persona-badge">🎩 Director of Sales</div>
      </div>

      <div className="kpi-row">
        <Stat label="Pipeline" value={`$${fmt(row ? row.pipelineM : TOTALS.pipelineM)}`} unit="M" spark={TREND.map((t) => t.pipeline)} />
        <Stat label="Won QTD" value={`$${fmt(TOTALS.wonM)}`} unit="M" color="var(--green)" spark={TREND.map((t) => t.won)} />
        <Stat label="Projects" value={fmt(row ? row.projects : TOTALS.projects)} />
        <Stat label="Breach rate" value={row ? row.breach : Math.round((TOTALS.breached / TOTALS.projects) * 100)} unit="%" color="var(--red)" />
        <Stat label="SLA compliance" value={TOTALS.slaCompliance} unit="%" color="var(--green)" spark={TREND.map((t) => t.compliance)} />
      </div>

      <div className="cols-2">
        <div className="panel chart-panel"><div className="panel-head"><h2>Pipeline by domain</h2><span className="count">$M</span></div><div className="chart-body"><DomainBars data={BY_DOMAIN} dataKey="pipelineM" unit="M" /></div></div>
        <div className="panel chart-panel"><div className="panel-head"><h2>Pipeline vs won</h2><span className="count">12 mo</span></div><div className="chart-body"><TrendArea data={TREND} keys={[{ k: "pipeline", color: "var(--accent)", label: "Pipeline" }, { k: "won", color: "var(--green)", label: "Won" }]} /></div></div>
      </div>

      <div className="cols-2">
        <div className="panel chart-panel"><div className="panel-head"><h2>Stage funnel</h2><span className="count">projects</span></div><div className="chart-body"><Funnel6 data={FUNNEL} /></div></div>
        <div className="panel chart-panel"><div className="panel-head"><h2>Health by region</h2><span className="count">projects</span></div><div className="chart-body"><RegionStack data={BY_REGION} /></div></div>
      </div>

      <div className="panel chart-panel"><div className="panel-head"><h2>Deals · size vs SLA attainment</h2><span className="count">{dom ?? "all domains"} · colour = status</span></div><div className="chart-body"><DealScatter data={scatter} h={260} /></div></div>
    </div>
  );
}
