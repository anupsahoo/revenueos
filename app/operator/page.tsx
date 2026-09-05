"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  COMPANIES, VERTICALS, filterProjects, projectById, briefsForProject, briefById,
  projectStatus, estateTotals, architectById, type Brief,
} from "@/lib/estate";
import { SLA_DAYS, statusForAge, templateById, type SeamStatus, type TemplateMatch, type PocPlan } from "@/lib/mock";
import { SlaGauge } from "../components/Visuals";
import { statusPill } from "../components/Viz";

interface DraftPayload { matches: TemplateMatch[]; plan: PocPlan; handoff: { section: string; note: string }[]; source: "ai" | "sample"; model: string | null; }
const fmt = (n: number) => n.toLocaleString("en-US");
const STLBL: Record<SeamStatus, string> = { green: "On track", amber: "At risk", red: "Breached" };

export default function OperatorWorkspace() {
  const T = useMemo(() => estateTotals(), []);
  const [companyId, setCompanyId] = useState(COMPANIES[0].id);
  const [vertical, setVertical] = useState("all");
  const [status, setStatus] = useState<SeamStatus | "all">("all");
  const [q, setQ] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [briefId, setBriefId] = useState<string | null>(null);
  const [decisions, setDecisions] = useState<Record<string, "accepted" | "rejected">>({});
  const [drafts, setDrafts] = useState<Record<string, DraftPayload>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [editMode, setEditMode] = useState(false);
  const boostsRef = useRef<Record<string, number>>({});
  const loadedRef = useRef<Set<string>>(new Set());

  const projects = useMemo(
    () => filterProjects({ companyId: companyId || undefined, vertical, status, q }),
    [companyId, vertical, status, q]
  );
  const project = projectId ? projectById(projectId) : null;
  const projectBriefs = project ? briefsForProject(project.id) : [];
  const brief = briefId ? briefById(briefId) : null;

  const loadDraft = useCallback(async (b: Brief, force = false) => {
    if (!force && loadedRef.current.has(b.id)) return;
    loadedRef.current.add(b.id);
    setLoading((s) => ({ ...s, [b.id]: true }));
    try {
      const res = await fetch("/api/draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ brief: b, boosts: boostsRef.current }) });
      if (res.ok) { const data = await res.json(); setDrafts((s) => ({ ...s, [b.id]: data })); }
      else loadedRef.current.delete(b.id);
    } catch { loadedRef.current.delete(b.id); }
    setLoading((s) => ({ ...s, [b.id]: false }));
  }, []);

  useEffect(() => { if (brief) loadDraft(brief); }, [brief, loadDraft]);

  const openProject = (id: string) => { setProjectId(id); setBriefId(null); setEditMode(false); };
  const openBrief = (id: string) => { setBriefId(id); setEditMode(false); };

  const decide = (b: Brief, d: "accepted" | "rejected") => {
    const used = (drafts[b.id]?.matches ?? []).map((m) => m.templateId);
    setDecisions((prev) => ({ ...prev, [b.id]: d }));
    used.forEach((id) => (boostsRef.current[id] = (boostsRef.current[id] ?? 0) + (d === "accepted" ? 8 : -8)));
    loadedRef.current.clear();
    setDrafts({});
    setEditMode(false);
  };

  const draft = brief ? drafts[brief.id] : undefined;
  const isLoading = brief ? loading[brief.id] : false;
  const decision = brief ? decisions[brief.id] : undefined;
  const arch = project ? architectById(project.architectId) : null;

  return (
    <div className="page ws-page">
      <div className="cockpit-head">
        <div><div className="eyebrow">{"// Operator workspace · Sales→PreSales"}</div><h1>Project portfolio</h1></div>
        <div className="persona-badge">🗂️ {fmt(T.projects)} projects · {fmt(T.openBriefs)} open briefs</div>
      </div>

      <div className="kpi-row">
        {[["Companies", fmt(T.companies), undefined], ["Projects", fmt(T.projects), undefined], ["Open briefs", fmt(T.openBriefs), undefined], ["Breached", fmt(T.breached), "var(--red)"], ["Architects", fmt(T.architects), undefined], ["Contracts", `$${fmt(T.contractM)}M`, "var(--accent)"]].map(([l, v, c]) => (
          <div className="kpi" key={l as string}><div className="kpi-label">{l}</div><div className="kpi-value mono" style={c ? { color: c as string } : undefined}>{v}</div></div>
        ))}
      </div>

      <div className="ws">
        {/* Projects browser */}
        <div className="panel ws-list">
          <div className="filters">
            <input className="filter-input" placeholder="Search projects…" value={q} onChange={(e) => setQ(e.target.value)} />
            <div className="filter-row">
              <select className="filter-select" value={companyId} onChange={(e) => { setCompanyId(e.target.value); openProject(""); setProjectId(null); }}>
                <option value="">All companies</option>
                {COMPANIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select className="filter-select" value={vertical} onChange={(e) => setVertical(e.target.value)}>
                <option value="all">All verticals</option>
                {VERTICALS.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
              <select className="filter-select" value={status} onChange={(e) => setStatus(e.target.value as SeamStatus | "all")}>
                <option value="all">Any status</option><option value="red">Breached</option><option value="amber">At risk</option><option value="green">On track</option>
              </select>
            </div>
          </div>
          <div className="ws-scroll">
            <div className="ws-count mono">{projects.length} projects</div>
            {projects.map((p) => {
              const st = projectStatus(p.id);
              return (
                <button key={p.id} className={`proj-row ${p.id === projectId ? "active" : ""}`} onClick={() => openProject(p.id)}>
                  <div className="proj-top"><span className="proj-name">{p.name}</span><span className={`dotpill status-${st.status}`}><span className="dot" /></span></div>
                  <div className="proj-meta">{p.company} · {p.vertical} · {p.stage}</div>
                  <div className="proj-tags"><span className="tag">{p.architect}</span><span className="tag mono">${fmt(p.valueK)}k</span><span className="tag mono">{st.open} briefs</span></div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detail */}
        <div className="ws-detail">
          {!project && <div className="panel empty-lg">Select a project from the portfolio to see its briefs and work the loop.</div>}

          {project && !brief && (
            <>
              <div className="panel brief-card">
                <div className="eyebrow">Project</div>
                <h1 style={{ marginTop: 6, fontSize: 20 }}>{project.name}</h1>
                <div className="sub">{project.company} · {project.vertical} · {project.region} · {project.stage}</div>
                <div className="kv-row" style={{ marginTop: 14 }}>
                  <div className="kv"><div className="k">Assigned architect</div><div className="v">{project.architect}{arch && ` · load ${arch.load}%`}</div></div>
                  <div className="kv"><div className="k">Contract</div><div className="v mono">${fmt(project.contractK)}k</div></div>
                  <div className="kv"><div className="k">Deal value</div><div className="v mono">${fmt(project.valueK)}k</div></div>
                  <div className="kv"><div className="k">Regulator</div><div className="v">{project.regulator}</div></div>
                  <div className="kv"><div className="k">SLA</div><div className="v">{project.sla} business days</div></div>
                </div>
              </div>
              <div className="panel">
                <div className="panel-head"><h2>Briefs on this project</h2><span className="count">{projectBriefs.length}</span></div>
                {projectBriefs.map((b) => {
                  const st = statusForAge(b.ageDays);
                  const dec = decisions[b.id] ?? (b.status !== "open" ? b.status : undefined);
                  return (
                    <button key={b.id} className="brief-row" onClick={() => openBrief(b.id)}>
                      <div className="top"><span className="acct">{b.title}</span>{dec ? <span className={`decided ${dec}`}>{dec}</span> : <span className={`age-pill status-${st}`}>{b.ageDays.toFixed(1)}d</span>}</div>
                      <div className="meta">{b.segment} · {b.regulator} · from {b.fromRep}</div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {project && brief && (
            <>
              <button className="back-link" onClick={() => setBriefId(null)}>← {project.name}</button>
              <div className="panel brief-card">
                <div className="eyebrow">Incoming brief · {brief.vertical}</div>
                <h1 style={{ marginTop: 6, fontSize: 20 }}>{brief.title}</h1>
                <div className="sub">{brief.account} · {brief.segment} · {brief.region} · regulator {brief.regulator} · from {brief.fromRep}</div>
                <p className="brief-problem">{brief.problem}</p>
                <div className="kv-row">
                  <div className="kv"><div className="k">Systems</div><div className="v">{brief.systems.join(", ")}</div></div>
                  <div className="kv"><div className="k">Timeline</div><div className="v">{brief.timeline}</div></div>
                  <div className="kv"><div className="k">Success looks like</div><div className="v">{brief.success}</div></div>
                  <div className="kv"><div className="k">Owner</div><div className="v">{brief.architect} · US Solution Architect</div></div>
                </div>
              </div>

              <div className="panel matches">
                <div className="eyebrow">Agent · retrieved templates &amp; why they match</div>
                {(draft?.matches ?? []).map((m) => { const t = templateById(m.templateId); if (!t) return null; return (
                  <div className="match" key={m.templateId}>
                    <div className="mh"><div><div className="mname">{t.name}</div><div className="mmeta">{t.region} origin · {t.segment} · reused {t.timesReused}×</div></div><div className="score">{m.score}<span className="bar"><i style={{ width: `${m.score}%` }} /></span></div></div>
                    <ul className="reasons">{m.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>
                  </div>
                ); })}
                {!draft && !isLoading && <div className="empty">Draft not loaded.</div>}
              </div>

              <div className="panel">
                <div className="panel-head"><h2>Draft POC plan</h2><span className="count">{isLoading ? "agent drafting…" : draft ? (draft.source === "ai" ? `drafted by AI · ${draft.model}` : "sample draft") : ""}</span></div>
                {draft && (
                  <div className="draft" contentEditable={editMode} suppressContentEditableWarning style={editMode ? { outline: "none", boxShadow: "inset 0 0 0 2px var(--accent-soft)" } : undefined}>
                    <h3>Objective</h3><p>{draft.plan.objective}</p>
                    <h3>Success criteria</h3><ul>{draft.plan.successCriteria.map((s, i) => <li key={i}>{s}</li>)}</ul>
                    <h3>Scope — in</h3><ul>{draft.plan.scopeIn.map((s, i) => <li key={i}>{s}</li>)}</ul>
                    <h3>Week-by-week plan</h3><div className="weekplan">{draft.plan.weekPlan.map((w, i) => <div className="wk" key={i}><span className="w">{w.week}</span><span className="d">{w.work}</span></div>)}</div>
                    <h3>Risks</h3><ul>{draft.plan.risks.map((s, i) => <li key={i}>{s}</li>)}</ul>
                  </div>
                )}
                {isLoading && !draft && <div className="empty">Retrieving templates and drafting the plan…</div>}
                <div className="actionbar">
                  {decision ? <span className="hint">This brief was <b style={{ color: decision === "accepted" ? "var(--green)" : "var(--red)" }}>{decision}</b>.</span> : (<>
                    <span className="hint">The agent proposes; {brief.architect} commits.</span>
                    <button className="btn btn-ghost" onClick={() => loadDraft(brief, true)} disabled={isLoading}>Regenerate</button>
                    <button className="btn" onClick={() => setEditMode((e) => !e)}>{editMode ? "Done" : "Edit"}</button>
                    <button className="btn btn-danger" onClick={() => decide(brief, "rejected")}>Reject</button>
                    <button className="btn btn-primary" onClick={() => decide(brief, "accepted")}>Accept &amp; send</button>
                  </>)}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right rail */}
        <div className="ws-rail">
          {brief ? (
            <div className="panel" style={{ padding: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div className="eyebrow" style={{ alignSelf: "flex-start" }}>SLA</div>
              <SlaGauge age={brief.ageDays} sla={SLA_DAYS} status={statusForAge(brief.ageDays)} />
              {statusPill(statusForAge(brief.ageDays), STLBL[statusForAge(brief.ageDays)])}
            </div>
          ) : project ? (
            <div className="panel" style={{ padding: 16 }}>
              <div className="eyebrow">Project health</div>
              <div style={{ marginTop: 10 }}>{statusPill(projectStatus(project.id).status, STLBL[projectStatus(project.id).status])}</div>
              <div className="kv" style={{ marginTop: 14 }}><div className="k">Worst open brief</div><div className="v mono">{projectStatus(project.id).worst.toFixed(1)}d / {project.sla}d</div></div>
            </div>
          ) : (
            <div className="panel empty-lg">Health &amp; SLA appear here.</div>
          )}
        </div>
      </div>
    </div>
  );
}
