import { NextRequest, NextResponse } from "next/server";
import {
  getSessionCookieConfig,
  signSessionToken,
} from "@/lib/server/auth-session";
import {
  createSupabaseAuthClient,
  isSupabaseConfigured,
  localLogin,
  supabaseGetDataset,
} from "@/lib/server/storage";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    if (isSupabaseConfigured()) {
      const sb = createSupabaseAuthClient();
      const { data, error } = await sb.auth.signInWithPassword({
        email,
        password,
      });
      if (error || !data.user || !data.session) {
        return NextResponse.json(
          { error: error?.message || "Invalid email or password." },
          { status: 401 }
        );
      }

      const dataset = await supabaseGetDataset(
        data.user.id,
        data.session.access_token
      );
      if (!dataset) {
        return NextResponse.json(
          { error: "User profile record not found." },
          { status: 404 }
        );
      }

      const token = signSessionToken({
        userId: data.user.id,
        email,
        mode: "supabase",
        accessToken: data.session.access_token,
      });

      const res = NextResponse.json({ dataset });
      res.cookies.set(getSessionCookieConfig(token));
      return res;
    }

    const { userId, dataset } = await localLogin({ email, password });
    const token = signSessionToken({
      userId,
      email,
      mode: "local",
    });

    const res = NextResponse.json({ dataset });
    res.cookies.set(getSessionCookieConfig(token));
    return res;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Invalid email or password.";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
