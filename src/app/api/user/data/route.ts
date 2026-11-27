import { NextRequest, NextResponse } from "next/server";
import {
  getClearSessionCookieConfig,
  getSessionFromCookies,
} from "@/lib/server/auth-session";
import {
  createInitialUserDataset,
  createSupabaseAuthClient,
  localDeleteAccount,
  localGetDataset,
  localSaveDataset,
  supabaseGetDataset,
  supabaseSaveDataset,
} from "@/lib/server/storage";
import type { AppDataset } from "@/lib/types";

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dataset =
    session.mode === "supabase" && session.accessToken
      ? await supabaseGetDataset(session.userId, session.accessToken)
      : await localGetDataset(session.userId);

  if (!dataset) {
    return NextResponse.json({ error: "User data not found" }, { status: 404 });
  }

  return NextResponse.json({ dataset });
}

export async function PUT(req: NextRequest) {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const incoming = body.dataset as AppDataset | undefined;
    if (!incoming || !incoming.profile || !Array.isArray(incoming.expenses)) {
      return NextResponse.json(
        { error: "Invalid dataset payload." },
        { status: 400 }
      );
    }

    const saved =
      session.mode === "supabase" && session.accessToken
        ? await supabaseSaveDataset(session.userId, session.accessToken, incoming)
        : await localSaveDataset(session.userId, incoming);

    return NextResponse.json({ dataset: saved });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to save dataset.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scope = req.nextUrl.searchParams.get("scope") || "reset";

  if (scope === "account") {
    if (session.mode === "supabase" && session.accessToken) {
      const sb = createSupabaseAuthClient(session.accessToken);
      await Promise.all([
        sb.from("expenses").delete().eq("user_id", session.userId),
        sb.from("monthly_budgets").delete().eq("user_id", session.userId),
        sb.from("category_budgets").delete().eq("user_id", session.userId),
        sb.from("savings_contributions").delete().eq("user_id", session.userId),
        sb.from("savings_goals").delete().eq("user_id", session.userId),
        sb.from("shared_bills").delete().eq("user_id", session.userId),
        sb.from("alerts").delete().eq("user_id", session.userId),
        sb.from("profiles").delete().eq("id", session.userId),
      ]);
    } else {
      await localDeleteAccount(session.userId);
    }
    const res = NextResponse.json({ ok: true, deleted: "account" });
    res.cookies.set(getClearSessionCookieConfig());
    return res;
  }

  // Scope: reset financial records while keeping profile
  const current =
    session.mode === "supabase" && session.accessToken
      ? await supabaseGetDataset(session.userId, session.accessToken)
      : await localGetDataset(session.userId);

  if (!current) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const fresh = createInitialUserDataset({
    id: current.profile.id,
    fullName: current.profile.fullName,
    email: current.profile.email,
    monthlyPocketMoney: current.profile.monthlyPocketMoney,
    savingsTarget: current.profile.savingsTarget,
  });
  fresh.profile.onboardingCompleted = current.profile.onboardingCompleted;
  fresh.profile.teamMembers = current.profile.teamMembers;

  const saved =
    session.mode === "supabase" && session.accessToken
      ? await supabaseSaveDataset(session.userId, session.accessToken, fresh)
      : await localSaveDataset(session.userId, fresh);

  return NextResponse.json({ ok: true, dataset: saved });
}
