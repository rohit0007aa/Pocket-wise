"use client";

import React, { useMemo, useState } from "react";
import {
  Check,
  Copy,
  Plus,
  Receipt,
  Trash2,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { useAppData } from "@/components/AppDataProvider";
import { useToast } from "@/components/ToastProvider";
import { formatINR, getLocalDateString } from "@/lib/finance";
import type { SharedBill, SplitParticipant } from "@/lib/types";

interface DraftParticipant {
  id: string;
  name: string;
  customAmount: string;
  isCurrentUser: boolean;
}

export function SplitExpensesView() {
  const {
    dataset,
    addSharedBill,
    markBillAddedToPersonal,
    deleteSharedBill,
  } = useAppData();
  const { showToast } = useToast();

  const defaultUserName =
    dataset?.profile.fullName.split(" ")[0]
      ? `${dataset.profile.fullName.split(" ")[0]} (You)`
      : "You";

  const [title, setTitle] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [billDate, setBillDate] = useState(getLocalDateString());
  const [splitMode, setSplitMode] = useState<"equal" | "custom">("equal");
  const [participants, setParticipants] = useState<DraftParticipant[]>([
    { id: "p-1", name: defaultUserName, customAmount: "", isCurrentUser: true },
    { id: "p-2", name: "Roommate 1", customAmount: "", isCurrentUser: false },
    { id: "p-3", name: "Roommate 2", customAmount: "", isCurrentUser: false },
  ]);
  const [paidBy, setPaidBy] = useState(defaultUserName);
  const [saving, setSaving] = useState(false);

  const numericTotal = Number(totalAmount) || 0;

  const computedParticipants: SplitParticipant[] = useMemo(() => {
    const count = participants.length;
    if (count === 0) return [];
    if (splitMode === "equal") {
      const base =
        numericTotal > 0 ? Math.floor((numericTotal * 100) / count) / 100 : 0;
      let remainderCents = Math.round(numericTotal * 100) - Math.round(base * 100) * count;
      return participants.map((p) => {
        const extra = remainderCents > 0 ? 0.01 : 0;
        if (remainderCents > 0) remainderCents -= 1;
        return {
          name: p.name.trim() || "Friend",
          amount: Math.round((base + extra) * 100) / 100,
          isCurrentUser: p.isCurrentUser,
        };
      });
    }

    return participants.map((p) => ({
      name: p.name.trim() || "Friend",
      amount: Math.max(0, Number(p.customAmount) || 0),
      isCurrentUser: p.isCurrentUser,
    }));
  }, [participants, splitMode, numericTotal]);

  const customSum = computedParticipants.reduce((s, p) => s + p.amount, 0);
  const customDiff = Math.round((numericTotal - customSum) * 100) / 100;

  if (!dataset) return null;

  const addParticipant = () => {
    setParticipants((prev) => [
      ...prev,
      {
        id: `p-${Date.now()}-${prev.length}`,
        name: `Friend ${prev.length}`,
        customAmount: "",
        isCurrentUser: false,
      },
    ]);
  };

  const removeParticipant = (id: string) => {
    if (participants.length <= 2) {
      showToast("At least 2 participants are needed to split a bill.", "info");
      return;
    }
    const target = participants.find((p) => p.id === id);
    const remaining = participants.filter((p) => p.id !== id);
    if (target?.isCurrentUser && remaining.length > 0) {
      remaining[0].isCurrentUser = true;
    }
    if (target && paidBy === target.name && remaining.length > 0) {
      setPaidBy(remaining[0].name);
    }
    setParticipants(remaining);
  };

  const balanceLastCustom = () => {
    if (participants.length === 0 || numericTotal <= 0) return;
    const lastIdx = participants.length - 1;
    const sumBeforeLast = participants
      .slice(0, lastIdx)
      .reduce((s, p) => s + (Number(p.customAmount) || 0), 0);
    const rem = Math.max(0, Math.round((numericTotal - sumBeforeLast) * 100) / 100);
    setParticipants((prev) =>
      prev.map((p, idx) =>
        idx === lastIdx ? { ...p, customAmount: String(rem) } : p
      )
    );
  };

  const buildSummaryText = (bill: {
    title: string;
    totalAmount: number;
    paidBy: string;
    billDate: string;
    participants: SplitParticipant[];
  }) => {
    const lines = [
      `PocketWise AI Split Summary — ${bill.title}`,
      `Date: ${bill.billDate} | Total: ${formatINR(bill.totalAmount)} | Paid by: ${bill.paidBy}`,
      "---",
      ...bill.participants.map((p) =>
        p.name === bill.paidBy
          ? `• ${p.name}: Paid ${formatINR(bill.totalAmount)} (own share ${formatINR(p.amount)})`
          : `• ${p.name} owes ${bill.paidBy}: ${formatINR(p.amount)}`
      ),
    ];
    return lines.join("\n");
  };

  const copySummary = async (bill: {
    title: string;
    totalAmount: number;
    paidBy: string;
    billDate: string;
    participants: SplitParticipant[];
  }) => {
    const text = buildSummaryText(bill);
    try {
      await navigator.clipboard.writeText(text);
      showToast("Split summary copied to clipboard!", "success");
    } catch {
      showToast("Could not access clipboard. Select and copy manually.", "info");
    }
  };

  const handleSaveBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 2) {
      showToast("Please enter a shared bill description.", "error");
      return;
    }
    if (numericTotal <= 0) {
      showToast("Bill total must be greater than ₹0.", "error");
      return;
    }
    if (splitMode === "custom" && Math.abs(customDiff) > 0.05) {
      showToast(
        `Custom shares must equal ${formatINR(numericTotal)} (difference: ${formatINR(customDiff)}).`,
        "error"
      );
      return;
    }

    setSaving(true);
    try {
      await addSharedBill({
        title: title.trim(),
        totalAmount: Math.round(numericTotal * 100) / 100,
        paidBy,
        splitMode,
        participants: computedParticipants,
        addedToPersonal: false,
        billDate,
      });
      setTitle("");
      setTotalAmount("");
    } finally {
      setSaving(false);
    }
  };

  const getMyShare = (bill: SharedBill): number => {
    const me = bill.participants.find((p) => p.isCurrentUser);
    return me ? me.amount : 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold flex items-center gap-2.5">
            <Users className="w-7 h-7 text-[#40E8A1]" />
            Roommate & Friend Expense Splitter
          </h1>
          <p className="text-xs text-[#91A99B] mt-1">
            Split hostel food, cabs, or outings fairly. Shared bills stay
            separate from your personal expenses unless you add your own share.
          </p>
        </div>
        <span className="rounded-full border border-[#40E8A1]/25 bg-[#0D2017] px-3 py-1 text-[11px] text-[#91A99B] self-start">
          Calculation & Summary Tool (No Payment Transfers)
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Bill Calculator Form */}
        <form
          onSubmit={handleSaveBill}
          className="pw-card rounded-3xl p-6 lg:col-span-6 space-y-4"
        >
          <h2 className="font-heading text-lg font-bold">Create Shared Bill</h2>

          <div>
            <label className="block text-xs font-medium text-[#91A99B] mb-1.5">
              Bill Description *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Hostel Dinner or Sitapura Auto"
              className="pw-input"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#91A99B] mb-1.5">
                Total Bill Amount (₹) *
              </label>
              <input
                type="number"
                min={1}
                step="0.01"
                required
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="600"
                className="pw-input"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#91A99B] mb-1.5">
                Bill Date
              </label>
              <input
                type="date"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
                className="pw-input"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#91A99B] mb-1.5">
                Paid By
              </label>
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="pw-input"
              >
                {participants.map((p) => (
                  <option key={p.id} value={p.name} className="bg-[#0D2017]">
                    {p.name || "Friend"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#91A99B] mb-1.5">
                Split Mode
              </label>
              <div className="flex rounded-xl bg-[#071510] p-1 border border-[#40E8A1]/20">
                <button
                  type="button"
                  onClick={() => setSplitMode("equal")}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
                    splitMode === "equal"
                      ? "bg-[#40E8A1] text-[#071510]"
                      : "text-[#91A99B]"
                  }`}
                >
                  Equal
                </button>
                <button
                  type="button"
                  onClick={() => setSplitMode("custom")}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
                    splitMode === "custom"
                      ? "bg-[#40E8A1] text-[#071510]"
                      : "text-[#91A99B]"
                  }`}
                >
                  Custom
                </button>
              </div>
            </div>
          </div>

          {/* Participants */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#F4F8F5]">
                Participants ({participants.length})
              </span>
              <button
                type="button"
                onClick={addParticipant}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#40E8A1] hover:underline"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add Person
              </button>
            </div>

            <div className="space-y-2">
              {participants.map((p, idx) => (
                <div
                  key={p.id}
                  className="flex flex-wrap sm:flex-nowrap items-center gap-2 rounded-2xl bg-[#071510]/75 border border-[#40E8A1]/12 p-2.5"
                >
                  <input
                    type="text"
                    value={p.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setParticipants((prev) =>
                        prev.map((item) =>
                          item.id === p.id ? { ...item, name: val } : item
                        )
                      );
                      if (paidBy === p.name) setPaidBy(val);
                    }}
                    placeholder="Name"
                    className="pw-input py-1.5 text-xs flex-1 min-w-[110px]"
                  />

                  <label className="inline-flex items-center gap-1 text-[11px] text-[#91A99B] shrink-0 cursor-pointer">
                    <input
                      type="radio"
                      name="isCurrentUser"
                      checked={p.isCurrentUser}
                      onChange={() =>
                        setParticipants((prev) =>
                          prev.map((item) => ({
                            ...item,
                            isCurrentUser: item.id === p.id,
                          }))
                        )
                      }
                      className="accent-[#40E8A1]"
                    />
                    You
                  </label>

                  {splitMode === "custom" ? (
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={p.customAmount}
                      onChange={(e) =>
                        setParticipants((prev) =>
                          prev.map((item) =>
                            item.id === p.id
                              ? { ...item, customAmount: e.target.value }
                              : item
                          )
                        )
                      }
                      placeholder="₹ Share"
                      className="pw-input py-1.5 text-xs w-24"
                    />
                  ) : (
                    <span className="text-xs font-semibold text-[#40E8A1] w-20 text-right shrink-0">
                      {formatINR(computedParticipants[idx]?.amount ?? 0, true)}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => removeParticipant(p.id)}
                    className="p-1.5 text-[#91A99B] hover:text-red-400"
                    aria-label="Remove participant"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {splitMode === "custom" && numericTotal > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#071510]/80 px-3 py-2 text-xs">
                <span
                  className={
                    Math.abs(customDiff) <= 0.05
                      ? "text-[#40E8A1]"
                      : "text-amber-300"
                  }
                >
                  {Math.abs(customDiff) <= 0.05
                    ? "Shares match total exactly."
                    : customDiff > 0
                    ? `Unassigned: ${formatINR(customDiff, true)}`
                    : `Over-assigned by: ${formatINR(Math.abs(customDiff), true)}`}
                </span>
                {Math.abs(customDiff) > 0.05 && (
                  <button
                    type="button"
                    onClick={balanceLastCustom}
                    className="text-[#D5FA72] hover:underline font-medium"
                  >
                    Auto-balance last share
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Live Who-Owes-Who Preview */}
          {numericTotal > 0 && (
            <div className="rounded-2xl bg-[#071510]/90 border border-[#40E8A1]/20 p-4 space-y-1.5 text-xs">
              <div className="font-semibold text-[#D5FA72] mb-1">
                Live Split Preview
              </div>
              {computedParticipants.map((p, idx) => (
                <div key={idx} className="flex justify-between">
                  <span className="text-[#91A99B]">
                    {p.name === paidBy
                      ? `${p.name} (paid bill)`
                      : `${p.name} owes ${paidBy}`}
                  </span>
                  <span className="font-semibold text-[#F4F8F5]">
                    {formatINR(p.amount, true)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="button"
              onClick={() =>
                copySummary({
                  title: title.trim() || "Shared Expense",
                  totalAmount: numericTotal,
                  paidBy,
                  billDate,
                  participants: computedParticipants,
                })
              }
              disabled={numericTotal <= 0}
              className="pw-btn-secondary text-xs"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy Summary
            </button>
            <button
              type="submit"
              disabled={saving}
              className="pw-btn-primary flex-1 text-xs"
            >
              <Plus className="w-4 h-4" />
              {saving ? "Saving..." : "Save Shared Bill"}
            </button>
          </div>
        </form>

        {/* Saved Shared Bills List */}
        <div className="pw-card rounded-3xl p-6 lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold">
              Saved Shared Bills ({dataset.sharedBills.length})
            </h2>
          </div>

          {dataset.sharedBills.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#40E8A1]/20 p-10 text-center text-xs text-[#91A99B] space-y-2">
              <Receipt className="w-8 h-8 mx-auto text-[#91A99B]/50" />
              <p>
                No shared bills saved yet. Use the calculator on the left to
                split a group bill.
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[640px] overflow-y-auto pr-1">
              {dataset.sharedBills.map((bill) => {
                const myShare = getMyShare(bill);
                return (
                  <div
                    key={bill.id}
                    className="rounded-2xl bg-[#071510]/80 border border-[#40E8A1]/15 p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-heading font-bold text-[#F4F8F5]">
                          {bill.title}
                        </h3>
                        <p className="text-[11px] text-[#91A99B]">
                          {bill.billDate} • Paid by {bill.paidBy} •{" "}
                          {bill.splitMode === "equal" ? "Equal Split" : "Custom Split"}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-heading text-lg font-bold text-[#D5FA72]">
                          {formatINR(bill.totalAmount)}
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteSharedBill(bill.id)}
                          className="text-[11px] text-[#91A99B] hover:text-red-400"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="rounded-xl bg-[#0D2017]/80 p-3 space-y-1 text-xs">
                      {bill.participants.map((p, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span className="text-[#91A99B]">
                            {p.name === bill.paidBy
                              ? `${p.name} (payer share)`
                              : `${p.name} owes ${bill.paidBy}`}
                          </span>
                          <span className="font-medium text-[#F4F8F5]">
                            {formatINR(p.amount, true)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => copySummary(bill)}
                        className="pw-btn-secondary py-1.5 px-3 text-xs"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Copy Summary
                      </button>

                      {myShare > 0 && (
                        <button
                          type="button"
                          disabled={bill.addedToPersonal}
                          onClick={() =>
                            markBillAddedToPersonal(bill.id, myShare)
                          }
                          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                            bill.addedToPersonal
                              ? "bg-[#40E8A1]/15 text-[#40E8A1] border border-[#40E8A1]/30 cursor-default"
                              : "bg-[#40E8A1] text-[#071510] hover:bg-[#5ef0b3]"
                          }`}
                        >
                          {bill.addedToPersonal ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              Share ({formatINR(myShare)}) Added to Personal
                            </>
                          ) : (
                            <>
                              <Wallet className="w-3.5 h-3.5" />
                              Add My Share ({formatINR(myShare)}) to Personal
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
