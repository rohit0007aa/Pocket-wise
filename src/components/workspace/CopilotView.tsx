"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowRight,
  Bot,
  Eye,
  EyeOff,
  Loader2,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useAppData } from "@/components/AppDataProvider";
import { buildSanitizedCopilotContext, formatINR } from "@/lib/finance";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  mode?: "ai" | "fallback";
  model?: string;
  fallbackReason?: string;
  suggestedActions?: string[];
}

const QUICK_QUESTIONS = [
  "Where is most of my money going?",
  "How can I save ₹500 this month?",
  "Can I afford a ₹300 movie ticket?",
  "Create a seven-day spending plan.",
  "Which expenses should I reduce?",
  "Will my pocket money last until month-end?",
];

function renderFormattedText(text: string) {
  const lines = text.split("\n");
  return lines.map((line, idx) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={idx} className={line.trim() === "" ? "h-2" : "leading-relaxed"}>
        {parts.map((part, pIdx) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong key={pIdx} className="font-semibold text-[#F4F8F5]">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return <React.Fragment key={pIdx}>{part}</React.Fragment>;
        })}
      </p>
    );
  });
}

function mapActionToTab(action: string): string {
  const lower = action.toLowerCase();
  if (lower.includes("simulator") || lower.includes("simulate")) return "simulator";
  if (lower.includes("analytics")) return "analytics";
  if (lower.includes("scanner") || lower.includes("receipt")) return "scanner";
  if (lower.includes("challenge") || lower.includes("goal")) return "goals";
  if (lower.includes("budget") || lower.includes("limit") || lower.includes("safe-to-spend"))
    return "budget";
  if (lower.includes("expense")) return "expenses";
  return "overview";
}

