"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  Database,
  Download,
  GraduationCap,
  LogOut,
  Plus,
  RotateCcw,
  Save,
  ShieldAlert,
  Trash2,
  User,
} from "lucide-react";
import { useAppData } from "@/components/AppDataProvider";
import { useToast } from "@/components/ToastProvider";
import { ACADEMIC_PROJECT_INFO } from "@/lib/constants";
import {
  calculateCategoryBreakdown,
  formatINR,
  getLocalDateString,
} from "@/lib/finance";
import type { TeamMember } from "@/lib/types";

export function SettingsView() {
  const router = useRouter();
  const {
    dataset,
    mode,
    capabilities,
    updateProfile,
    resetDemoData,
    resetUserFinancialData,
    deleteUserAccount,
    logout,
  } = useAppData();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState("");
  const [pocketMoney, setPocketMoney] = useState("5000");
  const [savingsTarget, setSavingsTarget] = useState("1000");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"reset" | "delete" | null>(
    null
  );

  useEffect(() => {
    if (!dataset) return;
    setFullName(dataset.profile.fullName);
    setPocketMoney(String(dataset.profile.monthlyPocketMoney));
    setSavingsTarget(String(dataset.profile.savingsTarget));
    setTeamMembers(
      dataset.profile.teamMembers.length > 0
        ? dataset.profile.teamMembers
        : [{ name: "Team Member 1", regNo: "JU/BT/CSE/2026/___" }]
    );
  }, [dataset]);

  const weeklySummary = useMemo(() => {
    if (!dataset) return null;
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);
    const startStr = getLocalDateString(sevenDaysAgo);
    const endStr = getLocalDateString(today);

    const recent = dataset.expenses.filter(
      (e) => e.transactionDate >= startStr && e.transactionDate <= endStr
    );
    const total = recent.reduce((s, e) => s + e.amount, 0);
    const top = calculateCategoryBreakdown(recent).filter((c) => c.amount > 0)[0];
    return {
      startStr,
      endStr,
      count: recent.length,
      total,
      topCategory: top ? `${top.category} (${formatINR(top.amount)})` : "None",
    };
  }, [dataset]);

  if (!dataset || !weeklySummary) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fullName.trim().length < 2) {
      showToast("Name must be at least 2 characters.", "error");
      return;
    }
    setSavingProfile(true);
    try {
      await updateProfile({
        fullName: fullName.trim(),
        monthlyPocketMoney: Math.max(0, Number(pocketMoney) || 0),
        savingsTarget: Math.max(0, Number(savingsTarget) || 0),
        teamMembers: teamMembers.filter((m) => m.name.trim() || m.regNo.trim()),
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCopyWeeklySummary = async () => {
    const text = [
      `PocketWise AI Weekly Expense Summary (${weeklySummary.startStr} to ${weeklySummary.endStr})`,
      `Student: ${dataset.profile.fullName}`,
      `Transactions (Last 7 Days): ${weeklySummary.count}`,
      `Total Spent: ${formatINR(weeklySummary.total)}`,
      `Top Category: ${weeklySummary.topCategory}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      showToast("Weekly summary copied to clipboard!", "success");
    } catch {
      showToast("Clipboard permission denied.", "info");
    }
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(dataset, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pocketwise-backup-${getLocalDateString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Full workspace JSON backup downloaded.", "success");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold">
          Settings, Data Controls & About Project
        </h1>
        <p className="text-xs text-[#91A99B] mt-1">
          Manage your student profile, review system capabilities, and customize
          your JECRC University academic project details.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Profile Management */}
        <form
          onSubmit={handleSaveProfile}
          className="pw-card rounded-3xl p-6 lg:col-span-6 space-y-4"
        >
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#40E8A1]" />
            <h2 className="font-heading text-lg font-bold">Student Profile</h2>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#91A99B] mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="pw-input"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#91A99B] mb-1.5">
              Email
            </label>
            <input
              type="email"
              disabled
              value={dataset.profile.email}
              className="pw-input opacity-70 cursor-not-allowed"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#91A99B] mb-1.5">
                Default Monthly Pocket Money (₹)
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
                Default Savings Target (₹)
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

          <button
            type="submit"
            disabled={savingProfile}
            className="pw-btn-primary"
          >
            <Save className="w-4 h-4" />
            {savingProfile ? "Saving..." : "Save Profile & Team Info"}
          </button>
        </form>

        {/* Weekly Summary + System & Data Controls */}
        <div className="space-y-6 lg:col-span-6">
          {/* Weekly Expense Summary (In-App, No Fake Email) */}
          <div className="pw-card rounded-3xl p-6 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-heading text-lg font-bold">
                Weekly Expense Summary (Last 7 Days)
              </h2>
              <button
                type="button"
                onClick={handleCopyWeeklySummary}
                className="pw-btn-secondary py-1.5 px-3 text-xs"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy Summary
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="rounded-xl bg-[#071510]/80 border border-[#40E8A1]/12 p-3">
                <div className="text-[#91A99B]">7-Day Total</div>
                <div className="font-heading text-base font-bold text-[#40E8A1] mt-0.5">
                  {formatINR(weeklySummary.total)}
                </div>
              </div>
              <div className="rounded-xl bg-[#071510]/80 border border-[#40E8A1]/12 p-3">
                <div className="text-[#91A99B]">Transactions</div>
                <div className="font-heading text-base font-bold text-[#F4F8F5] mt-0.5">
                  {weeklySummary.count}
                </div>
              </div>
              <div className="rounded-xl bg-[#071510]/80 border border-[#40E8A1]/12 p-3">
                <div className="text-[#91A99B]">Top Category</div>
                <div className="font-heading text-xs font-bold text-[#D5FA72] mt-1 truncate">
                  {weeklySummary.topCategory}
                </div>
              </div>
            </div>
            <p className="text-[11px] text-[#91A99B]">
              Summaries are generated live in-app. Email delivery is not
              simulated; automated emails require a configured email integration
              and explicit opt-in consent.
            </p>
          </div>

          {/* System Capabilities & Data Deletion Controls */}
          <div className="pw-card rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-[#D5FA72]" />
              <h2 className="font-heading text-lg font-bold">
                Storage, AI & Privacy Controls
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl bg-[#071510]/80 border border-[#40E8A1]/12 p-3">
                <div className="text-[#91A99B]">Active Storage</div>
                <div className="font-semibold text-[#40E8A1] mt-0.5">
                  {mode === "demo"
                    ? "Browser LocalStorage (Demo)"
                    : capabilities.storageMode === "supabase"
                    ? "Supabase Postgres (RLS)"
                    : "Local Persistent Server DB"}
                </div>
              </div>
              <div className="rounded-xl bg-[#071510]/80 border border-[#40E8A1]/12 p-3">
                <div className="text-[#91A99B]">AI Service</div>
                <div className="font-semibold text-[#D5FA72] mt-0.5">
                  {capabilities.aiConfigured
                    ? `Gemini API (${capabilities.aiModel})`
                    : "Rule-Based Fallback"}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleExportJSON}
                className="pw-btn-secondary text-xs py-2"
              >
                <Download className="w-3.5 h-3.5" />
                Export JSON Backup
              </button>

              {mode === "demo" ? (
                <button
                  type="button"
                  onClick={resetDemoData}
                  className="pw-btn-secondary text-xs py-2 text-[#D5FA72]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Demo Data
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setConfirmAction("reset")}
                    className="pw-btn-secondary text-xs py-2 text-amber-300 border-amber-400/25"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset Financial Data
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmAction("delete")}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-red-400/35 bg-red-500/10 px-3.5 py-2 text-xs font-medium text-red-300 hover:bg-red-500/20 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Account
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await logout();
                      router.push("/");
                    }}
                    className="pw-btn-secondary text-xs py-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* About Academic Project Section (Section 20) */}
      <div className="pw-card rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#40E8A1]/12 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[#40E8A1]/15 border border-[#40E8A1]/30 p-3 text-[#40E8A1]">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold">
                About Academic Project
              </h2>
              <p className="text-xs text-[#91A99B]">
                {ACADEMIC_PROJECT_INFO.project}
              </p>
            </div>
          </div>
          <span className="rounded-full bg-[#071510] border border-[#91A99B]/25 px-3 py-1 text-[11px] text-[#91A99B] self-start">
            Academic Prototype — Not Officially University Endorsed
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5 space-y-2.5 text-xs">
            <div className="rounded-2xl bg-[#071510]/75 border border-[#40E8A1]/12 p-4 space-y-2">
              <div className="flex justify-between gap-2">
                <span className="text-[#91A99B]">Subject</span>
                <span className="font-semibold text-[#F4F8F5] text-right">
                  {ACADEMIC_PROJECT_INFO.subject}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#91A99B]">Department</span>
                <span className="font-semibold text-[#F4F8F5] text-right">
                  {ACADEMIC_PROJECT_INFO.department}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#91A99B]">University</span>
                <span className="font-semibold text-[#40E8A1] text-right">
                  {ACADEMIC_PROJECT_INFO.university}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#91A99B]">Session</span>
                <span className="font-semibold text-[#F4F8F5] text-right">
                  {ACADEMIC_PROJECT_INFO.session}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#91A99B]">Project Guide</span>
                <span className="font-semibold text-[#D5FA72] text-right">
                  {ACADEMIC_PROJECT_INFO.guide}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-[#91A99B] leading-relaxed">
              {ACADEMIC_PROJECT_INFO.disclaimer}
            </p>
          </div>

          {/* Editable Team Member Placeholders */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-[#F4F8F5]">
                Team Members & Registration Numbers (Editable)
              </div>
              <button
                type="button"
                onClick={() =>
                  setTeamMembers((prev) => [
                    ...prev,
                    {
                      name: `Team Member ${prev.length + 1}`,
                      regNo: "JU/BT/CSE/2026/___",
                    },
                  ])
                }
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#40E8A1] hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Member
              </button>
            </div>

            <div className="space-y-2.5">
              {teamMembers.map((member, idx) => (
                <div
                  key={idx}
                  className="grid sm:grid-cols-12 gap-2 items-center"
                >
                  <input
                    type="text"
                    value={member.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTeamMembers((prev) =>
                        prev.map((m, i) => (i === idx ? { ...m, name: val } : m))
                      );
                    }}
                    placeholder="Student Full Name"
                    className="pw-input py-2 text-xs sm:col-span-6"
                  />
                  <input
                    type="text"
                    value={member.regNo}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTeamMembers((prev) =>
                        prev.map((m, i) => (i === idx ? { ...m, regNo: val } : m))
                      );
                    }}
                    placeholder="Registration Number"
                    className="pw-input py-2 text-xs sm:col-span-5"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setTeamMembers((prev) =>
                        prev.length > 1
                          ? prev.filter((_, i) => i !== idx)
                          : prev
                      )
                    }
                    className="p-2 text-[#91A99B] hover:text-red-400 sm:col-span-1 justify-self-end"
                    aria-label="Remove team member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-1 flex justify-end">
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="pw-btn-secondary text-xs py-2"
              >
                <Save className="w-3.5 h-3.5" />
                Save Team Details
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for Reset / Delete Account */}
      {confirmAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="pw-card w-full max-w-md rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2.5 text-red-300">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="font-heading text-lg font-bold text-[#F4F8F5]">
                {confirmAction === "delete"
                  ? "Delete Account Permanently?"
                  : "Reset All Financial Data?"}
              </h3>
            </div>
            <p className="text-xs text-[#91A99B] leading-relaxed">
              {confirmAction === "delete"
                ? "This permanently deletes your profile, expenses, budgets, goals, and shared bills. This action cannot be undone."
                : "This clears your expenses, goals, shared bills, and alerts while keeping your account profile intact."}
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="pw-btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const action = confirmAction;
                  setConfirmAction(null);
                  if (action === "reset") {
                    await resetUserFinancialData();
                  } else {
                    const ok = await deleteUserAccount();
                    if (ok) router.push("/");
                  }
                }}
                className="rounded-xl bg-red-500 px-4 py-2 text-xs font-semibold text-white hover:bg-red-600 transition"
              >
                {confirmAction === "delete" ? "Delete Forever" : "Confirm Reset"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
