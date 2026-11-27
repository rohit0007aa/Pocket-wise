"use client";

import React, { useMemo, useState } from "react";
import {
  Download,
  Edit3,
  Filter,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useAppData } from "@/components/AppDataProvider";
import { useToast } from "@/components/ToastProvider";
import { CATEGORY_COLORS, EXPENSE_CATEGORIES } from "@/lib/constants";
import { formatINR, formatMonthLabel, getMonthExpenses } from "@/lib/finance";
import type { Expense } from "@/lib/types";

interface ExpensesViewProps {
  onAddExpense: () => void;
  onEditExpense: (exp: Expense) => void;
}

export function ExpensesView({
  onAddExpense,
  onEditExpense,
}: ExpensesViewProps) {
  const { dataset, selectedMonth, deleteExpense } = useAppData();
  const { showToast } = useToast();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showAllMonths, setShowAllMonths] = useState(false);
  const [confirmDeleteExp, setConfirmDeleteExp] = useState<Expense | null>(
    null
  );

  const baseExpenses = useMemo(() => {
    if (!dataset) return [];
    if (showAllMonths) {
      return [...dataset.expenses].sort((a, b) =>
        b.transactionDate.localeCompare(a.transactionDate)
      );
    }
    return getMonthExpenses(dataset, selectedMonth);
  }, [dataset, selectedMonth, showAllMonths]);

  const filteredExpenses = useMemo(() => {
    return baseExpenses.filter((exp) => {
      if (categoryFilter !== "ALL" && exp.category !== categoryFilter) {
        return false;
      }
      if (dateFrom && exp.transactionDate < dateFrom) return false;
      if (dateTo && exp.transactionDate > dateTo) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          exp.title.toLowerCase().includes(q) ||
          exp.category.toLowerCase().includes(q) ||
          (exp.notes || "").toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [baseExpenses, categoryFilter, dateFrom, dateTo, search]);

  const totalFiltered = filteredExpenses.reduce((s, e) => s + e.amount, 0);

  const exportCSV = () => {
    if (filteredExpenses.length === 0) {
      showToast("No expenses to export.", "info");
      return;
    }
    const headers = [
      "Date",
      "Title",
      "Category",
      "Amount (INR)",
      "Payment Method",
      "Notes",
    ];
    const escapeCell = (val: string | number) => {
      const s = String(val ?? "").replace(/"/g, '""');
      return `"${s}"`;
    };
    const rows = filteredExpenses.map((e) =>
      [
        e.transactionDate,
        e.title,
        e.category,
        e.amount,
        e.paymentMethod,
        e.notes || "",
      ]
        .map(escapeCell)
        .join(",")
    );
    const csv = [headers.map(escapeCell).join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pocketwise-expenses-${
      showAllMonths ? "all" : selectedMonth
    }.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("CSV expense report downloaded.", "success");
  };

  const resetFilters = () => {
    setSearch("");
    setCategoryFilter("ALL");
    setDateFrom("");
    setDateTo("");
  };

  if (!dataset) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold">
            Expense Tracker
          </h1>
          <p className="text-xs text-[#91A99B] mt-1">
            {showAllMonths
              ? "Showing transactions across all months"
              : `Showing ${formatMonthLabel(selectedMonth)}`}
            {" • "}
            <span className="text-[#40E8A1] font-semibold">
              {filteredExpenses.length} items ({formatINR(totalFiltered)})
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button onClick={exportCSV} className="pw-btn-secondary text-xs py-2.5">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button onClick={onAddExpense} className="pw-btn-primary text-xs py-2.5">
            <Plus className="w-4 h-4" />
            Add Expense
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="pw-card rounded-3xl p-4 sm:p-5 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-[#91A99B] absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, category, or notes..."
              className="pw-input pl-10"
            />
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="pw-input"
              aria-label="Filter by category"
            >
              <option value="ALL" className="bg-[#0D2017]">
                All Categories
              </option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-[#0D2017]">
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="pw-input"
              aria-label="From date"
              title="From date"
            />
          </div>

          <div>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="pw-input"
              aria-label="To date"
              title="To date"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
          <label className="inline-flex items-center gap-2 text-[#91A99B] cursor-pointer">
            <input
              type="checkbox"
              checked={showAllMonths}
              onChange={(e) => setShowAllMonths(e.target.checked)}
              className="accent-[#40E8A1]"
            />
            Include all months
          </label>

          {(search || categoryFilter !== "ALL" || dateFrom || dateTo) && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-[#D5FA72] hover:underline"
            >
              <Filter className="w-3.5 h-3.5" />
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Expense List */}
      {filteredExpenses.length === 0 ? (
        <div className="pw-card rounded-3xl p-10 text-center space-y-3">
          <p className="text-sm font-medium text-[#F4F8F5]">
            No matching expenses found
          </p>
          <p className="text-xs text-[#91A99B] max-w-md mx-auto">
            Try clearing your filters, switching months, or record a new
            expense to start tracking.
          </p>
          <div className="pt-2">
            <button onClick={onAddExpense} className="pw-btn-primary text-xs">
              <Plus className="w-4 h-4" />
              Record Expense
            </button>
          </div>
        </div>
      ) : (
        <div className="pw-card rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#40E8A1]/15 bg-[#071510]/60 text-xs uppercase text-[#91A99B]">
                <tr>
                  <th className="px-5 py-3.5">Expense</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5">Method</th>
                  <th className="px-4 py-3.5 text-right">Amount</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#40E8A1]/10">
                {filteredExpenses.map((exp) => (
                  <tr
                    key={exp.id}
                    className="hover:bg-[#14291E]/55 transition"
                  >
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-[#F4F8F5]">
                        {exp.title}
                      </div>
                      {exp.notes && (
                        <div className="text-xs text-[#91A99B] truncate max-w-xs">
                          {exp.notes}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border"
                        style={{
                          color: CATEGORY_COLORS[exp.category],
                          borderColor: `${CATEGORY_COLORS[exp.category]}40`,
                          backgroundColor: `${CATEGORY_COLORS[exp.category]}15`,
                        }}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{
                            backgroundColor: CATEGORY_COLORS[exp.category],
                          }}
                        />
                        {exp.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-[#91A99B] whitespace-nowrap">
                      {exp.transactionDate}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-[#91A99B]">
                      {exp.paymentMethod}
                    </td>
                    <td className="px-4 py-3.5 text-right font-heading font-bold text-[#F4F8F5] whitespace-nowrap">
                      {formatINR(exp.amount)}
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => onEditExpense(exp)}
                          className="rounded-lg p-1.5 text-[#91A99B] hover:bg-[#071510] hover:text-[#40E8A1] transition"
                          aria-label={`Edit ${exp.title}`}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteExp(exp)}
                          className="rounded-lg p-1.5 text-[#91A99B] hover:bg-red-500/10 hover:text-red-400 transition"
                          aria-label={`Delete ${exp.title}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteExp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="pw-card w-full max-w-md rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-lg font-bold text-[#F4F8F5]">
                Delete Expense?
              </h3>
              <button
                onClick={() => setConfirmDeleteExp(null)}
                className="text-[#91A99B] hover:text-[#F4F8F5]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#91A99B] leading-relaxed">
              Are you sure you want to delete{" "}
              <strong className="text-[#F4F8F5]">
                {confirmDeleteExp.title}
              </strong>{" "}
              ({formatINR(confirmDeleteExp.amount)})? This will immediately
              recalculate your budget and charts.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmDeleteExp(null)}
                className="pw-btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const id = confirmDeleteExp.id;
                  setConfirmDeleteExp(null);
                  await deleteExpense(id);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-xs font-semibold text-white hover:bg-red-600 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
