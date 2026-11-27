"use client";

import React, { useMemo } from "react";
import { BarChart3, Download, Flame, Layers, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAppData } from "@/components/AppDataProvider";
import { useToast } from "@/components/ToastProvider";
import {
  calculateCategoryBreakdown,
  calculateWeeklyBreakdown,
  formatINR,
  formatMonthLabel,
  getMonthBudgetConfig,
  getMonthExpenses,
  getMonthKeyFromDate,
} from "@/lib/finance";

export function AnalyticsView() {
  const { dataset, selectedMonth, mode } = useAppData();
  const { showToast } = useToast();

  const analytics = useMemo(() => {
    if (!dataset) return null;
    const { pocketMoney } = getMonthBudgetConfig(dataset, selectedMonth);
    const expenses = getMonthExpenses(dataset, selectedMonth);
    const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);

    const catLimitsMap: Record<string, number> = {};
    for (const cb of dataset.categoryBudgets) {
      if (cb.monthKey === selectedMonth) {
        catLimitsMap[cb.category] = cb.limitAmount;
      }
    }

    const categoryBreakdown = calculateCategoryBreakdown(expenses, catLimitsMap);
    const activeCategories = categoryBreakdown.filter((c) => c.amount > 0);
    const highestCategory = activeCategories[0] ?? null;

    const essentialTotal = activeCategories
      .filter((c) => c.isEssential)
      .reduce((s, c) => s + c.amount, 0);
    const optionalTotal = activeCategories
      .filter((c) => !c.isEssential)
      .reduce((s, c) => s + c.amount, 0);

    const weeklyData = calculateWeeklyBreakdown(expenses, selectedMonth);

    // Monthly comparison across all months in dataset
    const monthKeys = new Set<string>([selectedMonth]);
    for (const e of dataset.expenses) {
      monthKeys.add(getMonthKeyFromDate(e.transactionDate));
    }
    for (const b of dataset.monthlyBudgets) {
      monthKeys.add(b.monthKey);
    }

    const monthlyComparison = Array.from(monthKeys)
      .sort((a, b) => a.localeCompare(b))
      .map((mk) => {
        const mExp = getMonthExpenses(dataset, mk);
        const spent = mExp.reduce((s, e) => s + e.amount, 0);
        const cfg = getMonthBudgetConfig(dataset, mk);
        return {
          month: formatMonthLabel(mk).replace(" 20", " '"),
          Actual: spent,
          Budget: cfg.pocketMoney,
        };
      });

    const budgetVsActualCats = categoryBreakdown
      .filter((c) => c.amount > 0 || c.limit > 0)
      .map((c) => ({
        category: c.category,
        Actual: c.amount,
        Limit: c.limit,
      }));

    return {
      pocketMoney,
      expenses,
      totalSpent,
      activeCategories,
      highestCategory,
      essentialTotal,
      optionalTotal,
      weeklyData,
      monthlyComparison,
      budgetVsActualCats,
    };
  }, [dataset, selectedMonth]);

  if (!dataset || !analytics) return null;

  const exportAnalyticsCSV = () => {
    if (analytics.expenses.length === 0) {
      showToast("No expenses recorded in this month to export.", "info");
      return;
    }
    const escapeCell = (v: string | number) =>
      `"${String(v ?? "").replace(/"/g, '""')}"`;

    const summaryLines = [
      ["PocketWise AI Monthly Analytics Report", formatMonthLabel(selectedMonth)],
      ["Data Mode", mode === "demo" ? "Fictional Demo Data" : "Live Student Account"],
      ["Monthly Pocket Money (INR)", analytics.pocketMoney],
      ["Total Expenses (INR)", analytics.totalSpent],
      ["Essential Spend (INR)", analytics.essentialTotal],
      ["Optional Spend (INR)", analytics.optionalTotal],
      [],
      ["Date", "Title", "Category", "Essential/Optional", "Amount (INR)", "Method", "Notes"],
    ];

    const txRows = analytics.expenses.map((e) => {
      const catItem = analytics.activeCategories.find(
        (c) => c.category === e.category
      );
      return [
        e.transactionDate,
        e.title,
        e.category,
        catItem?.isEssential ? "Essential" : "Optional",
        e.amount,
        e.paymentMethod,
        e.notes || "",
      ];
    });

    const csv = [...summaryLines, ...txRows]
      .map((row) => row.map(escapeCell).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pocketwise-analytics-${selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Analytics CSV report downloaded.", "success");
  };

  const essentialPct =
    analytics.totalSpent > 0
      ? Math.round((analytics.essentialTotal / analytics.totalSpent) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-[#40E8A1]" />
            Analytics & Reports
          </h1>
          <p className="text-xs text-[#91A99B] mt-1">
            {formatMonthLabel(selectedMonth)} insights computed from{" "}
            {mode === "demo"
              ? "clearly labeled fictional demo transactions"
              : "your stored transactions"}
            .
          </p>
        </div>

        <button onClick={exportAnalyticsCSV} className="pw-btn-primary text-xs">
          <Download className="w-4 h-4" />
          Export CSV Report
        </button>
      </div>

      {/* Summary KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="pw-card rounded-2xl p-4">
          <div className="text-xs text-[#91A99B]">Highest Expense Category</div>
          <div className="font-heading text-xl font-bold text-[#40E8A1] mt-1">
            {analytics.highestCategory
              ? analytics.highestCategory.category
              : "No data"}
          </div>
          <div className="text-[11px] text-[#91A99B] mt-1">
            {analytics.highestCategory
              ? `${formatINR(analytics.highestCategory.amount)} (${analytics.highestCategory.percentage}% of spend)`
              : "Add expenses to compute"}
          </div>
        </div>

        <div className="pw-card rounded-2xl p-4">
          <div className="text-xs text-[#91A99B]">Budget vs Actual</div>
          <div className="font-heading text-xl font-bold text-[#F4F8F5] mt-1">
            {formatINR(analytics.totalSpent)} / {formatINR(analytics.pocketMoney)}
          </div>
          <div className="text-[11px] text-[#91A99B] mt-1">
            {analytics.pocketMoney - analytics.totalSpent >= 0
              ? `${formatINR(analytics.pocketMoney - analytics.totalSpent)} under budget`
              : `${formatINR(analytics.totalSpent - analytics.pocketMoney)} over budget`}
          </div>
        </div>

        <div className="pw-card rounded-2xl p-4">
          <div className="text-xs text-[#91A99B]">Essential Spending</div>
          <div className="font-heading text-xl font-bold text-[#38BDF8] mt-1">
            {formatINR(analytics.essentialTotal)} ({essentialPct}%)
          </div>
          <div className="text-[11px] text-[#91A99B] mt-1">
            Food, Transport, Education, Hostel, Health, Internet
          </div>
        </div>

        <div className="pw-card rounded-2xl p-4">
          <div className="text-xs text-[#91A99B]">Optional / Discretionary</div>
          <div className="font-heading text-xl font-bold text-[#D5FA72] mt-1">
            {formatINR(analytics.optionalTotal)} ({analytics.totalSpent > 0 ? 100 - essentialPct : 0}%)
          </div>
          <div className="text-[11px] text-[#91A99B] mt-1">
            Shopping, Entertainment, Other
          </div>
        </div>
      </div>

      {/* Charts Row 1: Category Breakdown + Weekly Trends */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="pw-card rounded-3xl p-6 lg:col-span-6 space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#40E8A1]" />
            <h2 className="font-heading text-lg font-bold">
              Category-wise Breakdown
            </h2>
          </div>

          {analytics.activeCategories.length === 0 ? (
            <div className="h-60 flex items-center justify-center text-xs text-[#91A99B] border border-dashed border-[#40E8A1]/20 rounded-2xl">
              No spending recorded for {formatMonthLabel(selectedMonth)}.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4 items-center">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.activeCategories}
                      dataKey="amount"
                      nameKey="category"
                      innerRadius={48}
                      outerRadius={78}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {analytics.activeCategories.map((c) => (
                        <Cell key={c.category} fill={c.color} />
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
              <div className="space-y-2.5">
                {analytics.activeCategories.map((cat) => (
                  <div key={cat.category} className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="flex items-center gap-2 text-[#F4F8F5]">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.category}
                      </span>
                      <span className="font-semibold">
                        {formatINR(cat.amount)} ({cat.percentage}%)
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#071510] overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${cat.percentage}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="pw-card rounded-3xl p-6 lg:col-span-6 space-y-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-[#D5FA72]" />
            <h2 className="font-heading text-lg font-bold">
              Weekly Spending Trends
            </h2>
          </div>

          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.weeklyData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(145,169,155,0.12)"
                  vertical={false}
                />
                <XAxis
                  dataKey="week"
                  tick={{ fill: "#91A99B", fontSize: 11 }}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: "#91A99B", fontSize: 11 }}
                  axisLine={false}
                  tickFormatter={(v) => `₹${v}`}
                />
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
                <Bar
                  dataKey="amount"
                  fill="#D5FA72"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2: Monthly Comparison + Budget vs Actual by Category */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="pw-card rounded-3xl p-6 lg:col-span-6 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#40E8A1]" />
            <h2 className="font-heading text-lg font-bold">
              Monthly Spending Comparison
            </h2>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.monthlyComparison}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(145,169,155,0.12)"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
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
                    name,
                  ]}
                  contentStyle={{
                    backgroundColor: "#0D2017",
                    borderColor: "rgba(64,232,161,0.3)",
                    borderRadius: "12px",
                    color: "#F4F8F5",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar
                  dataKey="Budget"
                  fill="#91A99B"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={36}
                />
                <Bar
                  dataKey="Actual"
                  fill="#40E8A1"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={36}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="pw-card rounded-3xl p-6 lg:col-span-6 space-y-4">
          <div>
            <h2 className="font-heading text-lg font-bold">
              Category Limit vs. Actual Expenses
            </h2>
            <p className="text-xs text-[#91A99B]">
              Compare actual spending against any category limits set in Budget
              Planner
            </p>
          </div>

          {analytics.budgetVsActualCats.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-[#91A99B] border border-dashed border-[#40E8A1]/20 rounded-2xl">
              Add expenses or set category caps to view this comparison.
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.budgetVsActualCats}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(145,169,155,0.12)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="category"
                    tick={{ fill: "#91A99B", fontSize: 10 }}
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
                      name,
                    ]}
                    contentStyle={{
                      backgroundColor: "#0D2017",
                      borderColor: "rgba(64,232,161,0.3)",
                      borderRadius: "12px",
                      color: "#F4F8F5",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Bar
                    dataKey="Limit"
                    fill="#38BDF8"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={28}
                  />
                  <Bar
                    dataKey="Actual"
                    fill="#40E8A1"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={28}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
