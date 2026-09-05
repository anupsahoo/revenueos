import { NextResponse } from "next/server";
import { BRIEFS } from "@/lib/mock";
import { runBriefToPoc } from "@/lib/graph";

// The agent may call an external AI model, so allow generous time on Node runtime.
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

  // START ▸ retrieve ▸ draft ▸ handoff ▸ END
  const { matches, plan, handoff, source, model } = await runBriefToPoc(brief, body.boosts ?? {});

  return NextResponse.json({ briefId: brief.id, matches, plan, handoff, source, model });
}
