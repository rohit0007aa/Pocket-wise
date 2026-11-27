import { describe, expect, it } from "vitest";
import { createDemoDataset } from "@/lib/demo-data";
import {
  buildSanitizedCopilotContext,
  calculateCategoryBreakdown,
  calculateFinancialHealthScore,
  calculateMonthEndPrediction,
  calculateSafeToSpend,
  calculateWeeklyBreakdown,
  formatINR,
  generateRuleBasedCopilotReply,
  generateSmartAlerts,
  getCurrentMonthKey,
  getMonthBudgetConfig,
  getMonthExpenses,
  getMonthTiming,
} from "@/lib/finance";

describe("Demo Dataset Integrity", () => {
  it("loads exact fictional student numbers specified in requirements", () => {
    const fixedNow = new Date(2026, 10, 20, 12, 0, 0); // Nov 20, 2026
    const demo = createDemoDataset(fixedNow);
    const monthKey = getCurrentMonthKey(fixedNow);
    const cfg = getMonthBudgetConfig(demo, monthKey);
    const expenses = getMonthExpenses(demo, monthKey);
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    const breakdown = calculateCategoryBreakdown(expenses);
    const byCat = Object.fromEntries(
      breakdown.map((b) => [b.category, b.amount])
    );

    expect(cfg.pocketMoney).toBe(5000);
    expect(byCat["Food"]).toBe(1500);
    expect(byCat["Transport"]).toBe(600);
    expect(byCat["Shopping"]).toBe(800);
    expect(byCat["Entertainment"]).toBe(500);
    expect(byCat["Education"]).toBe(400);
    expect(total).toBe(3800);
    expect(cfg.pocketMoney - total).toBe(1200);
    expect(Math.round((total / cfg.pocketMoney) * 100)).toBe(76);
  });
});

describe("Safe-to-Spend Calculator", () => {
  it("calculates current month daily limit transparently with unreserved savings", () => {
    // Nov 2026 has 30 days. On Nov 21, remainingDays = 10 (including today).
    const now = new Date(2026, 10, 21, 10, 0, 0);
    const timing = getMonthTiming("2026-11", now);
    expect(timing.status).toBe("current");
    expect(timing.remainingDays).toBe(10);

    const res = calculateSafeToSpend(5000, 3000, 1000, 500, timing);
    // reservedSavingsRemaining = 1000 - 500 = 500
    // availableSpendingMoney = 5000 - 3000 - 500 = 1500
    // dailySafeLimit = 1500 / 10 = 150
    expect(res.reservedSavingsRemaining).toBe(500);
    expect(res.availableSpendingMoney).toBe(1500);
    expect(res.dailySafeLimit).toBe(150);
    expect(res.status).toBe("green");
  });

  it("handles negative/zero balance and marks status red", () => {
    const now = new Date(2026, 10, 21, 10, 0, 0);
    const timing = getMonthTiming("2026-11", now);
    const res = calculateSafeToSpend(5000, 5400, 1000, 0, timing);
    expect(res.availableSpendingMoney).toBe(-1400);
    expect(res.dailySafeLimit).toBe(0);
    expect(res.status).toBe("red");
  });

  it("handles past and future months accurately", () => {
    const now = new Date(2026, 10, 21, 10, 0, 0);
    const pastTiming = getMonthTiming("2026-10", now);
    const pastRes = calculateSafeToSpend(5000, 4200, 500, 500, pastTiming);
    expect(pastTiming.status).toBe("past");
    expect(pastRes.dailySafeLimit).toBe(0);

    const futureTiming = getMonthTiming("2026-12", now);
    const futureRes = calculateSafeToSpend(6200, 0, 0, 0, futureTiming);
    expect(futureTiming.status).toBe("future");
    expect(futureTiming.remainingDays).toBe(31);
    expect(futureRes.dailySafeLimit).toBe(200);
  });
});

