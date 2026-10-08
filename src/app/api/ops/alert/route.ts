import { NextResponse } from "next/server";
import type { OpsAlertKind } from "@/lib/ops/alerts-config";
import { reportOpsAlert } from "@/lib/ops/alerts";

const KINDS = new Set<OpsAlertKind>([
  "server_error",
  "cron",
  "email",
  "oauth",
  "uptime",
]);

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured." },
      { status: 503 }
    );
  }

  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const { kind, title, detail } = body as {
    kind?: unknown;
    title?: unknown;
    detail?: unknown;
  };

  if (typeof kind !== "string" || !KINDS.has(kind as OpsAlertKind)) {
    return NextResponse.json({ error: "Invalid kind." }, { status: 400 });
  }
  if (typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }

  void reportOpsAlert({
    kind: kind as OpsAlertKind,
    title: title.trim().slice(0, 180),
    detail: typeof detail === "string" ? detail.slice(0, 4000) : undefined,
  });

  return NextResponse.json({ ok: true });
}
