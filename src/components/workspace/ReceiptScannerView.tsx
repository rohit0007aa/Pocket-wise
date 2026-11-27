"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  FileImage,
  Loader2,
  Receipt,
  Sparkles,
  Upload,
} from "lucide-react";
import { useAppData } from "@/components/AppDataProvider";
import { useToast } from "@/components/ToastProvider";
import {
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  SAMPLE_RECEIPTS,
} from "@/lib/constants";
import type { ExpenseCategory, PaymentMethod } from "@/lib/types";

interface ExtractedReceiptForm {
  sourceMode: "ai_live" | "preset_sample";
  model?: string;
  merchantName: string;
  totalAmount: string;
  transactionDate: string;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  items: Array<{ name: string; qty?: number; price?: number }>;
  notes: string;
}

export function ReceiptScannerView() {
  const { addExpense, capabilities } = useAppData();
  const { showToast } = useToast();

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<ExtractedReceiptForm | null>(null);
  const [saving, setSaving] = useState(false);

  const handleFileChange = async (file: File | null) => {
    if (!file) return;
    setErrorMsg(null);
    setExtracted(null);
    setSelectedSampleId(null);

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setErrorMsg(
        "Invalid file type. Please upload a JPG, PNG, or WebP receipt image."
      );
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("File exceeds 5 MB limit. Please choose a smaller image.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result || "");
      setPreviewUrl(dataUrl);
      const base64 = dataUrl.split(",")[1] || "";

      setScanning(true);
      try {
        const res = await fetch("/api/ai/receipt-scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: base64,
            mimeType: file.type,
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          setErrorMsg(json.error || "Could not extract receipt details.");
          return;
        }
        const itemsList = Array.isArray(json.items) ? json.items : [];
        const itemsSummary = itemsList
          .map((it: { name: string; price?: number }) =>
            it.price ? `${it.name} (₹${it.price})` : it.name
          )
          .join(", ");

        setExtracted({
          sourceMode: "ai_live",
          model: json.model,
          merchantName: json.merchantName || "",
          totalAmount: String(json.totalAmount || ""),
          transactionDate:
            json.transactionDate || new Date().toISOString().slice(0, 10),
          category: json.category || "Other",
          paymentMethod: json.paymentMethod || "UPI",
          items: itemsList,
          notes: itemsSummary ? `Items: ${itemsSummary}` : "",
        });
        showToast("Receipt extracted! Please review before saving.", "info");
      } catch {
        setErrorMsg("Network error while scanning receipt.");
      } finally {
        setScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSampleScan = async (sampleId: string) => {
    setErrorMsg(null);
    setPreviewUrl(null);
    setSelectedSampleId(sampleId);
    setScanning(true);
    try {
      const res = await fetch("/api/ai/receipt-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sampleId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.error || "Failed to load sample receipt.");
        return;
      }
      const itemsList = Array.isArray(json.items) ? json.items : [];
      const itemsSummary = itemsList
        .map((it: { name: string; price?: number }) =>
          it.price ? `${it.name} (₹${it.price})` : it.name
        )
        .join(", ");

      setExtracted({
        sourceMode: "preset_sample",
        merchantName: json.merchantName,
        totalAmount: String(json.totalAmount),
        transactionDate: json.transactionDate,
        category: json.category,
        paymentMethod: json.paymentMethod,
        items: itemsList,
        notes: itemsSummary ? `Sample items: ${itemsSummary}` : "",
      });
    } finally {
      setScanning(false);
    }
  };

  const handleConfirmSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extracted) return;
    const amt = Number(extracted.totalAmount);
    if (!extracted.merchantName.trim() || !Number.isFinite(amt) || amt <= 0) {
      setErrorMsg("Merchant title and a positive amount are required.");
      return;
    }

    setSaving(true);
    try {
      await addExpense({
        title: extracted.merchantName.trim(),
        amount: Math.round(amt * 100) / 100,
        category: extracted.category,
        transactionDate: extracted.transactionDate,
        paymentMethod: extracted.paymentMethod,
        notes: extracted.notes,
        source:
          extracted.sourceMode === "ai_live" ? "receipt_ai" : "receipt_sample",
      });
      setExtracted(null);
      setPreviewUrl(null);
      setSelectedSampleId(null);
    } finally {
      setSaving(false);
    }
  };

  const activeSample = SAMPLE_RECEIPTS.find((s) => s.id === selectedSampleId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold">
            AI Receipt Scanner
          </h1>
          <p className="text-xs text-[#91A99B] mt-1">
            Upload a canteen bill, metro ticket, or shopping invoice. Uploaded
            images are processed in memory and never stored permanently.
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold border self-start ${
            capabilities.aiConfigured
              ? "bg-[#40E8A1]/15 text-[#40E8A1] border-[#40E8A1]/30"
              : "bg-amber-400/15 text-amber-300 border-amber-400/30"
          }`}
        >
          {capabilities.aiConfigured
            ? `Live Multimodal AI (${capabilities.aiModel})`
            : "Live Vision Requires GEMINI_API_KEY (Samples Ready)"}
        </span>
      </div>

      {/* Three Fictional Sample Receipts */}
      <div className="pw-card rounded-3xl p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#F4F8F5]">
            <Sparkles className="w-4 h-4 text-[#D5FA72]" />
            Test with Preset Fictional Sample Receipts
          </div>
          <span className="text-[11px] text-[#91A99B]">
            Clearly labeled preset demonstrations for classroom evaluation
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {SAMPLE_RECEIPTS.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => handleSampleScan(sample.id)}
              className={`text-left rounded-2xl border p-4 transition ${
                selectedSampleId === sample.id
                  ? "border-[#40E8A1] bg-[#40E8A1]/10"
                  : "border-[#40E8A1]/15 bg-[#071510]/70 hover:border-[#40E8A1]/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#40E8A1]">
                  {sample.category}
                </span>
                <span className="text-xs font-bold text-[#D5FA72]">
                  ₹{sample.totalAmount}
                </span>
              </div>
              <div className="font-heading text-sm font-bold text-[#F4F8F5] mt-1">
                {sample.label}
              </div>
              <div className="text-[11px] text-[#91A99B] mt-0.5">
                {sample.subtitle}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Scanner Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Upload / Preview Panel */}
        <div className="pw-card rounded-3xl p-6 lg:col-span-5 space-y-4">
          <h2 className="font-heading text-lg font-bold flex items-center gap-2">
            <Camera className="w-4 h-4 text-[#40E8A1]" />
            Upload Receipt Image
          </h2>

          <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#40E8A1]/30 bg-[#071510]/65 p-8 text-center cursor-pointer hover:border-[#40E8A1] hover:bg-[#071510]/90 transition">
            <Upload className="w-8 h-8 text-[#40E8A1] mb-3" />
            <span className="text-sm font-semibold text-[#F4F8F5]">
              Click to upload receipt photo
            </span>
            <span className="text-xs text-[#91A99B] mt-1">
              JPG, PNG, or WebP • Max 5 MB
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
            />
          </label>

          {scanning && (
            <div className="rounded-2xl border border-[#40E8A1]/30 bg-[#40E8A1]/10 p-4 flex items-center gap-3 text-xs text-[#40E8A1]">
              <Loader2 className="w-5 h-5 animate-spin shrink-0" />
              <span>Analyzing receipt fields securely on the server...</span>
            </div>
          )}

          {errorMsg && (
            <div className="rounded-2xl border border-red-400/35 bg-red-500/10 p-4 flex items-start gap-2.5 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {previewUrl && (
            <div className="space-y-2">
              <div className="text-xs text-[#91A99B] flex items-center gap-1.5">
                <FileImage className="w-3.5 h-3.5" />
                In-memory preview (not stored permanently)
              </div>
              <img
                src={previewUrl}
                alt="Uploaded receipt preview"
                className="max-h-64 w-full object-contain rounded-2xl border border-[#40E8A1]/20 bg-[#071510]"
              />
            </div>
          )}

          {activeSample && (
            <div className="rounded-2xl border border-[#D5FA72]/30 bg-[#071510] p-4 font-mono text-[11px] text-[#F4F8F5]/90 space-y-1">
              <div className="text-[#D5FA72] font-sans font-semibold text-xs mb-2">
                Fictional Sample Bill Preview
              </div>
              {activeSample.rawReceiptLines.map((line, idx) => (
                <div key={idx} className="whitespace-pre-wrap">
                  {line}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Editable Confirmation Form */}
        <div className="pw-card rounded-3xl p-6 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h2 className="font-heading text-lg font-bold flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#D5FA72]" />
              Review & Confirm Extracted Expense
            </h2>
            {extracted && (
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                  extracted.sourceMode === "ai_live"
                    ? "bg-[#40E8A1]/15 text-[#40E8A1] border border-[#40E8A1]/30"
                    : "bg-[#D5FA72]/15 text-[#D5FA72] border border-[#D5FA72]/30"
                }`}
              >
                {extracted.sourceMode === "ai_live"
                  ? `Real AI Extraction (${extracted.model})`
                  : "Preset Demonstration Result (Sample)"}
              </span>
            )}
          </div>

          {!extracted ? (
            <div className="h-72 flex flex-col items-center justify-center text-center border border-dashed border-[#40E8A1]/20 rounded-2xl p-6 text-xs text-[#91A99B]">
              <Receipt className="w-8 h-8 text-[#91A99B]/60 mb-2" />
              <p className="max-w-sm">
                Upload a receipt image or select one of the 3 preset sample
                receipts above. Extracted fields will appear here for your
                review before anything is saved.
              </p>
            </div>
          ) : (
            <form onSubmit={handleConfirmSave} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#91A99B] mb-1.5">
                    Merchant / Expense Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={extracted.merchantName}
                    onChange={(e) =>
                      setExtracted({
                        ...extracted,
                        merchantName: e.target.value,
                      })
                    }
                    className="pw-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#91A99B] mb-1.5">
                    Total Amount (₹) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    step="0.01"
                    required
                    value={extracted.totalAmount}
                    onChange={(e) =>
                      setExtracted({
                        ...extracted,
                        totalAmount: e.target.value,
                      })
                    }
                    className="pw-input"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#91A99B] mb-1.5">
                    Transaction Date
                  </label>
                  <input
                    type="date"
                    required
                    value={extracted.transactionDate}
                    onChange={(e) =>
                      setExtracted({
                        ...extracted,
                        transactionDate: e.target.value,
                      })
                    }
                    className="pw-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#91A99B] mb-1.5">
                    Suggested Category
                  </label>
                  <select
                    value={extracted.category}
                    onChange={(e) =>
                      setExtracted({
                        ...extracted,
                        category: e.target.value as ExpenseCategory,
                      })
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
                    value={extracted.paymentMethod}
                    onChange={(e) =>
                      setExtracted({
                        ...extracted,
                        paymentMethod: e.target.value as PaymentMethod,
                      })
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

              {extracted.items.length > 0 && (
                <div className="rounded-2xl bg-[#071510]/80 border border-[#40E8A1]/15 p-3.5">
                  <div className="text-xs font-semibold text-[#91A99B] mb-2">
                    Extracted Line Items
                  </div>
                  <div className="space-y-1 text-xs">
                    {extracted.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="text-[#F4F8F5]">
                          {it.qty ? `${it.qty}x ` : ""}
                          {it.name}
                        </span>
                        {it.price !== undefined && (
                          <span className="text-[#40E8A1]">₹{it.price}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#91A99B] mb-1.5">
                  Notes
                </label>
                <input
                  type="text"
                  value={extracted.notes}
                  onChange={(e) =>
                    setExtracted({ ...extracted, notes: e.target.value })
                  }
                  className="pw-input"
                />
              </div>

              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setExtracted(null)}
                  className="pw-btn-secondary"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="pw-btn-primary"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {saving ? "Saving..." : "Confirm & Save Expense"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
