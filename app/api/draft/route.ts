import { NextResponse } from "next/server";
import { runBriefToPoc } from "@/lib/graph";
import { store } from "@/lib/events";
import { boosts as deriveBoosts } from "@/lib/derive";
import type { Brief } from "@/lib/mock";

// The agent may call an external AI model, so allow generous time on Node runtime.
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  let body: { brief?: Partial<Brief> } = {};
  try { body = await req.json(); } catch {}

  const brief = body.brief;
  if (!brief || !brief.problem || !brief.id) {
    return NextResponse.json({ error: "Missing brief" }, { status: 400 });
  }

  // Ranking boosts come from the event log, never from the client.
  const events = await store.all();
  const boosts = deriveBoosts(events);

  // START ▸ retrieve ▸ draft ▸ assemble ▸ END
  const { matches, plan, handoff, source, model } = await runBriefToPoc(brief as Brief, boosts);

  await store.append({
    type: "draft.generated",
    actor: "agent",
    briefId: brief.id,
    synthetic: false,
    payload: { matches, source, model },
  });

  return NextResponse.json({ matches, plan, handoff, source, model });
}
