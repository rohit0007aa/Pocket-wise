import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/server/auth-session";
import {
  localGetDataset,
  supabaseGetDataset,
} from "@/lib/server/storage";

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const dataset =
    session.mode === "supabase" && session.accessToken
      ? await supabaseGetDataset(session.userId, session.accessToken)
      : await localGetDataset(session.userId);

  if (!dataset) {
    return NextResponse.json({ error: "Account not found" }, { status: 401 });
  }

  return NextResponse.json({
    dataset,
    storageMode: session.mode,
  });
}
