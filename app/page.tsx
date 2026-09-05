"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BRIEFS, SLA_DAYS, SOLUTION_ARCHITECT, REF, businessDaysBetween, statusForAge, templateById,
  requiredSkills, skillAvail, skillStatus, skillCoverage, skillPrepPlan,
  type Brief, type SeamStatus, type TemplateMatch, type PocPlan,
} from "@/lib/mock";

interface Draft { matches: TemplateMatch[]; plan: PocPlan; handoff: { section: string; note: string }[]; source: "ai" | "sample"; model: string | null; }
type Decision = "accepted" | "rejected";
const DAY = 86_400_000;
const STAT: Record<SeamStatus, string> = { green: "on track", amber: "at risk", red: "breached" };
const CH: Record<SeamStatus, string> = { green: "g", amber: "a", red: "r" };
const SG: Record<SeamStatus, string> = { green: "sg", amber: "sa", red: "sr" };
const TC: Record<SeamStatus, string> = { green: "tg", amber: "ta", red: "tr" };

const DERIV = {
  age: "Business days since this brief arrived, computed now. Weekends are skipped because the SLA is stated in business days.",
  status: "Red at or past 2.0 business days; amber from 1.0; green below. Derived from age; nothing is stored.",
  reuse: "Accepted drafts ÷ (accepted + rejected), over the decision events this session. Moves the moment a decision is recorded.",
  match: "Structured scoring: segment 30, regulator 16 (analogue 8), problem overlap up to 26, shared systems up to 18, recency 5, proven reuse 4, cross-region 3, plus a learned ±8 per prior accept/reject. Threshold 40.",
  health: "Every open brief's status, recomputed from arrival times on each poll.",
  skills: "Each skill the project needs, matched to the team's current bench strength (0-100). Green ≥70 strong, amber 40-69 partial, red <40 gap. Coverage is the average across the required skills.",
};
const CHIPS = [
  "Why did the agent pick this template for the selected brief?",
  "Which briefs are past SLA right now and who was triggered?",
  "What changed in ranking after the last decision?",
  "What happens to this data if the instance restarts?",
  "What was cut from M0 and why?",
  "What breaks first at ten times the volume?",
];

function Info({ id, text, open, set, glyph = "i", label = "Derivation" }: { id: string; text: string; open: string | null; set: (v: string | null) => void; glyph?: string; label?: string }) {
  const isOpen = open === id;
  return (
    <span className="info">
      <button className={`info-btn ${isOpen ? "on" : ""}`} onClick={(e) => { e.stopPropagation(); set(isOpen ? null : id); }} aria-label="Explain">{glyph}</button>
      {isOpen && <span className="info-card" onClick={(e) => e.stopPropagation()}><span className="eyebrow">{label}</span><span className="txt">{text}</span></span>}
    </span>
  );
}

