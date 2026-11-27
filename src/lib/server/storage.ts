import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { getCurrentMonthKey } from "@/lib/finance";
import type { AppDataset } from "@/lib/types";
import { hashPassword, verifyPassword } from "./auth-session";

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

export function createInitialUserDataset(params: {
  id: string;
  fullName: string;
  email: string;
  monthlyPocketMoney: number;
  savingsTarget: number;
}): AppDataset {
  const nowIso = new Date().toISOString();
  const currentMonth = getCurrentMonthKey();

  return {
    profile: {
      id: params.id,
      fullName: params.fullName.trim(),
      email: params.email.trim().toLowerCase(),
      monthlyPocketMoney: Math.max(0, Number(params.monthlyPocketMoney) || 0),
      savingsTarget: Math.max(0, Number(params.savingsTarget) || 0),
      onboardingCompleted: false,
      teamMembers: [
        { name: "Team Member 1", regNo: "JU/BT/CSE/2026/___" },
        { name: "Team Member 2", regNo: "JU/BT/CSE/2026/___" },
      ],
      createdAt: nowIso,
    },
    monthlyBudgets: [
      {
        id: crypto.randomUUID(),
        monthKey: currentMonth,
        pocketMoney: Math.max(0, Number(params.monthlyPocketMoney) || 0),
        savingsTarget: Math.max(0, Number(params.savingsTarget) || 0),
      },
    ],
    expenses: [],
    categoryBudgets: [],
    savingsGoals: [],
    savingsContributions: [],
    sharedBills: [],
    alerts: [],
    challenges: {
      noSpendDates: [],
      smartSpendWeekCount: 0,
      save500Completed: false,
    },
  };
}

// ============================================================================
// Local Persistent Store (.data/pocketwise-store.json)
// ============================================================================
interface LocalUserRecord {
  id: string;
  email: string;
  passwordHash: string;
  dataset: AppDataset;
}

interface LocalStoreFile {
  users: Record<string, LocalUserRecord>;
}

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(DATA_DIR, "pocketwise-store.json");

let writeQueue = Promise.resolve();

async function readLocalStore(): Promise<LocalStoreFile> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as LocalStoreFile;
    return parsed && parsed.users ? parsed : { users: {} };
  } catch {
    return { users: {} };
  }
}

