"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { createDemoDataset } from "@/lib/demo-data";
import { generateSmartAlerts, getCurrentMonthKey } from "@/lib/finance";
import type {
  AppDataset,
  Expense,
  ExpenseCategory,
  SavingsGoal,
  SharedBill,
  TeamMember,
} from "@/lib/types";
import { useToast } from "./ToastProvider";

const DEMO_STORAGE_KEY = "pocketwise_demo_state_v1";

function createUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function syncAlertsForMonth(base: AppDataset, monthKey: string): AppDataset {
  const updatedAlerts = generateSmartAlerts(base, monthKey);
  const mergedAlerts = [
    ...base.alerts.filter((a) => a.monthKey !== monthKey),
    ...updatedAlerts,
  ];
  return {
    ...base,
    alerts: mergedAlerts,
  };
}

interface SystemCapabilities {
  storageMode: "local" | "supabase";
  aiConfigured: boolean;
  aiModel: string;
}

interface AppDataContextValue {
  mode: "demo" | "authenticated";
  setMode: (mode: "demo" | "authenticated") => void;
  dataset: AppDataset | null;
  loading: boolean;
  saving: boolean;
  selectedMonth: string;
  setSelectedMonth: (monthKey: string) => void;
  capabilities: SystemCapabilities;
  refreshUserSession: () => Promise<AppDataset | null>;
  resetDemoData: () => void;
  // Mutations
  addExpense: (
    exp: Omit<Expense, "id" | "createdAt">
  ) => Promise<void>;
  updateExpense: (exp: Expense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  updateMonthlyBudget: (
    monthKey: string,
    pocketMoney: number,
    savingsTarget: number
  ) => Promise<void>;
  setCategoryLimit: (
    monthKey: string,
    category: ExpenseCategory,
    limitAmount: number
  ) => Promise<void>;
  addSavingsGoal: (
    goal: Omit<SavingsGoal, "id" | "createdAt" | "savedAmount"> & {
      savedAmount?: number;
    }
  ) => Promise<void>;
  contributeToGoal: (
    goalId: string,
    amount: number,
    note?: string
  ) => Promise<void>;
  deleteSavingsGoal: (goalId: string) => Promise<void>;
  addSharedBill: (
    bill: Omit<SharedBill, "id" | "createdAt">
  ) => Promise<void>;
  markBillAddedToPersonal: (billId: string, myShare: number) => Promise<void>;
  deleteSharedBill: (billId: string) => Promise<void>;
  dismissAlert: (alertKey: string) => Promise<void>;
  toggleNoSpendDate: (dateStr: string) => Promise<void>;
  incrementSmartWeekChallenge: () => Promise<void>;
  toggleSave500Challenge: () => Promise<void>;
  updateProfile: (updates: {
    fullName: string;
    monthlyPocketMoney: number;
    savingsTarget: number;
    onboardingCompleted?: boolean;
    teamMembers?: TeamMember[];
  }) => Promise<void>;
  resetUserFinancialData: () => Promise<void>;
  deleteUserAccount: () => Promise<boolean>;
  logout: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error("useAppData must be used inside AppDataProvider");
  }
  return ctx;
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();
  const pathname = usePathname();
  const initialIsDemo = pathname?.startsWith("/demo") ?? false;
  const [mode, setModeState] = useState<"demo" | "authenticated">(
    initialIsDemo ? "demo" : "authenticated"
  );
  const modeRef = useRef<"demo" | "authenticated">(mode);
  const setMode = useCallback((next: "demo" | "authenticated") => {
    modeRef.current = next;
    setModeState(next);
  }, []);