describe("Month-End Prediction & Health Score", () => {
  it("handles insufficient data when no expenses exist", () => {
    const now = new Date(2026, 10, 15, 10, 0, 0);
    const timing = getMonthTiming("2026-11", now);
    const pred = calculateMonthEndPrediction([], 5000, timing);
    expect(pred.insufficientData).toBe(true);
    expect(pred.predictedTotal).toBe(0);
  });

  it("estimates month-end overspend and builds projection series", () => {
    const now = new Date(2026, 10, 10, 10, 0, 0); // 10 days elapsed in 30-day month
    const timing = getMonthTiming("2026-11", now);
    const demo = createDemoDataset(now);
    const expenses = getMonthExpenses(demo, "2026-11"); // ₹3,800 in 10 days => ₹380/day => ₹11,400 est
    const pred = calculateMonthEndPrediction(expenses, 5000, timing);

    expect(pred.insufficientData).toBe(false);
    expect(pred.averageDailySpend).toBe(380);
    expect(pred.predictedTotal).toBe(11400);
    expect(pred.exceedsBudget).toBe(true);
    expect(pred.projectionSeries.length).toBeGreaterThan(2);
  });

  it("computes Financial Health Score labels deterministically", () => {
    const now = new Date(2026, 10, 20, 10, 0, 0);
    const timing = getMonthTiming("2026-11", now);

    const healthy = calculateFinancialHealthScore(5000, 2500, 1000, 800, timing);
    expect(healthy.label).toBe("Healthy");
    expect(healthy.score).toBeGreaterThanOrEqual(75);

    const overBudget = calculateFinancialHealthScore(5000, 5500, 1000, 0, timing);
    expect(overBudget.label).toBe("Over Budget");
  });
});

describe("Smart Alerts, Weekly Breakdown & Copilot Fallback", () => {
  it("generates deduplicated alerts when thresholds are exceeded", () => {
    const now = new Date(2026, 10, 20, 10, 0, 0);
    const demo = createDemoDataset(now);
    const monthKey = getCurrentMonthKey(now);

    const alerts = generateSmartAlerts(demo, monthKey, now);
    const keys = alerts.map((a) => a.alertKey);
    // Demo has Shopping = ₹800 vs limit ₹750 and predicted spend > 5000
    expect(keys).toContain(`${monthKey}:cat-exceeded:Shopping`);
    expect(keys).toContain(`${monthKey}:prediction-over`);
    // Ensure no duplicate alertKeys
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("calculates weekly totals summing to month total", () => {
    const now = new Date(2026, 10, 25, 10, 0, 0);
    const demo = createDemoDataset(now);
    const monthKey = getCurrentMonthKey(now);
    const expenses = getMonthExpenses(demo, monthKey);
    const weekly = calculateWeeklyBreakdown(expenses, monthKey);
    const sumWeekly = weekly.reduce((s, w) => s + w.amount, 0);
    expect(sumWeekly).toBe(3800);
  });

  it("builds sanitized copilot context and deterministic fallback replies", () => {
    const now = new Date(2026, 10, 20, 10, 0, 0);
    const demo = createDemoDataset(now);
    const monthKey = getCurrentMonthKey(now);
    const ctx = buildSanitizedCopilotContext(demo, monthKey, now);

    expect(ctx.monthlyBudget).toBe(5000);
    expect(ctx.totalExpenses).toBe(3800);
    expect(ctx.remainingBalance).toBe(1200);
    expect(ctx.utilizationPercent).toBe(76);

    const whereReply = generateRuleBasedCopilotReply(
      "Where is most of my money going?",
      ctx
    );
    expect(whereReply.reply).toContain("₹3,800");
    expect(whereReply.reply).toContain("Food");

    const movieReply = generateRuleBasedCopilotReply(
      "Can I afford a ₹300 movie ticket?",
      ctx
    );
    expect(movieReply.reply).toContain("₹300");
    expect(movieReply.reply).toContain("₹900");
  });

  it("formats INR cleanly", () => {
    expect(formatINR(5000)).toBe("₹5,000");
    expect(formatINR(-250)).toBe("-₹250");
  });
});
