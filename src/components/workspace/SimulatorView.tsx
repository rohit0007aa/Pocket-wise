"use client";

import React, { useMemo, useState } from "react";
import { RotateCcw, SlidersHorizontal, Sparkles, TrendingDown } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { useAppData } from "@/components/AppDataProvider";
import {
  formatINR,
  formatMonthLabel,
  getMonthBudgetConfig,
  getMonthExpenses,
} from "@/lib/finance";

type SliderKey = "Food" | "Shopping" | "Entertainment" | "Transport" | "OtherOptional";

const SLIDER_META: Array<{ key: SliderKey; label: string; hint: string }> = [
  {
    key: "Food",
    label: "Food & Dining",
    hint: "Swap café/delivery orders with mess or homemade snacks",
  },
  {
    key: "Shopping",
    label: "Shopping",
    hint: "Delay non-urgent clothes, gadgets, or impulse cart buys",
  },
  {
    key: "Entertainment",
    label: "Entertainment",
    hint: "Rotate subscriptions or pick student-discount outings",
  },
  {
    key: "Transport",
    label: "Transport",
    hint: "Bundle rides or prefer metro/bus passes over solo autos",
  },
  {
    key: "OtherOptional",
    label: "Other Optional Expenses",
    hint: "Mobile add-ons, miscellaneous, or non-core extras",
  },
];

