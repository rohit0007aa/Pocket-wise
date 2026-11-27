import {
  CATEGORY_COLORS,
  ESSENTIAL_CATEGORIES,
  EXPENSE_CATEGORIES,
} from "./constants";
import type {
  AppDataset,
  Expense,
  ExpenseCategory,
  SmartAlert,
} from "./types";

export function formatINR(amount: number, showDecimals = false): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const sign = safe < 0 ? "-" : "";
  const abs = Math.abs(safe);
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(abs);
  return `${sign}₹${formatted}`;
}

export function getMonthKeyFromDate(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export function getCurrentMonthKey(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function getLocalDateString(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatMonthLabel(monthKey: string): string {
  const [yStr, mStr] = monthKey.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  if (!y || !m) return monthKey;
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

export function getDaysInMonth(monthKey: string): number {
  const [yStr, mStr] = monthKey.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  if (!y || !m) return 30;
  return new Date(y, m, 0).getDate();
}

export interface MonthTiming {
  monthKey: string;
  status: "past" | "current" | "future";
  daysInMonth: number;
  elapsedDays: number;
  remainingDays: number; // includes today for current month
  todayDay: number;
}

export function getMonthTiming(monthKey: string, now = new Date()): MonthTiming {
  const currentKey = getCurrentMonthKey(now);
  const daysInMonth = getDaysInMonth(monthKey);

  if (monthKey < currentKey) {
    return {
      monthKey,
      status: "past",
      daysInMonth,
      elapsedDays: daysInMonth,
      remainingDays: 0,
      todayDay: daysInMonth,
    };
  }
  if (monthKey > currentKey) {
    return {
      monthKey,
      status: "future",
      daysInMonth,
      elapsedDays: 0,
      remainingDays: daysInMonth,
      todayDay: 0,
    };
  }
  const todayDay = Math.min(daysInMonth, Math.max(1, now.getDate()));
  return {
    monthKey,
    status: "current",
    daysInMonth,
    elapsedDays: todayDay,
    remainingDays: Math.max(1, daysInMonth - todayDay + 1),
    todayDay,
  };
}

export function getMonthBudgetConfig(dataset: AppDataset, monthKey: string) {
  const found = dataset.monthlyBudgets.find((b) => b.monthKey === monthKey);
  return {
    pocketMoney: found ? found.pocketMoney : dataset.profile.monthlyPocketMoney,
    savingsTarget: found ? found.savingsTarget : dataset.profile.savingsTarget,
  };
}

export function getMonthExpenses(dataset: AppDataset, monthKey: string): Expense[] {
  return dataset.expenses
    .filter((e) => getMonthKeyFromDate(e.transactionDate) === monthKey)
    .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate));
}

export function getMonthSavingsContributed(
  dataset: AppDataset,
  monthKey: string
): number {
  return dataset.savingsContributions
    .filter((c) => c.contributedAt.slice(0, 7) === monthKey)
    .reduce((sum, c) => sum + c.amount, 0);
}

export interface CategoryBreakdownItem {
  category: ExpenseCategory;
  amount: number;
  percentage: number;
  color: string;
  limit: number;
  isEssential: boolean;
}

export function calculateCategoryBreakdown(
  expenses: Expense[],
  categoryLimits: Record<string, number> = {}
): CategoryBreakdownItem[] {
  const totals = new Map<ExpenseCategory, number>();
  for (const cat of EXPENSE_CATEGORIES) {
    totals.set(cat, 0);
  }
  for (const exp of expenses) {
    totals.set(exp.category, (totals.get(exp.category) ?? 0) + exp.amount);
  }
  const grandTotal = Array.from(totals.values()).reduce((a, b) => a + b, 0);

  return EXPENSE_CATEGORIES.map((category) => {
    const amount = totals.get(category) ?? 0;
    return {
      category,
      amount,
      percentage: grandTotal > 0 ? Math.round((amount / grandTotal) * 100) : 0,
      color: CATEGORY_COLORS[category],
      limit: categoryLimits[category] ?? 0,
      isEssential: ESSENTIAL_CATEGORIES.includes(category),
    };
  })
    .filter((item) => item.amount > 0 || item.limit > 0)
    .sort((a, b) => b.amount - a.amount);
}

export interface WeeklySpendingPoint {
  week: string;
  amount: number;
  transactions: number;
}

export function calculateWeeklyBreakdown(
  expenses: Expense[],
  monthKey: string
): WeeklySpendingPoint[] {
  const days = getDaysInMonth(monthKey);
  const buckets = [
    { label: "Week 1 (1–7)", start: 1, end: 7, amount: 0, transactions: 0 },
    { label: "Week 2 (8–14)", start: 8, end: 14, amount: 0, transactions: 0 },
    { label: "Week 3 (15–21)", start: 15, end: 21, amount: 0, transactions: 0 },
    { label: `Week 4 (22–${days})`, start: 22, end: days, amount: 0, transactions: 0 },
  ];

  for (const exp of expenses) {
    const day = Number(exp.transactionDate.slice(8, 10));
    const bucket = buckets.find((b) => day >= b.start && day <= b.end);
    if (bucket) {
      bucket.amount += exp.amount;
      bucket.transactions += 1;
    }
  }

  return buckets.map((b) => ({
    week: b.label,
    amount: b.amount,
    transactions: b.transactions,
  }));
}

export interface SafeToSpendResult {
  monthlyBudget: number;
  recordedExpenses: number;
  savingsTarget: number;
  savingsAlreadySetAside: number;
  reservedSavingsRemaining: number;
  availableSpendingMoney: number;
  remainingDays: number;
  dailySafeLimit: number;
  status: "green" | "amber" | "red";
  monthStatus: "past" | "current" | "future";
  explanation: string;
}

export function calculateSafeToSpend(
  monthlyBudget: number,
  recordedExpenses: number,
  savingsTarget: number,
  savingsAlreadySetAside: number,
  timing: MonthTiming
): SafeToSpendResult {
  const reservedSavingsRemaining = Math.max(
    0,
    savingsTarget - savingsAlreadySetAside
  );
  const availableSpendingMoney =
    monthlyBudget - recordedExpenses - reservedSavingsRemaining;

  let dailySafeLimit = 0;
  if (timing.status === "past") {
    dailySafeLimit = 0;
  } else if (timing.remainingDays > 0 && availableSpendingMoney > 0) {
    dailySafeLimit = Math.floor(availableSpendingMoney / timing.remainingDays);
  } else {
    dailySafeLimit = 0;
  }

  const baselineDaily =
    monthlyBudget > 0 ? monthlyBudget / timing.daysInMonth : 0;

  let status: "green" | "amber" | "red" = "green";
  if (availableSpendingMoney <= 0 || monthlyBudget - recordedExpenses < 0) {
    status = "red";
  } else if (
    timing.status !== "past" &&
    baselineDaily > 0 &&
    dailySafeLimit < baselineDaily * 0.55
  ) {
    status = "amber";
  } else if (
    monthlyBudget > 0 &&
    recordedExpenses / monthlyBudget >= 0.8
  ) {
    status = "amber";
  }

  let explanation = "";
  if (timing.status === "past") {
    explanation =
      availableSpendingMoney >= 0
        ? `Month completed with ${formatINR(availableSpendingMoney)} net surplus after savings reserve.`
        : `Month completed over budget by ${formatINR(Math.abs(availableSpendingMoney))}.`;
  } else if (timing.status === "future") {
    explanation = `Future month budget of ${formatINR(monthlyBudget)} allows ${formatINR(dailySafeLimit)}/day across ${timing.daysInMonth} days.`;
  } else if (availableSpendingMoney <= 0) {
    explanation = `No safe discretionary allowance left today (${formatINR(availableSpendingMoney)} available after ${formatINR(reservedSavingsRemaining)} reserved savings).`;
  } else {
    explanation = `${formatINR(availableSpendingMoney)} available ÷ ${timing.remainingDays} remaining days (including today) = ${formatINR(dailySafeLimit)}/day.`;
  }

  return {
    monthlyBudget,
    recordedExpenses,
    savingsTarget,
    savingsAlreadySetAside,
    reservedSavingsRemaining,
    availableSpendingMoney,
    remainingDays: timing.remainingDays,
    dailySafeLimit,
    status,
    monthStatus: timing.status,
    explanation,
  };
}

export interface MonthEndPredictionResult {
  insufficientData: boolean;
  isActualCompletedMonth: boolean;
  averageDailySpend: number;
  predictedTotal: number;
  projectedDifference: number; // positive = over budget, negative = under budget
  exceedsBudget: boolean;
  note: string;
  projectionSeries: Array<{
    day: string;
    actualCumulative: number | null;
    projectedCumulative: number | null;
    budgetLine: number;
  }>;
}

export function calculateMonthEndPrediction(
  expenses: Expense[],
  monthlyBudget: number,
  timing: MonthTiming
): MonthEndPredictionResult {
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  if (timing.status === "future") {
    return {
      insufficientData: true,
      isActualCompletedMonth: false,
      averageDailySpend: 0,
      predictedTotal: 0,
      projectedDifference: -monthlyBudget,
      exceedsBudget: false,
      note: "This is a future month with no elapsed days yet. Projection will activate once the month begins.",
      projectionSeries: [],
    };
  }

  if (expenses.length === 0 || totalExpenses === 0) {
    return {
      insufficientData: true,
      isActualCompletedMonth: timing.status === "past",
      averageDailySpend: 0,
      predictedTotal: 0,
      projectedDifference: -monthlyBudget,
      exceedsBudget: false,
      note: "Insufficient data: add at least one expense in this month to generate an estimated spending projection.",
      projectionSeries: [],
    };
  }

  const avgDailySpend = totalExpenses / Math.max(1, timing.elapsedDays);
  const predictedTotal =
    timing.status === "past"
      ? totalExpenses
      : Math.round(avgDailySpend * timing.daysInMonth);
  const projectedDifference = predictedTotal - monthlyBudget;
  const exceedsBudget = monthlyBudget > 0 && predictedTotal > monthlyBudget;

  // Build daily cumulative projection series sampled every few days + key milestones
  const dailyMap = new Map<number, number>();
  for (const exp of expenses) {
    const d = Number(exp.transactionDate.slice(8, 10));
    dailyMap.set(d, (dailyMap.get(d) ?? 0) + exp.amount);
  }

  const sampleDays = new Set<number>([1]);
  for (let d = 5; d < timing.daysInMonth; d += 5) sampleDays.add(d);
  sampleDays.add(timing.todayDay);
  sampleDays.add(timing.daysInMonth);
  const sortedDays = Array.from(sampleDays)
    .filter((d) => d >= 1 && d <= timing.daysInMonth)
    .sort((a, b) => a - b);

  // Precompute cumulative actual per day
  const cumulativeByDay: number[] = [0];
  let running = 0;
  for (let d = 1; d <= timing.daysInMonth; d++) {
    running += dailyMap.get(d) ?? 0;
    cumulativeByDay[d] = running;
  }

  const projectionSeries = sortedDays.map((d) => {
    const isPastOrToday = timing.status === "past" || d <= timing.todayDay;
    const actualCumulative = isPastOrToday ? cumulativeByDay[d] : null;
    const projectedCumulative =
      timing.status === "past"
        ? cumulativeByDay[d]
        : d < timing.todayDay
        ? null
        : d === timing.todayDay
        ? cumulativeByDay[timing.todayDay]
        : Math.round(
            cumulativeByDay[timing.todayDay] +
              avgDailySpend * (d - timing.todayDay)
          );

    return {
      day: `Day ${d}`,
      actualCumulative,
      projectedCumulative,
      budgetLine: monthlyBudget,
    };
  });

  const note =
    timing.status === "past"
      ? `Completed month actual spending was ${formatINR(totalExpenses)} (${formatINR(Math.round(avgDailySpend))}/day avg).`
      : exceedsBudget
      ? `Estimate only: at ${formatINR(Math.round(avgDailySpend))}/day over ${timing.elapsedDays} elapsed days, month-end spending may exceed your budget by ${formatINR(projectedDifference)}.`
      : `Estimate only: at ${formatINR(Math.round(avgDailySpend))}/day, you are on track to finish ${formatINR(Math.abs(projectedDifference))} under budget.`;

  return {
    insufficientData: false,
    isActualCompletedMonth: timing.status === "past",
    averageDailySpend: Math.round(avgDailySpend),
    predictedTotal,
    projectedDifference,
    exceedsBudget,
    note,
    projectionSeries,
  };
}

export interface HealthScoreResult {
  score: number;
  label: "Healthy" | "Needs Attention" | "Over Budget";
  color: string;
  utilizationScore: number; // /40
  paceScore: number; // /35
  savingsScore: number; // /25
  explanation: string[];
}

export function calculateFinancialHealthScore(
  monthlyBudget: number,
  totalExpenses: number,
  savingsTarget: number,
  savingsContributed: number,
  timing: MonthTiming
): HealthScoreResult {
  const utilization = monthlyBudget > 0 ? totalExpenses / monthlyBudget : 1;
  const utilizationPct = utilization * 100;

  // 1. Budget Utilization (0 - 40)
  let utilizationScore = 40;
  if (utilizationPct <= 70) {
    utilizationScore = 40;
  } else if (utilizationPct <= 85) {
    utilizationScore = Math.round(40 - ((utilizationPct - 70) / 15) * 12);
  } else if (utilizationPct <= 100) {
    utilizationScore = Math.round(28 - ((utilizationPct - 85) / 15) * 16);
  } else {
    utilizationScore = Math.max(
      0,
      Math.round(12 - (utilizationPct - 100) * 0.6)
    );
  }

  // 2. Spending Pace (0 - 35)
  let paceScore = 35;
  const elapsedRatio =
    timing.status === "future"
      ? 1
      : Math.max(0.05, timing.elapsedDays / timing.daysInMonth);
  const paceRatio = totalExpenses === 0 ? 0 : utilization / elapsedRatio;

  if (timing.status === "future") {
    paceScore = 30;
  } else if (totalExpenses === 0) {
    paceScore = 32;
  } else if (paceRatio <= 1.0) {
    paceScore = 35;
  } else if (paceRatio <= 1.25) {
    paceScore = Math.round(35 - ((paceRatio - 1.0) / 0.25) * 15);
  } else if (paceRatio <= 1.6) {
    paceScore = Math.round(20 - ((paceRatio - 1.25) / 0.35) * 15);
  } else {
    paceScore = 0;
  }

  // 3. Savings Progress (0 - 25)
  const remainingBudget = monthlyBudget - totalExpenses;
  let savingsScore = 0;
  if (savingsTarget <= 0) {
    savingsScore = remainingBudget >= 0 ? 22 : 6;
  } else {
    const contributedRatio = Math.min(1, savingsContributed / savingsTarget);
    const bufferRatio = Math.min(
      1,
      Math.max(0, remainingBudget / savingsTarget)
    );
    savingsScore = Math.round(contributedRatio * 15 + bufferRatio * 10);
  }

  const score = Math.max(
    0,
    Math.min(100, utilizationScore + paceScore + savingsScore)
  );

  let label: HealthScoreResult["label"] = "Healthy";
  let color = "#40E8A1";
  if (utilizationPct > 100 || score < 45) {
    label = "Over Budget";
    color = "#F87171";
  } else if (score < 75) {
    label = "Needs Attention";
    color = "#FBBF24";
  }

  const explanation = [
    `Budget Utilization (${utilizationScore}/40 pts): ${Math.round(utilizationPct)}% of ${formatINR(monthlyBudget)} used.`,
    `Spending Pace (${paceScore}/35 pts): ${
      timing.status === "future"
        ? "Upcoming month baseline."
        : `Pace ratio ${paceRatio.toFixed(2)}x relative to ${timing.elapsedDays}/${timing.daysInMonth} days elapsed.`
    }`,
    `Savings Readiness (${savingsScore}/25 pts): ${formatINR(savingsContributed)} contributed + ${formatINR(Math.max(0, remainingBudget))} budget buffer vs ${formatINR(savingsTarget)} target.`,
  ];

  return {
    score,
    label,
    color,
    utilizationScore,
    paceScore,
    savingsScore,
    explanation,
  };
}

export function generateSmartAlerts(
  dataset: AppDataset,
  monthKey: string,
  now = new Date()
): SmartAlert[] {
  const { pocketMoney } = getMonthBudgetConfig(dataset, monthKey);
  const expenses = getMonthExpenses(dataset, monthKey);
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const timing = getMonthTiming(monthKey, now);
  const prediction = calculateMonthEndPrediction(expenses, pocketMoney, timing);

  const existingByKey = new Map(
    dataset.alerts.map((a) => [a.alertKey, a])
  );
  const candidates: Array<Omit<SmartAlert, "id" | "dismissed" | "createdAt">> = [];

  if (pocketMoney > 0) {
    const pct = (total / pocketMoney) * 100;
    if (pct > 100) {
      candidates.push({
        alertKey: `${monthKey}:budget-exceeded`,
        monthKey,
        severity: "danger",
        title: "Monthly Budget Exceeded",
        message: `You have spent ${formatINR(total)} against your ${formatINR(pocketMoney)} pocket money (${Math.round(pct)}%).`,
      });
    } else if (pct >= 80) {
      candidates.push({
        alertKey: `${monthKey}:budget-80`,
        monthKey,
        severity: "warning",
        title: "Budget 80% Threshold Reached",
        message: `You have used ${Math.round(pct)}% (${formatINR(total)}) of your ${formatINR(pocketMoney)} monthly budget.`,
      });
    }
  }

  // Category limits exceeded
  const catLimits = dataset.categoryBudgets.filter(
    (cb) => cb.monthKey === monthKey && cb.limitAmount > 0
  );
  const catSums = new Map<string, number>();
  for (const exp of expenses) {
    catSums.set(exp.category, (catSums.get(exp.category) ?? 0) + exp.amount);
  }
  for (const cb of catLimits) {
    const spent = catSums.get(cb.category) ?? 0;
    if (spent > cb.limitAmount) {
      candidates.push({
        alertKey: `${monthKey}:cat-exceeded:${cb.category}`,
        monthKey,
        severity: "warning",
        title: `${cb.category} Limit Exceeded`,
        message: `${cb.category} spending (${formatINR(spent)}) exceeded its ${formatINR(cb.limitAmount)} monthly limit.`,
      });
    }
  }

  // Predicted month-end exceeds budget
  if (
    timing.status === "current" &&
    !prediction.insufficientData &&
    prediction.exceedsBudget
  ) {
    candidates.push({
      alertKey: `${monthKey}:prediction-over`,
      monthKey,
      severity: "warning",
      title: "Projected Month-End Overspend",
      message: `At ${formatINR(prediction.averageDailySpend)}/day, estimated month-end spending is ${formatINR(prediction.predictedTotal)} (above ${formatINR(pocketMoney)} budget).`,
    });
  }

  // Savings goals completed
  for (const goal of dataset.savingsGoals) {
    if (goal.savedAmount >= goal.targetAmount && goal.targetAmount > 0) {
      candidates.push({
        alertKey: `goal-completed:${goal.id}`,
        monthKey,
        severity: "success",
        title: `Savings Goal Reached: ${goal.title}`,
        message: `Congratulations! You reached your ${formatINR(goal.targetAmount)} target for "${goal.title}".`,
      });
    }
  }

  // Merge preserving dismissed flag for deduplication
  const nowIso = now.toISOString();
  return candidates.map((c) => {
    const prev = existingByKey.get(c.alertKey);
    return {
      id: prev?.id ?? `alert-${c.alertKey}`,
      ...c,
      dismissed: prev?.dismissed ?? false,
      createdAt: prev?.createdAt ?? nowIso,
    };
  });
}

export interface SanitizedCopilotContext {
  monthLabel: string;
  monthKey: string;
  monthlyBudget: number;
  totalExpenses: number;
  remainingBalance: number;
  utilizationPercent: number;
  savingsTarget: number;
  savingsContributedThisMonth: number;
  safeToSpendDaily: number;
  remainingDays: number;
  averageDailySpend: number;
  estimatedMonthEndTotal: number;
  healthScore: number;
  healthLabel: string;
  categoryTotals: Array<{ category: string; amount: number; percentage: number }>;
  savingsGoals: Array<{ title: string; saved: number; target: number }>;
  weeklyTotals: Array<{ week: string; amount: number }>;
}

export function buildSanitizedCopilotContext(
  dataset: AppDataset,
  monthKey: string,
  now = new Date()
): SanitizedCopilotContext {
  const { pocketMoney, savingsTarget } = getMonthBudgetConfig(dataset, monthKey);
  const expenses = getMonthExpenses(dataset, monthKey);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const remainingBalance = pocketMoney - totalExpenses;
  const utilizationPercent =
    pocketMoney > 0 ? Math.round((totalExpenses / pocketMoney) * 100) : 0;
  const savingsContributedThisMonth = getMonthSavingsContributed(
    dataset,
    monthKey
  );
  const timing = getMonthTiming(monthKey, now);
  const safe = calculateSafeToSpend(
    pocketMoney,
    totalExpenses,
    savingsTarget,
    savingsContributedThisMonth,
    timing
  );
  const pred = calculateMonthEndPrediction(expenses, pocketMoney, timing);
  const health = calculateFinancialHealthScore(
    pocketMoney,
    totalExpenses,
    savingsTarget,
    savingsContributedThisMonth,
    timing
  );
  const catBreakdown = calculateCategoryBreakdown(expenses);
  const weekly = calculateWeeklyBreakdown(expenses, monthKey);

  return {
    monthLabel: formatMonthLabel(monthKey),
    monthKey,
    monthlyBudget: pocketMoney,
    totalExpenses,
    remainingBalance,
    utilizationPercent,
    savingsTarget,
    savingsContributedThisMonth,
    safeToSpendDaily: safe.dailySafeLimit,
    remainingDays: safe.remainingDays,
    averageDailySpend: pred.averageDailySpend,
    estimatedMonthEndTotal: pred.predictedTotal,
    healthScore: health.score,
    healthLabel: health.label,
    categoryTotals: catBreakdown
      .filter((c) => c.amount > 0)
      .map((c) => ({
        category: c.category,
        amount: c.amount,
        percentage: c.percentage,
      })),
    savingsGoals: dataset.savingsGoals.map((g) => ({
      title: g.title,
      saved: g.savedAmount,
      target: g.targetAmount,
    })),
    weeklyTotals: weekly.map((w) => ({ week: w.week, amount: w.amount })),
  };
}

export function generateRuleBasedCopilotReply(
  question: string,
  ctx: SanitizedCopilotContext
): { reply: string; suggestedActions: string[] } {
  const q = question.toLowerCase();
  const topCat = ctx.categoryTotals[0];
  const secondCat = ctx.categoryTotals[1];
  const nonEssential = ctx.categoryTotals.filter(
    (c) => !ESSENTIAL_CATEGORIES.includes(c.category as ExpenseCategory)
  );
  const topDiscretionary = nonEssential[0];

  if (ctx.totalExpenses === 0) {
    return {
      reply: `In ${ctx.monthLabel}, you haven't recorded any expenses yet against your ${formatINR(ctx.monthlyBudget)} pocket money. Your current Safe-to-Spend limit is ${formatINR(ctx.safeToSpendDaily)}/day across ${ctx.remainingDays} days. Start logging expenses or scan a canteen receipt so I can analyze your real spending patterns!`,
      suggestedActions: [
        "Log your first expense",
        "Try the AI Receipt Scanner",
      ],
    };
  }

  if (q.includes("where") || q.includes("most of my money")) {
    const topList = ctx.categoryTotals
      .slice(0, 3)
      .map((c) => `• **${c.category}**: ${formatINR(c.amount)} (${c.percentage}%)`)
      .join("\n");
    return {
      reply: `In ${ctx.monthLabel}, you have spent **${formatINR(ctx.totalExpenses)}** out of your **${formatINR(ctx.monthlyBudget)}** pocket money (${ctx.utilizationPercent}% used).\n\nYour top spending categories are:\n${topList}\n\n${
        topCat
          ? `${topCat.category} alone accounts for ${topCat.percentage}% of your outflow.`
          : ""
      }`,
      suggestedActions: [
        "Open Analytics breakdown",
        "Set a category limit for " + (topCat?.category ?? "Food"),
      ],
    };
  }

  if (q.includes("movie") || q.includes("afford")) {
    const match = question.match(/(\d[\d,]*)/);
    const itemCost = match ? Number(match[1].replace(/,/g, "")) : 300;
    const afterPurchase = ctx.remainingBalance - itemCost;
    const canAfford =
      afterPurchase >= 0 &&
      (ctx.safeToSpendDaily >= itemCost || afterPurchase >= 300);

    return {
      reply: `Let's check the numbers for a **${formatINR(itemCost)}** purchase in ${ctx.monthLabel}:\n\n• Current Remaining Balance: **${formatINR(ctx.remainingBalance)}**\n• Today's Safe-to-Spend Limit: **${formatINR(ctx.safeToSpendDaily)}/day** (${ctx.remainingDays} days left)\n• Balance After Purchase: **${formatINR(afterPurchase)}**\n\n${
        afterPurchase < 0
          ? `**Recommendation:** Skip or postpone this purchase — it would push you **${formatINR(Math.abs(afterPurchase))}** over budget.`
          : canAfford
          ? `**Recommendation:** You can afford this within your remaining balance, though it uses ${Math.round((itemCost / Math.max(1, ctx.remainingBalance)) * 100)}% of your leftover pocket money. Consider keeping the next 2–3 days light on discretionary spending.`
          : `**Recommendation:** Tight fit — you technically have ${formatINR(ctx.remainingBalance)} left, but spending ${formatINR(itemCost)} exceeds today's ${formatINR(ctx.safeToSpendDaily)} safe daily limit. Try trimming ${topDiscretionary?.category ?? "Shopping/Entertainment"} first.`
      }`,
      suggestedActions: [
        "Check Savings Simulator",
        "Review Safe-to-Spend calculator",
      ],
    };
  }

  if (q.includes("save") && (q.includes("500") || q.includes("more"))) {
    const foodAmt =
      ctx.categoryTotals.find((c) => c.category === "Food")?.amount ?? 0;
    const shopAmt =
      ctx.categoryTotals.find((c) => c.category === "Shopping")?.amount ?? 0;
    const entAmt =
      ctx.categoryTotals.find((c) => c.category === "Entertainment")?.amount ??
      0;

    return {
      reply: `Here is a realistic **₹500 savings plan** based on your ${ctx.monthLabel} spending (${formatINR(ctx.totalExpenses)} spent so far):\n\n1. **Trim ${topDiscretionary ? topDiscretionary.category : "Shopping"} (${formatINR(topDiscretionary?.amount ?? shopAmt)})**: Cut ~₹250 by pausing one non-essential impulse buy.\n2. **Campus Meal Swaps on Food (${formatINR(foodAmt)})**: Save ₹150 by swapping 2–3 café/delivery orders for hostel mess or tiffin.\n3. **Entertainment Cap (${formatINR(entAmt)})**: Save ₹100 on subscriptions or weekend outings.\n\nTotal potential monthly savings: **₹500** (estimated **₹6,000/year** if sustained).`,
      suggestedActions: [
        "Test this in Savings Simulator",
        "Start the Save ₹500 Challenge",
      ],
    };
  }

  if (q.includes("seven-day") || q.includes("7-day") || q.includes("plan")) {
    const dailyCap = Math.max(
      0,
      Math.floor(ctx.remainingBalance / Math.max(1, ctx.remainingDays))
    );
    const sevenDayCap = dailyCap * Math.min(7, Math.max(1, ctx.remainingDays));
    return {
      reply: `Here is your **7-Day Student Spending Plan** based on **${formatINR(ctx.remainingBalance)}** remaining over **${ctx.remainingDays} days**:\n\n• **Daily Cap**: ${formatINR(dailyCap)}/day\n• **7-Day Total Envelope**: ${formatINR(sevenDayCap)}\n• **Days 1–2 (Reset)**: Target a No-Spend Day or essential-only travel/food under ${formatINR(Math.round(dailyCap * 0.7))}.\n• **Days 3–5 (Campus Routine)**: Stick to ${formatINR(dailyCap)}/day — carry water/snacks to cut canteen impulse buys.\n• **Days 6–7 (Weekend Buffer)**: Keep any unspent weekday margin for one planned social outing without crossing ${formatINR(sevenDayCap)}.`,
      suggestedActions: [
        "Join 7-Day Smart Spending Challenge",
        "Check Budget Planner",
      ],
    };
  }

  if (q.includes("reduce") || q.includes("cut")) {
    const targets = (nonEssential.length > 0 ? nonEssential : ctx.categoryTotals)
      .slice(0, 3)
      .map(
        (c) =>
          `• **${c.category}** (${formatINR(c.amount)}, ${c.percentage}% of spend): reducing by 20% frees up **${formatINR(Math.round(c.amount * 0.2))}**.`
      )
      .join("\n");

    return {
      reply: `Based on your actual ${ctx.monthLabel} transactions, these categories offer the highest reduction impact:\n\n${targets}\n\nPrioritize discretionary categories before touching essentials like Education or Hostel & Rent.`,
      suggestedActions: ["Simulate 20% cut in Simulator", "View Expense List"],
    };
  }

  if (q.includes("last") || q.includes("month-end") || q.includes("run out")) {
    const diff = ctx.monthlyBudget - ctx.estimatedMonthEndTotal;
    return {
      reply: `Here is your **Month-End Sustainability Check** (estimate based on ${formatINR(ctx.averageDailySpend)}/day average):\n\n• **Budget**: ${formatINR(ctx.monthlyBudget)}\n• **Spent So Far**: ${formatINR(ctx.totalExpenses)} (${ctx.utilizationPercent}%)\n• **Remaining**: ${formatINR(ctx.remainingBalance)} for ${ctx.remainingDays} days\n• **Estimated Month-End Spend**: ${formatINR(ctx.estimatedMonthEndTotal)}\n\n${
        diff < 0
          ? `**Warning:** At your current pace, you may overshoot your budget by **${formatINR(Math.abs(diff))}**. Keep daily spending under **${formatINR(ctx.safeToSpendDaily)}/day** to stay safe.`
          : `**Good news:** At your current pace, your pocket money is projected to last with an estimated **${formatINR(diff)}** buffer.`
      }`,
      suggestedActions: [
        "View Month-End Prediction Chart",
        "Adjust Category Limits",
      ],
    };
  }

  return {
    reply: `Here is your **${ctx.monthLabel}** snapshot:\n\n• **Pocket Money**: ${formatINR(ctx.monthlyBudget)} | **Spent**: ${formatINR(ctx.totalExpenses)} (${ctx.utilizationPercent}%)\n• **Remaining**: ${formatINR(ctx.remainingBalance)} | **Safe-to-Spend Today**: ${formatINR(ctx.safeToSpendDaily)}/day\n• **Health Score**: ${ctx.healthScore}/100 (${ctx.healthLabel})\n• **Top Category**: ${topCat ? `${topCat.category} (${formatINR(topCat.amount)})` : "None"}${secondCat ? `, followed by ${secondCat.category} (${formatINR(secondCat.amount)})` : ""}.\n\nAsk me about your top expenses, whether you can afford a purchase, or how to save ₹500 this month!`,
    suggestedActions: [
      "Where is most of my money going?",
      "How can I save ₹500 this month?",
    ],
  };
}
