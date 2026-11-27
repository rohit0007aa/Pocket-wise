"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from "@/lib/constants";
import { getLocalDateString } from "@/lib/finance";
import type { Expense, ExpenseCategory, PaymentMethod } from "@/lib/types";

interface QuickAddExpenseModalProps {
  open: boolean;
  onClose: () => void;
  editingExpense?: Expense | null;
  onSave: (data: {
    id?: string;
    title: string;
    amount: number;
    category: ExpenseCategory;
    transactionDate: string;
    paymentMethod: PaymentMethod;
    notes: string;
  }) => Promise<void>;
}

export function QuickAddExpenseModal({
  open,
  onClose,
  editingExpense,
  onSave,
}: QuickAddExpenseModalProps) {
  const today = getLocalDateString();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("Food");
  const [transactionDate, setTransactionDate] = useState(today);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingExpense) {
      setTitle(editingExpense.title);
      setAmount(String(editingExpense.amount));
      setCategory(editingExpense.category);
      setTransactionDate(editingExpense.transactionDate);
      setPaymentMethod(editingExpense.paymentMethod);
      setNotes(editingExpense.notes || "");
    } else {
      setTitle("");
      setAmount("");
      setCategory("Food");
      setTransactionDate(today);
      setPaymentMethod("UPI");
      setNotes("");
    }
    setError("");
  }, [editingExpense, open, today]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const numAmount = Number(amount);
    if (title.trim().length < 2) {
      setError("Please enter an expense title (at least 2 characters).");
      return;
    }
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      setError("Amount must be greater than ₹0.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(transactionDate)) {
      setError("Please choose a valid transaction date.");
      return;
    }

    setSubmitting(true);
    try {
      await onSave({
        id: editingExpense?.id,
        title: title.trim(),
        amount: Math.round(numAmount * 100) / 100,
        category,
        transactionDate,
        paymentMethod,
        notes: notes.trim(),
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="expense-modal-title"
    >
      <div className="pw-card w-full max-w-lg rounded-3xl p-6 relative">
        <div className="flex items-center justify-between mb-5">
          <h2
            id="expense-modal-title"
            className="font-heading text-xl font-bold text-[#F4F8F5]"
          >
            {editingExpense ? "Edit Expense" : "Add New Expense"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-[#91A99B] hover:bg-[#071510] hover:text-[#F4F8F5]"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-400/35 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#91A99B] mb-1.5">
              Expense Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Campus Canteen Lunch"
              className="pw-input"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#91A99B] mb-1.5">
                Amount (₹) *
              </label>
              <input
                type="number"
                min={1}
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="150"
                className="pw-input"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#91A99B] mb-1.5">
                Transaction Date *
              </label>
              <input
                type="date"
                required
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="pw-input"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#91A99B] mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as ExpenseCategory)
                }
                className="pw-input"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-[#0D2017]">
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#91A99B] mb-1.5">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(e.target.value as PaymentMethod)
                }
                className="pw-input"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm} className="bg-[#0D2017]">
                    {pm}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#91A99B] mb-1.5">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any context (e.g., group study snacks)"
              className="pw-input resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="pw-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="pw-btn-primary"
            >
              {submitting
                ? "Saving..."
                : editingExpense
                ? "Update Expense"
                : "Save Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
