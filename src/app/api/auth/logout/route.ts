import { NextResponse } from "next/server";
import { getClearSessionCookieConfig } from "@/lib/server/auth-session";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(getClearSessionCookieConfig());
  return res;
}
