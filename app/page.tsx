"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BRIEFS,
  SLA_DAYS,
  SOLUTION_ARCHITECT,
  statusForAge,
  matchesFor,
  templateById,
  planFor,
  handoffSkeleton,
  type Brief,
  type SeamStatus,
  type TemplateMatch,
  type PocPlan,
} from "@/lib/mock";
import { EnginePipeline, SlaGauge, Sparkline, RegionBars } from "./components/Visuals";

type Decision = "accepted" | "rejected" | undefined;

interface DraftPayload {
  matches: TemplateMatch[];
  plan: PocPlan;
  handoff: { section: string; note: string }[];
  source: "claude" | "sample";
  model: string | null;
}

interface EventItem {
  id: number;
  kind: "arrive" | "draft" | "accept" | "reject" | "breach";
  time: string;
  text: React.ReactNode;
}

interface Trigger {
  id: number;
  account: string;
  ageDays: number;
  owner: string;
}

const STATUS_LABEL: Record<SeamStatus, string> = { green: "On track", amber: "At risk", red: "Breached" };
const fmtAge = (d: number) => `${d.toFixed(1)}d`;

export default function ControlSurface() {
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);
  const [ages, setAges] = useState<Record<string, number>>(() =>
    Object.fromEntries(BRIEFS.map((b) => [b.id, b.ageDays]))
  );
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [edited, setEdited] = useState<Record<string, boolean>>({});
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<string>(BRIEFS[0].id);
  const [reuse, setReuse] = useState(21);
  const [reuseHistory, setReuseHistory] = useState<number[]>([21]);
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [drafts, setDrafts] = useState<Record<string, DraftPayload>>({});
  const [draftLoading, setDraftLoading] = useState<Record<string, boolean>>({});
  const evId = useRef(1000);
  const firedRef = useRef<Set<string>>(new Set());
  const loadedRef = useRef<Set<string>>(new Set());
  const boostsRef = useRef<Record<string, number>>({});

  useEffect(() => {
    let t: "light" | "dark" = "light";
    try {
      const saved = localStorage.getItem("revos-theme");
      if (saved === "dark" || saved === "light") t = saved;
      else if (window.matchMedia("(prefers-color-scheme: dark)").matches) t = "dark";
    } catch {}
    setTheme(t);
  }, []);
  useEffect(() => {
    if (!theme) return;
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("revos-theme", theme); } catch {}
  }, [theme]);
  useEffect(() => {
    setReuseHistory((h) => (h[h.length - 1] === reuse ? h : [...h, reuse].slice(-24)));
  }, [reuse]);

  const pushEvent = useCallback((kind: EventItem["kind"], text: React.ReactNode, time = "just now") => {
    setEvents((prev) => [{ id: evId.current++, kind, time, text }, ...prev].slice(0, 40));
  }, []);

  const fireBreach = useCallback((b: Brief, age: number) => {
    if (firedRef.current.has(b.id)) return;
    firedRef.current.add(b.id);
    setTriggers((prev) => [{ id: evId.current++, account: b.account, ageDays: age, owner: SOLUTION_ARCHITECT }, ...prev]);
    pushEvent("breach", (<><b>SLA breach</b> · {b.account} · trigger → {SOLUTION_ARCHITECT} (draft attached)</>));
  }, [pushEvent]);

  // Fetch a real draft from the agent (retrieval + Claude, or sample fallback).
  const loadDraft = useCallback(async (briefId: string, force = false) => {
    if (!force && loadedRef.current.has(briefId)) return;
    loadedRef.current.add(briefId);
    setDraftLoading((s) => ({ ...s, [briefId]: true }));
    try {
      const res = await fetch("/api/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ briefId, boosts: boostsRef.current }),
      });
      if (res.ok) {
        const data: DraftPayload = await res.json();
        setDrafts((s) => ({ ...s, [briefId]: data }));
        const b = BRIEFS.find((x) => x.id === briefId);
        pushEvent("draft", (<>Agent drafted POC plan · <b>{b?.account}</b> · {data.source === "claude" ? `Claude ${data.model}` : "sample"}</>));
      } else {
        loadedRef.current.delete(briefId);
      }
    } catch {
      loadedRef.current.delete(briefId);
    }
    setDraftLoading((s) => ({ ...s, [briefId]: false }));
  }, [pushEvent]);

  // Seed events + any already-breached briefs, once.
  useEffect(() => {
    BRIEFS.forEach((b) => { if (b.ageDays >= SLA_DAYS) fireBreach(b, b.ageDays); });
    setEvents((prev) => [
      ...prev,
      { id: 1, kind: "arrive", time: "3d", text: <>Brief arrived · <b>Meridian Trust Bank</b> (KYC review)</> },
      { id: 2, kind: "arrive", time: "34h", text: <>Brief arrived · <b>Atlas Mutual</b> (claims triage)</> },
      { id: 3, kind: "arrive", time: "10h", text: <>Brief arrived · <b>Cascade Lending</b> (underwriting)</> },
    ]);
    loadDraft(BRIEFS[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch draft whenever selection changes (cached after first load).
  useEffect(() => { loadDraft(selectedId); }, [selectedId, loadDraft]);

  // Accelerated demo clock.
  useEffect(() => {
    const iv = setInterval(() => {
      setAges((prev) => {
        const next = { ...prev };
        for (const b of BRIEFS) {
          if (decisions[b.id]) continue;
          const na = Math.min(next[b.id] + 0.12, 4.2);
          next[b.id] = na;
          if (na >= SLA_DAYS) fireBreach(b, na);
        }
        return next;
      });
    }, 2500);
    return () => clearInterval(iv);
  }, [decisions, fireBreach]);

  const selected = BRIEFS.find((b) => b.id === selectedId)!;
  const worst = useMemo(() => {
    const open = BRIEFS.filter((b) => !decisions[b.id]);
    return open.reduce((m, b) => Math.max(m, ages[b.id]), 0);
  }, [ages, decisions]);
  const openCount = BRIEFS.filter((b) => !decisions[b.id]).length;
  const breachedCount = BRIEFS.filter((b) => !decisions[b.id] && ages[b.id] >= SLA_DAYS).length;
  const seamStatus: SeamStatus = statusForAge(worst);

  const decide = (b: Brief, decision: Exclude<Decision, undefined>) => {
    const usedIds = (drafts[b.id]?.matches ?? matchesFor(b.id)).map((m) => m.templateId);
    setDecisions((prev) => ({ ...prev, [b.id]: decision }));
    if (decision === "accepted") {
      if (usedIds.length) setReuse((r) => Math.min(r + 4, 58));
      usedIds.forEach((id) => (boostsRef.current[id] = (boostsRef.current[id] ?? 0) + 8));
      pushEvent("accept", (<><b>{SOLUTION_ARCHITECT}</b> accepted{edited[b.id] ? " (edited)" : ""} POC plan · {b.account}{usedIds.length ? " · reuse +1 · ranking learns" : ""}</>));
    } else {
      usedIds.forEach((id) => (boostsRef.current[id] = (boostsRef.current[id] ?? 0) - 8));
      pushEvent("reject", (<><b>{SOLUTION_ARCHITECT}</b> rejected draft · {b.account} · ranking penalised</>));
    }
    // Ranking changed → invalidate other briefs' cached drafts so re-rank shows.
    for (const other of BRIEFS) if (other.id !== b.id) { loadedRef.current.delete(other.id); }
    setDrafts((prev) => { const n = { ...prev }; for (const o of BRIEFS) if (o.id !== b.id) delete n[o.id]; return n; });
    setEditMode(false);
    const nextOpen = BRIEFS.find((x) => x.id !== b.id && !decisions[x.id]);
    if (nextOpen) setSelectedId(nextOpen.id);
  };

  const draft = drafts[selected.id];
  const loading = draftLoading[selected.id];
  const plan = draft?.plan ?? planFor(selected);
  const handoff = draft?.handoff ?? handoffSkeleton(selected);
  const matches = draft?.matches ?? matchesFor(selected.id);
  const decision = decisions[selected.id];

  return (
    <div className="shell">
      <header className="topbar">
        <div className="wm"><span className="wm-mark">R</span>Revenue<b>OS</b></div>
        <span className="topbar-context">
          Sales <span className="sep">→</span> PreSales seam
          <span className="sep">·</span> US region
          <span className="sep">·</span> SLA {SLA_DAYS} business days
        </span>
        <div className="topbar-spacer" />
        <span className="role-chip"><span className="dot" />{SOLUTION_ARCHITECT} · US Solution Architect</span>
        <button className="icon-btn" aria-label="Toggle theme" onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}>
          {theme === "dark" ? "☀" : "☾"}
        </button>
      </header>

      <main className="main">
        {/* Pictorial hero: the revenue engine + live SLA gauge */}
        <section className="panel" style={{ display: "grid", gridTemplateColumns: "1fr 150px", gap: 0, marginBottom: 16, overflow: "hidden" }}>
          <div style={{ padding: "16px 18px", borderRight: "1px solid var(--line)" }}>
            <div className="eyebrow" style={{ marginBottom: 4 }}>{"// The revenue engine · Sales→PreSales seam is live"}</div>
            <EnginePipeline status={seamStatus} age={worst} sla={SLA_DAYS} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, padding: "12px" }}>
            <SlaGauge age={worst} sla={SLA_DAYS} status={seamStatus} />
            <span className={`status-pill status-${seamStatus}`} style={{ transform: "scale(0.85)" }}><span className="dot" />{STATUS_LABEL[seamStatus]}</span>
          </div>
        </section>

        <section className="seam" aria-label="Seam health">
          <div className="seam-cell seam-headline">
            <div className="name">Won-opportunity → POC pickup</div>
            <div className="flow">Health computed from events · updates live</div>
          </div>
          <div className="seam-cell">
            <div className="label">Worst open brief age</div>
            <div className="big mono" style={{ color: seamStatus === "red" ? "var(--red)" : seamStatus === "amber" ? "var(--amber)" : "var(--ink)" }}>{fmtAge(worst)}</div>
            <div className="sub">against {SLA_DAYS}d SLA</div>
          </div>
          <div className="seam-cell">
            <div className="label">Open in queue</div>
            <div className="big mono">{openCount}</div>
            <div className="sub">{breachedCount} breached</div>
          </div>
          <div className="seam-cell">
            <div className="label">Reuse rate</div>
            <div className="big mono" style={{ color: "var(--accent)" }}>{reuse}%</div>
            <div className="sub">US was 21% · target 55%+</div>
          </div>
          <div className="seam-cell seam-status-cell">
            <span className={`status-pill status-${seamStatus}`}><span className="dot" />{STATUS_LABEL[seamStatus]}</span>
          </div>
        </section>

        <div className="grid">
          <div className="panel queue">
            <div className="panel-head"><h2>Brief queue</h2><span className="count">{openCount} open</span></div>
            {BRIEFS.map((b) => {
              const a = ages[b.id];
              const st = statusForAge(a);
              const dec = decisions[b.id];
              return (
                <button key={b.id} className={`brief-row ${b.id === selectedId ? "active" : ""}`} onClick={() => { setSelectedId(b.id); setEditMode(false); }}>
                  <div className="top">
                    <span className="acct">{b.account}</span>
                    {dec ? (<span className={`decided ${dec}`}>{dec === "accepted" ? "Accepted" : "Rejected"}</span>) : (<span className={`age-pill status-${st}`}>{fmtAge(a)}</span>)}
                  </div>
                  <div className="meta">{b.segment} · {b.region} · {b.regulator}</div>
                  <div className="tags"><span className="tag">{b.systems[0]}</span><span className="tag">from {b.fromRep.split(" (")[0]}</span></div>
                </button>
              );
            })}
          </div>

          <div className="work">
            <div className="panel brief-card">
              <div className="eyebrow">Incoming brief · OS event</div>
              <h1 style={{ marginTop: 6 }}>{selected.account}</h1>
              <div className="sub">{selected.segment} · {selected.region} · regulator {selected.regulator} · handed off by {selected.fromRep}</div>
              <p className="brief-problem">{selected.problem}</p>
              <div className="kv-row">
                <div className="kv"><div className="k">Systems</div><div className="v">{selected.systems.join(", ")}</div></div>
                <div className="kv"><div className="k">Timeline</div><div className="v">{selected.timeline}</div></div>
                <div className="kv"><div className="k">Success looks like</div><div className="v">{selected.success}</div></div>
              </div>
            </div>

            <div className="panel matches">
              <div className="eyebrow">Agent · retrieved templates &amp; why they match</div>
              {matches.map((m) => {
                const t = templateById(m.templateId);
                if (!t) return null;
                return (
                  <div className="match" key={m.templateId}>
                    <div className="mh">
                      <div>
                        <div className="mname">{t.name}</div>
                        <div className="mmeta">{t.region} origin · {t.segment} · {t.regulator} · reused {t.timesReused}× · last used {t.lastUsed}</div>
                      </div>
                      <div className="score">{m.score}<span className="bar"><i style={{ width: `${m.score}%` }} /></span></div>
                    </div>
                    <ul className="reasons">{m.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>
                  </div>
                );
              })}
            </div>

            <div className="panel">
              <div className="panel-head">
                <h2>Draft POC plan {editMode && <span style={{ color: "var(--accent)", fontWeight: 600 }}>· editing</span>}</h2>
                <span className="count">
                  {loading ? "agent drafting…" : draft ? (draft.source === "claude" ? `drafted by Claude · ${draft.model}` : "sample draft · editable") : "editable"}
                </span>
              </div>
              <div
                className="draft"
                contentEditable={editMode}
                suppressContentEditableWarning
                onInput={() => setEdited((e) => ({ ...e, [selected.id]: true }))}
                style={{ ...(editMode ? { outline: "none", boxShadow: "inset 0 0 0 2px var(--accent-soft)" } : {}), opacity: loading ? 0.55 : 1 }}
              >
                <h3>Objective</h3>
                <p>{plan.objective}</p>
                <h3>Success criteria</h3>
                <ul>{plan.successCriteria.map((s, i) => <li key={i}>{s}</li>)}</ul>
                <h3>Scope — in</h3>
                <ul>{plan.scopeIn.map((s, i) => <li key={i}>{s}</li>)}</ul>
                <h3>Scope — out</h3>
                <ul>{plan.scopeOut.map((s, i) => <li key={i}>{s}</li>)}</ul>
                <h3>Templates drawn on</h3>
                <ul>{plan.templatesUsed.map((tu, i) => { const t = templateById(tu.templateId); return <li key={i}><b>{t?.name ?? tu.templateId}</b> — {tu.change}</li>; })}</ul>
                <h3>Week-by-week plan</h3>
                <div className="weekplan">{plan.weekPlan.map((w, i) => <div className="wk" key={i}><span className="w">{w.week}</span><span className="d">{w.work}</span></div>)}</div>
                <h3>Risks</h3>
                <ul>{plan.risks.map((r, i) => <li key={i}>{r}</li>)}</ul>
                <h3>People needed</h3>
                <ul>{plan.people.map((p, i) => <li key={i}>{p}</li>)}</ul>
              </div>

              <div className="panel-head" style={{ borderTop: "1px solid var(--line)" }}>
                <h2>Handoff document skeleton</h2><span className="count">for Delivery</span>
              </div>
              <div className="draft handoff" style={{ paddingTop: 12 }}>
                {handoff.map((h, i) => <div className="hs" key={i}><span className="s">{h.section}</span><span className="n">{h.note}</span></div>)}
              </div>

              <div className="actionbar">
                {decision ? (
                  <span className="hint">This brief was <b style={{ color: decision === "accepted" ? "var(--green)" : "var(--red)" }}>{decision}</b> · decision recorded as an OS event.</span>
                ) : (
                  <>
                    <span className="hint">The agent proposes; you commit. Accept, edit, or reject — each is an OS event that feeds ranking.</span>
                    <button className="btn btn-ghost" onClick={() => loadDraft(selected.id, true)} disabled={loading}>Regenerate</button>
                    <button className="btn" onClick={() => setEditMode((e) => !e)}>{editMode ? "Done editing" : "Edit"}</button>
                    <button className="btn btn-danger" onClick={() => decide(selected, "rejected")}>Reject</button>
                    <button className="btn btn-primary" onClick={() => decide(selected, "accepted")}>Accept &amp; send</button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="rail">
            <div className="panel reuse-meter">
              <div className="eyebrow">Reuse of prior solutions</div>
              <div className="big mono" style={{ color: "var(--accent)", marginTop: 6 }}>{reuse}%</div>
              <Sparkline values={reuseHistory} />
              <div className="track"><i style={{ width: `${reuse}%` }} /></div>
              <div className="nums"><span>US start 21%</span><span>UK 58% · India 55%</span></div>
            </div>

            <div className="panel">
              <div className="panel-head"><h2>Pickup time by region</h2><span className="count">variance</span></div>
              <RegionBars sla={SLA_DAYS} />
            </div>

            <div className="panel">
              <div className="panel-head"><h2>Triggers</h2><span className="count">{triggers.length}</span></div>
              {triggers.length === 0 ? (
                <div className="empty">No SLA breaches. The seam is healthy.</div>
              ) : (
                triggers.map((t) => (
                  <div className="trigger" key={t.id}>
                    <div className="th">⚠ SLA breach escalated</div>
                    <div className="tbody"><b>{t.account}</b> sat {fmtAge(t.ageDays)} against a {SLA_DAYS}d SLA. Escalated to <b>{t.owner}</b> with the current draft attached.</div>
                  </div>
                ))
              )}
            </div>

            <div className="panel">
              <div className="panel-head"><h2>Event log</h2><span className="count">source of truth</span></div>
              <div className="log">
                {events.map((e) => (
                  <div className={`event ev-${e.kind}`} key={e.id}>
                    <span className="edot" /><span className="etime">{e.time}</span><span className="etext">{e.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="footer-note">
          Prototype · all data synthetic · seam health, reuse and triggers computed live from the event log · retrieval is explainable and learns from decisions · POC drafting runs on Claude when an API key is set, otherwise a sample draft.
        </div>
      </main>
    </div>
  );
}
