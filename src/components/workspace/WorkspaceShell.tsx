"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Bot,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Info,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  Menu,
  PiggyBank,
  Plus,
  RotateCcw,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useAppData } from "@/components/AppDataProvider";
import { BrandLogo } from "@/components/BrandLogo";
import { formatMonthLabel, getCurrentMonthKey } from "@/lib/finance";
import type { Expense } from "@/lib/types";
import { AnalyticsView } from "./AnalyticsView";
import { BudgetPlannerView } from "./BudgetPlannerView";
import { CopilotView } from "./CopilotView";
import { ExpensesView } from "./ExpensesView";
import { OnboardingModal } from "./OnboardingModal";
import { OverviewView } from "./OverviewView";
import { QuickAddExpenseModal } from "./QuickAddExpenseModal";
import { ReceiptScannerView } from "./ReceiptScannerView";
import { SavingsGoalsView } from "./SavingsGoalsView";
import { SettingsView } from "./SettingsView";
import { SimulatorView } from "./SimulatorView";
import { SplitExpensesView } from "./SplitExpensesView";

export type WorkspaceTab =
  | "overview"
  | "expenses"
  | "scanner"
  | "budget"
  | "copilot"
  | "simulator"
  | "splitter"
  | "goals"
  | "analytics"
  | "settings";

const NAV_ITEMS: Array<{
  id: WorkspaceTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "expenses", label: "Expenses", icon: ListOrdered },
  { id: "scanner", label: "AI Receipt Scanner", icon: Camera, badge: "AI" },
  { id: "budget", label: "Budget Planner", icon: Wallet },
  { id: "copilot", label: "AI Copilot", icon: Bot, badge: "AI" },
  { id: "simulator", label: "Savings Simulator", icon: SlidersHorizontal },
  { id: "splitter", label: "Split Expenses", icon: Users },
  { id: "goals", label: "Savings Goals", icon: PiggyBank },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

const VALID_TABS = new Set<string>(NAV_ITEMS.map((i) => i.id));

