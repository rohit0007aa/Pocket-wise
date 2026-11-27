"use client";

import React, { useState } from "react";
import {
  Award,
  CalendarCheck,
  CheckCircle2,
  Flame,
  PiggyBank,
  Plus,
  Sparkles,
  Target,
  Trash2,
} from "lucide-react";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { useAppData } from "@/components/AppDataProvider";
import { useToast } from "@/components/ToastProvider";
import {
  formatINR,
  getCurrentMonthKey,
  getLocalDateString,
  getMonthSavingsContributed,
} from "@/lib/finance";

const GOAL_TEMPLATES = [
  { title: "Buy a Laptop", target: 35000, category: "Tech" },
  { title: "College Trip", target: 4000, category: "Travel" },
  { title: "Emergency Fund", target: 3000, category: "Emergency" },
  { title: "New Headphones", target: 2500, category: "Tech" },
  { title: "Books & Courses", target: 1500, category: "Education" },
];

export function SavingsGoalsView() {
  const {
    dataset,
    addSavingsGoal,
    contributeToGoal,
    deleteSavingsGoal,
    toggleNoSpendDate,
    incrementSmartWeekChallenge,
    toggleSave500Challenge,
  } = useAppData();
  const { showToast } = useToast();

  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [initialSaved, setInitialSaved] = useState("");
  const [deadline, setDeadline] = useState("");
  const [category, setCategory] = useState("Tech");
  const [creating, setCreating] = useState(false);

  const [contribAmounts, setContribAmounts] = useState<Record<string, string>>({});
  const [contribNotes, setContribNotes] = useState<Record<string, string>>({});
  const [noSpendInput, setNoSpendInput] = useState(getLocalDateString());

  if (!dataset) return null;

  const totalSavedAcrossGoals = dataset.savingsGoals.reduce(
    (s, g) => s + g.savedAmount,
    0
  );
  const completedGoalsCount = dataset.savingsGoals.filter(
    (g) => g.targetAmount > 0 && g.savedAmount >= g.targetAmount
  ).length;
  const currentMonthSaved = getMonthSavingsContributed(
    dataset,
    getCurrentMonthKey()
  );

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = Number(targetAmount);
    const saved = Number(initialSaved || 0);
    if (title.trim().length < 2) {
      showToast("Please enter a goal title.", "error");
      return;
    }
    if (!Number.isFinite(target) || target <= 0) {
      showToast("Target amount must be greater than ₹0.", "error");
      return;
    }
    setCreating(true);
    try {
      await addSavingsGoal({
        title: title.trim(),
        targetAmount: Math.round(target),
        savedAmount: Math.max(0, Math.round(saved)),
        deadline: deadline || undefined,
        category,
      });
      setTitle("");
      setTargetAmount("");
      setInitialSaved("");
      setDeadline("");
    } finally {
      setCreating(false);
    }
  };

  const handleContribute = async (goalId: string) => {
    const amt = Number(contribAmounts[goalId]);
    if (!Number.isFinite(amt) || amt <= 0) {
      showToast("Enter a positive contribution amount.", "error");
      return;
    }
    await contributeToGoal(
      goalId,
      Math.round(amt),
      contribNotes[goalId]?.trim() || undefined
    );
    setContribAmounts((prev) => ({ ...prev, [goalId]: "" }));
    setContribNotes((prev) => ({ ...prev, [goalId]: "" }));
  };

  return (
    <div className="space-y-6">
      {/* Header + Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold flex items-center gap-2.5">
            <PiggyBank className="w-7 h-7 text-[#40E8A1]" />
            Savings Goals & Student Challenges
          </h1>
          <p className="text-xs text-[#91A99B] mt-1">
            Build consistent saving habits toward laptops, college trips, or
            your emergency buffer.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="pw-card rounded-2xl px-4 py-2.5 text-xs">
            <div className="text-[#91A99B]">Total Goal Savings</div>
            <div className="font-heading text-lg font-bold text-[#40E8A1]">
              <AnimatedNumber value={totalSavedAcrossGoals} />
            </div>
          </div>
          <div className="pw-card rounded-2xl px-4 py-2.5 text-xs">
            <div className="text-[#91A99B]">Completed Goals</div>
            <div className="font-heading text-lg font-bold text-[#D5FA72]">
              {completedGoalsCount} / {dataset.savingsGoals.length}
            </div>
          </div>
        </div>
      </div>

      {/* Create Goal + Student Challenges */}
      <div className="grid gap-6 lg:grid-cols-12">
        <form
          onSubmit={handleCreateGoal}
          className="pw-card rounded-3xl p-6 lg:col-span-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold flex items-center gap-2">
              <Target className="w-5 h-5 text-[#40E8A1]" />
              New Savings Goal
            </h2>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {GOAL_TEMPLATES.map((tpl) => (
              <button
                key={tpl.title}
                type="button"
                onClick={() => {
                  setTitle(tpl.title);
                  setTargetAmount(String(tpl.target));
                  setCategory(tpl.category);
                }}
                className="rounded-full border border-[#40E8A1]/20 bg-[#071510]/80 px-2.5 py-1 text-[11px] text-[#91A99B] hover:border-[#40E8A1] hover:text-[#F4F8F5] transition"
              >
                + {tpl.title}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#91A99B] mb-1.5">
              Goal Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Buy a Laptop"
              className="pw-input"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#91A99B] mb-1.5">
                Target Amount (₹) *
              </label>
              <input
                type="number"
                min={1}
                required
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="3000"
                className="pw-input"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#91A99B] mb-1.5">
                Initial Saved (₹)
              </label>
              <input
                type="number"
                min={0}
                value={initialSaved}
                onChange={(e) => setInitialSaved(e.target.value)}
                placeholder="0"
                className="pw-input"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#91A99B] mb-1.5">
                Target Date (Optional)
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="pw-input"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#91A99B] mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="pw-input"
              >
                {["Tech", "Travel", "Emergency", "Education", "Personal"].map(
                  (c) => (
                    <option key={c} value={c} className="bg-[#0D2017]">
                      {c}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="pw-btn-primary w-full"
          >
            <Plus className="w-4 h-4" />
            {creating ? "Creating..." : "Create Savings Goal"}
          </button>
        </form>

        {/* Student Savings Challenges */}
        <div className="pw-card rounded-3xl p-6 lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold flex items-center gap-2">
              <Award className="w-5 h-5 text-[#D5FA72]" />
              Student Savings Challenges
            </h2>
            <span className="text-[11px] text-[#91A99B]">
              Habit milestones (personal tracking only)
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {/* Challenge 1: No-Spend Day */}
            <div className="rounded-2xl bg-[#071510]/80 border border-[#40E8A1]/15 p-4 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#40E8A1]">
                    No-Spend Day
                  </span>
                  <CalendarCheck className="w-4 h-4 text-[#40E8A1]" />
                </div>
                <div className="font-heading text-2xl font-bold mt-2">
                  {dataset.challenges.noSpendDates.length}{" "}
                  <span className="text-xs font-normal text-[#91A99B]">
                    days logged
                  </span>
                </div>
                <p className="text-[11px] text-[#91A99B] mt-1">
                  Zero discretionary spending for a full day.
                </p>
              </div>
              <div className="space-y-2">
                <input
                  type="date"
                  value={noSpendInput}
                  onChange={(e) => setNoSpendInput(e.target.value)}
                  className="pw-input py-1.5 text-xs"
                />
                <button
                  type="button"
                  onClick={() => toggleNoSpendDate(noSpendInput)}
                  className="pw-btn-secondary w-full py-1.5 text-xs"
                >
                  {dataset.challenges.noSpendDates.includes(noSpendInput)
                    ? "Remove Date"
                    : "Mark No-Spend Day"}
                </button>
              </div>
            </div>

            {/* Challenge 2: Save ₹500 */}
            <div className="rounded-2xl bg-[#071510]/80 border border-[#40E8A1]/15 p-4 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#D5FA72]">
                    Save ₹500
                  </span>
                  <Sparkles className="w-4 h-4 text-[#D5FA72]" />
                </div>
                <div className="font-heading text-2xl font-bold mt-2">
                  {formatINR(currentMonthSaved)}{" "}
                  <span className="text-xs font-normal text-[#91A99B]">
                    / ₹500
                  </span>
                </div>
                <p className="text-[11px] text-[#91A99B] mt-1">
                  Set aside ₹500 into your goals this month.
                </p>
              </div>
              <div className="space-y-2">
                <div className="h-2 rounded-full bg-[#14291E] overflow-hidden">
                  <div
                    className="h-full bg-[#D5FA72] rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round((currentMonthSaved / 500) * 100)
                      )}%`,
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={toggleSave500Challenge}
                  className={`w-full rounded-xl py-1.5 text-xs font-semibold transition ${
                    dataset.challenges.save500Completed ||
                    currentMonthSaved >= 500
                      ? "bg-[#40E8A1]/15 text-[#40E8A1] border border-[#40E8A1]/35"
                      : "pw-btn-secondary"
                  }`}
                >
                  {dataset.challenges.save500Completed ||
                  currentMonthSaved >= 500
                    ? "Completed!"
                    : "Mark Completed"}
                </button>
              </div>
            </div>

            {/* Challenge 3: 7-Day Smart Spending */}
            <div className="rounded-2xl bg-[#071510]/80 border border-[#40E8A1]/15 p-4 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#38BDF8]">
                    7-Day Smart Spend
                  </span>
                  <Flame className="w-4 h-4 text-[#38BDF8]" />
                </div>
                <div className="font-heading text-2xl font-bold mt-2">
                  {dataset.challenges.smartSpendWeekCount} / 7{" "}
                  <span className="text-xs font-normal text-[#91A99B]">
                    days
                  </span>
                </div>
                <p className="text-[11px] text-[#91A99B] mt-1">
                  Stay under your daily Safe-to-Spend limit for 7 days.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <span
                      key={n}
                      className={`h-2 flex-1 rounded-full ${
                        n <= dataset.challenges.smartSpendWeekCount
                          ? "bg-[#40E8A1]"
                          : "bg-[#14291E]"
                      }`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  disabled={dataset.challenges.smartSpendWeekCount >= 7}
                  onClick={incrementSmartWeekChallenge}
                  className="pw-btn-secondary w-full py-1.5 text-xs"
                >
                  {dataset.challenges.smartSpendWeekCount >= 7
                    ? "7-Day Streak Achieved!"
                    : "Log Today Under Limit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Goals Grid */}
      {dataset.savingsGoals.length === 0 ? (
        <div className="pw-card rounded-3xl p-10 text-center text-xs text-[#91A99B]">
          No savings goals yet. Pick a template above to create your first goal!
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {dataset.savingsGoals.map((goal) => {
            const pct =
              goal.targetAmount > 0
                ? Math.min(
                    100,
                    Math.round((goal.savedAmount / goal.targetAmount) * 100)
                  )
                : 0;
            const remaining = Math.max(0, goal.targetAmount - goal.savedAmount);
            const completed = goal.savedAmount >= goal.targetAmount;
            const goalContribs = dataset.savingsContributions
              .filter((c) => c.goalId === goal.id)
              .slice(0, 4);

            return (
              <div
                key={goal.id}
                className={`pw-card rounded-3xl p-5 flex flex-col justify-between space-y-4 ${
                  completed ? "border-[#40E8A1]/45" : ""
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#40E8A1]">
                        {goal.category || "Personal"}
                      </span>
                      <h3 className="font-heading text-lg font-bold text-[#F4F8F5] mt-0.5">
                        {goal.title}
                      </h3>
                      {goal.deadline && (
                        <p className="text-[11px] text-[#91A99B]">
                          Target date: {goal.deadline}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteSavingsGoal(goal.id)}
                      className="p-1.5 text-[#91A99B] hover:text-red-400"
                      aria-label={`Delete ${goal.title}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-semibold text-[#F4F8F5]">
                        {formatINR(goal.savedAmount)} saved
                      </span>
                      <span className="text-[#91A99B]">
                        Goal: {formatINR(goal.targetAmount)} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-[#071510] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: completed ? "#D5FA72" : "#40E8A1",
                        }}
                      />
                    </div>
                    <div className="mt-1.5 text-[11px] text-[#91A99B]">
                      {completed ? (
                        <span className="inline-flex items-center gap-1 text-[#D5FA72] font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Target achieved!
                        </span>
                      ) : (
                        `${formatINR(remaining)} more to reach target`
                      )}
                    </div>
                  </div>

                  {/* Contribution input */}
                  <div className="flex gap-2 pt-1">
                    <input
                      type="number"
                      min={1}
                      placeholder="₹ Add"
                      value={contribAmounts[goal.id] ?? ""}
                      onChange={(e) =>
                        setContribAmounts((prev) => ({
                          ...prev,
                          [goal.id]: e.target.value,
                        }))
                      }
                      className="pw-input py-1.5 text-xs w-24"
                    />
                    <input
                      type="text"
                      placeholder="Note (optional)"
                      value={contribNotes[goal.id] ?? ""}
                      onChange={(e) =>
                        setContribNotes((prev) => ({
                          ...prev,
                          [goal.id]: e.target.value,
                        }))
                      }
                      className="pw-input py-1.5 text-xs flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => handleContribute(goal.id)}
                      className="pw-btn-primary py-1.5 px-3 text-xs shrink-0"
                    >
                      Save
                    </button>
                  </div>
                </div>

                {/* Contribution History */}
                {goalContribs.length > 0 && (
                  <div className="border-t border-[#40E8A1]/10 pt-3 space-y-1.5">
                    <div className="text-[11px] font-semibold text-[#91A99B]">
                      Recent Contributions
                    </div>
                    {goalContribs.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between text-[11px]"
                      >
                        <span className="text-[#91A99B] truncate pr-2">
                          {c.note || "Contribution"} •{" "}
                          {c.contributedAt.slice(0, 10)}
                        </span>
                        <span className="font-semibold text-[#40E8A1] shrink-0">
                          +{formatINR(c.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
