"use client";

import React from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Calculator,
  CalendarClock,
  Flame,
  PiggyBank,
  Plus,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { useAppData } from "@/components/AppDataProvider";
import {
  calculateCategoryBreakdown,
  calculateFinancialHealthScore,
  calculateMonthEndPrediction,
  calculateSafeToSpend,
  calculateWeeklyBreakdown,
  formatINR,
  formatMonthLabel,
  getMonthBudgetConfig,
  getMonthExpenses,
  getMonthSavingsContributed,
  getMonthTiming,
} from "@/lib/finance";

interface OverviewViewProps {
  onQuickAdd: () => void;
  onNavigateTab: (tab: string) => void;
}

export function OverviewView({
  onQuickAdd,
  onNavigateTab,
}: OverviewViewProps) {
  const { dataset, selectedMonth, mode } = useAppData();
  if (!dataset) return null;

  const { pocketMoney, savingsTarget } = getMonthBudgetConfig(
    dataset,
    selectedMonth
  );
  const expenses = getMonthExpenses(dataset, selectedMonth);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const remainingBalance = pocketMoney - totalExpenses;
  const utilizationPct =
    pocketMoney > 0 ? Math.round((totalExpenses / pocketMoney) * 100) : 0;

  const savingsContributed = getMonthSavingsContributed(dataset, selectedMonth);
  const savingsPct =
    savingsTarget > 0
      ? Math.min(100, Math.round((savingsContributed / savingsTarget) * 100))
      : 0;

  const timing = getMonthTiming(selectedMonth);
  const safeToSpend = calculateSafeToSpend(
    pocketMoney,
    totalExpenses,
    savingsTarget,
    savingsContributed,
    timing
  );
  const prediction = calculateMonthEndPrediction(
    expenses,
    pocketMoney,
    timing
  );
  const health = calculateFinancialHealthScore(
    pocketMoney,
    totalExpenses,
    savingsTarget,
    savingsContributed,
    timing
  );

  const catLimitsMap: Record<string, number> = {};
  for (const cb of dataset.categoryBudgets) {
    if (cb.monthKey === selectedMonth) {
      catLimitsMap[cb.category] = cb.limitAmount;
    }
  }
  const categoryData = calculateCategoryBreakdown(expenses, catLimitsMap).filter(
    (c) => c.amount > 0
  );
  const weeklyData = calculateWeeklyBreakdown(expenses, selectedMonth);

  const firstName = dataset.profile.fullName.split(" ")[0] || "Student";
  const topCategory = categoryData[0];

  const gaugeRadius = 46;
  const gaugeCirc = 2 * Math.PI * gaugeRadius;
  const gaugeOffset = gaugeCirc - (health.score / 100) * gaugeCirc;

  const recentTransactions = expenses.slice(0, 5);

  const aiInsightLines: string[] = [];
  if (expenses.length === 0) {
    aiInsightLines.push(
      `No transactions recorded in ${formatMonthLabel(selectedMonth)} yet. Log your first expense or scan a bill to unlock spending insights.`
    );
  } else {
    if (topCategory) {
      aiInsightLines.push(
        `${topCategory.category} is your top expense at ${formatINR(topCategory.amount)} (${topCategory.percentage}% of monthly spend).`
      );
    }
    if (prediction.exceedsBudget && !prediction.insufficientData) {
      aiInsightLines.push(
        `At ${formatINR(prediction.averageDailySpend)}/day, estimated month-end spend (${formatINR(prediction.predictedTotal)}) may exceed your ${formatINR(pocketMoney)} budget.`
      );
    } else if (safeToSpend.status === "green") {
      aiInsightLines.push(
        `Great discipline! Staying under ${formatINR(safeToSpend.dailySafeLimit)}/day keeps your budget and ₹${savingsTarget.toLocaleString("en-IN")} savings target intact.`
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* Personalized Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-medium text-[#40E8A1] mb-1">
            <Sparkles className="w-3.5 h-3.5 text-[#D5FA72]" />
            <span>
              {mode === "demo"
                ? "Interactive Demo Command Center (Fictional Student Data)"
                : "Personal Financial Command Center"}
            </span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#F4F8F5]">
            Hello, {firstName} — {formatMonthLabel(selectedMonth)}
          </h1>
        </div>
        <button onClick={onQuickAdd} className="pw-btn-primary shrink-0">
          <Plus className="w-4 h-4" />
          Quick Add Expense
        </button>
      </div>

      {/* Primary KPI Bento Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="pw-card rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-[#91A99B]">
            <span>Monthly Pocket Money</span>
            <Wallet className="w-4 h-4 text-[#40E8A1]" />
          </div>
          <div className="font-heading text-2xl font-bold mt-2 text-[#F4F8F5]">
            <AnimatedNumber value={pocketMoney} />
          </div>
          <div className="text-[11px] text-[#91A99B] mt-1">
            Base allowance for {selectedMonth}
          </div>
        </div>

        <div className="pw-card rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-[#91A99B]">
            <span>Total Expenses</span>
            <Flame className="w-4 h-4 text-[#D5FA72]" />
          </div>
          <div className="font-heading text-2xl font-bold mt-2 text-[#D5FA72]">
            <AnimatedNumber value={totalExpenses} />
          </div>
          <div className="text-[11px] text-[#91A99B] mt-1">
            {expenses.length} transaction{expenses.length === 1 ? "" : "s"}
          </div>
        </div>

        <div className="pw-card rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-[#91A99B]">
            <span>Remaining Balance</span>
            <ShieldCheck
              className={`w-4 h-4 ${
                remainingBalance < 0 ? "text-red-400" : "text-[#40E8A1]"
              }`}
            />
          </div>
          <div
            className={`font-heading text-2xl font-bold mt-2 ${
              remainingBalance < 0 ? "text-red-400" : "text-[#40E8A1]"
            }`}
          >
            <AnimatedNumber value={remainingBalance} />
          </div>
          <div className="text-[11px] text-[#91A99B] mt-1">
            {remainingBalance < 0 ? "Over budget" : "Available before reserve"}
          </div>
        </div>

        <div className="pw-card rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-[#91A99B]">
            <span>Budget Utilization</span>
            <span className="text-xs font-semibold text-[#F4F8F5]">
              {utilizationPct}%
            </span>
          </div>
          <div className="font-heading text-2xl font-bold mt-2 text-[#F4F8F5]">
            <AnimatedNumber value={utilizationPct} currency={false} suffix="%" />
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-[#071510] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, utilizationPct)}%`,
                backgroundColor:
                  utilizationPct > 100
                    ? "#F87171"
                    : utilizationPct >= 80
                    ? "#FBBF24"
                    : "#40E8A1",
              }}
            />
          </div>
        </div>

        <div className="pw-card rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-[#91A99B]">
            <span>Savings Progress</span>
            <PiggyBank className="w-4 h-4 text-[#40E8A1]" />
          </div>
          <div className="font-heading text-2xl font-bold mt-2 text-[#F4F8F5]">
            <AnimatedNumber value={savingsContributed} />
          </div>
          <div className="text-[11px] text-[#91A99B] mt-1">
            {savingsTarget > 0
              ? `${savingsPct}% of ${formatINR(savingsTarget)} target`
              : "No monthly target set"}
          </div>
        </div>
      </div>

      {/* Intelligence Row: Safe-to-Spend + Financial Health Score + AI Insight */}
      <div className="grid gap-5 lg:grid-cols-12">
        {/* Safe-to-Spend Daily Limit */}
        <div className="pw-card rounded-3xl p-5 lg:col-span-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#91A99B]">
                <Calculator className="w-4 h-4 text-[#40E8A1]" />
                Safe-to-Spend Today
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  safeToSpend.status === "green"
                    ? "bg-[#40E8A1]/15 text-[#40E8A1] border border-[#40E8A1]/30"
                    : safeToSpend.status === "amber"
                    ? "bg-amber-400/15 text-amber-300 border border-amber-400/30"
                    : "bg-red-400/15 text-red-300 border border-red-400/30"
                }`}
              >
                {safeToSpend.status === "green"
                  ? "Healthy Buffer"
                  : safeToSpend.status === "amber"
                  ? "Tight Budget"
                  : "Over / Zero Limit"}
              </span>
            </div>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-heading text-4xl font-bold text-[#F4F8F5]">
                <AnimatedNumber value={safeToSpend.dailySafeLimit} />
              </span>
              <span className="text-xs text-[#91A99B]">/ day</span>
            </div>

            <p className="text-xs text-[#91A99B] mt-2 leading-relaxed">
              {safeToSpend.explanation}
            </p>
          </div>

          <div className="mt-4 rounded-2xl bg-[#071510]/80 border border-[#40E8A1]/12 p-3 text-[11px] space-y-1 text-[#91A99B]">
            <div className="flex justify-between">
              <span>Pocket Money</span>
              <span className="text-[#F4F8F5]">{formatINR(safeToSpend.monthlyBudget)}</span>
            </div>
            <div className="flex justify-between">
              <span>− Recorded Expenses</span>
              <span className="text-[#F4F8F5]">−{formatINR(safeToSpend.recordedExpenses)}</span>
            </div>
            <div className="flex justify-between">
              <span>− Unreserved Savings</span>
              <span className="text-[#F4F8F5]">
                −{formatINR(safeToSpend.reservedSavingsRemaining)}
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-[#40E8A1]/12 font-semibold text-[#40E8A1]">
              <span>Available ({safeToSpend.remainingDays}d left)</span>
              <span>{formatINR(safeToSpend.availableSpendingMoney)}</span>
            </div>
          </div>
        </div>

        {/* Financial Health Score */}
        <div className="pw-card rounded-3xl p-5 lg:col-span-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#91A99B]">
                Financial Health Score
              </span>
              <span
                className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold border"
                style={{
                  color: health.color,
                  borderColor: `${health.color}45`,
                  backgroundColor: `${health.color}15`,
                }}
              >
                {health.label}
              </span>
            </div>

            <div className="mt-4 flex items-center gap-5">
              <div className="relative h-28 w-28 shrink-0">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 110 110">
                  <circle
                    cx="55"
                    cy="55"
                    r={gaugeRadius}
                    fill="none"
                    stroke="rgba(145,169,155,0.18)"
                    strokeWidth="9"
                  />
                  <circle
                    cx="55"
                    cy="55"
                    r={gaugeRadius}
                    fill="none"
                    stroke={health.color}
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeDasharray={gaugeCirc}
                    strokeDashoffset={gaugeOffset}
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-heading text-2xl font-bold text-[#F4F8F5]">
                    {health.score}
                  </span>
                  <span className="text-[10px] text-[#91A99B]">/ 100</span>
                </div>
              </div>

              <div className="space-y-1.5 text-[11px] text-[#91A99B]">
                {health.explanation.map((line) => (
                  <p key={line} className="leading-snug">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </div>

          <p className="mt-3 text-[10px] text-[#91A99B]/80 border-t border-[#40E8A1]/10 pt-2.5">
            Rule-based educational wellness indicator — not a credit score or
            professional financial assessment.
          </p>
        </div>

        {/* AI Insights + Copilot Shortcut */}
        <div className="pw-card rounded-3xl p-5 lg:col-span-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#40E8A1]">
                <Bot className="w-4 h-4" />
                AI Personalized Insights
              </div>
              <span className="text-[10px] rounded-full bg-[#D5FA72]/15 text-[#D5FA72] px-2 py-0.5 font-medium">
                Live Data
              </span>
            </div>

            <div className="mt-4 space-y-2.5">
              {aiInsightLines.map((line, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-[#071510]/80 border border-[#40E8A1]/15 p-3 text-xs text-[#F4F8F5]/90 leading-relaxed"
                >
                  {line}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => onNavigateTab("copilot")}
              className="pw-btn-primary w-full justify-between text-xs py-2.5"
            >
              <span>Ask PocketWise Copilot</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Charts Row: Category Donut + Weekly Spending Bar */}
      <div className="grid gap-5 lg:grid-cols-12">
        <div className="pw-card rounded-3xl p-5 lg:col-span-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-heading text-lg font-bold">
                Category-wise Expenses
              </h2>
              <p className="text-xs text-[#91A99B]">
                Actual breakdown for {formatMonthLabel(selectedMonth)}
              </p>
            </div>
            <button
              onClick={() => onNavigateTab("analytics")}
              className="text-xs text-[#40E8A1] hover:underline"
            >
              Full Analytics
            </button>
          </div>

          {categoryData.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-center text-xs text-[#91A99B] border border-dashed border-[#40E8A1]/20 rounded-2xl p-6">
              <p>No expenses recorded for this month yet.</p>
              <button
                onClick={onQuickAdd}
                className="mt-3 text-[#40E8A1] font-semibold hover:underline"
              >
                + Record your first expense
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4 items-center">
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="amount"
                      nameKey="category"
                      innerRadius={48}
                      outerRadius={76}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {categoryData.map((entry) => (
                        <Cell key={entry.category} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: number) => [formatINR(val), "Spent"]}
                      contentStyle={{
                        backgroundColor: "#0D2017",
                        borderColor: "rgba(64,232,161,0.3)",
                        borderRadius: "12px",
                        color: "#F4F8F5",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {categoryData.map((item) => (
                  <div
                    key={item.category}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="flex items-center gap-2 text-[#F4F8F5]">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="truncate max-w-[115px]">
                        {item.category}
                      </span>
                    </span>
                    <span className="text-[#91A99B]">
                      <strong className="text-[#F4F8F5]">
                        {formatINR(item.amount)}
                      </strong>{" "}
                      ({item.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Weekly Spending Bar Chart */}
        <div className="pw-card rounded-3xl p-5 lg:col-span-7">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-heading text-lg font-bold">
                Weekly Spending Trend
              </h2>
              <p className="text-xs text-[#91A99B]">
                Week-by-week outflow in {formatMonthLabel(selectedMonth)}
              </p>
            </div>
            <span className="text-xs text-[#91A99B]">
              Avg/tx:{" "}
              <strong className="text-[#F4F8F5]">
                {expenses.length > 0
                  ? formatINR(Math.round(totalExpenses / expenses.length))
                  : "₹0"}
              </strong>
            </span>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(145,169,155,0.12)"
                  vertical={false}
                />
                <XAxis
                  dataKey="week"
                  tick={{ fill: "#91A99B", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#91A99B", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${v}`}
                />
                <Tooltip
                  formatter={(val: number) => [formatINR(val), "Weekly Spend"]}
                  contentStyle={{
                    backgroundColor: "#0D2017",
                    borderColor: "rgba(64,232,161,0.3)",
                    borderRadius: "12px",
                    color: "#F4F8F5",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="amount"
                  fill="#40E8A1"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Month-End Prediction + Recent Transactions */}
      <div className="grid gap-5 lg:grid-cols-12">
        {/* Month-End Expense Prediction */}
        <div className="pw-card rounded-3xl p-5 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#D5FA72]" />
              <h2 className="font-heading text-lg font-bold">
                Month-End Expense Estimate
              </h2>
            </div>
            <span className="rounded-full bg-[#071510] border border-[#91A99B]/25 px-2.5 py-0.5 text-[11px] text-[#91A99B]">
              Estimate Only — Not Guaranteed
            </span>
          </div>

          {prediction.insufficientData ? (
            <div className="rounded-2xl border border-dashed border-[#40E8A1]/20 bg-[#071510]/50 p-6 text-center text-xs text-[#91A99B] flex flex-col items-center gap-2">
              <CalendarClock className="w-6 h-6 text-[#91A99B]" />
              <p>{prediction.note}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="rounded-2xl bg-[#071510]/75 border border-[#40E8A1]/12 p-3">
                  <div className="text-[11px] text-[#91A99B]">Avg Daily Pace</div>
                  <div className="font-heading text-lg font-bold text-[#F4F8F5]">
                    {formatINR(prediction.averageDailySpend)}/day
                  </div>
                </div>
                <div className="rounded-2xl bg-[#071510]/75 border border-[#40E8A1]/12 p-3">
                  <div className="text-[11px] text-[#91A99B]">
                    {prediction.isActualCompletedMonth
                      ? "Final Month Total"
                      : "Estimated Month-End"}
                  </div>
                  <div
                    className={`font-heading text-lg font-bold ${
                      prediction.exceedsBudget
                        ? "text-amber-300"
                        : "text-[#40E8A1]"
                    }`}
                  >
                    {formatINR(prediction.predictedTotal)}
                  </div>
                </div>
                <div className="rounded-2xl bg-[#071510]/75 border border-[#40E8A1]/12 p-3">
                  <div className="text-[11px] text-[#91A99B]">vs Budget</div>
                  <div
                    className={`font-heading text-lg font-bold ${
                      prediction.exceedsBudget
                        ? "text-red-400"
                        : "text-[#40E8A1]"
                    }`}
                  >
                    {prediction.exceedsBudget
                      ? `+${formatINR(prediction.projectedDifference)} over`
                      : `${formatINR(Math.abs(prediction.projectedDifference))} under`}
                  </div>
                </div>
              </div>

              {prediction.exceedsBudget && (
                <div className="mb-3 rounded-xl border border-amber-400/35 bg-amber-400/10 px-3.5 py-2.5 text-xs text-amber-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{prediction.note}</span>
                </div>
              )}

              <div className="h-48">
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
                      y={pocketMoney}
                      stroke="#F87171"
                      strokeDasharray="4 4"
                      label={{
                        value: `Budget ${formatINR(pocketMoney)}`,
                        fill: "#F87171",
                        fontSize: 10,
                        position: "insideTopRight",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="actualCumulative"
                      stroke="#40E8A1"
                      fill="#40E8A1"
                      fillOpacity={0.18}
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

        {/* Recent Transactions */}
        <div className="pw-card rounded-3xl p-5 lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg font-bold">
                Recent Transactions
              </h2>
              <button
                onClick={() => onNavigateTab("expenses")}
                className="text-xs text-[#40E8A1] hover:underline"
              >
                View All
              </button>
            </div>

            {recentTransactions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#40E8A1]/20 p-6 text-center text-xs text-[#91A99B]">
                No transactions yet for {formatMonthLabel(selectedMonth)}.
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between rounded-2xl bg-[#071510]/75 border border-[#40E8A1]/10 px-3.5 py-2.5"
                  >
                    <div className="min-w-0 pr-3">
                      <div className="text-sm font-medium text-[#F4F8F5] truncate">
                        {tx.title}
                      </div>
                      <div className="text-[11px] text-[#91A99B]">
                        {tx.category} • {tx.transactionDate} • {tx.paymentMethod}
                      </div>
                    </div>
                    <div className="font-heading text-sm font-bold text-[#F4F8F5] shrink-0">
                      {formatINR(tx.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigateTab("scanner")}
            className="mt-4 pw-btn-secondary w-full text-xs py-2.5"
          >
            Scan a Receipt with AI
          </button>
        </div>
      </div>
    </div>
  );
}
