import { NextResponse } from "next/server";
import {
  insertFunnelEvent,
  isFunnelEventName,
  isFunnelSessionId,
  parseFunnelPlatform,
} from "@/lib/marketing/funnel";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const sessionId =
    "sessionId" in body && typeof body.sessionId === "string"
      ? body.sessionId
      : "";
  const event =
    "event" in body && typeof body.event === "string" ? body.event : "";
  const platformRaw =
    "platform" in body && typeof body.platform === "string"
      ? body.platform
      : null;

  if (!isFunnelSessionId(sessionId) || !isFunnelEventName(event)) {
    return NextResponse.json({ error: "Invalid event." }, { status: 400 });
  }

  const result = await insertFunnelEvent({
    sessionId,
    event,
    platform: parseFunnelPlatform(platformRaw),
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true });
}
