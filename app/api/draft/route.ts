import { NextResponse } from "next/server";
import { runBriefToPoc } from "@/lib/graph";
import type { Brief } from "@/lib/mock";

// The agent may call an external AI model, so allow generous time on Node runtime.
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  let body: { brief?: Partial<Brief>; boosts?: Record<string, number> } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body ok */
  }

  const brief = body.brief;
  if (!brief || !brief.problem) {
    return NextResponse.json({ error: "Missing brief" }, { status: 400 });
  }

  // START ▸ retrieve ▸ draft ▸ assemble ▸ END
  const { matches, plan, handoff, source, model } = await runBriefToPoc(brief as Brief, body.boosts ?? {});

  return NextResponse.json({ matches, plan, handoff, source, model });
}
