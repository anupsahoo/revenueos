"use client";

import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer, Treemap, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  AreaChart, Area, ScatterChart, Scatter, ZAxis, Cell, FunnelChart, Funnel, LabelList,
} from "recharts";

export const CAT = ["#3538cd", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#64748b"];
export const SEM: Record<string, string> = { green: "var(--green)", amber: "var(--amber)", red: "var(--red)" };

export function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}
function Skel({ h }: { h: number }) { return <div className="chart-skel" style={{ height: h }} />; }

const tip = { background: "var(--panel)", border: "1px solid var(--line-strong)", borderRadius: 8, fontSize: 12, color: "var(--ink)" };
const tick = { fill: "var(--ink-3)", fontSize: 11 };

// KPI tile with an inline sparkline
export function Stat({ label, value, unit, delta, color = "var(--accent)", spark }: { label: string; value: string | number; unit?: string; delta?: string; color?: string; spark?: number[] }) {
  const W = 120, H = 30;
  let path = "";
  if (spark && spark.length) {
    const mn = Math.min(...spark), mx = Math.max(...spark);
    path = spark.map((v, i) => `${i === 0 ? "M" : "L"} ${(i / (spark.length - 1)) * W} ${H - ((v - mn) / Math.max(mx - mn, 1)) * H}`).join(" ");
  }
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value mono" style={{ color }}>{value}{unit && <span className="stat-unit">{unit}</span>}</div>
      {spark && <svg className="stat-spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"><path d={path} fill="none" stroke={color} strokeWidth={2} opacity={0.7} /></svg>}
      {delta && <div className="stat-delta">{delta}</div>}
    </div>
  );
}

export function DomainTreemap({ data, h = 240 }: { data: { name: string; size: number }[]; h?: number }) {
  if (!useMounted()) return <Skel h={h} />;
  const withColor = data.map((d, i) => ({ ...d, fill: CAT[i % CAT.length] }));
  return (
    <ResponsiveContainer width="100%" height={h}>
      <Treemap data={withColor} dataKey="size" stroke="var(--panel)" content={<TreeCell />} isAnimationActive={false} />
    </ResponsiveContainer>
  );
}
function TreeCell(props: any) {
  const { x, y, width, height, name, size, fill } = props;
  if (width < 2 || height < 2) return null;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill} stroke="var(--panel)" strokeWidth={2} rx={4} />
      {width > 64 && height > 30 && (
        <>
          <text x={x + 8} y={y + 20} fill="#fff" fontSize={12} fontWeight={700}>{name}</text>
          <text x={x + 8} y={y + 36} fill="#ffffffcc" fontSize={11} fontFamily="var(--font-mono)">${size}M</text>
        </>
      )}
    </g>
  );
}

export function RegionStack({ data, h = 240 }: { data: { region: string; green: number; amber: number; red: number }[]; h?: number }) {
  if (!useMounted()) return <Skel h={h} />;
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart data={data} layout="vertical" margin={{ left: 6, right: 12, top: 4, bottom: 4 }}>
        <XAxis type="number" tick={tick} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="region" tick={tick} width={78} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tip} cursor={{ fill: "var(--panel-2)" }} />
        <Bar dataKey="green" stackId="a" fill="var(--green)" radius={[4, 0, 0, 4]} />
        <Bar dataKey="amber" stackId="a" fill="var(--amber)" />
        <Bar dataKey="red" stackId="a" fill="var(--red)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TrendArea({ data, keys, h = 240 }: { data: any[]; keys: { k: string; color: string; label: string }[]; h?: number }) {
  if (!useMounted()) return <Skel h={h} />;
  return (
    <ResponsiveContainer width="100%" height={h}>
      <AreaChart data={data} margin={{ left: 0, right: 8, top: 6, bottom: 0 }}>
        <defs>
          {keys.map((s) => (
            <linearGradient key={s.k} id={`g-${s.k}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
        <XAxis dataKey="month" tick={tick} axisLine={false} tickLine={false} />
        <YAxis tick={tick} axisLine={false} tickLine={false} width={30} />
        <Tooltip contentStyle={tip} />
        {keys.map((s) => <Area key={s.k} type="monotone" dataKey={s.k} name={s.label} stroke={s.color} strokeWidth={2} fill={`url(#g-${s.k})`} isAnimationActive={false} />)}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function Funnel6({ data, h = 240 }: { data: { stage: string; count: number }[]; h?: number }) {
  if (!useMounted()) return <Skel h={h} />;
  const d = data.map((x, i) => ({ ...x, fill: CAT[i % CAT.length] }));
  return (
    <ResponsiveContainer width="100%" height={h}>
      <FunnelChart>
        <Tooltip contentStyle={tip} />
        <Funnel dataKey="count" data={d} isAnimationActive={false}>
          <LabelList position="right" dataKey="stage" fill="var(--ink-2)" stroke="none" fontSize={12} />
          <LabelList position="left" dataKey="count" fill="var(--ink-3)" stroke="none" fontSize={11} />
        </Funnel>
      </FunnelChart>
    </ResponsiveContainer>
  );
}

export function DealScatter({ data, h = 240 }: { data: { value: number; attain: number; status: string }[]; h?: number }) {
  if (!useMounted()) return <Skel h={h} />;
  return (
    <ResponsiveContainer width="100%" height={h}>
      <ScatterChart margin={{ left: 0, right: 12, top: 8, bottom: 4 }}>
        <CartesianGrid stroke="var(--line)" />
        <XAxis type="number" dataKey="attain" name="SLA attainment" unit="%" tick={tick} axisLine={false} tickLine={false} />
        <YAxis type="number" dataKey="value" name="deal $k" tick={tick} axisLine={false} tickLine={false} width={40} />
        <ZAxis range={[30, 30]} />
        <Tooltip contentStyle={tip} cursor={{ strokeDasharray: "3 3" }} />
        <Scatter data={data} isAnimationActive={false}>
          {data.map((d, i) => <Cell key={i} fill={SEM[d.status]} fillOpacity={0.7} />)}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}

export function CapacityBars({ data, h = 220 }: { data: { band: string; people: number; tone: string }[]; h?: number }) {
  if (!useMounted()) return <Skel h={h} />;
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart data={data} margin={{ left: 0, right: 10, top: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
        <XAxis dataKey="band" tick={tick} axisLine={false} tickLine={false} />
        <YAxis tick={tick} axisLine={false} tickLine={false} width={36} />
        <Tooltip contentStyle={tip} cursor={{ fill: "var(--panel-2)" }} />
        <Bar dataKey="people" radius={[5, 5, 0, 0]}>
          {data.map((d, i) => <Cell key={i} fill={SEM[d.tone]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DomainBars({ data, dataKey, color = "var(--accent)", unit = "", h = 260 }: { data: any[]; dataKey: string; color?: string; unit?: string; h?: number }) {
  if (!useMounted()) return <Skel h={h} />;
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart data={data} layout="vertical" margin={{ left: 6, right: 16, top: 4, bottom: 4 }}>
        <XAxis type="number" tick={tick} axisLine={false} tickLine={false} unit={unit} />
        <YAxis type="category" dataKey="domain" tick={tick} width={92} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tip} cursor={{ fill: "var(--panel-2)" }} />
        <Bar dataKey={dataKey} fill={color} radius={[0, 5, 5, 0]}>
          {data.map((_, i) => <Cell key={i} fill={CAT[i % CAT.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
