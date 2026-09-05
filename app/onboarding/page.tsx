"use client";

import React from "react";
import { useApp } from "../components/AppFrame";
import { Journey } from "../components/Viz";
import { ONBOARDINGS, type Onboarding } from "@/lib/enterprise";

const KIND: Record<Onboarding["kind"], { label: string; icon: string }> = {
  company: { label: "Company", icon: "🏢" },
  vertical: { label: "Vertical / team", icon: "🧩" },
  system: { label: "System / integration", icon: "🔌" },
  user: { label: "Users", icon: "👥" },
};

export default function OnboardingPage() {
  const { company } = useApp();

  return (
    <div className="page">
      <div className="cockpit-head">
        <div>
          <div className="eyebrow">{"// Onboarding · guided journeys"}</div>
          <h1>Onboarding</h1>
          <p className="cockpit-sub">You onboard a company, a team, a system — not one person. Each is a resumable, visual journey with an owner and a status.</p>
        </div>
        <div className="persona-badge">🚀 {company.name}</div>
      </div>

      <div className="onboard-grid">
        {ONBOARDINGS.map((o) => {
          const k = KIND[o.kind];
          const done = o.current >= o.steps.length;
          const pct = Math.round((o.current / o.steps.length) * 100);
          return (
            <div className="panel onboard-card" key={o.id}>
              <div className="onboard-top">
                <span className="onboard-kind">{k.icon} {k.label}</span>
                <span className={`onboard-pct mono ${done ? "done" : ""}`}>{done ? "live" : `${pct}%`}</span>
              </div>
              <h3 className="onboard-title">{o.title}</h3>
              <div className="onboard-sub">{o.sub} · owner {o.owner}</div>
              <Journey steps={o.steps} current={o.current} />
            </div>
          );
        })}
      </div>

      <div className="panel" style={{ padding: "18px 20px" }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>{"// The company onboarding journey"}</div>
        <Journey steps={["Provision tenant", "Org structure", "Connect systems", "Invite users", "Choose vertical packs", "Seed templates", "Dry-run", "Go live"]} current={4} />
        <p className="risk-note">Retail today, banking tomorrow, healthcare the day after — each team loads its own vertical pack (seams, SLAs, regulators, templates, agent), no code change.</p>
      </div>
    </div>
  );
}
