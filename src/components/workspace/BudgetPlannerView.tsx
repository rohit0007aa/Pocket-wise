"use client";

import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  Bell,
  Calculator,
  Check,
  CheckCircle2,
  Save,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { useAppData } from "@/components/AppDataProvider";
import { CATEGORY_COLORS, EXPENSE_CATEGORIES } from "@/lib/constants";
import {
  calculateCategoryBreakdown,
  calculateFinancialHealthScore,
  calculateMonthEndPrediction,
  calculateSafeToSpend,
  formatINR,
  formatMonthLabel,
  getMonthBudgetConfig,
  getMonthExpenses,
  getMonthSavingsContributed,
  getMonthTiming,
} from "@/lib/finance";
import type { ExpenseCategory } from "@/lib/types";

export function BudgetPlannerView() {
  const {
    dataset,
    selectedMonth,
    updateMonthlyBudget,
    setCategoryLimit,
    dismissAlert,
  } = useAppData();

  const currentConfig = dataset
    ? getMonthBudgetConfig(dataset, selectedMonth)
    : { pocketMoney: 5000, savingsTarget: 1000 };

  const [pocketMoneyInput, setPocketMoneyInput] = useState(
    String(currentConfig.pocketMoney)
  );
  const [savingsTargetInput, setSavingsTargetInput] = useState(
    String(currentConfig.savingsTarget)
  );
  const [catInputs, setCatInputs] = useState<Record<string, string>>({});
  const [savingBudget, setSavingBudget] = useState(false);
  const [savingCat, setSavingCat] = useState<string | null>(null);

  useEffect(() => {
    if (!dataset) return;
    const cfg = getMonthBudgetConfig(dataset, selectedMonth);
    setPocketMoneyInput(String(cfg.pocketMoney));
    setSavingsTargetInput(String(cfg.savingsTarget));

    const map: Record<string, string> = {};
    for (const cat of EXPENSE_CATEGORIES) {
      const found = dataset.categoryBudgets.find(
        (cb) => cb.monthKey === selectedMonth && cb.category === cat
      );
      map[cat] = found && found.limitAmount > 0 ? String(found.limitAmount) : "";
    }
    setCatInputs(map);
  }, [dataset, selectedMonth]);

  if (!dataset) return null;

  const expenses = getMonthExpenses(dataset, selectedMonth);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const savingsContributed = getMonthSavingsContributed(dataset, selectedMonth);
  const timing = getMonthTiming(selectedMonth);

  const safeToSpend = calculateSafeToSpend(
    currentConfig.pocketMoney,
    totalExpenses,
    currentConfig.savingsTarget,
    savingsContributed,
    timing
  );
  const prediction = calculateMonthEndPrediction(
    expenses,
    currentConfig.pocketMoney,
    timing
  );
  const health = calculateFinancialHealthScore(
    currentConfig.pocketMoney,
    totalExpenses,
    currentConfig.savingsTarget,
    savingsContributed,
    timing
  );

  const catLimitsMap: Record<string, number> = {};
  for (const cb of dataset.categoryBudgets) {
    if (cb.monthKey === selectedMonth) {
      catLimitsMap[cb.category] = cb.limitAmount;
    }
  }
  const breakdown = calculateCategoryBreakdown(expenses, catLimitsMap);
  const spentByCategory = new Map(
    breakdown.map((b) => [b.category, b.amount])
  );

  const monthAlerts = dataset.alerts.filter(
    (a) => a.monthKey === selectedMonth && !a.dismissed
  );

  const handleSaveMonthlyBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBudget(true);
    try {
      await updateMonthlyBudget(
        selectedMonth,
        Math.max(0, Number(pocketMoneyInput) || 0),
        Math.max(0, Number(savingsTargetInput) || 0)
      );
    } finally {
      setSavingBudget(false);
    }
  };

  const handleSaveCategoryLimit = async (category: ExpenseCategory) => {
    setSavingCat(category);
    try {
      const raw = Number(catInputs[category] || 0);
      await setCategoryLimit(selectedMonth, category, Math.max(0, raw));
    } finally {
      setSavingCat(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold">
          Budget Planner & Forecasting
        </h1>
        <p className="text-xs text-[#91A99B] mt-1">
          Configure your {formatMonthLabel(selectedMonth)} pocket money,
          category caps, and review your Safe-to-Spend daily limit.
        </p>
      </div>

      {/* Monthly Budget Form + Safe-to-Spend Breakdown */}
      <div className="grid gap-5 lg:grid-cols-12">
        <form
          onSubmit={handleSaveMonthlyBudget}
          className="pw-card rounded-3xl p-6 lg:col-span-5 space-y-4"
        >
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[#40E8A1]" />
            <h2 className="font-heading text-lg font-bold">
              {formatMonthLabel(selectedMonth)} Allowance
            </h2>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#91A99B] mb-1.5">
              Monthly Pocket Money (₹)
            </label>
            <input
              type="number"
              min={0}
              required
              value={pocketMoneyInput}
              onChange={(e) => setPocketMoneyInput(e.target.value)}
              className="pw-input"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#91A99B] mb-1.5">
              Monthly Savings Reserve Target (₹)
            </label>
            <input
              type="number"
              min={0}
              value={savingsTargetInput}
              onChange={(e) => setSavingsTargetInput(e.target.value)}
              className="pw-input"
            />
            <p className="text-[11px] text-[#91A99B] mt-1">
              Reserved savings are subtracted before calculating your daily
              Safe-to-Spend limit.
            </p>
          </div>

          <button
            type="submit"
            disabled={savingBudget}
            className="pw-btn-primary w-full"
          >
            <Save className="w-4 h-4" />
            {savingBudget ? "Saving..." : "Update Monthly Budget"}
          </button>
        </form>

        {/* Transparent Safe-to-Spend Calculator */}
        <div className="pw-card rounded-3xl p-6 lg:col-span-7 flex flex-col justify-between space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-[#D5FA72]" />
              <h2 className="font-heading text-lg font-bold">
                Smart Daily Spending Limit (Safe-to-Spend)
              </h2>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold border ${
                safeToSpend.status === "green"
                  ? "bg-[#40E8A1]/15 text-[#40E8A1] border-[#40E8A1]/30"
                  : safeToSpend.status === "amber"
                  ? "bg-amber-400/15 text-amber-300 border-amber-400/30"
                  : "bg-red-400/15 text-red-300 border-red-400/30"
              }`}
            >
              {safeToSpend.status === "green"
                ? "Green • On Track"
                : safeToSpend.status === "amber"
                ? "Amber • Caution"
                : "Red • Zero / Over Limit"}
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 items-center">
            <div className="rounded-2xl bg-[#071510]/85 border border-[#40E8A1]/20 p-5">
              <div className="text-xs text-[#91A99B]">
                {safeToSpend.monthStatus === "past"
                  ? "Month Completed (Daily Limit N/A)"
                  : "Safe Daily Allowance"}
              </div>
              <div className="font-heading text-4xl font-bold text-[#F4F8F5] mt-1">
                <AnimatedNumber value={safeToSpend.dailySafeLimit} />
                <span className="text-sm font-normal text-[#91A99B]">
                  {" "}
                  / day
                </span>
              </div>
              <p className="text-xs text-[#91A99B] mt-2 leading-relaxed">
                {safeToSpend.explanation}
              </p>
            </div>

            <div className="rounded-2xl bg-[#071510]/65 border border-[#40E8A1]/12 p-4 space-y-2 text-xs">
              <div className="font-semibold text-[#F4F8F5] mb-1">
                Formula Transparency
              </div>
              <div className="flex justify-between text-[#91A99B]">
                <span>Monthly Budget</span>
                <span className="text-[#F4F8F5]">
                  {formatINR(safeToSpend.monthlyBudget)}
                </span>
              </div>
              <div className="flex justify-between text-[#91A99B]">
                <span>− Recorded Expenses</span>
                <span className="text-[#F4F8F5]">
                  −{formatINR(safeToSpend.recordedExpenses)}
                </span>
              </div>
              <div className="flex justify-between text-[#91A99B]">
                <span>
                  − Unreserved Savings ({formatINR(safeToSpend.savingsTarget)} −{" "}
                  {formatINR(safeToSpend.savingsAlreadySetAside)} saved)
                </span>
                <span className="text-[#F4F8F5]">
                  −{formatINR(safeToSpend.reservedSavingsRemaining)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#40E8A1]/15 font-semibold text-[#40E8A1]">
                <span>Available Spending Money</span>
                <span>{formatINR(safeToSpend.availableSpendingMoney)}</span>
              </div>
              <div className="flex justify-between text-[#91A99B]">
                <span>÷ Remaining Calendar Days (incl. today)</span>
                <span className="text-[#F4F8F5]">
                  {safeToSpend.remainingDays} days
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Budgets Grid */}
      <div className="pw-card rounded-3xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-heading text-lg font-bold">
              Category Spending Limits
            </h2>
            <p className="text-xs text-[#91A99B]">
              Set optional caps per category to trigger Smart Alerts before you
              overspend. Enter 0 or clear to remove a limit.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {EXPENSE_CATEGORIES.map((cat) => {
            const spent = spentByCategory.get(cat) ?? 0;
            const limit = catLimitsMap[cat] ?? 0;
            const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
            const exceeded = limit > 0 && spent > limit;

            return (
              <div
                key={cat}
                className="rounded-2xl bg-[#071510]/80 border border-[#40E8A1]/15 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-semibold text-[#F4F8F5]">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                    />
                    {cat}
                  </span>
                  {exceeded ? (
                    <span className="text-[11px] font-semibold text-red-300 bg-red-500/15 px-2 py-0.5 rounded-full">
                      Exceeded
                    </span>
                  ) : limit > 0 ? (
                    <span className="text-[11px] text-[#40E8A1]">
                      {pct}% used
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#91A99B]">No cap</span>
                  )}
                </div>

                <div className="text-xs text-[#91A99B] flex justify-between">
                  <span>
                    Spent:{" "}
                    <strong className="text-[#F4F8F5]">
                      {formatINR(spent)}
                    </strong>
                  </span>
                  {limit > 0 && <span>Cap: {formatINR(limit)}</span>}
                </div>

                {limit > 0 && (
                  <div className="h-1.5 w-full rounded-full bg-[#14291E] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, pct)}%`,
                        backgroundColor: exceeded
                          ? "#F87171"
                          : pct >= 80
                          ? "#FBBF24"
                          : CATEGORY_COLORS[cat],
                      }}
                    />
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="number"
                    min={0}
                    placeholder="Limit ₹"
                    value={catInputs[cat] ?? ""}
                    onChange={(e) =>
                      setCatInputs({ ...catInputs, [cat]: e.target.value })
                    }
                    className="pw-input py-1.5 text-xs"
                    aria-label={`${cat} monthly limit`}
                  />
                  <button
                    type="button"
                    disabled={savingCat === cat}
                    onClick={() => handleSaveCategoryLimit(cat)}
                    className="pw-btn-secondary py-1.5 px-3 text-xs shrink-0"
                  >
                    {savingCat === cat ? (
                      "..."
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Save
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Month-End Forecast + Financial Health Breakdown + Alerts */}
      <div className="grid gap-5 lg:grid-cols-12">
        <div className="pw-card rounded-3xl p-6 lg:col-span-7 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#D5FA72]" />
              <h2 className="font-heading text-lg font-bold">
                Month-End Spending Projection
              </h2>
            </div>
            <span className="rounded-full border border-[#91A99B]/25 bg-[#071510] px-2.5 py-0.5 text-[11px] text-[#91A99B]">
              Estimate Only — Not Guaranteed
            </span>
          </div>

          {prediction.insufficientData ? (
            <div className="rounded-2xl border border-dashed border-[#40E8A1]/20 p-6 text-xs text-[#91A99B] text-center">
              {prediction.note}
            </div>
          ) : (
            <>
              <p className="text-xs text-[#91A99B] leading-relaxed">
                {prediction.note}
              </p>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={prediction.projectionSeries}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(145,169,155,0.12)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="day"
                      tick={{ fill: "#91A99B", fontSize: 11 }}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#91A99B", fontSize: 11 }}
                      axisLine={false}
                      tickFormatter={(v) => `₹${v}`}
                    />
                    <Tooltip
                      formatter={(val: number, name: string) => [
                        formatINR(val),
                        name === "actualCumulative"
                          ? "Actual Spend"
                          : "Estimated Pace",
                      ]}
                      contentStyle={{
                        backgroundColor: "#0D2017",
                        borderColor: "rgba(64,232,161,0.3)",
                        borderRadius: "12px",
                        color: "#F4F8F5",
                        fontSize: "12px",
                      }}
                    />
                    <ReferenceLine
                      y={currentConfig.pocketMoney}
                      stroke="#F87171"
                      strokeDasharray="4 4"
                    />
                    <Area
                      type="monotone"
                      dataKey="actualCumulative"
                      stroke="#40E8A1"
                      fill="#40E8A1"
                      fillOpacity={0.2}
                      strokeWidth={2.5}
                      connectNulls={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="projectedCumulative"
                      stroke="#D5FA72"
                      strokeDasharray="5 5"
                      fill="#D5FA72"
                      fillOpacity={0.08}
                      strokeWidth={2}
                      connectNulls={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>

        <div className="pw-card rounded-3xl p-6 lg:col-span-5 space-y-5">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#40E8A1]" />
                <h2 className="font-heading text-lg font-bold">
                  Health Score Breakdown
                </h2>
              </div>
              <span
                className="font-heading text-xl font-bold"
                style={{ color: health.color }}
              >
                {health.score}/100 ({health.label})
              </span>
            </div>
            <div className="mt-3 space-y-2 text-xs text-[#91A99B]">
              {health.explanation.map((line) => (
                <div
                  key={line}
                  className="rounded-xl bg-[#071510]/70 border border-[#40E8A1]/10 px-3 py-2"
                >
                  {line}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-[#40E8A1]/12 pt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-[#F4F8F5]">
              <Bell className="w-4 h-4 text-[#D5FA72]" />
              Active Alerts ({monthAlerts.length})
            </div>
            {monthAlerts.length === 0 ? (
              <div className="flex items-center gap-2 text-xs text-[#40E8A1]">
                <CheckCircle2 className="w-4 h-4" />
                No budget warnings for {formatMonthLabel(selectedMonth)}.
              </div>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {monthAlerts.map((a) => (
                  <div
                    key={a.alertKey}
                    className="rounded-xl border border-amber-400/25 bg-amber-400/10 p-2.5 text-xs flex items-start justify-between gap-2"
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-300 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-[#F4F8F5]">
                          {a.title}
                        </div>
                        <div className="text-[#91A99B]">{a.message}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => dismissAlert(a.alertKey)}
                      className="text-[11px] text-[#91A99B] hover:text-[#F4F8F5] shrink-0"
                    >
                      Dismiss
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