export function CopilotView({
  onNavigateTab,
}: {
  onNavigateTab: (tab: string) => void;
}) {
  const { dataset, selectedMonth, capabilities, mode } = useAppData();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showContextPreview, setShowContextPreview] = useState(false);

  const sanitizedContext = useMemo(() => {
    if (!dataset) return null;
    return buildSanitizedCopilotContext(dataset, selectedMonth);
  }, [dataset, selectedMonth]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  if (!dataset || !sanitizedContext) return null;

  const welcomeMessage: ChatMessage = {
    id: "welcome",
    role: "assistant",
    mode: capabilities.aiConfigured ? "ai" : "fallback",
    model: capabilities.aiModel,
    content: `Hi ${dataset.profile.fullName.split(" ")[0]}! I'm **PocketWise Copilot**.\n\nFor **${sanitizedContext.monthLabel}**, I see **${formatINR(sanitizedContext.totalExpenses)}** spent out of **${formatINR(sanitizedContext.monthlyBudget)}** (${sanitizedContext.utilizationPercent}% used), leaving **${formatINR(sanitizedContext.remainingBalance)}** and a Safe-to-Spend limit of **${formatINR(sanitizedContext.safeToSpendDaily)}/day**.\n\nAsk me any budgeting question below!`,
    suggestedActions: ["Open Savings Simulator", "View Analytics breakdown"],
  };

  const displayMessages =
    messages.length > 0 ? messages : [welcomeMessage];

  const sendQuestion = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || sending) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          context: sanitizedContext,
          history: nextHistory.slice(-6).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: "assistant",
            mode: "fallback",
            content: json.error || "Unable to reach PocketWise Copilot right now.",
          },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: "assistant",
          mode: json.mode,
          model: json.model,
          fallbackReason: json.fallbackReason,
          content: json.reply,
          suggestedActions: json.suggestedActions,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          mode: "fallback",
          content: "Network error while contacting Copilot. Please try again.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold flex items-center gap-2.5">
            <Bot className="w-7 h-7 text-[#40E8A1]" />
            PocketWise Copilot
          </h1>
          <p className="text-xs text-[#91A99B] mt-1">
            Personalized student guidance using deterministic INR calculations
            and privacy-minimized summaries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold border ${
              capabilities.aiConfigured
                ? "bg-[#40E8A1]/15 text-[#40E8A1] border-[#40E8A1]/30"
                : "bg-amber-400/15 text-amber-300 border-amber-400/30"
            }`}
          >
            {capabilities.aiConfigured
              ? `Live Gemini AI (${capabilities.aiModel})`
              : "Rule-Based Fallback Mode (No GEMINI_API_KEY)"}
          </span>
          <button
            type="button"
            onClick={() => setShowContextPreview((v) => !v)}
            className="pw-btn-secondary py-1.5 px-3 text-xs"
          >
            {showContextPreview ? (
              <EyeOff className="w-3.5 h-3.5" />
            ) : (
              <Eye className="w-3.5 h-3.5" />
            )}
            {showContextPreview ? "Hide AI Payload" : "Inspect AI Payload"}
          </button>
        </div>
      </div>

      {showContextPreview && (
        <div className="pw-card rounded-2xl p-4 space-y-2 border-[#40E8A1]/30">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#40E8A1]">
            <ShieldCheck className="w-4 h-4" />
            Sanitized Summary Sent to Copilot (No passwords, bank data, or raw
            PII)
          </div>
          <pre className="max-h-52 overflow-auto rounded-xl bg-[#071510] p-3 text-[11px] text-[#91A99B]">
            {JSON.stringify(sanitizedContext, null, 2)}
          </pre>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-12">
        {/* Left Live Financial Summary Context */}
        <div className="pw-card rounded-3xl p-5 lg:col-span-4 space-y-4 h-fit">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#91A99B]">
              {sanitizedContext.monthLabel} Snapshot
            </span>
            {mode === "demo" && (
              <span className="text-[10px] rounded-full bg-[#D5FA72]/15 text-[#D5FA72] px-2 py-0.5 font-medium">
                Demo Data
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-2xl bg-[#071510]/80 border border-[#40E8A1]/12 p-3">
              <div className="text-[#91A99B]">Pocket Money</div>
              <div className="font-heading text-base font-bold text-[#F4F8F5] mt-0.5">
                {formatINR(sanitizedContext.monthlyBudget)}
              </div>
            </div>
            <div className="rounded-2xl bg-[#071510]/80 border border-[#40E8A1]/12 p-3">
              <div className="text-[#91A99B]">Spent ({sanitizedContext.utilizationPercent}%)</div>
              <div className="font-heading text-base font-bold text-[#D5FA72] mt-0.5">
                {formatINR(sanitizedContext.totalExpenses)}
              </div>
            </div>
            <div className="rounded-2xl bg-[#071510]/80 border border-[#40E8A1]/12 p-3">
              <div className="text-[#91A99B]">Remaining</div>
              <div className="font-heading text-base font-bold text-[#40E8A1] mt-0.5">
                {formatINR(sanitizedContext.remainingBalance)}
              </div>
            </div>
            <div className="rounded-2xl bg-[#071510]/80 border border-[#40E8A1]/12 p-3">
              <div className="text-[#91A99B]">Safe / Day</div>
              <div className="font-heading text-base font-bold text-[#F4F8F5] mt-0.5">
                {formatINR(sanitizedContext.safeToSpendDaily)}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-[#F4F8F5]">
              Suggested Questions
            </div>
            <div className="flex flex-col gap-2">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={sending}
                  onClick={() => sendQuestion(q)}
                  className="text-left rounded-xl border border-[#40E8A1]/15 bg-[#071510]/70 px-3 py-2 text-xs text-[#91A99B] hover:border-[#40E8A1]/45 hover:text-[#F4F8F5] transition"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-[#91A99B]/80 border-t border-[#40E8A1]/10 pt-3 leading-relaxed">
            Educational budgeting disclaimer: PocketWise Copilot provides
            student expense guidance from your recorded entries. It does not
            guarantee savings or constitute regulated financial advice.
          </p>
        </div>

        {/* Right Chat Window */}
        <div className="pw-card rounded-3xl p-5 lg:col-span-8 flex flex-col min-h-[540px] max-h-[72vh]">
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {displayMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl p-4 text-xs sm:text-sm space-y-2 ${
                    msg.role === "user"
                      ? "bg-[#40E8A1] text-[#071510] font-medium"
                      : "bg-[#071510]/85 border border-[#40E8A1]/20 text-[#91A99B]"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-[#40E8A1]/10">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#40E8A1]">
                        <Sparkles className="w-3.5 h-3.5 text-[#D5FA72]" />
                        PocketWise Copilot
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          msg.mode === "ai"
                            ? "bg-[#40E8A1]/15 text-[#40E8A1]"
                            : "bg-amber-400/15 text-amber-300"
                        }`}
                      >
                        {msg.mode === "ai"
                          ? `AI (${msg.model || "Gemini"})`
                          : "Rule-Based Fallback"}
                      </span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    {msg.role === "user" ? (
                      <p>{msg.content}</p>
                    ) : (
                      renderFormattedText(msg.content)
                    )}
                  </div>

                  {msg.fallbackReason && (
                    <div className="text-[10px] text-amber-300/80">
                      Fallback note: {msg.fallbackReason}
                    </div>
                  )}

                  {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {msg.suggestedActions.map((act) => (
                        <button
                          key={act}
                          type="button"
                          onClick={() => onNavigateTab(mapActionToTab(act))}
                          className="inline-flex items-center gap-1 rounded-full border border-[#40E8A1]/30 bg-[#14291E] px-3 py-1 text-[11px] font-medium text-[#D5FA72] hover:bg-[#40E8A1]/15 transition"
                        >
                          {act}
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-[#40E8A1]/20 bg-[#071510]/85 px-4 py-3 text-xs text-[#40E8A1] inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing your {sanitizedContext.monthLabel} budget...
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendQuestion(input);
            }}
            className="mt-4 pt-4 border-t border-[#40E8A1]/12 flex items-center gap-2.5"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your budget, savings plan, or affordability..."
              className="pw-input flex-1"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="pw-btn-primary py-2.5 px-4 shrink-0"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Ask</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