export default function Operator() {
  const [now, setNow] = useState(REF);
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [decisions, setDecisions] = useState<Record<string, { d: Decision; at: string }>>({});
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [edited, setEdited] = useState<Record<string, Partial<PocPlan>>>({});
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<string>(BRIEFS[0].id);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<SeamStatus | "all">("all");
  const [dCollapsed, setDCollapsed] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [openPrep, setOpenPrep] = useState<string | null>(null);
  const [lastDelta, setLastDelta] = useState<{ account: string; d: Decision; items: { name: string; up: boolean }[] } | null>(null);
  const [keyed, setKeyed] = useState(false);
  const [chat, setChat] = useState<{ role: "q" | "a"; text: string; sources?: string }[]>([]);
  const [askText, setAskText] = useState("");
  const [asking, setAsking] = useState(false);
  const boostsRef = useRef<Record<string, number>>({});
  const loadedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let t: "light" | "dark" = "light";
    try { const s = localStorage.getItem("revos-theme"); if (s === "dark" || s === "light") t = s; else if (window.matchMedia("(prefers-color-scheme: dark)").matches) t = "dark"; } catch {}
    setTheme(t);
    const tick = () => setNow(Date.now());
    tick(); const iv = setInterval(tick, 30_000);
    fetch("/api/ask").then((r) => r.json()).then((d) => setKeyed(!!d.keyed)).catch(() => {});
    return () => clearInterval(iv);
  }, []);
  useEffect(() => { if (theme) { document.documentElement.setAttribute("data-theme", theme); try { localStorage.setItem("revos-theme", theme); } catch {} } }, [theme]);

  const age = useCallback((b: Brief) => businessDaysBetween(b.arrivedAt, now), [now]);

  // Health counts over open briefs
  const open = BRIEFS.filter((b) => !decisions[b.id]);
  const counts = open.reduce((a, b) => { a[statusForAge(age(b))]++; return a; }, { green: 0, amber: 0, red: 0 } as Record<SeamStatus, number>);
  const accepted = Object.values(decisions).filter((d) => d.d === "accepted").length;
  const rejected = Object.values(decisions).filter((d) => d.d === "rejected").length;
  const reuseNow = accepted + rejected ? Math.round((accepted / (accepted + rejected)) * 100) : 21;

  // Queue: filter, then sort red>amber>green then age desc, decided last
  const rank: Record<SeamStatus, number> = { red: 0, amber: 1, green: 2 };
  const queue = useMemo(() => {
    return BRIEFS.filter((b) => {
      if (q && !(`${b.account} ${b.title}`.toLowerCase().includes(q.toLowerCase()))) return false;
      if (statusFilter !== "all" && !decisions[b.id] && statusForAge(age(b)) !== statusFilter) return false;
      return true;
    }).sort((a, b) => {
      const da = !!decisions[a.id], db = !!decisions[b.id];
      if (da !== db) return da ? 1 : -1;
      const sa = statusForAge(age(a)), sb = statusForAge(age(b));
      if (rank[sa] !== rank[sb]) return rank[sa] - rank[sb];
      return age(b) - age(a);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, statusFilter, decisions, now]);

  const breaches = open.filter((b) => age(b) >= SLA_DAYS).sort((a, b) => age(a) - age(b));

  const brief = BRIEFS.find((b) => b.id === selectedId)!;
  const draft = drafts[selectedId];
  const isLoading = loading[selectedId];

  const loadDraft = useCallback(async (b: Brief, force = false) => {
    if (!force && loadedRef.current.has(b.id)) return;
    loadedRef.current.add(b.id);
    setLoading((s) => ({ ...s, [b.id]: true }));
    try {
      const res = await fetch("/api/draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ brief: b, boosts: boostsRef.current }) });
      if (res.ok) { const d = await res.json(); setDrafts((s) => ({ ...s, [b.id]: d })); } else loadedRef.current.delete(b.id);
    } catch { loadedRef.current.delete(b.id); }
    setLoading((s) => ({ ...s, [b.id]: false }));
  }, []);
  useEffect(() => { loadDraft(brief); }, [brief, loadDraft]);

  const decide = (b: Brief, d: Decision) => {
    const used = (drafts[b.id]?.matches ?? []).map((m) => m.templateId);
    const at = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
    setDecisions((prev) => ({ ...prev, [b.id]: { d, at } }));
    used.forEach((id) => (boostsRef.current[id] = (boostsRef.current[id] ?? 0) + (d === "accepted" ? 8 : -8)));
    // #8 — show the library re-ranking so "the system learns" is visible.
    setLastDelta({ account: b.account, d, items: used.map((id) => ({ name: templateById(id)?.name ?? id, up: d === "accepted" })) });
    setEditMode(false);
    const next = BRIEFS.find((x) => x.id !== b.id && !decisions[x.id]);
    if (next) setSelectedId(next.id);
  };

  const planVal = (f: keyof PocPlan) => (edited[selectedId]?.[f] ?? draft?.plan[f]) as unknown;
  const setEdit = (f: keyof PocPlan, v: unknown) => setEdited((e) => ({ ...e, [selectedId]: { ...e[selectedId], [f]: v } }));

  const ask = async (question: string) => {
    if (!keyed || asking) return;
    setChat((c) => [...c, { role: "q", text: question }]);
    setAsking(true);
    try {
      const ctx = { waiting: open.length, green: counts.green, amber: counts.amber, red: counts.red, reuseNow, selectedBrief: { account: brief.account, title: brief.title, matches: (draft?.matches ?? []).map((m) => ({ id: m.templateId, score: m.score })) } };
      const res = await fetch("/api/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question, context: ctx }) });
      const d = await res.json();
      setChat((c) => [...c, { role: "a", text: d.answer || "Could not answer.", sources: d.sources }]);
    } catch { setChat((c) => [...c, { role: "a", text: "Ask failed." }]); }
    setAsking(false);
  };

  const bAge = age(brief), bStatus = statusForAge(bAge);
  const eventId = `evt_${brief.id.replace("br-", "")}${Math.floor(brief.arrivedAt / 100000) % 10000}`;

  return (
    <div className="op" onClick={() => setInfo(null)}>
      {/* A · seam health strip */}
      <div className="stripA">
        <div className="idc">
          <span className="mark">R</span>
          <div><div className="who">Revenue<b>OS</b> · Dana Ortiz</div><div className="role">US Solution Architect · /operator</div></div>
        </div>
        <div className="divv" />
        <div className="grp">
          <span className="eyebrow">Seam health</span>
          <div className="row">
            <span className="dotpill g"><span className="dot" />{counts.green} on track</span>
            <span className="dotpill a"><span className="dot" />{counts.amber} at risk</span>
            <span className="dotpill r"><span className="dot" />{counts.red} breached</span>
            <Info id="health" text={DERIV.health} open={info} set={setInfo} />
          </div>
        </div>
        <div className="divv" />
        <div className="grp reuse">
          <span className="eyebrow">Reuse</span>
          <div className="row"><span className="n1 mono">21%</span><span style={{ color: "var(--ink-3)" }}>→</span><span className="n2 mono">{reuseNow}%</span><Info id="reuse" text={DERIV.reuse} open={info} set={setInfo} /></div>
        </div>
        <span className="poll">polling every 30 s</span>
        <div className="spacer" />
        <div className="badges"><span className="badge">Synthetic data</span></div>
        <button className="btn how-btn" onClick={() => setShowGuide(true)}>? How to use</button>
        <button className="iconbtn" aria-label="Theme" onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}>{theme === "dark" ? "☀" : "☾"}</button>
      </div>

      <div className={`mid ${dCollapsed ? "dcol" : ""}`}>
        {/* B · queue */}
        <div className="colB">
          <div className="colB-head">
            <div className="top"><span className="eyebrow">Queue</span><span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>{open.length} open</span></div>
            <input className="q-filter" placeholder="Filter account or problem" value={q} onChange={(e) => setQ(e.target.value)} />
            <select className="q-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as SeamStatus | "all")}>
              <option value="all">Any status</option><option value="red">Breached</option><option value="amber">At risk</option><option value="green">On track</option>
            </select>
          </div>
          <div className="q-list">
            {queue.map((b) => {
              const st = statusForAge(age(b)); const dec = decisions[b.id];
              return (
                <button key={b.id} className={`q-card ${b.id === selectedId ? "on" : ""}`} onClick={() => { setSelectedId(b.id); setEditMode(false); }}>
                  {!dec && <span className={`stripe ${SG[st]}`} />}
                  <div className="r1"><span className="acct">{b.account}</span>{dec ? <span className={`decided ${TC[dec.d === "accepted" ? "green" : "red"]}`}>{dec.d}</span> : <span className={`age mono ${TC[st]}`}>{age(b).toFixed(1)}d</span>}</div>
                  <div className="meta">{b.segment} · {b.region}</div>
                </button>
              );
            })}
            {queue.length === 0 && <div className="empty">No briefs match this filter.</div>}
          </div>
          <div className="q-foot">sorted red · amber · green · then age</div>
        </div>

        {/* C · draft */}
        <div className="colC">
          <div className="colC-scroll">
            <div className="c-head">
              <div className="r1">
                <span className="acct">{brief.account}</span>
                <span className="src">{isLoading ? "drafting…" : draft ? (draft.source === "ai" ? "drafted by AI model" : "sample draft") : ""}</span>
                <div className="cluster">
                  <span style={{ fontSize: 12, color: "var(--ink-3)" }}>age</span>
                  <span className={`agev ${TC[bStatus]}`}>{bAge.toFixed(1)}d</span>
                  <Info id="c-age" text={DERIV.age} open={info} set={setInfo} />
                  <span className={`dotpill ${CH[bStatus]}`}><span className="dot" />{STAT[bStatus]}</span>
                  <Info id="c-status" text={DERIV.status} open={info} set={setInfo} />
                </div>
              </div>
              <div className="r2"><span className="k">segment</span> {brief.segment} · <span className="k">regulator</span> {brief.regulator} · <span className="k">region</span> {brief.region} · <span className="mono" style={{ color: "var(--ink-3)" }}>{eventId}</span></div>
              <div className="prob">{brief.problem}</div>
            </div>

            {isLoading && !draft && (
              <div className="working">
                <span className="spin" />
                <div><div className="working-t">The agent is working on this brief…</div><div className="working-s mono">retrieve → draft → assemble · this usually takes a few seconds</div></div>
              </div>
            )}

            <div>
              {(() => { const cov = skillCoverage(selectedId); const cst = skillStatus(cov); return (
                <div className="sec-eyebrow"><span className="eyebrow">Skills needed vs available</span><span className={`mono ${TC[cst]}`} style={{ fontSize: 11 }}>{cov}% covered</span><Info id="c-skills" text={DERIV.skills} open={info} set={setInfo} /></div>
              ); })()}
              <div className="skills">
                {requiredSkills(selectedId).map((s) => { const av = skillAvail(s); const st = skillStatus(av); return (
                  <div className="skill-row" key={s}>
                    <span className="sk-name">{s}</span>
                    <span className="sk-bar"><i className={SG[st]} style={{ width: `${av}%` }} /></span>
                    <span className={`sk-pct mono ${TC[st]}`}>{av}%</span>
                    {st === "green"
                      ? <span className="dotpill g"><span className="dot" />strong</span>
                      : <button className={`dotpill ${CH[st]} prep-toggle`} onClick={() => setOpenPrep(openPrep === s ? null : s)}><span className="dot" />{st === "amber" ? "partial" : "gap"} · prepare ▸</button>}
                  </div>
                ); })}
              </div>
              {openPrep && requiredSkills(selectedId).includes(openPrep) && (() => { const p = skillPrepPlan(openPrep); const by = new Date(Date.now() + p.weeks * 7 * DAY).toLocaleDateString("en-US", { month: "short", day: "numeric" }); return (
                <div className="prep">
                  <div className="prep-h">Get ready for <b>{openPrep}</b> <span className="mono">≈ {p.weeks} weeks · ready by {by}</span></div>
                  <ol>{p.steps.map((x, i) => <li key={i}>{x}</li>)}</ol>
                </div>
              ); })()}
            </div>

            <div>
              <div className="sec-eyebrow"><span className="eyebrow">Matches</span><span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>{(draft?.matches ?? []).length} above threshold 40</span><Info id="c-match" text={DERIV.match} open={info} set={setInfo} /></div>
              {isLoading && !draft ? (
                <div className="matches">{[0, 1, 2].map((i) => <div key={i} className="skel" style={{ height: 96 }} />)}</div>
              ) : (draft?.matches ?? []).length ? (
                <div className="matches">
                  {draft!.matches.map((m) => { const t = templateById(m.templateId); if (!t) return null; return (
                    <div className="match" key={m.templateId}>
                      <div className="mh"><div><div className="name">{t.name}</div><div className="om">{t.region} · {t.segment} · reused {t.timesReused}×</div></div><div className="score"><span className="s mono">{m.score}</span></div></div>
                      <div className="bar"><i style={{ width: `${m.score}%` }} /></div>
                      <ul>{m.reasons.map((r, i) => <li key={i}>· {r}</li>)}</ul>
                    </div>
                  ); })}
                </div>
              ) : <div className="nomatch">no template cleared the 40 threshold · plan below is the sample fallback</div>}
            </div>

            <div>
              <div className="sec-eyebrow"><span className="eyebrow">POC plan {draft ? "" : ""}</span>{editMode && <span className="mono" style={{ fontSize: 11, color: "var(--accent)" }}>editing · saved as one draft.edited event</span>}</div>
              {isLoading && !draft ? (
                <div className="plan-grid">{[0, 1, 2, 3].map((i) => <div key={i} className="skel" style={{ height: 90 }} />)}</div>
              ) : draft ? (
                <div className="plan-grid">
                  <EditBlock label="Objective" editMode={editMode} value={(planVal("objective") as string)} onChange={(v) => setEdit("objective", v)} />
                  <ListBlock label="Success criteria" editMode={editMode} value={(planVal("successCriteria") as string[])} onChange={(v) => setEdit("successCriteria", v)} />
                  <ListBlock label="Scope — in" editMode={editMode} value={(planVal("scopeIn") as string[])} onChange={(v) => setEdit("scopeIn", v)} />
                  <ListBlock label="Risks" editMode={editMode} value={(planVal("risks") as string[])} onChange={(v) => setEdit("risks", v)} />
                  <div className="block wide"><div className="lbl">Templates used and what changes</div><ul>{draft.plan.templatesUsed.length ? draft.plan.templatesUsed.map((tu, i) => <li key={i}><b>{templateById(tu.templateId)?.name ?? tu.templateId}</b> — {tu.change}</li>) : <li style={{ color: "var(--ink-3)" }}>None (sample fallback)</li>}</ul></div>
                  <div className="block wide"><div className="lbl">Week-by-week plan</div><div className="weeks">{draft.plan.weekPlan.map((w, i) => <div className="wk" key={i}><span className="w">{w.week}</span><span>{w.work}</span></div>)}</div></div>
                </div>
              ) : null}
            </div>

            <div>
              <div className="sec-eyebrow"><span className="eyebrow">Handoff to Delivery</span></div>
              <div className="handoff">{(draft?.handoff ?? []).map((h, i) => <div className="hrow" key={i}><span className="s">{h.section}</span><span className="n">{h.note}</span></div>)}</div>
            </div>
          </div>

          <div className="actionbar">
            {decisions[selectedId] ? (
              <span className="decided-line">This brief was {decisions[selectedId].d} by {SOLUTION_ARCHITECT} at {decisions[selectedId].at} · library re-ranked</span>
            ) : (<>
              <button className="btn btn-primary" title="Send this plan to the customer and record the decision" onClick={() => decide(brief, "accepted")}>Accept</button>
              <Info glyph="?" label="Accept" id="h-accept" text="Sends the draft as-is and records your decision. The template it used is promoted, so it ranks higher next time." open={info} set={setInfo} />
              <button className="btn" title="Change any part of the plan before sending" onClick={() => setEditMode((e) => !e)}>{editMode ? "Save edits" : "Edit"}</button>
              <Info glyph="?" label="Edit" id="h-edit" text="Turns the plan into editable boxes. Change anything, then Save. Your edits are kept with the decision." open={info} set={setInfo} />
              <button className="btn btn-danger" title="Reject this draft; the system learns from it" onClick={() => decide(brief, "rejected")}>Reject</button>
              <Info glyph="?" label="Reject" id="h-reject" text="Rejects this draft. The template it used is demoted, so it ranks lower next time. Use this when the match is wrong." open={info} set={setInfo} />
              <button className="btn" title="Ask the AI to draft the plan again" onClick={() => loadDraft(brief, true)} disabled={isLoading}>Regenerate</button>
              <Info glyph="?" label="Regenerate" id="h-regen" text="Runs the AI again to produce a fresh draft for this same brief. Nothing is decided." open={info} set={setInfo} />
              <span className="note">decision recorded as {SOLUTION_ARCHITECT}, US Solution Architect · each writes an event and re-ranks the library</span>
            </>)}
          </div>
        </div>

        {/* D · ask the seam */}
        <div className={`colD ${dCollapsed ? "collapsed" : ""}`}>
          {dCollapsed ? (
            <button className="iconbtn" style={{ marginTop: 12 }} onClick={() => setDCollapsed(false)} aria-label="Expand">‹</button>
          ) : (
            <>
              <div className="colD-head"><span className="t">Ask the seam</span><button className="iconbtn" onClick={() => setDCollapsed(true)} aria-label="Collapse">›</button></div>
              {!keyed && <div className="d-note">Ask the seam needs an API key — set ANTHROPIC_API_KEY and LLM_MODEL.</div>}
              <div className="chips">{CHIPS.map((c) => <button key={c} className="chip" disabled={!keyed || asking} onClick={() => ask(c)}>{c}</button>)}</div>
              <div className="msgs">
                {chat.map((m, i) => m.role === "q" ? <div className="q-msg" key={i}>{m.text}</div> : <div className="a-msg" key={i}>{m.text}{m.sources && <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 8 }}>sources ▸ {m.sources}</div>}</div>)}
                {asking && <div className="a-msg mono" style={{ fontSize: 11 }}>reading events…</div>}
              </div>
              <div className="d-input">
                <input placeholder={keyed ? "Ask about the seam" : "inert without a key"} value={askText} disabled={!keyed} onChange={(e) => setAskText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && askText.trim()) { ask(askText); setAskText(""); } }} />
                <button className="btn" disabled={!keyed || !askText.trim()} onClick={() => { ask(askText); setAskText(""); }}>Ask</button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* E · trigger log */}
      <div className="stripE">
        <div className="stripE-head"><span className="eyebrow">Trigger log</span><span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>{breaches.length} triggers · newest first</span><span className="e-explain">When a brief passes its 2-day SLA, the system escalates it here to the named owner, automatically. Red means already breached.</span></div>
        <div className="log">
          {breaches.length === 0 ? <div className="empty">No triggers yet. The seam checks every 30 s.</div> : breaches.map((b) => {
            const at = new Date(b.arrivedAt + SLA_DAYS * DAY).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
            return <div className="logrow br" key={b.id}><span>{at}</span><span>·</span><span>{b.account}</span><span>·</span><span>breached 2d SLA → escalated to {SOLUTION_ARCHITECT}, US Solution Architect</span><span className="attach">draft attached</span></div>;
          })}
        </div>
      </div>

      {/* #8 — the system learns: ranking moved after the last decision */}
      {lastDelta && (
        <div className="delta-toast" onClick={(e) => e.stopPropagation()}>
          <div className="dt-h">The system just learned<button className="dt-x" onClick={() => setLastDelta(null)} aria-label="Dismiss">✕</button></div>
          <div className="dt-sub">{lastDelta.account} · {lastDelta.d}. The library was re-ranked, so next time:</div>
          {lastDelta.items.length === 0 ? <div className="dt-row mono">no template was used on this draft</div> : lastDelta.items.map((it, i) => (
            <div className="dt-row" key={i}><span className={`mono ${it.up ? "tg" : "tr"}`}>{it.up ? "▲ +8" : "▼ −8"}</span><span>{it.name}</span></div>
          ))}
        </div>
      )}

      {showGuide && <Guide onClose={() => setShowGuide(false)} />}
    </div>
  );
}

