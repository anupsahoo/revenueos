import { NextResponse } from "next/server";
import { store, OS_EVENT_TYPES, type OsEventType } from "@/lib/events";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const briefId = u.searchParams.get("briefId") ?? undefined;
  const type = (u.searchParams.get("type") as OsEventType | null) ?? undefined;
  const since = u.searchParams.get("since") ?? undefined;
  if (type && !OS_EVENT_TYPES.includes(type)) return NextResponse.json({ error: "unknown type" }, { status: 400 });
  return NextResponse.json({ events: await store.list({ briefId, type, since }) });
}

export async function POST(req: Request) {
  let body: { type?: string; actor?: string; briefId?: string; payload?: Record<string, unknown>; synthetic?: boolean } = {};
  try { body = await req.json(); } catch {}
  if (!body.type || !OS_EVENT_TYPES.includes(body.type as OsEventType)) {
    return NextResponse.json({ error: `type must be one of ${OS_EVENT_TYPES.join(", ")}` }, { status: 400 });
  }
  if (!body.briefId) return NextResponse.json({ error: "briefId required" }, { status: 400 });
  const event = await store.append({
    type: body.type as OsEventType,
    actor: body.actor ?? "system",
    briefId: body.briefId,
    payload: body.payload ?? {},
    synthetic: body.synthetic ?? false,
  });
  return NextResponse.json({ event });
}
