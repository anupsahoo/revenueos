"use client";

import React from "react";
import { Stat, DomainTreemap, RegionStack, TrendArea, Funnel6, DealScatter } from "./components/Charts";
import { Heatmap } from "./components/Viz";
import { TOTALS, BY_DOMAIN, BY_REGION, FUNNEL, TREND, DOMAIN_STAGE, SCATTER, STAGES } from "@/lib/dataset";

const fmt = (n: number) => n.toLocaleString("en-US");

export default function Portfolio() {
  return (
    <div className="page">
      <div className="cockpit-head">
        <div>
          <div className="eyebrow">{"// Platform portfolio · all tenants"}</div>
          <h1>Command Centre</h1>
        </div>
        <div className="persona-badge">🌐 {fmt(TOTALS.companies)} companies · {fmt(TOTALS.projects)} projects</div>
      </div>

      <div className="kpi-row">
        <Stat label="Companies" value={fmt(TOTALS.companies)} spark={TREND.map((t) => t.pipeline)} />
        <Stat label="Projects" value={fmt(TOTALS.projects)} spark={TREND.map((t) => t.won)} />
        <Stat label="People" value={`${(TOTALS.people / 1000).toFixed(0)}k`} color="var(--ink)" />
        <Stat label="Pipeline" value={`$${fmt(TOTALS.pipelineM)}`} unit="M" spark={TREND.map((t) => t.pipeline)} />
        <Stat label="SLA compliance" value={TOTALS.slaCompliance} unit="%" color="var(--green)" spark={TREND.map((t) => t.compliance)} />
        <Stat label="Breached" value={fmt(TOTALS.breached)} color="var(--red)" delta="seams past SLA" />
      </div>

      <div className="cols-2">
        <div className="panel chart-panel">
          <div className="panel-head"><h2>Pipeline by domain</h2><span className="count">$M · treemap</span></div>
          <div className="chart-body"><DomainTreemap data={BY_DOMAIN.map((d) => ({ name: d.domain, size: d.pipelineM }))} /></div>
        </div>
        <div className="panel chart-panel">
          <div className="panel-head"><h2>Health by region</h2><span className="count">projects</span></div>
          <div className="chart-body"><RegionStack data={BY_REGION} /></div>
        </div>
      </div>

      <div className="cols-2">
        <div className="panel chart-panel">
          <div className="panel-head"><h2>Pipeline vs won</h2><span className="count">12 months · $M</span></div>
          <div className="chart-body"><TrendArea data={TREND} keys={[{ k: "pipeline", color: "var(--accent)", label: "Pipeline" }, { k: "won", color: "var(--green)", label: "Won" }]} /></div>
        </div>
        <div className="panel chart-panel">
          <div className="panel-head"><h2>Stage funnel</h2><span className="count">projects</span></div>
          <div className="chart-body"><Funnel6 data={FUNNEL} /></div>
        </div>
      </div>

      <div className="cols-2">
        <div className="panel chart-panel">
          <div className="panel-head"><h2>Seam health · domain × stage</h2><span className="count">10 × 6</span></div>
          <div className="chart-body" style={{ paddingTop: 18 }}>
            <Heatmap
              rows={DOMAIN_STAGE.map((d) => ({ id: d.domain, label: d.domain }))}
              cols={STAGES}
              cell={(rowId, ci) => DOMAIN_STAGE.find((d) => d.domain === rowId)!.cells[ci]}
            />
          </div>
        </div>
        <div className="panel chart-panel">
          <div className="panel-head"><h2>Deals · size vs SLA attainment</h2><span className="count">colour = status</span></div>
          <div className="chart-body"><DealScatter data={SCATTER} /></div>
        </div>
      </div>
    </div>
  );
}