function Guide({ onClose }: { onClose: () => void }) {
  return (
    <div className="guide-ov" onClick={onClose}>
      <div className="guide" onClick={(e) => e.stopPropagation()}>
        <div className="guide-top"><h2>How to use this screen</h2><button className="btn" onClick={onClose}>Close</button></div>
        <div className="guide-body">
          <p className="guide-lead">You run the PreSales desk. When Sales wins a deal, the brief lands here and someone must start the plan within <b>two business days</b>. This screen does the heavy lifting; you make the call. No software knowledge needed.</p>

          <h3>The five areas, at a glance</h3>
          <div className="guide-map">
            <div className="gm-a">A · Top bar — the health of your desk</div>
            <div className="gm-row">
              <div className="gm-b">B · Queue<br /><small>the briefs waiting</small></div>
              <div className="gm-c">C · The work<br /><small>brief · skills · matches · plan · decide</small></div>
              <div className="gm-d">D · Ask<br /><small>plain questions</small></div>
            </div>
            <div className="gm-e">E · Trigger log — anything late is escalated here</div>
          </div>

          <h3>Work a brief in five steps</h3>
          <ol className="guide-steps">
            <li><b>Pick the top brief</b> in the queue (left). It is sorted most urgent first: red is late, amber is close, green is fine.</li>
            <li><b>Check the skills</b> needed vs what your team has. Green is your strength; a red gap has a <b>Prepare</b> button that gives you a plan to get ready.</li>
            <li><b>Read the matches</b> — past solutions we can reuse, each with a score and the reason it fits. This is how you avoid building from scratch.</li>
            <li><b>Read the draft plan.</b> Edit anything, or press <b>Accept</b> to send it. Press <b>Reject</b> if the match is wrong.</li>
            <li><b>The system learns.</b> Every accept or reject re-ranks the library, so the next brief is better. You will see it move.</li>
          </ol>

          <h3>What the numbers mean</h3>
          <table className="guide-tbl">
            <tbody>
              <tr><td>Age</td><td>Business days since the brief arrived. The target is 2.</td></tr>
              <tr><td>On track / at risk / breached</td><td>The traffic light on the 2-day SLA.</td></tr>
              <tr><td>Match %</td><td>How well a past solution fits this brief (higher is better).</td></tr>
              <tr><td>Reuse</td><td>How often we reuse past work instead of starting over. We want this to rise.</td></tr>
              <tr><td>Skills coverage</td><td>How much of the needed skill set we already have.</td></tr>
              <tr><td>ⓘ next to a number</td><td>Click it to see exactly how that number is worked out.</td></tr>
            </tbody>
          </table>

          <h3>What you can ask "Ask the seam" (right side)</h3>
          <ul className="guide-ask">
            <li>Why did the agent pick this template for the selected brief?</li>
            <li>Which briefs are past SLA right now and who was triggered?</li>
            <li>What changed in ranking after the last decision?</li>
            <li>What happens to this data if the instance restarts?</li>
            <li>What was cut, and what breaks first at ten times the volume?</li>
          </ul>

          <h3>Good to know</h3>
          <p className="guide-note">Every name and number here is made up for the demo (synthetic). The memory is temporary and resets if the server sleeps, which is fine for a demo. In production this sits on a real event store.</p>
        </div>
      </div>
    </div>
  );
}

function EditBlock({ label, editMode, value, onChange }: { label: string; editMode: boolean; value: string; onChange: (v: string) => void }) {
  return (
    <div className={`block ${editMode ? "edit" : ""}`}>
      <div className="lbl">{label}</div>
      {editMode ? <textarea rows={3} value={value ?? ""} onChange={(e) => onChange(e.target.value)} /> : <div className="val">{value}</div>}
    </div>
  );
}
function ListBlock({ label, editMode, value, onChange }: { label: string; editMode: boolean; value: string[]; onChange: (v: string[]) => void }) {
  const arr = value ?? [];
  return (
    <div className={`block ${editMode ? "edit" : ""}`}>
      <div className="lbl">{label}</div>
      {editMode ? <textarea rows={Math.max(arr.length + 1, 3)} value={arr.join("\n")} onChange={(e) => onChange(e.target.value.split("\n").filter(Boolean))} /> : <ul>{arr.map((s, i) => <li key={i}>{s}</li>)}</ul>}
    </div>
  );
}
