import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/cached";
import { getSearchIndex } from "@/lib/search/queries";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await getSearchIndex();
  return NextResponse.json({ items });
}
