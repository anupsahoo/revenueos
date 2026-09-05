"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { COMPANIES, companyById, type Company } from "@/lib/enterprise";

interface Ctx {
  company: Company;
  companyId: string;
  setCompanyId: (id: string) => void;
  verticalId: string | null;
  setVerticalId: (id: string | null) => void;
}
const AppCtx = createContext<Ctx | null>(null);
export function useApp(): Ctx {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp outside AppFrame");
  return c;
}

const NAV = [
  { href: "/", label: "Command Centre", icon: "🌐" },
  { href: "/sales", label: "Sales cockpit", icon: "📊" },
  { href: "/presales", label: "Pre-Sales cockpit", icon: "🧭" },
  { href: "/onboarding", label: "Onboarding", icon: "🚀" },
  { href: "/operator", label: "Operator · loop", icon: "⚙️" },
];

export default function AppFrame({ children }: { children: React.ReactNode }) {
  const [companyId, setCompanyId] = useState("apex");
  const [verticalId, setVerticalId] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);
  const pathname = usePathname();
  const company = companyById(companyId);

  useEffect(() => {
    let t: "light" | "dark" = "light";
    try {
      const s = localStorage.getItem("revos-theme");
      if (s === "dark" || s === "light") t = s;
      else if (window.matchMedia("(prefers-color-scheme: dark)").matches) t = "dark";
    } catch {}
    setTheme(t);
  }, []);
  useEffect(() => {
    if (!theme) return;
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("revos-theme", theme); } catch {}
  }, [theme]);

  return (
    <AppCtx.Provider value={{ company, companyId, setCompanyId, verticalId, setVerticalId }}>
      <div className="app-frame">
        <aside className="rail">
          <div className="rail-logo"><span className="wm-mark">R</span><span>Revenue<b>OS</b></span></div>

          <div className="rail-section">Company</div>
          <select className="rail-select" value={companyId} onChange={(e) => { setCompanyId(e.target.value); setVerticalId(null); }}>
            {COMPANIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="rail-meta mono">{company.industry}<br />{company.users.toLocaleString()} users · {company.projects} projects</div>

          <div className="rail-section">Vertical</div>
          <div className="rail-chips">
            <button className={`rail-chip ${verticalId === null ? "on" : ""}`} onClick={() => setVerticalId(null)}>All</button>
            {company.verticals.map((v) => (
              <button key={v.id} className={`rail-chip ${verticalId === v.id ? "on" : ""}`} onClick={() => setVerticalId(v.id)}>{v.icon} {v.name}</button>
            ))}
          </div>

          <div className="rail-section">Workspace</div>
          <nav className="rail-nav">
            {NAV.map((n) => {
              const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
              return <Link key={n.href} href={n.href} className={active ? "active" : ""}><span>{n.icon}</span>{n.label}</Link>;
            })}
          </nav>

          <div className="rail-foot">
            <button className="icon-btn" aria-label="Toggle theme" onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}>{theme === "dark" ? "☀" : "☾"}</button>
            <span className="rail-meta mono">prototype · synthetic data</span>
          </div>
        </aside>
        <div className="app-main">{children}</div>
      </div>
    </AppCtx.Provider>
  );
}