export function SimulatorView() {
  const { dataset, selectedMonth } = useAppData();
  const [cuts, setCuts] = useState<Record<SliderKey, number>>({
    Food: 15,
    Shopping: 25,
    Entertainment: 20,
    Transport: 10,
    OtherOptional: 15,
  });

  const summary = useMemo(() => {
    if (!dataset) return null;
    const { pocketMoney } = getMonthBudgetConfig(dataset, selectedMonth);
    const expenses = getMonthExpenses(dataset, selectedMonth);

    const base: Record<SliderKey, number> = {
      Food: 0,
      Shopping: 0,
      Entertainment: 0,
      Transport: 0,
      OtherOptional: 0,
    };

    for (const exp of expenses) {
      if (
        exp.category === "Food" ||
        exp.category === "Shopping" ||
        exp.category === "Entertainment" ||
        exp.category === "Transport"
      ) {
        base[exp.category] += exp.amount;
      } else {
        base.OtherOptional += exp.amount;
      }
    }

    const currentSpending = Object.values(base).reduce((s, v) => s + v, 0);

    const chartRows = SLIDER_META.map((item) => {
      const current = base[item.key];
      const cutPct = cuts[item.key];
      const saved = Math.round((current * cutPct) / 100);
      const adjusted = Math.max(0, current - saved);
      return {
        key: item.key,
        label: item.label,
        hint: item.hint,
        cutPct,
        Current: current,
        Adjusted: adjusted,
        saved,
      };
    });

    const adjustedSpending = chartRows.reduce((s, r) => s + r.Adjusted, 0);
    const monthlySavings = Math.max(0, currentSpending - adjustedSpending);
    const annualSavings = monthlySavings * 12;
    const currentRemaining = pocketMoney - currentSpending;
    const projectedRemaining = pocketMoney - adjustedSpending;
    const currentUtil =
      pocketMoney > 0 ? Math.round((currentSpending / pocketMoney) * 100) : 0;
    const projectedUtil =
      pocketMoney > 0 ? Math.round((adjustedSpending / pocketMoney) * 100) : 0;

    return {
      pocketMoney,
      currentSpending,
      adjustedSpending,
      monthlySavings,
      annualSavings,
      currentRemaining,
      projectedRemaining,
      currentUtil,
      projectedUtil,
      chartRows,
    };
  }, [dataset, selectedMonth, cuts]);

  if (!dataset || !summary) return null;

  const applyPreset = (pct: number) => {
    setCuts({
      Food: pct,
      Shopping: pct,
      Entertainment: pct,
      Transport: pct,
      OtherOptional: pct,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold flex items-center gap-2.5">
            <SlidersHorizontal className="w-7 h-7 text-[#40E8A1]" />
            What-If Savings Simulator
          </h1>
          <p className="text-xs text-[#91A99B] mt-1">
            Simulate spending adjustments on your{" "}
            {formatMonthLabel(selectedMonth)} expenses. All figures are
            hypothetical estimates.
          </p>
        </div>

        <span className="rounded-full border border-[#D5FA72]/35 bg-[#D5FA72]/10 px-3 py-1 text-xs font-semibold text-[#D5FA72] self-start">
          Hypothetical Estimates Only
        </span>
      </div>

      {/* KPI Results Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="pw-card rounded-2xl p-4">
          <div className="text-xs text-[#91A99B]">Current Monthly Spend</div>
          <div className="font-heading text-2xl font-bold text-[#F4F8F5] mt-1">
            <AnimatedNumber value={summary.currentSpending} />
          </div>
          <div className="text-[11px] text-[#91A99B] mt-1">
            {summary.currentUtil}% of {formatINR(summary.pocketMoney)}
          </div>
        </div>

        <div className="pw-card rounded-2xl p-4">
          <div className="text-xs text-[#91A99B]">Adjusted Monthly Spend</div>
          <div className="font-heading text-2xl font-bold text-[#40E8A1] mt-1">
            <AnimatedNumber value={summary.adjustedSpending} />
          </div>
          <div className="text-[11px] text-[#91A99B] mt-1">
            Projected {summary.projectedUtil}% utilization
          </div>
        </div>

        <div className="pw-card rounded-2xl p-4 border-[#40E8A1]/30">
          <div className="text-xs text-[#91A99B]">Potential Monthly Savings</div>
          <div className="font-heading text-2xl font-bold text-[#D5FA72] mt-1">
            +<AnimatedNumber value={summary.monthlySavings} />
          </div>
          <div className="text-[11px] text-[#40E8A1] mt-1">
            Hypothetical monthly gain
          </div>
        </div>

        <div className="pw-card rounded-2xl p-4">
          <div className="text-xs text-[#91A99B]">Potential Annual Savings</div>
          <div className="font-heading text-2xl font-bold text-[#F4F8F5] mt-1">
            +<AnimatedNumber value={summary.annualSavings} />
          </div>
          <div className="text-[11px] text-[#91A99B] mt-1">
            12-month hypothetical run rate
          </div>
        </div>

        <div className="pw-card rounded-2xl p-4">
          <div className="text-xs text-[#91A99B]">Updated Budget Buffer</div>
          <div className="font-heading text-2xl font-bold text-[#40E8A1] mt-1">
            <AnimatedNumber value={summary.projectedRemaining} />
          </div>
          <div className="text-[11px] text-[#91A99B] mt-1">
            Was {formatINR(summary.currentRemaining)}
          </div>
        </div>
      </div>

      {/* Main Simulator Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Sliders Panel */}
        <div className="pw-card rounded-3xl p-6 lg:col-span-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-heading text-lg font-bold">
              Adjust Category Reductions
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "0%", val: 0 },
                { label: "10%", val: 10 },
                { label: "20%", val: 20 },
                { label: "35%", val: 35 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPreset(preset.val)}
                  className="rounded-lg border border-[#40E8A1]/20 bg-[#071510] px-2.5 py-1 text-[11px] text-[#91A99B] hover:border-[#40E8A1] hover:text-[#F4F8F5] transition"
                >
                  {preset.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => applyPreset(0)}
                className="rounded-lg border border-[#91A99B]/20 px-2 py-1 text-[11px] text-[#91A99B] hover:text-[#F4F8F5]"
                title="Reset sliders"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          </div>

          {summary.currentSpending === 0 && (
            <div className="rounded-2xl border border-dashed border-[#40E8A1]/25 bg-[#071510]/70 p-4 text-xs text-[#91A99B]">
              No expenses recorded in {formatMonthLabel(selectedMonth)} yet.
              Record expenses or switch to a month with transactions to simulate
              reductions on real numbers.
            </div>
          )}

          <div className="space-y-4">
            {summary.chartRows.map((row) => (
              <div
                key={row.key}
                className="rounded-2xl bg-[#071510]/75 border border-[#40E8A1]/12 p-4 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#F4F8F5]">
                    {row.label}
                  </span>
                  <span className="text-[#D5FA72] font-semibold">
                    −{row.cutPct}% ({formatINR(row.saved)} saved)
                  </span>
                </div>

                <input
                  type="range"
                  min={0}
                  max={60}
                  step={5}
                  value={row.cutPct}
                  onChange={(e) =>
                    setCuts({ ...cuts, [row.key]: Number(e.target.value) })
                  }
                  className="pw-slider w-full"
                  aria-label={`Reduce ${row.label} by percentage`}
                />

                <div className="flex items-center justify-between text-[11px] text-[#91A99B]">
                  <span>Now: {formatINR(row.Current)}</span>
                  <span className="text-[#40E8A1]">
                    After: {formatINR(row.Adjusted)}
                  </span>
                </div>
                <p className="text-[11px] text-[#91A99B]/80">{row.hint}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Before vs After Animated Comparison Chart */}
        <div className="pw-card rounded-3xl p-6 lg:col-span-7 flex flex-col justify-between space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-heading text-lg font-bold flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-[#40E8A1]" />
                Before vs. After Spending Comparison
              </h2>
              <p className="text-xs text-[#91A99B]">
                Instant visual projection as you drag any category slider
              </p>
            </div>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={summary.chartRows.map((r) => ({
                  name: r.label.replace(" Expenses", ""),
                  Current: r.Current,
                  Adjusted: r.Adjusted,
                }))}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(145,169,155,0.12)"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
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
                  dataKey="Current"
                  fill="#91A99B"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={36}
                />
                <Bar
                  dataKey="Adjusted"
                  fill="#40E8A1"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={36}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl border border-[#40E8A1]/20 bg-gradient-to-r from-[#40E8A1]/10 to-[#D5FA72]/5 p-4 flex items-start gap-3 text-xs">
            <Sparkles className="w-4 h-4 text-[#D5FA72] shrink-0 mt-0.5" />
            <div className="text-[#F4F8F5]/90 leading-relaxed">
              <strong>Hypothetical Projection:</strong> Saving{" "}
              <strong className="text-[#D5FA72]">
                {formatINR(summary.monthlySavings)}/month
              </strong>{" "}
              brings your monthly spending from{" "}
              {formatINR(summary.currentSpending)} down to{" "}
              {formatINR(summary.adjustedSpending)}, leaving{" "}
              <strong className="text-[#40E8A1]">
                {formatINR(summary.projectedRemaining)}
              </strong>{" "}
              against your {formatINR(summary.pocketMoney)} pocket money.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