function buildMonthOptions(
  expenseDates: string[],
  budgetMonths: string[]
): string[] {
  const now = new Date();
  const set = new Set<string>();
  for (let offset = -5; offset <= 2; offset++) {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    set.add(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  }
  for (const dateStr of expenseDates) {
    if (dateStr.length >= 7) set.add(dateStr.slice(0, 7));
  }
  for (const mk of budgetMonths) {
    if (mk) set.add(mk);
  }
  return Array.from(set).sort((a, b) => b.localeCompare(a));
}

export function WorkspaceShell() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {
    mode,
    dataset,
    saving,
    selectedMonth,
    setSelectedMonth,
    resetDemoData,
    addExpense,
    updateExpense,
    dismissAlert,
    logout,
  } = useAppData();

  const tabParam = searchParams.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(
    VALID_TABS.has(tabParam) ? (tabParam as WorkspaceTab) : "overview"
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  useEffect(() => {
    if (VALID_TABS.has(tabParam)) {
      setActiveTab(tabParam as WorkspaceTab);
    }
  }, [tabParam]);

  const navigateTab = (tab: string) => {
    const nextTab: WorkspaceTab = VALID_TABS.has(tab)
      ? (tab as WorkspaceTab)
      : "overview";
    setActiveTab(nextTab);
    setMobileDrawerOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", nextTab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const monthOptions = useMemo(() => {
    if (!dataset) return [getCurrentMonthKey()];
    return buildMonthOptions(
      dataset.expenses.map((e) => e.transactionDate),
      dataset.monthlyBudgets.map((b) => b.monthKey)
    );
  }, [dataset]);

  const activeAlerts = useMemo(() => {
    if (!dataset) return [];
    return dataset.alerts.filter((a) => !a.dismissed);
  }, [dataset]);

  if (!dataset) return null;

  const handleSaveExpense = async (payload: {
    id?: string;
    title: string;
    amount: number;
    category: Expense["category"];
    transactionDate: string;
    paymentMethod: Expense["paymentMethod"];
    notes: string;
  }) => {
    if (payload.id && editingExpense) {
      await updateExpense({
        ...editingExpense,
        title: payload.title,
        amount: payload.amount,
        category: payload.category,
        transactionDate: payload.transactionDate,
        paymentMethod: payload.paymentMethod,
        notes: payload.notes,
      });
    } else {
      await addExpense({
        title: payload.title,
        amount: payload.amount,
        category: payload.category,
        transactionDate: payload.transactionDate,
        paymentMethod: payload.paymentMethod,
        notes: payload.notes,
        source: "manual",
      });
    }
    setEditingExpense(null);
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-[#071510] text-[#F4F8F5] flex">
      {/* Desktop Collapsible Sidebar */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 border-r border-[#40E8A1]/12 bg-[#0D2017]/90 backdrop-blur-xl transition-all duration-200 sticky top-0 h-screen ${
          sidebarCollapsed ? "w-20" : "w-64"
        }`}
        aria-label="Primary Sidebar Navigation"
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#40E8A1]/10">
          <Link href="/" className="min-w-0">
            <BrandLogo size={34} showText={!sidebarCollapsed} />
          </Link>
          <button
            type="button"
            onClick={() => setSidebarCollapsed((v) => !v)}
            className="rounded-lg p-1.5 text-[#91A99B] hover:bg-[#14291E] hover:text-[#F4F8F5] transition"
            aria-label={
              sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
            }
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateTab(item.id)}
                aria-current={active ? "page" : undefined}
                title={sidebarCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-[#40E8A1]/15 text-[#40E8A1] border border-[#40E8A1]/30 shadow-glow"
                    : "text-[#91A99B] hover:bg-[#14291E]/75 hover:text-[#F4F8F5] border border-transparent"
                } ${sidebarCollapsed ? "justify-center px-2" : ""}`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 text-left truncate">
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className="rounded-full bg-[#D5FA72]/15 text-[#D5FA72] px-2 py-0.5 text-[10px] font-semibold">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Profile / Mode Panel */}
        <div className="p-3 border-t border-[#40E8A1]/10 space-y-2.5">
          {!sidebarCollapsed && (
            <div className="rounded-2xl bg-[#071510]/85 border border-[#40E8A1]/12 p-3">
              <div className="text-xs font-semibold text-[#F4F8F5] truncate">
                {dataset.profile.fullName}
              </div>
              <div className="text-[11px] text-[#91A99B] truncate">
                {mode === "demo"
                  ? "Fictional Student Demo"
                  : dataset.profile.email}
              </div>
            </div>
          )}

          {mode === "demo" ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={resetDemoData}
                title="Reset Demo Data"
                className="pw-btn-secondary w-full py-2 text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                {!sidebarCollapsed && <span>Reset Demo</span>}
              </button>
              {!sidebarCollapsed && (
                <Link
                  href="/auth?mode=signup"
                  className="pw-btn-primary w-full py-2 text-xs"
                >
                  Save Real Data (Sign Up)
                </Link>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={handleLogout}
              title="Log out"
              className="pw-btn-secondary w-full py-2 text-xs text-red-300 border-red-400/20 hover:border-red-400/40"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              {!sidebarCollapsed && <span>Sign Out</span>}
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Slide-Over Sidebar */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <aside className="relative z-10 w-72 max-w-[85vw] bg-[#0D2017] border-r border-[#40E8A1]/20 flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-4 border-b border-[#40E8A1]/12">
              <BrandLogo size={34} showText />
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="rounded-lg p-1.5 text-[#91A99B] hover:text-[#F4F8F5]"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              {NAV_ITEMS.map((item) => {
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigateTab(item.id)}
                    className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      active
                        ? "bg-[#40E8A1]/15 text-[#40E8A1] border border-[#40E8A1]/30"
                        : "text-[#91A99B] hover:bg-[#14291E] hover:text-[#F4F8F5]"
                    }`}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <span className="rounded-full bg-[#D5FA72]/15 text-[#D5FA72] px-2 py-0.5 text-[10px] font-semibold">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="p-4 border-t border-[#40E8A1]/12 space-y-2">
              {mode === "demo" ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      resetDemoData();
                      setMobileDrawerOpen(false);
                    }}
                    className="pw-btn-secondary w-full py-2 text-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset Demo Data
                  </button>
                  <Link
                    href="/auth?mode=signup"
                    className="pw-btn-primary w-full py-2 text-xs"
                  >
                    Create Student Account
                  </Link>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="pw-btn-secondary w-full py-2 text-xs text-red-300"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Command Header */}
        <header className="sticky top-0 z-30 border-b border-[#40E8A1]/12 bg-[#071510]/88 backdrop-blur-xl px-4 py-3 sm:px-6">
          <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(true)}
                className="lg:hidden rounded-xl border border-[#40E8A1]/20 p-2 text-[#F4F8F5] hover:bg-[#14291E]"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              {mode === "demo" ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-[#D5FA72]/30 bg-[#D5FA72]/10 px-3 py-1 text-xs font-medium text-[#D5FA72]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Live Demo Mode</span>
                  <span className="hidden sm:inline text-[#91A99B]">
                    • Fictional Student Data (LocalStorage)
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-full border border-[#40E8A1]/25 bg-[#40E8A1]/10 px-3 py-1 text-xs font-medium text-[#40E8A1]">
                  <span className="h-2 w-2 rounded-full bg-[#40E8A1]" />
                  <span>Personal Workspace</span>
                  {saving && (
                    <span className="text-[#91A99B]">• Saving...</span>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Month Selector */}
              <div className="inline-flex items-center gap-1.5 rounded-xl border border-[#40E8A1]/20 bg-[#0D2017] px-3 py-1.5 text-xs">
                <Calendar className="w-3.5 h-3.5 text-[#40E8A1]" />
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent text-[#F4F8F5] font-medium focus:outline-none cursor-pointer"
                  aria-label="Select month"
                >
                  {monthOptions.map((mk) => (
                    <option key={mk} value={mk} className="bg-[#0D2017]">
                      {formatMonthLabel(mk)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reset Demo Button (Quick Access on Header) */}
              {mode === "demo" && (
                <button
                  type="button"
                  onClick={resetDemoData}
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-[#91A99B]/25 bg-[#0D2017] px-3 py-1.5 text-xs font-medium text-[#91A99B] hover:text-[#F4F8F5] hover:border-[#40E8A1]/35 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Demo
                </button>
              )}

              {/* Smart Alerts Bell */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setAlertsOpen((v) => !v)}
                  className="relative rounded-xl border border-[#40E8A1]/20 bg-[#0D2017] p-2 text-[#91A99B] hover:text-[#F4F8F5] hover:border-[#40E8A1]/40 transition"
                  aria-label="Smart alerts"
                >
                  <Bell className="w-4 h-4" />
                  {activeAlerts.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 min-w-[16px] rounded-full bg-[#D5FA72] px-1 text-[10px] font-bold text-[#071510] flex items-center justify-center">
                      {activeAlerts.length}
                    </span>
                  )}
                </button>

                {alertsOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-[#40E8A1]/25 bg-[#0D2017] p-4 shadow-card z-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-heading text-sm font-bold text-[#F4F8F5]">
                        Smart Budget Alerts
                      </span>
                      <button
                        type="button"
                        onClick={() => setAlertsOpen(false)}
                        className="text-[#91A99B] hover:text-[#F4F8F5]"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {activeAlerts.length === 0 ? (
                      <div className="rounded-xl bg-[#071510]/80 p-4 text-center text-xs text-[#91A99B]">
                        No active alerts right now. You are within safe limits!
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {activeAlerts.map((alert) => (
                          <div
                            key={alert.alertKey}
                            className={`rounded-xl border p-3 text-xs space-y-1 ${
                              alert.severity === "danger"
                                ? "border-red-400/35 bg-red-500/10"
                                : alert.severity === "warning"
                                ? "border-amber-400/35 bg-amber-400/10"
                                : alert.severity === "success"
                                ? "border-[#40E8A1]/35 bg-[#40E8A1]/10"
                                : "border-[#40E8A1]/20 bg-[#071510]/70"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-1.5 font-semibold text-[#F4F8F5]">
                                {alert.severity === "success" ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-[#40E8A1] shrink-0" />
                                ) : alert.severity === "info" ? (
                                  <Info className="w-3.5 h-3.5 text-[#D5FA72] shrink-0" />
                                ) : (
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                                )}
                                <span>{alert.title}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => dismissAlert(alert.alertKey)}
                                className="text-[11px] text-[#91A99B] hover:text-[#F4F8F5]"
                              >
                                Dismiss
                              </button>
                            </div>
                            <p className="text-[#91A99B] leading-snug">
                              {alert.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingExpense(null);
                  setExpenseModalOpen(true);
                }}
                className="pw-btn-primary py-2 px-3.5 text-xs"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Quick Add</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Active View */}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            {activeTab === "overview" && (
              <OverviewView
                onQuickAdd={() => {
                  setEditingExpense(null);
                  setExpenseModalOpen(true);
                }}
                onNavigateTab={navigateTab}
              />
            )}
            {activeTab === "expenses" && (
              <ExpensesView
                onAddExpense={() => {
                  setEditingExpense(null);
                  setExpenseModalOpen(true);
                }}
                onEditExpense={(exp) => {
                  setEditingExpense(exp);
                  setExpenseModalOpen(true);
                }}
              />
            )}
            {activeTab === "scanner" && <ReceiptScannerView />}
            {activeTab === "budget" && <BudgetPlannerView />}
            {activeTab === "copilot" && (
              <CopilotView onNavigateTab={navigateTab} />
            )}
            {activeTab === "simulator" && <SimulatorView />}
            {activeTab === "splitter" && <SplitExpensesView />}
            {activeTab === "goals" && <SavingsGoalsView />}
            {activeTab === "analytics" && <AnalyticsView />}
            {activeTab === "settings" && <SettingsView />}
          </div>
        </main>
      </div>

      <QuickAddExpenseModal
        open={expenseModalOpen}
        onClose={() => {
          setExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        editingExpense={editingExpense}
        onSave={handleSaveExpense}
      />

      <OnboardingModal />
    </div>
  );
}
