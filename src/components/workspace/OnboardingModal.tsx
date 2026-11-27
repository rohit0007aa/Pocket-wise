"use client";

import React, { useState } from "react";
import { ArrowRight, CheckCircle2, Sparkles, Target, Wallet } from "lucide-react";
import { useAppData } from "@/components/AppDataProvider";

export function OnboardingModal() {
  const { dataset, mode, updateProfile, addSavingsGoal } = useAppData();
  const [step, setStep] = useState(1);
  const [pocketMoney, setPocketMoney] = useState(
    String(dataset?.profile.monthlyPocketMoney ?? 5000)
  );
  const [savingsTarget, setSavingsTarget] = useState(
    String(dataset?.profile.savingsTarget ?? 1000)
  );
  const [goalTitle, setGoalTitle] = useState("Emergency Student Fund");
  const [goalTarget, setGoalTarget] = useState("2000");
  const [createFirstGoal, setCreateFirstGoal] = useState(true);
  const [saving, setSaving] = useState(false);

  if (
    !dataset ||
    mode === "demo" ||
    dataset.profile.onboardingCompleted
  ) {
    return null;
  }

  const finishOnboarding = async () => {
    setSaving(true);
    try {
      await updateProfile({
        fullName: dataset.profile.fullName,
        monthlyPocketMoney: Math.max(0, Number(pocketMoney) || 0),
        savingsTarget: Math.max(0, Number(savingsTarget) || 0),
        onboardingCompleted: true,
      });
      if (createFirstGoal && goalTitle.trim() && Number(goalTarget) > 0) {
        await addSavingsGoal({
          title: goalTitle.trim(),
          targetAmount: Number(goalTarget),
          category: "Emergency",
        });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Student Onboarding"
    >
      <div className="pw-card w-full max-w-xl rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#40E8A1]/15 border border-[#40E8A1]/30 px-3 py-1 text-xs font-semibold text-[#40E8A1]">
            <Sparkles className="w-3.5 h-3.5" />
            Guided Setup ({step}/2)
          </span>
          <button
            onClick={() =>
              updateProfile({
                fullName: dataset.profile.fullName,
                monthlyPocketMoney: dataset.profile.monthlyPocketMoney,
                savingsTarget: dataset.profile.savingsTarget,
                onboardingCompleted: true,
              })
            }
            className="text-xs text-[#91A99B] hover:text-[#F4F8F5]"
          >
            Skip setup
          </button>
        </div>

        {step === 1 ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[#40E8A1]/15 p-3 text-[#40E8A1]">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-heading text-2xl font-bold">
                  Welcome, {dataset.profile.fullName.split(" ")[0]}!
                </h2>
                <p className="text-xs text-[#91A99B]">
                  Confirm your monthly pocket money and savings target.
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-[#91A99B] mb-1.5">
                  Monthly Pocket Money (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={pocketMoney}
                  onChange={(e) => setPocketMoney(e.target.value)}
                  className="pw-input"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#91A99B] mb-1.5">
                  Monthly Savings Target (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={savingsTarget}
                  onChange={(e) => setSavingsTarget(e.target.value)}
                  className="pw-input"
                />
              </div>
            </div>

            <div className="rounded-2xl bg-[#071510]/80 border border-[#40E8A1]/15 p-4 text-xs text-[#91A99B] space-y-1">
              <div className="font-semibold text-[#F4F8F5]">
                How PocketWise uses this:
              </div>
              <p>
                Your Safe-to-Spend daily limit reserves your savings target
                first so you always know what is truly safe to spend today.
              </p>
            </div>

            <div className="flex justify-end">
              <button onClick={() => setStep(2)} className="pw-btn-primary">
                Next: First Savings Goal
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[#D5FA72]/15 p-3 text-[#D5FA72]">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-heading text-2xl font-bold">
                  Set your first savings goal
                </h2>
                <p className="text-xs text-[#91A99B]">
                  Start small—like a laptop accessory, college trip, or
                  emergency buffer.
                </p>
              </div>
            </div>

            <label className="flex items-center gap-2.5 text-xs text-[#F4F8F5] cursor-pointer">
              <input
                type="checkbox"
                checked={createFirstGoal}
                onChange={(e) => setCreateFirstGoal(e.target.checked)}
                className="rounded accent-[#40E8A1]"
              />
              Create a starter savings goal right now
            </label>

            {createFirstGoal && (
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#91A99B] mb-1.5">
                    Goal Name
                  </label>
                  <input
                    type="text"
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    className="pw-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#91A99B] mb-1.5">
                    Target Amount (₹)
                  </label>
                  <input
                    type="number"
                    min={100}
                    value={goalTarget}
                    onChange={(e) => setGoalTarget(e.target.value)}
                    className="pw-input"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-between pt-2">
              <button
                onClick={() => setStep(1)}
                className="pw-btn-secondary"
              >
                Back
              </button>
              <button
                onClick={finishOnboarding}
                disabled={saving}
                className="pw-btn-primary"
              >
                <CheckCircle2 className="w-4 h-4" />
                {saving ? "Setting up..." : "Launch My Dashboard"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
