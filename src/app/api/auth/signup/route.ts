import { NextRequest, NextResponse } from "next/server";
import {
  getSessionCookieConfig,
  signSessionToken,
} from "@/lib/server/auth-session";
import {
  createInitialUserDataset,
  createSupabaseAuthClient,
  isSupabaseConfigured,
  localSignUp,
} from "@/lib/server/storage";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const fullName = String(body.fullName ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const monthlyPocketMoney = Number(body.monthlyPocketMoney ?? 5000);
    const savingsTarget = Number(body.savingsTarget ?? 0);

    if (fullName.length < 2) {
      return NextResponse.json(
        { error: "Please enter your full name (at least 2 characters)." },
        { status: 400 }
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }
    if (!Number.isFinite(monthlyPocketMoney) || monthlyPocketMoney < 0) {
      return NextResponse.json(
        { error: "Monthly pocket money must be a valid non-negative amount." },
        { status: 400 }
      );
    }
    if (!Number.isFinite(savingsTarget) || savingsTarget < 0) {
      return NextResponse.json(
        { error: "Savings target must be a valid non-negative amount." },
        { status: 400 }
      );
    }

    if (isSupabaseConfigured()) {
      const sb = createSupabaseAuthClient();
      const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error || !data.user) {
        return NextResponse.json(
          { error: error?.message || "Signup failed." },
          { status: 400 }
        );
      }

      const accessToken = data.session?.access_token;
      if (!accessToken) {
        return NextResponse.json(
          {
            error:
              "Account created. Please verify your email in Supabase before logging in.",
          },
          { status: 202 }
        );
      }

      const dataset = createInitialUserDataset({
        id: data.user.id,
        fullName,
        email,
        monthlyPocketMoney,
        savingsTarget,
      });

      const authedSb = createSupabaseAuthClient(accessToken);
      await authedSb.from("profiles").insert({
        id: data.user.id,
        full_name: fullName,
        email,
        monthly_pocket_money: monthlyPocketMoney,
        savings_target: savingsTarget,
        onboarding_completed: false,
        team_members: dataset.profile.teamMembers,
      });
      if (dataset.monthlyBudgets.length > 0) {
        await authedSb.from("monthly_budgets").insert(
          dataset.monthlyBudgets.map((b) => ({
            user_id: data.user!.id,
            month_key: b.monthKey,
            pocket_money: b.pocketMoney,
            savings_target: b.savingsTarget,
          }))
        );
      }

      const token = signSessionToken({
        userId: data.user.id,
        email,
        mode: "supabase",
        accessToken,
      });

      const res = NextResponse.json({ dataset }, { status: 201 });
      res.cookies.set(getSessionCookieConfig(token));
      return res;
    }

    const { userId, dataset } = await localSignUp({
      fullName,
      email,
      password,
      monthlyPocketMoney,
      savingsTarget,
    });

    const token = signSessionToken({
      userId,
      email,
      mode: "local",
    });

    const res = NextResponse.json({ dataset }, { status: 201 });
    res.cookies.set(getSessionCookieConfig(token));
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Signup failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
