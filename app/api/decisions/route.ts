import { NextResponse } from "next/server";
import { store, type OsEventType } from "@/lib/events";
import { boosts, reuseRate } from "@/lib/derive";

export const runtime = "nodejs";

const MAP: Record<string, OsEventType> = {
  accepted: "draft.accepted",
  edited: "draft.edited",
  rejected: "draft.rejected",
};

export async function POST(req: Request) {
  let body: {
    briefId?: string; decision?: string; actor?: string;
    draft?: { matches?: { templateId: string }[]; source?: string; model?: string | null };
    editSummary?: string; reason?: string;
  } = {};
  try { body = await req.json(); } catch {}

  const type = MAP[body.decision ?? ""];
  if (!type) return NextResponse.json({ error: "decision must be accepted, edited or rejected" }, { status: 400 });
  if (!body.briefId) return NextResponse.json({ error: "briefId required" }, { status: 400 });

  const templateIds = (body.draft?.matches ?? []).map((m) => m.templateId);
  const event = await store.append({
    type,
    actor: body.actor ?? "Dana Ortiz, US Solution Architect",
    briefId: body.briefId,
    payload: {
      templateIds,
      source: body.draft?.source ?? null,
      model: body.draft?.model ?? null,
      ...(body.editSummary ? { editSummary: body.editSummary } : {}),
      ...(body.reason ? { reason: body.reason } : {}),
    },
    synthetic: false,
  });

  // Recompute from the log so the client never derives these itself.
  const events = await store.all();
  return NextResponse.json({ event, boosts: boosts(events), reuse: reuseRate(events) });
}
