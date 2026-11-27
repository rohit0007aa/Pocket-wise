import { NextRequest, NextResponse } from "next/server";
import {
  generateRuleBasedCopilotReply,
  type SanitizedCopilotContext,
} from "@/lib/finance";
import { isGeminiConfigured } from "@/lib/server/storage";

interface CopilotHistoryItem {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = String(body.message ?? "").trim();
    const context = body.context as SanitizedCopilotContext | undefined;
    const history = Array.isArray(body.history)
      ? (body.history as CopilotHistoryItem[]).slice(-6)
      : [];

    if (!message) {
      return NextResponse.json(
        { error: "Please enter a question for PocketWise Copilot." },
        { status: 400 }
      );
    }
    if (!context || typeof context.monthlyBudget !== "number") {
      return NextResponse.json(
        { error: "Financial summary context is required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!isGeminiConfigured() || !apiKey) {
      const fallback = generateRuleBasedCopilotReply(message, context);
      return NextResponse.json({
        mode: "fallback",
        model: "rule-based-fallback",
        reply: fallback.reply,
        suggestedActions: fallback.suggestedActions,
      });
    }

    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const systemPrompt = `You are PocketWise Copilot, a practical, empathetic student financial assistant built for Indian college students (currency: Indian Rupees ₹).
CRITICAL RULES:
1. Use ONLY the deterministic monetary values provided in the FINANCIAL_SUMMARY JSON below. Never fabricate expenses, balances, or percentages, and never guarantee savings outcomes.
2. Give concise, actionable, student-friendly advice (hostel mess, campus canteen, metro/auto, stationery, impulse shopping).
3. Keep responses well-structured with bullet points and bold INR figures.
4. End or include 1 short practical next step. Do not give legal, tax, or investment advice.

FINANCIAL_SUMMARY (sanitized, deterministic):
${JSON.stringify(context, null, 2)}`;

    const contents = [
      ...history.map((h) => ({
        role: h.role === "assistant" ? "model" : "user",
        parts: [{ text: h.content }],
      })),
      { role: "user", parts: [{ text: message }] },
    ];

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents,
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 600,
        },
      }),
    });

    if (!response.ok) {
      const fallback = generateRuleBasedCopilotReply(message, context);
      return NextResponse.json({
        mode: "fallback",
        model: "rule-based-fallback",
        fallbackReason: `Gemini API returned status ${response.status}.`,
        reply: fallback.reply,
        suggestedActions: fallback.suggestedActions,
      });
    }

    const json = await response.json();
    const replyText: string | undefined =
      json?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!replyText) {
      const fallback = generateRuleBasedCopilotReply(message, context);
      return NextResponse.json({
        mode: "fallback",
        model: "rule-based-fallback",
        fallbackReason: "Empty response from Gemini API.",
        reply: fallback.reply,
        suggestedActions: fallback.suggestedActions,
      });
    }

    const fallbackActions = generateRuleBasedCopilotReply(
      message,
      context
    ).suggestedActions;

    return NextResponse.json({
      mode: "ai",
      model,
      reply: replyText,
      suggestedActions: fallbackActions,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Unexpected error in Copilot service.",
      },
      { status: 500 }
    );
  }
}
