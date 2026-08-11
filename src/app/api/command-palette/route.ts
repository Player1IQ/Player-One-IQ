import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/cached";
import { getCommandPaletteIndex } from "@/lib/command-palette";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const index = await getCommandPaletteIndex();
  return NextResponse.json(index);
}