async function writeLocalStore(store: LocalStoreFile): Promise<void> {
  writeQueue = writeQueue.then(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const tmp = `${STORE_PATH}.${crypto.randomUUID()}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(store, null, 2), "utf8");
    await fs.rename(tmp, STORE_PATH);
  });
  return writeQueue;
}

export async function localSignUp(params: {
  fullName: string;
  email: string;
  password: string;
  monthlyPocketMoney: number;
  savingsTarget: number;
}): Promise<{ userId: string; dataset: AppDataset }> {
  const email = params.email.trim().toLowerCase();
  const store = await readLocalStore();
  const existing = Object.values(store.users).find((u) => u.email === email);
  if (existing) {
    throw new Error("An account with this email already exists.");
  }
  const userId = crypto.randomUUID();
  const dataset = createInitialUserDataset({
    id: userId,
    fullName: params.fullName,
    email,
    monthlyPocketMoney: params.monthlyPocketMoney,
    savingsTarget: params.savingsTarget,
  });
  store.users[userId] = {
    id: userId,
    email,
    passwordHash: hashPassword(params.password),
    dataset,
  };
  await writeLocalStore(store);
  return { userId, dataset };
}

export async function localLogin(params: {
  email: string;
  password: string;
}): Promise<{ userId: string; dataset: AppDataset }> {
  const email = params.email.trim().toLowerCase();
  const store = await readLocalStore();
  const user = Object.values(store.users).find((u) => u.email === email);
  if (!user || !verifyPassword(params.password, user.passwordHash)) {
    throw new Error("Invalid email or password.");
  }
  return { userId: user.id, dataset: user.dataset };
}

export async function localGetDataset(userId: string): Promise<AppDataset | null> {
  const store = await readLocalStore();
  return store.users[userId]?.dataset ?? null;
}

export async function localSaveDataset(
  userId: string,
  dataset: AppDataset
): Promise<AppDataset> {
  const store = await readLocalStore();
  const user = store.users[userId];
  if (!user) {
    throw new Error("User account not found.");
  }
  // Enforce immutable user id and email ownership
  const sanitized: AppDataset = {
    ...dataset,
    profile: {
      ...dataset.profile,
      id: userId,
      email: user.email,
    },
  };
  store.users[userId].dataset = sanitized;
  await writeLocalStore(store);
  return sanitized;
}

export async function localDeleteAccount(userId: string): Promise<void> {
  const store = await readLocalStore();
  delete store.users[userId];
  await writeLocalStore(store);
}

// ============================================================================
// Supabase Cloud Storage Adapter (RLS-enforced with user's JWT)
// ============================================================================
export function createSupabaseAuthClient(accessToken?: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    ...(accessToken
      ? {
          global: {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        }
      : {}),
  });
}

export async function supabaseGetDataset(
  userId: string,
  accessToken: string
): Promise<AppDataset | null> {
  const sb = createSupabaseAuthClient(accessToken);
  const [
    profileRes,
    budgetsRes,
    expensesRes,
    catBudgetsRes,
    goalsRes,
    contribRes,
    billsRes,
    alertsRes,
  ] = await Promise.all([
    sb.from("profiles").select("*").eq("id", userId).maybeSingle(),
    sb.from("monthly_budgets").select("*").eq("user_id", userId),
    sb.from("expenses").select("*").eq("user_id", userId),
    sb.from("category_budgets").select("*").eq("user_id", userId),
    sb.from("savings_goals").select("*").eq("user_id", userId),
    sb.from("savings_contributions").select("*").eq("user_id", userId),
    sb.from("shared_bills").select("*").eq("user_id", userId),
    sb.from("alerts").select("*").eq("user_id", userId),
  ]);

  if (profileRes.error || !profileRes.data) return null;
  const p = profileRes.data;

  return {
    profile: {
      id: p.id,
      fullName: p.full_name,
      email: p.email,
      monthlyPocketMoney: Number(p.monthly_pocket_money),
      savingsTarget: Number(p.savings_target),
      onboardingCompleted: Boolean(p.onboarding_completed),
      teamMembers: Array.isArray(p.team_members) ? p.team_members : [],
      createdAt: p.created_at,
    },
    monthlyBudgets: (budgetsRes.data ?? []).map((b) => ({
      id: b.id,
      monthKey: b.month_key,
      pocketMoney: Number(b.pocket_money),
      savingsTarget: Number(b.savings_target),
    })),
    expenses: (expensesRes.data ?? []).map((e) => ({
      id: e.id,
      title: e.title,
      amount: Number(e.amount),
      category: e.category,
      transactionDate: e.transaction_date,
      paymentMethod: e.payment_method,
      notes: e.notes ?? "",
      source: e.source ?? "manual",
      createdAt: e.created_at,
    })),
    categoryBudgets: (catBudgetsRes.data ?? []).map((cb) => ({
      id: cb.id,
      monthKey: cb.month_key,
      category: cb.category,
      limitAmount: Number(cb.limit_amount),
    })),
    savingsGoals: (goalsRes.data ?? []).map((g) => ({
      id: g.id,
      title: g.title,
      targetAmount: Number(g.target_amount),
      savedAmount: Number(g.saved_amount),
      deadline: g.deadline ?? undefined,
      category: g.category ?? "Personal",
      createdAt: g.created_at,
    })),
    savingsContributions: (contribRes.data ?? []).map((c) => ({
      id: c.id,
      goalId: c.goal_id,
      amount: Number(c.amount),
      note: c.note ?? "",
      contributedAt: c.contributed_at,
    })),
    sharedBills: (billsRes.data ?? []).map((sbItem) => ({
      id: sbItem.id,
      title: sbItem.title,
      totalAmount: Number(sbItem.total_amount),
      paidBy: sbItem.paid_by,
      splitMode: sbItem.split_mode,
      participants: Array.isArray(sbItem.participants)
        ? sbItem.participants
        : [],
      addedToPersonal: Boolean(sbItem.added_to_personal),
      billDate: sbItem.bill_date,
      createdAt: sbItem.created_at,
    })),
    alerts: (alertsRes.data ?? []).map((a) => ({
      id: a.id,
      alertKey: a.alert_key,
      monthKey: a.month_key,
      severity: a.severity,
      title: a.title,
      message: a.message,
      dismissed: Boolean(a.dismissed),
      createdAt: a.created_at,
    })),
    challenges: {
      noSpendDates: [],
      smartSpendWeekCount: 0,
      save500Completed: false,
    },
  };
}

export async function supabaseSaveDataset(
  userId: string,
  accessToken: string,
  dataset: AppDataset
): Promise<AppDataset> {
  const sb = createSupabaseAuthClient(accessToken);

  await sb
    .from("profiles")
    .update({
      full_name: dataset.profile.fullName,
      monthly_pocket_money: dataset.profile.monthlyPocketMoney,
      savings_target: dataset.profile.savingsTarget,
      onboarding_completed: dataset.profile.onboardingCompleted,
      team_members: dataset.profile.teamMembers,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  // Sync collections cleanly inside user's RLS scope
  await Promise.all([
    sb.from("monthly_budgets").delete().eq("user_id", userId),
    sb.from("category_budgets").delete().eq("user_id", userId),
    sb.from("expenses").delete().eq("user_id", userId),
    sb.from("savings_contributions").delete().eq("user_id", userId),
    sb.from("savings_goals").delete().eq("user_id", userId),
    sb.from("shared_bills").delete().eq("user_id", userId),
    sb.from("alerts").delete().eq("user_id", userId),
  ]);

  if (dataset.monthlyBudgets.length > 0) {
    await sb.from("monthly_budgets").insert(
      dataset.monthlyBudgets.map((b) => ({
        user_id: userId,
        month_key: b.monthKey,
        pocket_money: b.pocketMoney,
        savings_target: b.savingsTarget,
      }))
    );
  }
  if (dataset.categoryBudgets.length > 0) {
    await sb.from("category_budgets").insert(
      dataset.categoryBudgets.map((cb) => ({
        user_id: userId,
        month_key: cb.monthKey,
        category: cb.category,
        limit_amount: cb.limitAmount,
      }))
    );
  }
  if (dataset.expenses.length > 0) {
    await sb.from("expenses").insert(
      dataset.expenses.map((e) => ({
        id: e.id,
        user_id: userId,
        title: e.title,
        amount: e.amount,
        category: e.category,
        transaction_date: e.transactionDate,
        payment_method: e.paymentMethod,
        notes: e.notes ?? "",
        source: e.source ?? "manual",
      }))
    );
  }
  if (dataset.savingsGoals.length > 0) {
    await sb.from("savings_goals").insert(
      dataset.savingsGoals.map((g) => ({
        id: g.id,
        user_id: userId,
        title: g.title,
        target_amount: g.targetAmount,
        saved_amount: g.savedAmount,
        deadline: g.deadline ?? null,
        category: g.category ?? "Personal",
      }))
    );
  }
  if (dataset.savingsContributions.length > 0) {
    await sb.from("savings_contributions").insert(
      dataset.savingsContributions.map((c) => ({
        id: c.id,
        user_id: userId,
        goal_id: c.goalId,
        amount: c.amount,
        note: c.note ?? "",
        contributed_at: c.contributedAt,
      }))
    );
  }
  if (dataset.sharedBills.length > 0) {
    await sb.from("shared_bills").insert(
      dataset.sharedBills.map((b) => ({
        id: b.id,
        user_id: userId,
        title: b.title,
        total_amount: b.totalAmount,
        paid_by: b.paidBy,
        split_mode: b.splitMode,
        participants: b.participants,
        added_to_personal: b.addedToPersonal,
        bill_date: b.billDate,
      }))
    );
  }
  if (dataset.alerts.length > 0) {
    await sb.from("alerts").insert(
      dataset.alerts.map((a) => ({
        user_id: userId,
        alert_key: a.alertKey,
        month_key: a.monthKey,
        severity: a.severity,
        title: a.title,
        message: a.message,
        dismissed: a.dismissed,
      }))
    );
  }

  return dataset;
}