  const [dataset, setDataset] = useState<AppDataset | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(() =>
    getCurrentMonthKey()
  );
  const [capabilities, setCapabilities] = useState<SystemCapabilities>({
    storageMode: "local",
    aiConfigured: false,
    aiModel: "rule-based-fallback",
  });

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((data) => {
        if (data?.ok) {
          setCapabilities({
            storageMode: data.storageMode,
            aiConfigured: Boolean(data.aiConfigured),
            aiModel: data.aiModel,
          });
        }
      })
      .catch(() => {});
  }, []);

  const loadDemoFromLocalStorage = useCallback((): AppDataset => {
    try {
      const raw = localStorage.getItem(DEMO_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AppDataset;
        if (parsed?.profile && Array.isArray(parsed.expenses)) {
          return syncAlertsForMonth(parsed, getCurrentMonthKey());
        }
      }
    } catch {
      // ignore corrupted storage
    }
    const fresh = syncAlertsForMonth(createDemoDataset(), getCurrentMonthKey());
    try {
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(fresh));
    } catch {
      // ignore quota
    }
    return fresh;
  }, []);

  const refreshUserSession = useCallback(async (): Promise<AppDataset | null> => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (modeRef.current !== "authenticated") {
        return null;
      }
      if (res.ok) {
        const json = await res.json();
        const synced = syncAlertsForMonth(
          json.dataset as AppDataset,
          getCurrentMonthKey()
        );
        setDataset(synced);
        return synced;
      }
      setDataset(null);
      return null;
    } catch {
      if (modeRef.current === "authenticated") {
        setDataset(null);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    modeRef.current = mode;
    if (mode === "demo") {
      setLoading(true);
      const demoData = loadDemoFromLocalStorage();
      setDataset(demoData);
      setLoading(false);
    } else {
      refreshUserSession();
    }
  }, [mode, loadDemoFromLocalStorage, refreshUserSession]);

  const persistDataset = useCallback(
    async (updater: (prev: AppDataset) => AppDataset) => {
      if (!dataset) return;
      const updatedBase = updater(dataset);
      const nextDataset = syncAlertsForMonth(updatedBase, selectedMonth);

      setDataset(nextDataset);

      if (mode === "demo") {
        try {
          localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(nextDataset));
        } catch {
          showToast("Could not persist demo data in browser storage.", "error");
        }
        return;
      }

      setSaving(true);
      try {
        const res = await fetch("/api/user/data", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dataset: nextDataset }),
        });
        if (!res.ok) {
          throw new Error("Save failed");
        }
      } catch {
        showToast(
          "Failed to save changes to server. Please check your connection.",
          "error"
        );
      } finally {
        setSaving(false);
      }
    },
    [dataset, mode, selectedMonth, showToast]
  );

  const resetDemoData = useCallback(() => {
    const currentKey = getCurrentMonthKey();
    const fresh = syncAlertsForMonth(createDemoDataset(), currentKey);
    setDataset(fresh);
    setSelectedMonth(currentKey);
    try {
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(fresh));
    } catch {
      // ignore
    }
    showToast("Demo data reset to ₹5,000 pocket money & ₹3,800 expenses.", "info");
  }, [showToast]);

  const addExpense = useCallback(
    async (exp: Omit<Expense, "id" | "createdAt">) => {
      const newExp: Expense = {
        ...exp,
        id: createUuid(),
        createdAt: new Date().toISOString(),
      };
      await persistDataset((prev) => ({
        ...prev,
        expenses: [newExp, ...prev.expenses],
      }));
      showToast(`Added "${newExp.title}" (₹${newExp.amount}).`, "success");
    },
    [persistDataset, showToast]
  );

  const updateExpense = useCallback(
    async (exp: Expense) => {
      await persistDataset((prev) => ({
        ...prev,
        expenses: prev.expenses.map((item) =>
          item.id === exp.id ? exp : item
        ),
      }));
      showToast(`Updated "${exp.title}".`, "success");
    },
    [persistDataset, showToast]
  );

  const deleteExpense = useCallback(
    async (id: string) => {
      await persistDataset((prev) => ({
        ...prev,
        expenses: prev.expenses.filter((item) => item.id !== id),
      }));
      showToast("Expense deleted.", "info");
    },
    [persistDataset, showToast]
  );

  const updateMonthlyBudget = useCallback(
    async (monthKey: string, pocketMoney: number, savingsTarget: number) => {
      await persistDataset((prev) => {
        const exists = prev.monthlyBudgets.some((b) => b.monthKey === monthKey);
        const monthlyBudgets = exists
          ? prev.monthlyBudgets.map((b) =>
              b.monthKey === monthKey
                ? { ...b, pocketMoney, savingsTarget }
                : b
            )
          : [
              ...prev.monthlyBudgets,
              {
                id: createUuid(),
                monthKey,
                pocketMoney,
                savingsTarget,
              },
            ];
        return {
          ...prev,
          monthlyBudgets,
          profile:
            monthKey === getCurrentMonthKey()
              ? {
                  ...prev.profile,
                  monthlyPocketMoney: pocketMoney,
                  savingsTarget,
                }
              : prev.profile,
        };
      });
      showToast("Monthly budget & savings target updated.", "success");
    },
    [persistDataset, showToast]
  );

  const setCategoryLimit = useCallback(
    async (
      monthKey: string,
      category: ExpenseCategory,
      limitAmount: number
    ) => {
      await persistDataset((prev) => {
        const idx = prev.categoryBudgets.findIndex(
          (cb) => cb.monthKey === monthKey && cb.category === category
        );
        const updated = [...prev.categoryBudgets];
        if (idx >= 0) {
          updated[idx] = { ...updated[idx], limitAmount };
        } else {
          updated.push({
            id: createUuid(),
            monthKey,
            category,
            limitAmount,
          });
        }
        return { ...prev, categoryBudgets: updated };
      });
      showToast(`Saved ${category} limit.`, "success");
    },
    [persistDataset, showToast]
  );

  const addSavingsGoal = useCallback(
    async (
      goal: Omit<SavingsGoal, "id" | "createdAt" | "savedAmount"> & {
        savedAmount?: number;
      }
    ) => {
      const created: SavingsGoal = {
        id: createUuid(),
        title: goal.title,
        targetAmount: goal.targetAmount,
        savedAmount: goal.savedAmount ?? 0,
        deadline: goal.deadline,
        category: goal.category || "Personal",
        createdAt: new Date().toISOString(),
      };
      await persistDataset((prev) => ({
        ...prev,
        savingsGoals: [created, ...prev.savingsGoals],
      }));
      showToast(`Created goal "${created.title}".`, "success");
    },
    [persistDataset, showToast]
  );

  const contributeToGoal = useCallback(
    async (goalId: string, amount: number, note?: string) => {
      await persistDataset((prev) => ({
        ...prev,
        savingsGoals: prev.savingsGoals.map((g) =>
          g.id === goalId ? { ...g, savedAmount: g.savedAmount + amount } : g
        ),
        savingsContributions: [
          {
            id: createUuid(),
            goalId,
            amount,
            note: note || "Manual contribution",
            contributedAt: new Date().toISOString(),
          },
          ...prev.savingsContributions,
        ],
      }));
      showToast(`Added ₹${amount} to your savings goal!`, "success");
    },
    [persistDataset, showToast]
  );

  const deleteSavingsGoal = useCallback(
    async (goalId: string) => {
      await persistDataset((prev) => ({
        ...prev,
        savingsGoals: prev.savingsGoals.filter((g) => g.id !== goalId),
        savingsContributions: prev.savingsContributions.filter(
          (c) => c.goalId !== goalId
        ),
      }));
      showToast("Savings goal deleted.", "info");
    },
    [persistDataset, showToast]
  );

  const addSharedBill = useCallback(
    async (bill: Omit<SharedBill, "id" | "createdAt">) => {
      const created: SharedBill = {
        ...bill,
        id: createUuid(),
        createdAt: new Date().toISOString(),
      };
      await persistDataset((prev) => ({
        ...prev,
        sharedBills: [created, ...prev.sharedBills],
      }));
      showToast(`Saved split bill "${created.title}".`, "success");
    },
    [persistDataset, showToast]
  );

  const markBillAddedToPersonal = useCallback(
    async (billId: string, myShare: number) => {
      const targetBill = dataset?.sharedBills.find((b) => b.id === billId);
      if (!targetBill || targetBill.addedToPersonal) return;

      const personalExpense: Expense = {
        id: createUuid(),
        title: `${targetBill.title} (My Split Share)`,
        amount: myShare,
        category: "Food",
        transactionDate: targetBill.billDate,
        paymentMethod: "UPI",
        notes: `Split from shared bill (Total ₹${targetBill.totalAmount})`,
        source: "split_bill",
        createdAt: new Date().toISOString(),
      };

      await persistDataset((prev) => ({
        ...prev,
        sharedBills: prev.sharedBills.map((b) =>
          b.id === billId ? { ...b, addedToPersonal: true } : b
        ),
        expenses: [personalExpense, ...prev.expenses],
      }));
      showToast(`Added your ₹${myShare} share to Personal Expenses.`, "success");
    },
    [dataset, persistDataset, showToast]
  );

  const deleteSharedBill = useCallback(
    async (billId: string) => {
      await persistDataset((prev) => ({
        ...prev,
        sharedBills: prev.sharedBills.filter((b) => b.id !== billId),
      }));
      showToast("Split bill record removed.", "info");
    },
    [persistDataset, showToast]
  );

  const dismissAlert = useCallback(
    async (alertKey: string) => {
      await persistDataset((prev) => ({
        ...prev,
        alerts: prev.alerts.map((a) =>
          a.alertKey === alertKey ? { ...a, dismissed: true } : a
        ),
      }));
    },
    [persistDataset]
  );

  const toggleNoSpendDate = useCallback(
    async (dateStr: string) => {
      await persistDataset((prev) => {
        const exists = prev.challenges.noSpendDates.includes(dateStr);
        return {
          ...prev,
          challenges: {
            ...prev.challenges,
            noSpendDates: exists
              ? prev.challenges.noSpendDates.filter((d) => d !== dateStr)
              : [...prev.challenges.noSpendDates, dateStr],
          },
        };
      });
    },
    [persistDataset]
  );

  const incrementSmartWeekChallenge = useCallback(async () => {
    await persistDataset((prev) => ({
      ...prev,
      challenges: {
        ...prev.challenges,
        smartSpendWeekCount: Math.min(
          7,
          prev.challenges.smartSpendWeekCount + 1
        ),
      },
    }));
  }, [persistDataset]);

  const toggleSave500Challenge = useCallback(async () => {
    await persistDataset((prev) => ({
      ...prev,
      challenges: {
        ...prev.challenges,
        save500Completed: !prev.challenges.save500Completed,
      },
    }));
  }, [persistDataset]);

  const updateProfile = useCallback(
    async (updates: {
      fullName: string;
      monthlyPocketMoney: number;
      savingsTarget: number;
      onboardingCompleted?: boolean;
      teamMembers?: TeamMember[];
    }) => {
      await persistDataset((prev) => {
        const currentMonth = getCurrentMonthKey();
        const hasCurrent = prev.monthlyBudgets.some(
          (b) => b.monthKey === currentMonth
        );
        const monthlyBudgets = hasCurrent
          ? prev.monthlyBudgets.map((b) =>
              b.monthKey === currentMonth
                ? {
                    ...b,
                    pocketMoney: updates.monthlyPocketMoney,
                    savingsTarget: updates.savingsTarget,
                  }
                : b
            )
          : [
              ...prev.monthlyBudgets,
              {
                id: `mb-${currentMonth}`,
                monthKey: currentMonth,
                pocketMoney: updates.monthlyPocketMoney,
                savingsTarget: updates.savingsTarget,
              },
            ];

        return {
          ...prev,
          monthlyBudgets,
          profile: {
            ...prev.profile,
            fullName: updates.fullName,
            monthlyPocketMoney: updates.monthlyPocketMoney,
            savingsTarget: updates.savingsTarget,
            onboardingCompleted:
              updates.onboardingCompleted ?? prev.profile.onboardingCompleted,
            teamMembers: updates.teamMembers ?? prev.profile.teamMembers,
          },
        };
      });
      showToast("Profile updated.", "success");
    },
    [persistDataset, showToast]
  );

  const resetUserFinancialData = useCallback(async () => {
    if (mode === "demo") {
      resetDemoData();
      return;
    }
    const res = await fetch("/api/user/data?scope=reset", { method: "DELETE" });
    if (res.ok) {
      const json = await res.json();
      setDataset(json.dataset);
      showToast("All financial records cleared.", "info");
    } else {
      showToast("Could not reset records.", "error");
    }
  }, [mode, resetDemoData, showToast]);

  const deleteUserAccount = useCallback(async () => {
    if (mode === "demo") {
      resetDemoData();
      return true;
    }
    const res = await fetch("/api/user/data?scope=account", {
      method: "DELETE",
    });
    if (res.ok) {
      setDataset(null);
      showToast("Your account and data have been permanently deleted.", "info");
      return true;
    }
    showToast("Failed to delete account.", "error");
    return false;
  }, [mode, resetDemoData, showToast]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setDataset(null);
    showToast("Logged out safely.", "info");
  }, [showToast]);

  return (
    <AppDataContext.Provider
      value={{
        mode,
        setMode,
        dataset,
        loading,
        saving,
        selectedMonth,
        setSelectedMonth,
        capabilities,
        refreshUserSession,
        resetDemoData,
        addExpense,
        updateExpense,
        deleteExpense,
        updateMonthlyBudget,
        setCategoryLimit,
        addSavingsGoal,
        contributeToGoal,
        deleteSavingsGoal,
        addSharedBill,
        markBillAddedToPersonal,
        deleteSharedBill,
        dismissAlert,
        toggleNoSpendDate,
        incrementSmartWeekChallenge,
        toggleSave500Challenge,
        updateProfile,
        resetUserFinancialData,
        deleteUserAccount,
        logout,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}
