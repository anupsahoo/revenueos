import { NextResponse } from "next/server";
import { BRIEFS } from "@/lib/mock";
import { retrieve } from "@/lib/retrieval";
import { draftPoc } from "@/lib/agent";
import { handoffSkeleton } from "@/lib/mock";

// The agent may call Claude, so allow generous time on Node runtime.
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  let body: { briefId?: string; boosts?: Record<string, number> } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body ok */
  }

  const brief = BRIEFS.find((b) => b.id === body.briefId);
  if (!brief) {
    return NextResponse.json({ error: "Unknown briefId" }, { status: 400 });
  }

  // 1) Explainable retrieval (learns from decision boosts)
  const matches = retrieve(brief, body.boosts ?? {});

  // 2) The agent drafts the POC plan (Claude, or sample fallback)
  const { plan, source, model } = await draftPoc(brief, matches);

  return NextResponse.json({
    briefId: brief.id,
    matches,
    plan,
    handoff: handoffSkeleton(brief),
    source,
    model: model ?? null,
  });
}
